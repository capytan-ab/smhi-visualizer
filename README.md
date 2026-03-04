# SMHI Visualizer

This is a code test for Elvy. The frontend is built using Next.js and Shadcn. The backend is built using Python and FastAPI.

## Difficulties

### Backend

SMHI's APIs for lightning strikes was easy and straightforward, the historical cloud coverage however was not. I initially tried using this endpoint: https://opendata.smhi.se/metobs/introduction where the `corrected-archive` would provide historical data. Although the documentation lists:

```
GET /api/version/{version}/parameter/{parameter}/station/{station}/period/{period}/data.{ext}
```

It did not work using `data.json` at the end, only `data.csv` worked. This threw me for a loop for a while looking at https://www.smhi.se/data/nederbord-och-fuktighet/moln/totalCloudCover/88590 and GRIB data. This provided issues with long download times for data or issues with downloading multiple CSV files manually from their site for each station.

The cloud coverage is also provided from a weather station, this station might be decommissioned or inactive and no longer provide data for the period you want to look at. The location that is provided have to check the closest station that has data for that period, and that might not be the closest station.

## Improvements

* Add type safety between backend and frontend.
* Ability to customize radius for lightning strikes.
* Show distance from chosen location to the weather station used for cloud coverage.

### Backend

* Cache or download archived data to avoid the longer load times or potential outtages/rate limiting etc.

### Frontend

* Add streaming to avoid the appearance of long loading times, use a skeleton in the interface.
* Add Google Maps and not only use their Geocoding API to choose a location on the map instead of typing an address.

## Failed functionality

* Terraform is not tested with any real integrations.
* No AI prognocies was implemented.
* No testing.
* No guidelines for AI, i.e. `.claude/CLAUDE.md`
