/**
 * Parses the backend's object name so the browser can show a friendly label
 * (location + period) without an extra API call.
 *
 *   weather_<lat>_<lon>_<start>_<end>_<YYYYMMDDTHHMMSSZ>.json
 */

const NAME_RE =
  /^weather_(-?\d+\.\d+)_(-?\d+\.\d+)_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})_(\d{8}T\d{6}Z)\.json$/;

export interface ParsedDataset {
  latitude: number;
  longitude: number;
  startDate: string;
  endDate: string;
  storedAt: string;
}

export function parseDatasetName(name: string): ParsedDataset | null {
  const match = NAME_RE.exec(name);
  if (!match) return null;
  const [, lat, lon, startDate, endDate, ts] = match;
  const storedAt =
    `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}` +
    `T${ts.slice(9, 11)}:${ts.slice(11, 13)}:${ts.slice(13, 15)}Z`;
  return {
    latitude: Number(lat),
    longitude: Number(lon),
    startDate,
    endDate,
    storedAt,
  };
}

export function formatCoordinates(latitude: number, longitude: number): string {
  const lat = `${Math.abs(latitude).toFixed(2)}°${latitude >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(longitude).toFixed(2)}°${longitude >= 0 ? "E" : "W"}`;
  return `${lat}, ${lon}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string): { d: number; m: number; y: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

/** "1–10 Jun 2024" · "28 Dec 2023 – 5 Jan 2024" */
export function formatPeriod(startDate: string, endDate: string): string {
  const a = parts(startDate);
  const b = parts(endDate);
  if (!a || !b) return `${startDate} – ${endDate}`;
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS[a.m]} ${a.y}`;
  if (a.y === b.y) return `${a.d} ${MONTHS[a.m]} – ${b.d} ${MONTHS[b.m]} ${a.y}`;
  return `${a.d} ${MONTHS[a.m]} ${a.y} – ${b.d} ${MONTHS[b.m]} ${b.y}`;
}

export function dayCount(startDate: string, endDate: string): number {
  const a = new Date(`${startDate}T00:00:00Z`).getTime();
  const b = new Date(`${endDate}T00:00:00Z`).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}
