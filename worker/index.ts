interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  AMAP_WEB_KEY?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface DrivingRequest {
  origin: Coordinates;
  destination: Coordinates;
}

interface AmapRoutePath {
  distance?: string | number;
  cost?: { duration?: string | number };
}

interface AmapResponse {
  status?: string;
  info?: string;
  route?: { paths?: AmapRoutePath[] };
}

const PI = Math.PI;
const AXIS = 6378245.0;
const ECCENTRICITY = 0.006693421622965943;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=UTF-8",
    },
  });
}

function isCoordinate(value: unknown): value is Coordinates {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Coordinates>;
  return (
    typeof candidate.latitude === "number" &&
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    typeof candidate.longitude === "number" &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}

function isChinaCoordinate({ latitude, longitude }: Coordinates) {
  return latitude >= 15 && latitude <= 55 && longitude >= 70 && longitude <= 138;
}

function transformLatitude(x: number, y: number) {
  let result =
    -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0;
  result += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0;
  return result;
}

function transformLongitude(x: number, y: number) {
  let result = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  result += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0;
  result += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0;
  result += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0;
  return result;
}

// Browser geolocation is WGS84; the domestic AMap road network uses its own
// coordinate system. The city dataset already stores AMap-compatible centers,
// so only the live origin needs conversion here.
function wgs84ToGcj02(coordinate: Coordinates): Coordinates {
  if (!isChinaCoordinate(coordinate)) return coordinate;
  const { longitude, latitude } = coordinate;
  const deltaLatitude = transformLatitude(longitude - 105.0, latitude - 35.0);
  const deltaLongitude = transformLongitude(longitude - 105.0, latitude - 35.0);
  const radians = (latitude / 180.0) * PI;
  const magic = 1 - ECCENTRICITY * Math.sin(radians) ** 2;
  const sqrtMagic = Math.sqrt(magic);
  return {
    longitude: longitude + (deltaLongitude * 180.0) / ((AXIS / sqrtMagic) * Math.cos(radians) * PI),
    latitude:
      latitude + (deltaLatitude * 180.0) / (((AXIS * (1 - ECCENTRICITY)) / magic ** 1.5) * PI),
  };
}

function formatCoordinate({ latitude, longitude }: Coordinates) {
  return `${longitude.toFixed(6)},${latitude.toFixed(6)}`;
}

async function handleDrivingRoute(request: Request, env: Env) {
  if (request.method !== "POST") {
    return json({ code: "method_not_allowed", message: "只支持 POST 请求" }, 405);
  }
  if (!env.AMAP_WEB_KEY) {
    return json({ code: "provider_unconfigured", message: "高德路线服务尚未配置" }, 503);
  }

  let input: Partial<DrivingRequest>;
  try {
    input = (await request.json()) as Partial<DrivingRequest>;
  } catch {
    return json({ code: "invalid_json", message: "请求参数格式不正确" }, 400);
  }

  if (!isCoordinate(input.origin) || !isCoordinate(input.destination)) {
    return json({ code: "invalid_coordinates", message: "缺少有效的起点或目的地坐标" }, 400);
  }
  if (!isChinaCoordinate(input.origin) || !isChinaCoordinate(input.destination)) {
    return json({ code: "domestic_only", message: "自驾估算目前只支持中国境内" }, 422);
  }

  const url = new URL("https://restapi.amap.com/v5/direction/driving");
  url.searchParams.set("key", env.AMAP_WEB_KEY);
  url.searchParams.set("origin", formatCoordinate(wgs84ToGcj02(input.origin)));
  url.searchParams.set("destination", formatCoordinate(input.destination));
  url.searchParams.set("strategy", "32");
  url.searchParams.set("ferry", "1");
  url.searchParams.set("show_fields", "cost");
  url.searchParams.set("output", "json");

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return json({ code: "provider_unreachable", message: "高德路线服务暂时无法访问" }, 502);
  }
  if (!upstream.ok) {
    return json({ code: "provider_error", message: "高德路线服务返回错误" }, 502);
  }

  let payload: AmapResponse;
  try {
    payload = (await upstream.json()) as AmapResponse;
  } catch {
    return json({ code: "provider_invalid_response", message: "高德路线服务响应无法解析" }, 502);
  }

  const path = payload.route?.paths?.[0];
  const distanceMeters = Number(path?.distance);
  const durationSeconds = Number(path?.cost?.duration);
  if (
    payload.status !== "1" ||
    !path ||
    !Number.isFinite(distanceMeters) ||
    !Number.isFinite(durationSeconds)
  ) {
    return json({ code: "no_route", message: "高德没有返回可行的中国境内驾车路线" }, 422);
  }

  return json({
    provider: "amap",
    distanceMeters,
    durationSeconds,
    fetchedAt: new Date().toISOString(),
  });
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/route/driving") {
      return handleDrivingRoute(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
