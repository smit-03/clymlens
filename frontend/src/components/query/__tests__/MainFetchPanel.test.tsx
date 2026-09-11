import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QueryDraftProvider } from "../../../context/QueryDraftContext";
import { SidebarUIProvider } from "../../../context/SidebarUIContext";
import { ToastProvider } from "../../../context/ToastContext";
import { WorkspaceProvider } from "../../../context/WorkspaceContext";
import { MainFetchPanel } from "../MainFetchPanel";

const api = vi.hoisted(() => ({
  listWeatherFiles: vi.fn(),
  storeWeatherData: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));
vi.mock("../../../api/weather", () => api);

function setup() {
  return render(
    <ToastProvider>
      <QueryDraftProvider>
        <WorkspaceProvider>
          <SidebarUIProvider>
            <MainFetchPanel />
          </SidebarUIProvider>
        </WorkspaceProvider>
      </QueryDraftProvider>
    </ToastProvider>,
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

describe("MainFetchPanel", () => {
  it("hides coordinate fields until the disclosure is opened", async () => {
    setup();
    expect(screen.queryByLabelText(/^latitude$/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /enter coordinates manually/i }));
    expect(screen.getByLabelText(/^latitude$/i)).toBeInTheDocument();
  });

  it("submits the default (valid) draft and reports success via a toast", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /fetch & store/i }));

    await waitFor(() => expect(api.storeWeatherData).toHaveBeenCalledTimes(1));
    expect(api.storeWeatherData.mock.calls[0][0]).toMatchObject({ latitude: 19.076, longitude: 72.8777 });
    expect(await screen.findByText(/stored ·/i)).toBeInTheDocument();
  });

  it("reveals coordinates and blocks submission on an invalid latitude", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /enter coordinates manually/i }));
    const lat = screen.getByLabelText(/^latitude$/i);
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
