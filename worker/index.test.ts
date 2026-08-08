import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "./index";

const assets = { fetch: vi.fn(async () => new Response("asset")) };

afterEach(() => vi.restoreAllMocks());

function request(body: unknown) {
  return new Request("https://sunward.willhong.dev/api/route/driving", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("route worker", () => {
  it("does not expose an unconfigured provider as a successful route", async () => {
    const response = await worker.fetch(
      request({
        origin: { latitude: 31.2, longitude: 121.4 },
        destination: { latitude: 31.23, longitude: 121.47 },
      }),
      { ASSETS: assets },
    );
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({ code: "provider_unconfigured" });
  });

  it("rejects destinations outside the domestic driving boundary", async () => {
    const response = await worker.fetch(
      request({
        origin: { latitude: 31.2, longitude: 121.4 },
        destination: { latitude: 35.68, longitude: 139.65 },
      }),
      { AMAP_WEB_KEY: "test-key", ASSETS: assets },
    );
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ code: "domestic_only" });
  });

  it("normalizes a successful AMap path to distance and duration", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "1",
          route: { paths: [{ distance: "12345", cost: { duration: "3660" } }] },
        }),
        { status: 200 },
      ),
    );
    const response = await worker.fetch(
      request({
        origin: { latitude: 31.2, longitude: 121.4 },
        destination: { latitude: 31.23, longitude: 121.47 },
      }),
      { AMAP_WEB_KEY: "test-key", ASSETS: assets },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      provider: "amap",
      distanceMeters: 12345,
      durationSeconds: 3660,
    });
    const [upstreamUrl] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(String(upstreamUrl)).toContain("ferry=1");
  });
});
