import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, request } from "../client";

function mockFetch(response: Partial<Response> & { textValue?: string }) {
  const text = response.textValue ?? "";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: response.ok ?? true,
      status: response.status ?? 200,
      text: () => Promise.resolve(text),
    } as Response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("request", () => {
  it("returns parsed JSON on success", async () => {
    mockFetch({ ok: true, status: 200, textValue: JSON.stringify({ files: [] }) });

    await expect(request("/list-weather-files")).resolves.toEqual({ files: [] });
  });

  it("returns null for an empty success body", async () => {
    mockFetch({ ok: true, status: 200, textValue: "" });

    await expect(request("/whatever")).resolves.toBeNull();
  });

  it("throws ApiError with the server message on a 400", async () => {
    mockFetch({
      ok: false,
      status: 400,
      textValue: JSON.stringify({ status: "error", message: "latitude: must be <= 90" }),
    });

    await expect(request("/store-weather-data", { method: "POST", body: {} })).rejects.toMatchObject(
      { name: "ApiError", status: 400, message: "latitude: must be <= 90" },
    );
  });

  it("throws ApiError on a 404 error body", async () => {
    mockFetch({
      ok: false,
      status: 404,
      textValue: JSON.stringify({ status: "error", message: "not found" }),
    });

    await expect(request("/weather-file-content/x")).rejects.toMatchObject({
      status: 404,
      message: "not found",
    });
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    mockFetch({ ok: false, status: 500, textValue: "<html>500</html>" });

    await expect(request("/list-weather-files")).rejects.toMatchObject({
      status: 500,
      message: "Request failed (500)",
    });
  });

  it("maps a network failure to ApiError status 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const error = await request("/list-weather-files").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(0);
  });
});
