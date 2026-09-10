/** Typed calls to the ClymLens backend. No React here — trivially unit-testable. */

import { request } from "./client";
import type {
  ListFilesResponse,
  OpenMeteoArchive,
  StoreWeatherRequest,
  StoreWeatherResponse,
} from "./types";

export function storeWeatherData(
  body: StoreWeatherRequest,
  signal?: AbortSignal,
): Promise<StoreWeatherResponse> {
  return request<StoreWeatherResponse>("/store-weather-data", { method: "POST", body, signal });
}

export function listWeatherFiles(signal?: AbortSignal): Promise<ListFilesResponse> {
  return request<ListFilesResponse>("/list-weather-files", { signal });
}

export function getWeatherFileContent(
  file: string,
  signal?: AbortSignal,
): Promise<OpenMeteoArchive> {
  return request<OpenMeteoArchive>(
    `/weather-file-content/${encodeURIComponent(file)}`,
    { signal },
  );
}
