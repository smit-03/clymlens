/**
 * City search via Open-Meteo's free, keyless geocoding API. Used only to help
 * the user fill in coordinates — it is not part of the weather data flow.
 */

const ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";

export interface GeoPlace {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  countryCode?: string;
  country?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

interface RawResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = `${ENDPOINT}?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Geocoding failed (${response.status})`);

  const body: unknown = await response.json();
  const results =
    typeof body === "object" && body !== null && Array.isArray((body as { results?: unknown }).results)
      ? ((body as { results: RawResult[] }).results)
      : [];

  return results.map((r) => ({
    id: r.id,
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    countryCode: r.country_code,
    country: r.country,
    admin1: r.admin1,
    timezone: r.timezone,
    population: r.population,
  }));
}

/** "Maharashtra, India" · "India" · "" */
export function placeRegion(place: GeoPlace): string {
  return [place.admin1, place.country].filter(Boolean).join(", ");
}
