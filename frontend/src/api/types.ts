/**
 * TypeScript mirrors of the backend data contracts (see docs/DESIGN.md §4).
 * Kept in sync by hand — the backend is the source of truth.
 */

export interface StoreWeatherRequest {
  latitude: number;
  longitude: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

export interface StoreWeatherResponse {
  status: "ok";
  file: string;
  cached?: boolean;
}

export interface FileInfo {
  name: string;
  size: number;
  created_at: string; // ISO8601
}

export interface ListFilesResponse {
  files: FileInfo[];
}

export interface ErrorResponse {
  status: "error";
  message: string;
}

/**
 * Raw Open-Meteo archive payload — only the fields the UI relies on are typed.
 * Everything is optional: the UI must render sensibly even if the stored file
 * is partial or unexpected.
 */
export interface OpenMeteoArchive {
  latitude?: number;
  longitude?: number;
  timezone?: string;
  elevation?: number;
  daily_units?: Record<string, string>;
  daily?: {
    time: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    temperature_2m_mean?: (number | null)[];
    apparent_temperature_max?: (number | null)[];
    apparent_temperature_min?: (number | null)[];
  };
}
