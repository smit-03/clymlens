import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "../../../App";

const api = vi.hoisted(() => ({
  listWeatherFiles: vi.fn(),
  storeWeatherData: vi.fn(),
  getWeatherFileContent: vi.fn(),
}));
vi.mock("../../../api/weather", () => api);
vi.mock("../../query/LocationMap", () => ({
  LocationMap: () => <div data-testid="location-map" />,
}));

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
  api.listWeatherFiles.mockResolvedValue({ files: [] });
});

describe("first-visit onboarding tour", () => {
  it("shows on first visit, can be skipped, and can be replayed", async () => {
    render(<App />);

    expect(await screen.findByRole("dialog")).toHaveTextContent("Choose a location");
    await userEvent.click(screen.getByRole("button", { name: "Skip" }));

    expect(window.localStorage.getItem("clymlens:onboarding-complete:v1")).toBe("true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Take a tour" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Choose a location");
  });

  it("walks through all steps, saves completion, and stays closed after refresh", async () => {
    render(<App />);

    const next = () => userEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("dialog");
    await next();
    expect(screen.getByRole("dialog")).toHaveTextContent("Fetch & store");
    await next();
    expect(screen.getByRole("dialog")).toHaveTextContent("Return to stored datasets");
    await next();
    expect(screen.getByRole("dialog")).toHaveTextContent("Explore the chart and table");
    await userEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(window.localStorage.getItem("clymlens:onboarding-complete:v1")).toBe("true");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    render(<App />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
