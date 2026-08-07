import { Crosshair, LoaderCircle, Locate, RefreshCw, Sparkles } from "lucide-react";
import type { LocationStatus } from "../../hooks/useGeolocation";
import type { City } from "../../lib/weather/types";
import { CitySearch } from "./CitySearch";

interface WeatherToolbarProps {
  cities: City[];
  dryHighlight: boolean;
  dryWindowDays: number;
  onDryHighlightChange: (value: boolean) => void;
  onDryWindowDaysChange: (value: number) => void;
  onSelectCity: (city: City) => void;
  locationStatus: LocationStatus;
  onLocate: () => void;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function WeatherToolbar({
  cities,
  dryHighlight,
  dryWindowDays,
  onDryHighlightChange,
  onSelectCity,
  onDryWindowDaysChange,
  locationStatus,
  onLocate,
  isRefreshing,
  onRefresh,
}: WeatherToolbarProps) {
  return (
    <div className="weather-toolbar">
      <CitySearch cities={cities} onSelect={onSelectCity} />
      <button
        type="button"
        className="toolbar-button"
        onClick={onLocate}
        disabled={locationStatus === "requesting"}
      >
        {locationStatus === "requesting" ? (
          <LoaderCircle className="spin" aria-hidden="true" />
        ) : locationStatus === "located" ? (
          <Crosshair aria-hidden="true" />
        ) : (
          <Locate aria-hidden="true" />
        )}
        <span>{locationStatus === "located" ? "已定位" : "我的位置"}</span>
      </button>
      <label className="dry-switch">
        <input
          type="checkbox"
          checked={dryHighlight}
          onChange={(event) => onDryHighlightChange(event.target.checked)}
        />
        <span className="switch-track" aria-hidden="true">
          <span />
        </span>
        <Sparkles aria-hidden="true" />
        <b>有晴窗</b>
      </label>
      {dryHighlight && (
        <label className="window-select">
          <span>连续</span>
          <select
            value={dryWindowDays}
            onChange={(event) => onDryWindowDaysChange(Number(event.target.value))}
            aria-label="晴窗连续无雨天数"
          >
            {[2, 3, 4].map((days) => (
              <option value={days} key={days}>
                {days} 天
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className="icon-button"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="刷新天气"
      >
        <RefreshCw className={isRefreshing ? "spin" : ""} aria-hidden="true" />
      </button>
    </div>
  );
}
