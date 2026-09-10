import { describe, expect, it } from "vitest";

import type { OpenMeteoArchive } from "../../api/types";
import { hasPlottableData, normalizeWeather } from "../weatherData";

const FULL: OpenMeteoArchive = {
  latitude: 19.07,
  longitude: 72.88,
  timezone: "UTC",
  elevation: 11,
  daily_units: { temperature_2m_max: "°C", temperature_2m_min: "°C" },
  daily: {
    time: ["2024-06-01", "2024-06-02"],
    temperature_2m_max: [31.2, 30.9],
    temperature_2m_min: [26.0, 25.7],
    temperature_2m_mean: [28.4, 28.1],
    apparent_temperature_max: [35.1, 34.8],
    apparent_temperature_min: [27.0, 26.5],
  },
};

describe("normalizeWeather", () => {
  it("zips daily arrays into rows", () => {
    const { rows, meta, temperatureUnit } = normalizeWeather(FULL);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      date: "2024-06-01",
      tMax: 31.2,
      tMin: 26.0,
      tMean: 28.4,
      appMax: 35.1,
      appMin: 27.0,
    });
    expect(meta).toMatchObject({ latitude: 19.07, timezone: "UTC", elevation: 11 });
    expect(temperatureUnit).toBe("°C");
  });

  it("tolerates a missing mean series", () => {
    const raw = { ...FULL, daily: { ...FULL.daily!, temperature_2m_mean: undefined } };
    const { rows } = normalizeWeather(raw as OpenMeteoArchive);
    expect(rows.every((r) => r.tMean === null)).toBe(true);
  });

  it("maps null and non-finite entries to null", () => {
    const raw: OpenMeteoArchive = {
      daily: {
        time: ["2024-06-01"],
        temperature_2m_max: [null],
        temperature_2m_min: [Number.NaN as unknown as number],
      },
    };
    const { rows } = normalizeWeather(raw);
    expect(rows[0].tMax).toBeNull();
    expect(rows[0].tMin).toBeNull();
  });

  it("returns an empty result for missing/empty payloads", () => {
    expect(normalizeWeather(undefined).rows).toEqual([]);
    expect(normalizeWeather(null).temperatureUnit).toBe("°C");
    expect(normalizeWeather({ daily: { time: [] } }).rows).toEqual([]);
  });
});

describe("hasPlottableData", () => {
  it("is false when every max/min is null", () => {
    const { rows } = normalizeWeather({
      daily: { time: ["2024-06-01"], temperature_2m_max: [null], temperature_2m_min: [null] },
    });
    expect(hasPlottableData(rows)).toBe(false);
  });

  it("is true when at least one value is present", () => {
    expect(hasPlottableData(normalizeWeather(FULL).rows)).toBe(true);
  });
});
