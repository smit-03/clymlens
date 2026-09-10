import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { DailyRow } from "../../../lib/weatherData";
import { ObservationsTable } from "../ObservationsTable";

function makeRows(n: number): DailyRow[] {
  return Array.from({ length: n }, (_, i) => ({
    date: `2024-06-${String(i + 1).padStart(2, "0")}`,
    tMax: 30 + i,
    tMin: 20 + i,
    tMean: 25 + i,
    appMax: 33 + i,
    appMin: 22 + i,
  }));
}

describe("ObservationsTable", () => {
  it("paginates and reports the visible range", async () => {
    render(<ObservationsTable rows={makeRows(25)} unit="°C" />);

    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1–10 of 25");
    expect(screen.getAllByRole("row")).toHaveLength(1 + 10); // header + 10

    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 11–20 of 25");

    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 21–25 of 25");
    expect(screen.getByRole("button", { name: /next page/i })).toBeDisabled();
  });

  it("resets to page 1 when the page size changes", async () => {
    render(<ObservationsTable rows={makeRows(25)} unit="°C" />);

    await userEvent.click(screen.getByRole("button", { name: /next page/i }));
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 11–20 of 25");

    await userEvent.selectOptions(screen.getByLabelText(/rows/i), "50");
    expect(screen.getByText(/showing/i)).toHaveTextContent("Showing 1–25 of 25");
  });

  it("renders an em dash for missing values", () => {
    const rows: DailyRow[] = [
      { date: "2024-06-01", tMax: 30, tMin: null, tMean: null, appMax: null, appMin: null },
    ];
    render(<ObservationsTable rows={rows} unit="°C" />);
    const bodyRow = screen.getAllByRole("row")[1];
    expect(within(bodyRow).getAllByText("—").length).toBeGreaterThan(0);
  });
});
