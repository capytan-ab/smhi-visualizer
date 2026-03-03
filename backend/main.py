from datetime import datetime
from math import asin, cos, radians, sin, sqrt
from typing import Dict, List, Optional, Set

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(
    title="SMHI Visualizer API",
    description="Backend API for the SMHI data visualizer",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LightningMonthlyResponse(BaseModel):
    year: int
    lat: float
    lon: float
    radius_km: Optional[float]
    monthly_counts: Dict[str, int]
    monthly_daily_probability: Dict[str, float]


@app.get("/lightning/monthly", response_model=LightningMonthlyResponse)
async def get_lightning_monthly(
    year: int = Query(..., ge=2012, le=datetime.utcnow().year),
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: Optional[float] = Query(25.0, gt=0, le=200),
):
    """
    Returns lightning statistics per month for a given year and location.

    For each calendar month this endpoint returns:
    - `monthly_counts`: total number of lightning strikes within `radius_km`
      of (`lat`, `lon`) during that month.
    - `monthly_daily_probability`: the fraction of days in that month that had
      at least one lightning strike within `radius_km` of (`lat`, `lon`).

    Data source: SMHI lightning open data API
    (`https://opendata-download-lightning.smhi.se/api.json`).

    For the given year, the backend:
    - Fetches all available months and days from the SMHI "latest" lightning dataset.
    - Downloads daily JSON data.
    - Filters each lightning event to be within `radius_km` of (`lat`, `lon`).
    - Aggregates the number of strikes for each calendar month.
    """

    base_url = "https://opendata-download-lightning.smhi.se/api"

    def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Great-circle distance between two points (in km)."""
        r = 6371.0
        d_lat = radians(lat2 - lat1)
        d_lon = radians(lon2 - lon1)
        a = (
            sin(d_lat / 2) ** 2
            + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
        )
        c = 2 * asin(sqrt(a))
        return r * c

    async def fetch_json(client: httpx.AsyncClient, url: str) -> Dict:
        try:
            resp = await client.get(url, timeout=60.0)
        except httpx.HTTPError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to reach SMHI lightning service: {exc}",
            ) from exc

        if resp.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Requested lightning data not found in SMHI open data.",
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"SMHI lightning service returned {resp.status_code}: "
                    f"{resp.text[:200]}"
                ),
            )
        return resp.json()

    monthly_counts: Dict[str, int] = {f"{m:02d}": 0 for m in range(1, 13)}
    monthly_days_with_strikes: Dict[str, Set[int]] = {
        f"{m:02d}": set() for m in range(1, 13)
    }
    monthly_total_days: Dict[str, int] = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get all months for the selected year.
        year_url = f"{base_url}/version/latest/year/{year}.json"
        year_data = await fetch_json(client, year_url)

        months: List[Dict] = year_data.get("month") or []

        for month_entry in months:
            try:
                month_num = int(month_entry.get("key"))
            except (TypeError, ValueError):
                continue
            month_key = f"{month_num:02d}"

            month_url = f"{base_url}/version/latest/year/{year}/month/{month_num}.json"
            month_data = await fetch_json(client, month_url)

            days: List[Dict] = month_data.get("day") or []
            monthly_total_days[month_key] = len(days)
            for day_entry in days:
                try:
                    day_num = int(day_entry.get("key"))
                except (TypeError, ValueError):
                    continue

                data_url = (
                    f"{base_url}/version/latest/year/{year}"
                    f"/month/{month_num}/day/{day_num}/data.json"
                )
                data_json = await fetch_json(client, data_url)
                events: List[Dict] = data_json.get("values") or []

                for event in events:
                    ev_lat = event.get("lat")
                    ev_lon = event.get("lon")
                    if not isinstance(ev_lat, (int, float)) or not isinstance(
                        ev_lon, (int, float)
                    ):
                        continue

                    if radius_km is not None:
                        distance = haversine_km(lat, lon, float(ev_lat), float(ev_lon))
                        if distance > radius_km:
                            continue

                    monthly_counts[month_key] += 1
                    monthly_days_with_strikes[month_key].add(day_num)

    monthly_daily_probability: Dict[str, float] = {}
    for month_key in monthly_counts.keys():
        total_days = monthly_total_days.get(month_key, 0)
        if total_days == 0:
            monthly_daily_probability[month_key] = 0.0
        else:
            days_with_strikes = len(monthly_days_with_strikes[month_key])
            monthly_daily_probability[month_key] = days_with_strikes / total_days

    return {
        "year": year,
        "lat": lat,
        "lon": lon,
        "radius_km": radius_km,
        "monthly_counts": monthly_counts,
        "monthly_daily_probability": monthly_daily_probability,
    }
