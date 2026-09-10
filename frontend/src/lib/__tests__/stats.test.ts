import { describe, expect, it } from "vitest";

import { summarize } from "../stats";
import type { DailyRow } from "../weatherData";

function row(date: string, tMax: number | null, tMin: number | null): DailyRow {
  return { date, tMax, tMin, tMean: null, appMax: null, appMin: null };
}

describe("summarize", () => {
  it("finds the warmest high, coolest low and the averages", () => {
    const rows = [row("2024-06-01", 30, 22), row("2024-06-02", 34, 25), row("2024-06-03", 28, 19)];

    const result = summarize(rows);

    expect(result.dayCount).toBe(3);
    expect(result.warmest).toEqual({ date: "2024-06-02", value: 34 });
    expect(result.coolest).toEqual({ date: "2024-06-03", value: 19 });
    expect(result.avgMax).toBeCloseTo((30 + 34 + 28) / 3);
    expect(result.avgMin).toBeCloseTo((22 + 25 + 19) / 3);
  });

  it("ignores null readings and copes with an all-null series", () => {
    const result = summarize([row("2024-06-01", null, null), row("2024-06-02", 31, null)]);
    expect(result.warmest).toEqual({ date: "2024-06-02", value: 31 });
    expect(result.coolest).toBeNull();
    expect(result.avgMin).toBeNull();
  });
});
