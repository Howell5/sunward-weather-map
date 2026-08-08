import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDrivingEstimate } from "./useDrivingEstimate";

const city = {
  id: "310000",
  adcode: "310000",
  name: "上海市",
  shortName: "上海",
  province: "上海市",
  longitude: 121.47,
  latitude: 31.23,
  importance: 100,
  aliases: ["上海"],
};

afterEach(() => vi.restoreAllMocks());

describe("useDrivingEstimate", () => {
  it("requests a route only after the user clicks estimate", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          provider: "amap",
          distanceMeters: 12345,
          durationSeconds: 3660,
          fetchedAt: "2026-08-08T04:00:00Z",
        }),
        { status: 200 },
      ),
    );
    const { result } = renderHook(() =>
      useDrivingEstimate(city, { latitude: 31.2, longitude: 121.4 }),
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    await result.current.calculate();

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.estimate?.durationSeconds).toBe(3660);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/route/driving",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("explains that a location is required", async () => {
    const { result } = renderHook(() => useDrivingEstimate(city, null));
    await result.current.calculate();
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toContain("我的位置");
  });
});
