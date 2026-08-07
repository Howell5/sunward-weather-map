import type { City } from "../weather/types";

export function shouldShowCityLabel(city: City, zoom: number, selectedCityId: string | null) {
  if (city.id === selectedCityId) return true;
  if (city.importance >= 90) return true;
  if (zoom >= 3.2) return true;
  if (zoom >= 2.1 && city.importance >= 20) return true;
  return false;
}
