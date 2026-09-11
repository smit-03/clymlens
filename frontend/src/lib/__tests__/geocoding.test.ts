import { afterEach, describe, expect, it, vi } from "vitest";

import { placeRegion, searchPlaces } from "../geocoding";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(payload: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(payload) }),
  );
}

describe("searchPlaces", () => {
  it("returns [] without calling the network for short queries", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await searchPlaces("M")).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps the Open-Meteo response to GeoPlace objects", async () => {
    stubFetch({
      results: [
        {
          id: 1275339,
          name: "Mumbai",
          latitude: 19.07283,
          longitude: 72.88261,
          country_code: "IN",
          country: "India",
          admin1: "Maharashtra",
          timezone: "Asia/Kolkata",
          population: 12691836,
        },
      ],
    });

    const places = await searchPlaces("Mumbai");

    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      name: "Mumbai",
      latitude: 19.07283,
      longitude: 72.88261,
      countryCode: "IN",
      admin1: "Maharashtra",
    });
    expect(placeRegion(places[0])).toBe("Maharashtra, India");
  });

  it("tolerates a response with no results array", async () => {
    stubFetch({ generationtime_ms: 0.1 });
    expect(await searchPlaces("zzzzzz")).toEqual([]);
  });

  it("throws on a non-ok response", async () => {
    stubFetch({}, false);
    await expect(searchPlaces("Mumbai")).rejects.toThrow(/Geocoding failed/);
  });
});
