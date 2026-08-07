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
