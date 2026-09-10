import type { DailyRow } from "./weatherData";

export interface WeatherSummary {
  dayCount: number;
  warmest: { date: string; value: number } | null;
  coolest: { date: string; value: number } | null;
  avgMax: number | null;
  avgMin: number | null;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function summarize(rows: DailyRow[]): WeatherSummary {
  let warmest: WeatherSummary["warmest"] = null;
  let coolest: WeatherSummary["coolest"] = null;
  const maxes: number[] = [];
  const mins: number[] = [];

  for (const row of rows) {
    if (row.tMax !== null) {
      maxes.push(row.tMax);
      if (!warmest || row.tMax > warmest.value) warmest = { date: row.date, value: row.tMax };
    }
    if (row.tMin !== null) {
      mins.push(row.tMin);
      if (!coolest || row.tMin < coolest.value) coolest = { date: row.date, value: row.tMin };
    }
  }

  return {
    dayCount: rows.length,
    warmest,
    coolest,
    avgMax: mean(maxes),
    avgMin: mean(mins),
  };
}
