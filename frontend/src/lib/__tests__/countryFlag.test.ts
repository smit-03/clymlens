import { describe, expect, it } from "vitest";

import { countryFlag } from "../countryFlag";

describe("countryFlag", () => {
  it("maps ISO country codes to flag emoji", () => {
    expect(countryFlag("IN")).toBe("🇮🇳");
    expect(countryFlag("us")).toBe("🇺🇸");
    expect(countryFlag("BR")).toBe("🇧🇷");
  });

  it("returns an empty string for invalid input", () => {
    expect(countryFlag(undefined)).toBe("");
    expect(countryFlag("")).toBe("");
    expect(countryFlag("USA")).toBe("");
    expect(countryFlag("1N")).toBe("");
  });
});
