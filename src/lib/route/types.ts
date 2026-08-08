export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DrivingEstimate {
  provider: "amap";
  distanceMeters: number;
  durationSeconds: number;
  fetchedAt: string;
}

export type DrivingStatus = "idle" | "loading" | "success" | "error";
export type DrivingOriginSource = "automatic" | "manual";
