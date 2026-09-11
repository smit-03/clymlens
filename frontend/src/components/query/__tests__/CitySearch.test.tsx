import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GeoPlace } from "../../../lib/geocoding";
import { CitySearch } from "../CitySearch";

const { searchPlaces } = vi.hoisted(() => ({ searchPlaces: vi.fn() }));
vi.mock("../../../lib/geocoding", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../lib/geocoding")>()),
  searchPlaces,
}));

const MUMBAI: GeoPlace = {
  id: 1,
  name: "Mumbai",
  latitude: 19.076,
  longitude: 72.8777,
  countryCode: "IN",
  country: "India",
  admin1: "Maharashtra",
};

beforeEach(() => {
  searchPlaces.mockReset();
});

describe("CitySearch", () => {
  it("searches after two characters and lists results", async () => {
    searchPlaces.mockResolvedValue([MUMBAI]);
    render(<CitySearch onSelect={vi.fn()} />);

    await userEvent.type(screen.getByRole("combobox"), "Mu");

    expect(await screen.findByRole("option", { name: /Mumbai/ })).toBeInTheDocument();
    expect(searchPlaces).toHaveBeenCalledWith("Mu", expect.any(AbortSignal));
  });

  it("does not search for a single character", async () => {
    render(<CitySearch onSelect={vi.fn()} />);
    await userEvent.type(screen.getByRole("combobox"), "M");
    await new Promise((r) => setTimeout(r, 350));
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it("calls onSelect with the chosen place and fills the input", async () => {
    searchPlaces.mockResolvedValue([MUMBAI]);
    const onSelect = vi.fn();
    render(<CitySearch onSelect={onSelect} />);

    await userEvent.type(screen.getByRole("combobox"), "Mumbai");
    const option = await screen.findByRole("option", { name: /Mumbai/ });
    await userEvent.click(option);

    expect(onSelect).toHaveBeenCalledWith(MUMBAI);
    expect(screen.getByRole("combobox")).toHaveValue("Mumbai");
  });
});
