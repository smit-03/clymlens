import { describe, expect, it } from "vitest";

import { validateQuery, type QueryFormValues } from "../validation";

const BASE: QueryFormValues = {
  latitude: "19.076",
  longitude: "72.8777",
  startDate: "2024-06-01",
  endDate: "2024-06-10",
};

function withValues(overrides: Partial<QueryFormValues>): QueryFormValues {
  return { ...BASE, ...overrides };
}

describe("validateQuery", () => {
  it("accepts a valid query and returns a typed request body", () => {
    const { errors, value } = validateQuery(BASE);
    expect(errors).toEqual({});
    expect(value).toEqual({
      latitude: 19.076,
      longitude: 72.8777,
      start_date: "2024-06-01",
      end_date: "2024-06-10",
    });
  });

  it("accepts coordinate and range boundaries", () => {
    const result = validateQuery(
      withValues({
        latitude: "-90",
        longitude: "180",
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      }),
    );
    expect(result.errors).toEqual({});
    expect(result.value).toBeDefined();
  });

  it.each([
    [{ latitude: "" }, "latitude"],
    [{ latitude: "90.5" }, "latitude"],
    [{ latitude: "abc" }, "latitude"],
    [{ longitude: "-181" }, "longitude"],
    [{ startDate: "01/06/2024" }, "startDate"],
    [{ startDate: "2024-02-30" }, "startDate"],
  ] as [Partial<QueryFormValues>, string][])("flags %o", (overrides, field) => {
    const { errors, value } = validateQuery(withValues(overrides));
    expect(value).toBeUndefined();
    expect(errors).toHaveProperty(field);
  });

  it("rejects an end date before the start date", () => {
    const { errors } = validateQuery(withValues({ startDate: "2024-06-10", endDate: "2024-06-01" }));
    expect(errors.endDate).toMatch(/on or after/i);
  });

  it("rejects a range longer than 31 days", () => {
    const { errors } = validateQuery(withValues({ startDate: "2024-01-01", endDate: "2024-02-05" }));
    expect(errors.form).toMatch(/31 days/);
  });

  it("rejects a future end date", () => {
    const future = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
    const { errors } = validateQuery(withValues({ startDate: BASE.startDate, endDate: future }));
    expect(errors.endDate).toMatch(/future/i);
  });
});
