import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MainFetchPanel } from "../../components/query/MainFetchPanel";
import { SidebarLocationCard } from "../../components/query/SidebarLocationCard";
import { QueryDraftProvider } from "../QueryDraftContext";
import { SidebarUIProvider } from "../SidebarUIContext";
import { ToastProvider } from "../ToastContext";
import { WorkspaceProvider } from "../WorkspaceContext";

const api = vi.hoisted(() => ({
  listWeatherFiles: vi.fn(),
  storeWeatherData: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));
vi.mock("../../api/weather", () => api);
vi.mock("../../components/query/LocationMap", () => ({
  LocationMap: () => <div data-testid="location-map" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  api.listWeatherFiles.mockResolvedValue({ files: [] });
});

describe("QueryDraftContext sharing", () => {
  it("keeps the sidebar and main panel coordinates in sync", async () => {
    render(
      <ToastProvider>
        <QueryDraftProvider>
          <WorkspaceProvider>
            <SidebarUIProvider>
              <SidebarLocationCard />
              <MainFetchPanel />
            </SidebarUIProvider>
          </WorkspaceProvider>
        </QueryDraftProvider>
      </ToastProvider>,
    );

    // Edit the sidebar's latitude...
    const sidebarLat = screen.getByLabelText(/^latitude$/i);
    await userEvent.clear(sidebarLat);
    await userEvent.type(sidebarLat, "51.5072");

    // ...and it should show up once the main panel's coordinates are revealed.
    await userEvent.click(screen.getByRole("button", { name: /enter coordinates manually/i }));
    const mainLat = screen.getAllByLabelText(/^latitude$/i)[1];
    expect(mainLat).toHaveValue("51.5072");
  });
});
