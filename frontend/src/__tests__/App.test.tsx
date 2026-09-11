import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

const api = vi.hoisted(() => ({
  listWeatherFiles: vi.fn(),
  storeWeatherData: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));
vi.mock("../api/weather", () => api);

// Leaflet needs a real layout engine; stub the map in tests.
vi.mock("../components/query/LocationMap", () => ({
  LocationMap: () => <div data-testid="location-map" />,
}));

const STORED = "weather_19.0760_72.8777_2024-06-01_2024-06-05_20260101T000000Z.json";

const ARCHIVE = {
  latitude: 19.08,
  longitude: 72.88,
  timezone: "UTC",
  daily_units: { temperature_2m_max: "°C" },
  daily: {
    time: ["2024-06-01", "2024-06-02", "2024-06-03"],
    temperature_2m_max: [31, 33, 30],
    temperature_2m_min: [26, 27, 25],
    temperature_2m_mean: [28, 30, 27],
    apparent_temperature_max: [35, 37, 34],
    apparent_temperature_min: [27, 28, 26],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  api.listWeatherFiles.mockResolvedValue({ files: [] });
  api.storeWeatherData.mockResolvedValue({ status: "ok", file: STORED, cached: false });
  api.getWeatherFileContent.mockResolvedValue(ARCHIVE);
});

describe("ClymLens end-to-end (mocked API)", () => {
  it("fetches, stores, auto-selects and visualizes a dataset", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "ClymLens" })).toBeInTheDocument();
    expect(await screen.findByText(/nothing to inspect yet/i)).toBeInTheDocument();

    // After storing, the list call should return the new file.
    api.listWeatherFiles.mockResolvedValue({
      files: [{ name: STORED, size: 4200, created_at: "2026-01-01T00:00:00Z" }],
    });

    // Two "Fetch & store" buttons exist (main panel + sidebar quick-fetch); use the main one.
    const mainPanel = screen.getByRole("region", { name: /fetch weather data/i });
    await userEvent.click(within(mainPanel).getByRole("button", { name: /fetch & store/i }));

    await waitFor(() => expect(api.storeWeatherData).toHaveBeenCalledTimes(1));
    expect(api.getWeatherFileContent).toHaveBeenCalledWith(STORED);

    // Workspace now shows the selected dataset: header, summary stats, table.
    expect(await screen.findByRole("heading", { name: /19\.08°N/ })).toBeInTheDocument();

    const table = await screen.findByRole("table");
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 3);
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1–3 of 3");
    expect(screen.getAllByText(/warmest/i).length).toBeGreaterThan(0);

    // The chart chunk is lazy-loaded, so allow it extra time to appear.
    expect(await screen.findByText(/daily high/i, undefined, { timeout: 8000 })).toBeInTheDocument();
  });

  it("surfaces a 404 when the selected dataset is gone", async () => {
    const { ApiError } = await import("../api/client");
    api.listWeatherFiles.mockResolvedValue({
      files: [{ name: STORED, size: 4200, created_at: "2026-01-01T00:00:00Z" }],
    });
    api.getWeatherFileContent.mockRejectedValue(new ApiError("not found", 404));

    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: /19\.08°N/ }));
    expect(await screen.findByText(/dataset unavailable/i)).toBeInTheDocument();
  });
});
