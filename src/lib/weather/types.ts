export interface City {
  id: string;
  adcode: string;
  name: string;
  shortName: string;
  province: string;
  longitude: number;
  latitude: number;
  importance: number;
  aliases: string[];
  region?: CityRegion;
}

export type CityRegion = "china" | "nearby" | "overseas";

export interface CityDataset {
  version: string;
  generatedAt: string;
  source: string;
  count: number;
  cities: City[];
}

export type DataStatus = "loading" | "fresh" | "stale" | "error" | "unknown";

export interface CurrentWeather {
  time: string;
  temperature: number | null;
  apparentTemperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  windSpeed: number | null;
}

export interface DailyWeather {
  date: string;
  weatherCode: number | null;
  temperatureMax: number | null;
  temperatureMin: number | null;
  precipitationSum: number | null;
  precipitationHours: number | null;
  precipitationProbabilityMax: number | null;
  windSpeedMax: number | null;
  humidityMean?: number | null;
  isDry: boolean | null;
}

export interface CityWeatherSummary {
  cityId: string;
  status: DataStatus;
  current: CurrentWeather | null;
  daily: DailyWeather[];
  dryDays: number;
  availableDays: number;
  fetchedAt: string;
  timezone?: string;
}

export interface WeatherDatasetState {
  weatherByCity: Record<string, CityWeatherSummary>;
  loadedCount: number;
  totalCount: number;
  failedBatchCount: number;
  fetchedAt: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  globalError: string | null;
}

export type ViewMode = { type: "now" } | { type: "day"; dayIndex: number } | { type: "week" };
