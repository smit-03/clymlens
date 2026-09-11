import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceProvider } from "../../../context/WorkspaceContext";
import { QueryForm } from "../QueryForm";

const api = vi.hoisted(() => ({
  listWeatherFiles: vi.fn(),
  storeWeatherData: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));

vi.mock("../../../api/weather", () => api);
vi.mock("../LocationMap", () => ({ LocationMap: () => <div data-testid="location-map" /> }));

function setup() {
  return render(
    <WorkspaceProvider>
      <QueryForm />
    </WorkspaceProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.listWeatherFiles.mockResolvedValue({ files: [] });
  api.getWeatherFileContent.mockResolvedValue({ daily: { time: [] } });
  api.storeWeatherData.mockResolvedValue({
    status: "ok",
    file: "weather_1.0000_2.0000_2024-06-01_2024-06-05_20260101T000000Z.json",
    cached: false,
  });
});

describe("QueryForm", () => {
  it("submits the parsed query and shows a success message", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /fetch & store/i }));

    await waitFor(() => expect(api.storeWeatherData).toHaveBeenCalledTimes(1));
    const body = api.storeWeatherData.mock.calls[0][0];
    expect(body).toMatchObject({ latitude: 19.076, longitude: 72.8777 });
    expect(await screen.findByText(/stored ·/i)).toBeInTheDocument();
  });

  it("blocks submission and shows a field error for a bad latitude", async () => {
    setup();
    const lat = screen.getByLabelText(/latitude/i);
    await userEvent.clear(lat);
    await userEvent.type(lat, "999");
    await userEvent.click(screen.getByRole("button", { name: /fetch & store/i }));

    expect(await screen.findByText(/between -90 and 90/i)).toBeInTheDocument();
    expect(api.storeWeatherData).not.toHaveBeenCalled();
  });

  it("flags an over-long date range without calling the API", async () => {
    setup();
    await userEvent.clear(screen.getByLabelText(/start date/i));
    await userEvent.type(screen.getByLabelText(/start date/i), "2024-01-01");
    await userEvent.clear(screen.getByLabelText(/end date/i));
    await userEvent.type(screen.getByLabelText(/end date/i), "2024-03-01");
    await userEvent.click(screen.getByRole("button", { name: /fetch & store/i }));

    expect(await screen.findByText(/must not exceed 31 days/i)).toBeInTheDocument();
    expect(api.storeWeatherData).not.toHaveBeenCalled();
  });
});
