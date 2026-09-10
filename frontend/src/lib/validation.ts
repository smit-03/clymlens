/**
 * Client-side mirror of the backend validation rules (docs/DESIGN.md §6).
 * Gives instant feedback; the backend stays authoritative and the UI always
 * handles a 400 response gracefully.
 */

import type { StoreWeatherRequest } from "../api/types";

export const MAX_RANGE_DAYS = 31;

export interface QueryFormValues {
  latitude: string;
  longitude: string;
  startDate: string;
  endDate: string;
}

export type QueryFieldErrors = Partial<Record<keyof QueryFormValues | "form", string>>;

export interface QueryValidationResult {
  errors: QueryFieldErrors;
  value?: StoreWeatherRequest;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 86_400_000;

function parseCoord(raw: string, min: number, max: number, label: string): number | string {
  const trimmed = raw.trim();
  if (trimmed === "") return `${label} is required`;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return `${label} must be a number`;
  if (value < min || value > max) return `${label} must be between ${min} and ${max}`;
  return value;
}

function parseDate(raw: string, label: string): Date | string {
  const trimmed = raw.trim();
  if (trimmed === "") return `${label} is required`;
  if (!ISO_DATE.test(trimmed)) return `${label} must be in YYYY-MM-DD format`;
  const date = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== trimmed) {
    return `${label} is not a valid date`;
  }
  return date;
}

function todayUtc(): Date {
  return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
}

export function validateQuery(values: QueryFormValues): QueryValidationResult {
  const errors: QueryFieldErrors = {};

  const latitude = parseCoord(values.latitude, -90, 90, "Latitude");
  const longitude = parseCoord(values.longitude, -180, 180, "Longitude");
  const start = parseDate(values.startDate, "Start date");
  const end = parseDate(values.endDate, "End date");

  if (typeof latitude === "string") errors.latitude = latitude;
  if (typeof longitude === "string") errors.longitude = longitude;
  if (typeof start === "string") errors.startDate = start;
  if (typeof end === "string") errors.endDate = end;

  if (start instanceof Date && end instanceof Date) {
    if (start.getTime() > end.getTime()) {
      errors.endDate = "End date must be on or after the start date";
    } else if ((end.getTime() - start.getTime()) / MS_PER_DAY > MAX_RANGE_DAYS - 1) {
      errors.form = `Date range must not exceed ${MAX_RANGE_DAYS} days`;
    }
    if (end.getTime() > todayUtc().getTime()) {
      errors.endDate = "End date must not be in the future";
    }
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    value: {
      latitude: latitude as number,
      longitude: longitude as number,
      start_date: values.startDate.trim(),
      end_date: values.endDate.trim(),
    },
  };
}
