from datetime import datetime
from typing import Dict, List, Optional

import httpx
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from utils import haversine_km

router = APIRouter()


class CloudMonthlyResponse(BaseModel):
    year: int
    lat: float
    lon: float
    station_name: str
    station_id: int
    station_lat: float
    station_lon: float
    station_distance_km: float
    monthly_avg_cloud_pct: Dict[str, Optional[float]]
    monthly_obs_count: Dict[str, int]


@router.get("/monthly", response_model=CloudMonthlyResponse)
async def get_cloud_monthly(
    year: int = Query(..., ge=2003, le=datetime.utcnow().year),
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
):
    """
    Returns average total cloud coverage per month for a given year and location.

    For each calendar month this endpoint returns:
    - `monthly_avg_cloud_pct`: mean total cloud cover (0–100 %) across all
      hourly observations in that month, or `null` if no observations exist.
    - `monthly_obs_count`: number of hourly observations used for the average.

    The nearest SMHI weather station that records total cloud cover (parameter 16)
    is selected automatically using the haversine distance to (`lat`, `lon`).

    Data source: SMHI meteorological observations open data API, parameter 16
    (`https://opendata-download-metobs.smhi.se`), corrected-archive period.
    Historical data is available from 2003 onwards.
    """

    stations_url = (
        "https://opendata-download-metobs.smhi.se"
        "/api/version/1.0/parameter/16.json"
    )

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.get(stations_url)
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to reach SMHI observation service: {exc}",
            ) from exc
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"SMHI observation service returned {resp.status_code}",
            )
        stations: List[Dict] = resp.json().get("station", [])

    if not stations:
        raise HTTPException(
            status_code=502,
            detail="SMHI returned no stations for cloud cover parameter.",
        )

    def _dist(s: Dict) -> float:
        return haversine_km(lat, lon, float(s["latitude"]), float(s["longitude"]))

    def _covers_year(s: Dict) -> bool:
        """Return True if the station's active period includes `year`."""
        try:
            from_year = datetime.utcfromtimestamp(s["from"] / 1000).year
            to_year = datetime.utcfromtimestamp(s["to"] / 1000).year
            return from_year <= year <= to_year
        except (KeyError, TypeError, ValueError, OSError):
            return True  # unknown range: don't exclude

    def _parse_csv_monthly(
        csv_text: str,
    ) -> tuple[Dict[str, float], Dict[str, int]]:
        """Parse the SMHI cloud cover CSV and return (totals, counts) for `year`."""
        totals: Dict[str, float] = {f"{m:02d}": 0.0 for m in range(1, 13)}
        counts: Dict[str, int] = {f"{m:02d}": 0 for m in range(1, 13)}
        in_data = False
        for raw_line in csv_text.splitlines():
            line = raw_line.strip()
            if not in_data:
                if line.startswith("Datum;"):
                    in_data = True
                continue
            parts = line.split(";")
            if len(parts) < 3:
                continue
            date_str = parts[0].strip()
            value_str = parts[2].strip()
            if not date_str or not value_str:
                continue
            try:
                obs_year = int(date_str[:4])
                obs_month = date_str[5:7]
            except (ValueError, IndexError):
                continue
            if obs_year != year:
                continue
            try:
                value = float(value_str)
            except ValueError:
                continue
            totals[obs_month] += value
            counts[obs_month] += 1
        return totals, counts

    candidates = sorted(
        [s for s in stations if _covers_year(s)],
        key=_dist,
    )

    if not candidates:
        raise HTTPException(
            status_code=404,
            detail=f"No cloud cover station with data for year {year} found.",
        )

    MAX_TRIES = 10
    monthly_totals: Dict[str, float] = {}
    monthly_counts: Dict[str, int] = {}
    chosen: Optional[Dict] = None

    async with httpx.AsyncClient(timeout=120.0) as client:
        for candidate in candidates[:MAX_TRIES]:
            csv_url = (
                f"https://opendata-download-metobs.smhi.se/api/version/1.0"
                f"/parameter/16/station/{candidate['key']}"
                f"/period/corrected-archive/data.csv"
            )
            try:
                resp = await client.get(csv_url)
            except httpx.HTTPError:
                continue
            if resp.status_code != 200:
                continue

            totals, counts = _parse_csv_monthly(resp.text)
            if sum(counts.values()) > 0:
                monthly_totals = totals
                monthly_counts = counts
                chosen = candidate
                break

    if chosen is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No cloud cover data found for year {year} in any of the "
                f"{min(MAX_TRIES, len(candidates))} nearest stations."
            ),
        )

    monthly_avg_cloud_pct: Dict[str, Optional[float]] = {}
    for month_key in monthly_counts:
        count = monthly_counts[month_key]
        monthly_avg_cloud_pct[month_key] = (
            None if count == 0 else round(monthly_totals[month_key] / count, 2)
        )

    return CloudMonthlyResponse(
        year=year,
        lat=lat,
        lon=lon,
        station_name=chosen["name"],
        station_id=int(chosen["key"]),
        station_lat=float(chosen["latitude"]),
        station_lon=float(chosen["longitude"]),
        station_distance_km=round(_dist(chosen), 3),
        monthly_avg_cloud_pct=monthly_avg_cloud_pct,
        monthly_obs_count=monthly_counts,
    )
