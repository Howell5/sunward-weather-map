import { useCallback, useState } from "react";

export type LocationStatus = "idle" | "requesting" | "located" | "denied" | "error";

export interface UserLocation {
  latitude: number;
  longitude: number;
}

export function useGeolocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("当前浏览器不支持定位，请使用城市搜索");
      return;
    }
    setStatus("requesting");
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus("located");
      },
      (error) => {
        setStatus(error.code === error.PERMISSION_DENIED ? "denied" : "error");
        setMessage(
          error.code === error.PERMISSION_DENIED
            ? "定位权限未开启，可直接搜索城市"
            : "暂时无法定位，请使用城市搜索",
        );
      },
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 10 * 60 * 1000 },
    );
  }, []);

  return { status, location, message, locate };
}
