import { describe, expect, it } from "vitest";

import {
  dayCount,
  formatCoordinates,
  formatPeriod,
  parseDatasetName,
} from "../datasetName";

const NAME = "weather_19.0760_-72.8777_2024-06-01_2024-06-10_20260910T101500Z.json";

describe("parseDatasetName", () => {
  it("extracts coordinates, dates and the stored timestamp", () => {
    expect(parseDatasetName(NAME)).toEqual({
      latitude: 19.076,
      longitude: -72.8777,
      startDate: "2024-06-01",
      endDate: "2024-06-10",
      storedAt: "2026-09-10T10:15:00Z",
    });
  });

  it("returns null for anything that is not a weather object name", () => {
    expect(parseDatasetName("notes.txt")).toBeNull();
    expect(parseDatasetName("weather_1_2_2024-06-01_2024-06-10_x.json")).toBeNull();
  });
});

describe("formatCoordinates", () => {
  it("uses hemispheres", () => {
    expect(formatCoordinates(19.076, 72.8777)).toBe("19.08°N, 72.88°E");
    expect(formatCoordinates(-33.87, -151.2)).toBe("33.87°S, 151.20°W");
  });
});

describe("formatPeriod", () => {
  it("collapses a same-month range", () => {
    expect(formatPeriod("2024-06-01", "2024-06-10")).toBe("1–10 Jun 2024");
  });
  it("spans months and years", () => {
    expect(formatPeriod("2023-12-28", "2024-01-05")).toBe("28 Dec 2023 – 5 Jan 2024");
  });
});

describe("dayCount", () => {
  it("is inclusive of both endpoints", () => {
    expect(dayCount("2024-06-01", "2024-06-10")).toBe(10);
    expect(dayCount("2024-06-01", "2024-06-01")).toBe(1);
  });
});
