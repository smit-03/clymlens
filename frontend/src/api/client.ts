/**
 * Low-level HTTP client. Prepends the API base URL, parses JSON, and normalizes
 * every failure into an {@link ApiError} so callers never deal with raw fetch
 * rejections. Feature-specific calls live in api/weather.ts (added in M7).
 */

import type { ErrorResponse } from "./types";

// VITE_API_BASE_URL is baked in at build time — if it's ever left unset, an
// empty string here would silently turn every call into a same-origin
// relative request (i.e. against the frontend itself), which fails as a
// confusing 404 instead of a clear "can't reach the API" error. Default to
// the documented local backend port so local dev works with zero setup, and
// warn loudly in a production build so a missing deploy config is obvious
// instead of silent.
const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const DEV_DEFAULT_BASE_URL = "http://localhost:8000";
const BASE_URL = (configuredBaseUrl || DEV_DEFAULT_BASE_URL).replace(/\/$/, "");

if (!configuredBaseUrl && import.meta.env.PROD) {
  console.warn(
    "[ClymLens] VITE_API_BASE_URL is not set for this build. Falling back to " +
      `${DEV_DEFAULT_BASE_URL}, which will not work from a deployed site. Set ` +
      "VITE_API_BASE_URL in your hosting platform's environment variables and redeploy.",
  );
}

export class ApiError extends Error {
  /** HTTP status, or 0 when the request never reached the server. */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0);
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    const message =
      isErrorResponse(payload) && payload.message
        ? payload.message
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

async function parseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as Record<string, unknown>).message === "string"
  );
}
