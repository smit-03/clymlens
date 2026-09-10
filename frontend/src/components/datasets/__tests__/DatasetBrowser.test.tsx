import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../../api/client";
import { useWorkspace, WorkspaceProvider } from "../../../context/WorkspaceContext";
import { DatasetBrowser } from "../DatasetBrowser";

const api = vi.hoisted(() => ({
  listWeatherFiles: vi.fn(),
  storeWeatherData: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));
vi.mock("../../../api/weather", () => api);

const NAME_A = "weather_19.0760_72.8777_2024-06-01_2024-06-10_20260101T090000Z.json";
const NAME_B = "weather_51.5000_-0.1200_2024-05-01_2024-05-15_20260102T090000Z.json";

function Probe() {
  const { selectedFile } = useWorkspace();
  return <div data-testid="selected">{selectedFile ?? "none"}</div>;
}

function setup() {
  return render(
    <WorkspaceProvider>
      <DatasetBrowser />
      <Probe />
    </WorkspaceProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getWeatherFileContent.mockResolvedValue({ daily: { time: [] } });
});

describe("DatasetBrowser", () => {
  it("shows an empty state when nothing is stored", async () => {
    api.listWeatherFiles.mockResolvedValue({ files: [] });
    setup();
    expect(await screen.findByText(/no datasets yet/i)).toBeInTheDocument();
  });

  it("lists stored datasets and selects one on click", async () => {
    api.listWeatherFiles.mockResolvedValue({
      files: [
        { name: NAME_A, size: 12000, created_at: "2026-01-01T09:00:00Z" },
        { name: NAME_B, size: 18000, created_at: "2026-01-02T09:00:00Z" },
      ],
    });
    setup();

    const row = await screen.findByRole("button", { name: /19\.08°N/ });
    expect(screen.getByText(/2 stored datasets/i)).toBeInTheDocument();

    await userEvent.click(row);
    expect(screen.getByTestId("selected")).toHaveTextContent(NAME_A);
  });

  it("shows an error with a retry action", async () => {
    api.listWeatherFiles.mockRejectedValue(new ApiError("boom", 500));
    setup();
    expect(await screen.findByText("boom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
