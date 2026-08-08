import { useCallback, useEffect, useRef, useState } from "react";
import type { DrivingEstimate, DrivingStatus } from "../lib/route/types";
import type { City } from "../lib/weather/types";
import type { UserLocation } from "./useGeolocation";

interface RoutePayload {
  code?: string;
  message?: string;
  provider?: "amap";
  distanceMeters?: number;
  durationSeconds?: number;
  fetchedAt?: string;
}

function isDrivingEstimate(payload: RoutePayload): payload is DrivingEstimate {
  return (
    payload.provider === "amap" &&
    typeof payload.distanceMeters === "number" &&
    Number.isFinite(payload.distanceMeters) &&
    typeof payload.durationSeconds === "number" &&
    Number.isFinite(payload.durationSeconds) &&
    typeof payload.fetchedAt === "string"
  );
}

export function useDrivingEstimate(city: City | null, origin: UserLocation | null) {
  const [status, setStatus] = useState<DrivingStatus>("idle");
  const [estimate, setEstimate] = useState<DrivingEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const drivingKey = `${city?.id ?? ""}:${origin?.latitude ?? ""}:${origin?.longitude ?? ""}`;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when the selected city or origin key changes.
  useEffect(() => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    setStatus("idle");
    setEstimate(null);
    setError(null);
  }, [drivingKey]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const calculate = useCallback(async () => {
    if (!city) return;
    if (!origin) {
      setStatus("error");
      setEstimate(null);
      setError("请先点击“我的位置”，才能估算从当前所在地出发的驾车时间。");
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;
    setStatus("loading");
    setEstimate(null);
    setError(null);

    try {
      const response = await fetch("/api/route/driving", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          origin,
          destination: { latitude: city.latitude, longitude: city.longitude },
        }),
        signal: controller.signal,
      });
      const payload = (await response.json()) as RoutePayload;
      if (requestId !== requestIdRef.current) return;
      if (!response.ok || !isDrivingEstimate(payload)) {
        throw new Error(payload.message ?? "暂时无法获得驾车路线");
      }
      setEstimate(payload);
      setStatus("success");
    } catch (reason) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setStatus("error");
      setError(reason instanceof Error ? reason.message : "暂时无法获得驾车路线");
    }
  }, [city, origin]);

  return { status, estimate, error, calculate };
}
