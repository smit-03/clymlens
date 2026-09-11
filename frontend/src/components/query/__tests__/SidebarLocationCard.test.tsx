import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QueryDraftProvider } from "../../../context/QueryDraftContext";
import { SidebarUIProvider, useSidebarUI } from "../../../context/SidebarUIContext";
import { ToastProvider } from "../../../context/ToastContext";
import { WorkspaceProvider } from "../../../context/WorkspaceContext";
import { SidebarLocationCard } from "../SidebarLocationCard";

const api = vi.hoisted(() => ({
  listWeatherFiles: vi.fn(),
  storeWeatherData: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));
vi.mock("../../../api/weather", () => api);
vi.mock("../LocationMap", () => ({ LocationMap: () => <div data-testid="location-map" /> }));

function CollapsedProbe() {
  const { collapsed } = useSidebarUI();
  return <div data-testid="collapsed-probe">{String(collapsed)}</div>;
}

function setup() {
  return render(
    <ToastProvider>
      <QueryDraftProvider>
        <WorkspaceProvider>
          <SidebarUIProvider>
            <SidebarLocationCard />
            <CollapsedProbe />
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

describe("SidebarLocationCard", () => {
  it("shows coordinates and date fields directly, with no disclosure needed", () => {
    setup();
    expect(screen.getByLabelText(/^latitude$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^longitude$/i)).toBeInTheDocument();
  });

  it("submits the shared draft, collapses the sidebar, and reports success via a toast", async () => {
    setup();
    expect(screen.getByTestId("collapsed-probe")).toHaveTextContent("false");

    await userEvent.click(screen.getByRole("button", { name: /fetch & store/i }));

    expect(screen.getByTestId("collapsed-probe")).toHaveTextContent("true");
    await waitFor(() => expect(api.storeWeatherData).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/stored ·/i)).toBeInTheDocument();
  });

  it("opens the expanded map picker", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: /expand map/i }));
    expect(await screen.findByRole("dialog", { name: /pick a location/i })).toBeInTheDocument();
  });

  it("blocks submission (and does not collapse) on an invalid longitude", async () => {
    setup();
    const lon = screen.getByLabelText(/^longitude$/i);
    await userEvent.clear(lon);
    await userEvent.type(lon, "-999");
    await userEvent.click(screen.getByRole("button", { name: /fetch & store/i }));

    expect(await screen.findByText(/between -180 and 180/i)).toBeInTheDocument();
    expect(api.storeWeatherData).not.toHaveBeenCalled();
    expect(screen.getByTestId("collapsed-probe")).toHaveTextContent("false");
  });
});
