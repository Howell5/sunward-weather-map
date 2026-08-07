import { isDryDay } from "./dryness";
import type { CityWeatherSummary, CurrentWeather, DailyWeather } from "./types";

interface OpenMeteoCurrent {
  time?: string;
  temperature_2m?: number;
  apparent_temperature?: number;
  relative_humidity_2m?: number;
  precipitation?: number;
  weather_code?: number;
  wind_speed_10m?: number;
}

interface OpenMeteoDaily {
  time?: string[];
  weather_code?: Array<number | null>;
  temperature_2m_max?: Array<number | null>;
  temperature_2m_min?: Array<number | null>;
  precipitation_sum?: Array<number | null>;
  precipitation_hours?: Array<number | null>;
  precipitation_probability_max?: Array<number | null>;
  wind_speed_10m_max?: Array<number | null>;
}

export interface OpenMeteoSummaryResponse {
  current?: OpenMeteoCurrent;
  daily?: OpenMeteoDaily;
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeCurrent(value: OpenMeteoCurrent | undefined): CurrentWeather | null {
  if (!value?.time) return null;
  return {
    time: value.time,
    temperature: finiteOrNull(value.temperature_2m),
    apparentTemperature: finiteOrNull(value.apparent_temperature),
    humidity: finiteOrNull(value.relative_humidity_2m),
    precipitation: finiteOrNull(value.precipitation),
    weatherCode: finiteOrNull(value.weather_code),
    windSpeed: finiteOrNull(value.wind_speed_10m),
  };
}

function valueAt(values: Array<number | null> | undefined, index: number): number | null {
  return finiteOrNull(values?.[index]);
}

export function normalizeSummary(
  cityId: string,
  response: OpenMeteoSummaryResponse,
  fetchedAt: string,
): CityWeatherSummary {
  const times = response.daily?.time ?? [];
  const daily: DailyWeather[] = times.slice(0, 7).map((date, index) => {
    const day: DailyWeather = {
      date,
      weatherCode: valueAt(response.daily?.weather_code, index),
      temperatureMax: valueAt(response.daily?.temperature_2m_max, index),
      temperatureMin: valueAt(response.daily?.temperature_2m_min, index),
      precipitationSum: valueAt(response.daily?.precipitation_sum, index),
      precipitationHours: valueAt(response.daily?.precipitation_hours, index),
      precipitationProbabilityMax: valueAt(response.daily?.precipitation_probability_max, index),
      windSpeedMax: valueAt(response.daily?.wind_speed_10m_max, index),
      isDry: null,
    };
    day.isDry = isDryDay(day);
    return day;
  });
  const availableDays = daily.filter((day) => day.isDry != null).length;
  return {
    cityId,
    status: daily.length > 0 ? "fresh" : "unknown",
    current: normalizeCurrent(response.current),
    daily,
    dryDays: daily.filter((day) => day.isDry === true).length,
    availableDays,
    fetchedAt,
  };
}

export function mergeHourlyHumidity(
  summary: CityWeatherSummary,
  times: string[],
  humidities: Array<number | null>,
): CityWeatherSummary {
  const valuesByDate = new Map<string, number[]>();
  times.forEach((time, index) => {
    const humidity = finiteOrNull(humidities[index]);
    if (humidity == null) return;
    const date = time.slice(0, 10);
    const values = valuesByDate.get(date) ?? [];
    values.push(humidity);
    valuesByDate.set(date, values);
  });
  return {
    ...summary,
    daily: summary.daily.map((day) => {
      const values = valuesByDate.get(day.date);
      return {
        ...day,
        humidityMean: values?.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
          : null,
      };
    }),
  };
}
