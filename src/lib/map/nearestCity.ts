import type { City } from "../weather/types";

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number,
) {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestCity(cities: City[], latitude: number, longitude: number) {
  return cities.reduce<{ city: City | null; distance: number }>(
    (nearest, city) => {
      const distance = distanceKm(latitude, longitude, city.latitude, city.longitude);
      return distance < nearest.distance ? { city, distance } : nearest;
    },
    { city: null, distance: Number.POSITIVE_INFINITY },
  );
}
