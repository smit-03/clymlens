/**
 * Normalizes a stored Open-Meteo archive payload into row/series shapes the
 * chart and table consume. Tolerant of missing arrays and null entries.
 */

import type { OpenMeteoArchive } from "../api/types";

export interface DailyRow {
  date: string;
  tMax: number | null;
  tMin: number | null;
  tMean: number | null;
  appMax: number | null;
  appMin: number | null;
}

export interface WeatherMeta {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  elevation?: number;
}

export interface NormalizedWeather {
  rows: DailyRow[];
  units: Record<string, string>;
  meta: WeatherMeta;
  temperatureUnit: string;
}

function numOrNull(values: (number | null)[] | undefined, index: number): number | null {
  const value = values?.[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeWeather(raw: OpenMeteoArchive | null | undefined): NormalizedWeather {
  const units = raw?.daily_units ?? {};
  const meta: WeatherMeta = {
    latitude: raw?.latitude,
    longitude: raw?.longitude,
    timezone: raw?.timezone,
    elevation: raw?.elevation,
  };
  const temperatureUnit = units.temperature_2m_max ?? units.temperature_2m_min ?? "°C";

  const times = raw?.daily?.time ?? [];
  const daily = raw?.daily;
  const rows: DailyRow[] = times.map((date, i) => ({
    date,
    tMax: numOrNull(daily?.temperature_2m_max, i),
    tMin: numOrNull(daily?.temperature_2m_min, i),
    tMean: numOrNull(daily?.temperature_2m_mean, i),
    appMax: numOrNull(daily?.apparent_temperature_max, i),
    appMin: numOrNull(daily?.apparent_temperature_min, i),
  }));

  return { rows, units, meta, temperatureUnit };
}

export function hasPlottableData(rows: DailyRow[]): boolean {
  return rows.some((row) => row.tMax !== null || row.tMin !== null);
}
