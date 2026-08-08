interface MapLegendProps {
  showRegions?: boolean;
}

export function MapLegend({ showRegions = true }: MapLegendProps) {
  return (
    <ul className="map-legend" aria-label="天气图例">
      {showRegions && (
        <li className="legend-item legend-item--region">
          <i className="legend-gradient" aria-hidden="true" />
          区域色块：浅 = 更多城市无雨
        </li>
      )}
      <li className="legend-item">
        <span className="legend-emoji" aria-hidden="true">
          ☀️
        </span>
        无明显降水
      </li>
      <li className="legend-item">
        <span className="legend-emoji" aria-hidden="true">
          🌧️
        </span>
        有降水
      </li>
      <li className="legend-item">
        <span className="legend-emoji" aria-hidden="true">
          ❔
        </span>
        未知
      </li>
    </ul>
  );
}
