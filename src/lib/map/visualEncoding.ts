import { isCurrentlyDry, longestDryStreak } from "../weather/dryness";
import type { CityWeatherSummary, ViewMode } from "../weather/types";

export const DEFAULT_DRY_WINDOW_DAYS = 2;

export interface CityVisual {
  fill: string;
  border: string;
  opacity: number;
  symbol: "circle" | "diamond" | "emptyCircle";
  dryState: boolean | null;
}

const WEEK_COLORS = [
  "#4b6b70",
  "#547980",
  "#5f898c",
  "#6d9892",
  "#82a88f",
  "#a6b77e",
  "#d2c16f",
  "#f0cc72",
];

export function dryStateForMode(
  weather: CityWeatherSummary | undefined,
  mode: ViewMode,
): boolean | null {
  if (!weather) return null;
  if (mode.type === "now") {
    return isCurrentlyDry(
      weather.current?.precipitation ?? null,
      weather.current?.weatherCode ?? null,
    );
  }
  if (mode.type === "day") {
    return weather.daily[mode.dayIndex]?.isDry ?? null;
  }
  if (weather.availableDays !== 7) return null;
  return weather.dryDays === 7;
}

export function dryWindowMatches(
  weather: CityWeatherSummary | undefined,
  mode: ViewMode,
  minimumDays = DEFAULT_DRY_WINDOW_DAYS,
): boolean | null {
  if (!weather || weather.status === "error" || weather.status === "unknown") return null;
  if (mode.type === "now" || mode.type === "day") return dryStateForMode(weather, mode);
  if (weather.availableDays === 0) return null;
  return longestDryStreak(weather.daily) >= minimumDays;
}

export function cityVisual(
  weather: CityWeatherSummary | undefined,
  mode: ViewMode,
  dryHighlight: boolean,
  selected: boolean,
  dryWindowDays = DEFAULT_DRY_WINDOW_DAYS,
): CityVisual {
  if (!weather || weather.status === "error" || weather.status === "unknown") {
    return {
      fill: "#75817c",
      border: selected ? "#fff7dc" : "#d5ddd8",
      opacity: selected ? 1 : 0.58,
      symbol: "emptyCircle",
      dryState: null,
    };
  }
  const dryState = dryStateForMode(weather, mode);
  const windowState = dryWindowMatches(weather, mode, dryWindowDays);
  let fill = dryState ? "#f0cc72" : "#60a6ca";
  let symbol: CityVisual["symbol"] = dryState ? "circle" : "diamond";
  if (mode.type === "week") {
    fill = WEEK_COLORS[Math.max(0, Math.min(7, weather.dryDays))];
    symbol = weather.dryDays === 7 ? "circle" : "diamond";
  }
  return {
    fill,
    border: selected ? "#fff7dc" : "rgba(9, 32, 28, 0.82)",
    opacity:
      dryHighlight && windowState !== true && !selected
        ? 0.12
        : weather.status === "stale"
          ? 0.72
          : 1,
    symbol,
    dryState,
  };
}

export function cityLabel(weather: CityWeatherSummary | undefined, mode: ViewMode): string {
  if (!weather) return "—";
  if (mode.type === "now") {
    return weather.current?.temperature == null
      ? "—"
      : `${Math.round(weather.current.temperature)}°`;
  }
  if (mode.type === "day") {
    const day = weather.daily[mode.dayIndex];
    if (!day || day.temperatureMax == null || day.temperatureMin == null) return "—";
    return `${Math.round(day.temperatureMax)}°/${Math.round(day.temperatureMin)}°`;
  }
  return `${weather.dryDays}/7`;
}

function weatherCodeEmoji(code: number | null): string {
  if (code == null) return "❔";
  if (code === 0) return "☀️";
  if (code === 1) return "🌤️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 86) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌦️";
}

export function cityWeatherEmoji(weather: CityWeatherSummary | undefined, mode: ViewMode): string {
  if (!weather || weather.status === "error" || weather.status === "unknown") return "❔";
  if (mode.type === "now") return weatherCodeEmoji(weather.current?.weatherCode ?? null);
  if (mode.type === "day")
    return weatherCodeEmoji(weather.daily[mode.dayIndex]?.weatherCode ?? null);
  if (weather.availableDays === 0) return "❔";
  if (weather.dryDays === 7) return "☀️";
  if (weather.dryDays >= 4) return "🌤️";
  if (weather.dryDays > 0) return "🌦️";
  return weather.availableDays === 7 ? "🌧️" : "❔";
}
