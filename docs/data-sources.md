# Data Sources

## Map boundary prototype

- Source: Alibaba Cloud DataV geographic boundary endpoint
- Base URL: `https://geo.datav.aliyun.com/areas_v3/bound`
- Retrieved for this prototype: 2026-08-07
- Bundled files: `public/data/china.geojson`, `public/data/cities.json`

The source is used here as replaceable prototype data. Its presence does not prove that this
application has completed the map review and approval process required for a public commercial
map in China. Before commercial launch, verify the source licence, national boundary expression,
review number requirements, attribution, and update cadence, then replace these assets if needed.

## Overseas weather map prototype

- Boundary source: [Natural Earth Admin 0 Countries, 1:110m](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/)
- Bundled file: `public/data/world.geojson`
- Terms: Natural Earth states that its vector and raster data are public domain; the map is used as
  a small-scale weather context layer, not as a legal or navigation boundary.
- City source: `public/data/global-cities.json`, a curated MVP list covering East/Southeast/West
  Asia, Russia and selected global cities. Coordinates are city centers and are for weather lookup.

The range control has three modes: China, China + nearby, and Overseas. The overseas modes reuse the
same Open-Meteo summary/detail fields and local timezone response, but deliberately do not render
the domestic AMap driving module.

## Weather

- Provider: [Open-Meteo](https://open-meteo.com/)
- Endpoint: `https://api.open-meteo.com/v1/forecast`
- Forecast model: Open-Meteo automatic best match
- Timezone: `Asia/Shanghai`
- Data licence: CC BY 4.0; attribution is displayed in the interface
- Free endpoint limitation: non-commercial evaluation/personal use, no SLA

The interface says “预计” and “模型数据” because current conditions and forecasts are model
outputs, not promises or guaranteed station observations. Commercial use must move to a suitable
paid endpoint and re-check the current provider terms.

## Domestic driving estimate

- Provider: [高德 Web 服务 API](https://lbs.amap.com/api/webservice/guide/api/newroute)
- Worker endpoint: `POST /api/route/driving`
- Upstream endpoint: `https://restapi.amap.com/v5/direction/driving`
- Scope: 中国境内起点到中国城市目的地；海外坐标会被拒绝，不会请求路线服务
- Strategy: `strategy=32`, `ferry=1`, `show_fields=cost`
- Secret: `AMAP_WEB_KEY` is stored with `wrangler secret put AMAP_WEB_KEY`; it is never bundled into
  client JavaScript or committed to GitHub.

The browser's WGS84 location is converted inside the Worker before the request. If location
permission is unavailable, the UI lets the user choose a Chinese city manually; that city's bundled
AMap-compatible center becomes the approximate origin. Destination coordinates are the same city
centers from `public/data/cities.json`. The UI only requests a route after the user clicks the
estimate button, and labels the result as an estimate.
Routes are not cached because live traffic and provider policy can change; upstream errors are
returned as localized, retryable messages without exposing the provider key or raw response.
