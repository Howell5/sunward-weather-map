import type { DailyWeather } from "./types";

export const DRY_PRECIPITATION_THRESHOLD_MM = 0.2;
export const DRY_PRECIPITATION_HOURS_MAX = 1;

export function isDryDay(
  day: Pick<DailyWeather, "precipitationSum" | "precipitationHours">,
): boolean | null {
  if (day.precipitationSum == null || day.precipitationHours == null) {
    return null;
  }
  return (
    day.precipitationSum < DRY_PRECIPITATION_THRESHOLD_MM &&
    day.precipitationHours <= DRY_PRECIPITATION_HOURS_MAX
  );
}

export function isPrecipitationCode(code: number | null): boolean {
  if (code == null) return false;
  return (
    (code >= 51 && code <= 67) ||
    (code >= 71 && code <= 77) ||
    (code >= 80 && code <= 86) ||
    (code >= 95 && code <= 99)
  );
}

export function isCurrentlyDry(
  precipitation: number | null,
  weatherCode: number | null,
): boolean | null {
  if (precipitation == null || weatherCode == null) return null;
  return precipitation < DRY_PRECIPITATION_THRESHOLD_MM && !isPrecipitationCode(weatherCode);
}

export function longestDryStreak(days: ReadonlyArray<Pick<DailyWeather, "isDry">>): number {
  let current = 0;
  let longest = 0;
  for (const day of days) {
    if (day.isDry === true) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

export function weatherCodeLabel(code: number | null): string {
  if (code == null) return "暂无数据";
  if (code === 0) return "晴";
  if (code === 1) return "大部晴朗";
  if (code === 2) return "多云";
  if (code === 3) return "阴";
  if (code === 45 || code === 48) return "雾";
  if (code >= 51 && code <= 55) return "毛毛雨";
  if (code === 56 || code === 57) return "冻毛毛雨";
  if (code >= 61 && code <= 65) return "雨";
  if (code === 66 || code === 67) return "冻雨";
  if (code >= 71 && code <= 77) return "雪";
  if (code >= 80 && code <= 82) return "阵雨";
  if (code === 85 || code === 86) return "阵雪";
  if (code >= 95) return "雷暴";
  return "天气变化";
}
