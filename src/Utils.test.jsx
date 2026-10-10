import { describe, it, expect } from "vitest";
import { formatLastUpdated, getMostRecentDate } from "./Utils.jsx";

describe("formatLastUpdated", () => {
  it("formats ISO string correctly into America/New_York time", () => {
    const formatted = formatLastUpdated("2026-10-10T22:00:00Z");
    expect(formatted).toContain("Oct 10, 2026");
    expect(formatted).toContain("6:00 PM");
  });

  it("handles empty or falsy values gracefully", () => {
    expect(formatLastUpdated("")).toBe("");
    expect(formatLastUpdated(null)).toBe("");
    expect(formatLastUpdated(undefined)).toBe("");
  });

  it("returns raw string if not a parseable date", () => {
    expect(formatLastUpdated("not-a-date")).toBe("not-a-date");
  });
});

describe("getMostRecentDate", () => {
  it("picks the newer date between two valid dates", () => {
    const older = "2024-11-05T12:00:00Z";
    const newer = "2026-10-10T22:00:00Z";
    expect(getMostRecentDate(older, newer)).toBe(newer);
    expect(getMostRecentDate(newer, older)).toBe(newer);
  });

  it("handles older election dates properly", () => {
    const date2020 = "2020-11-03T20:00:00Z";
    const date2022 = "2022-11-08T20:00:00Z";
    expect(getMostRecentDate(date2020, date2022)).toBe(date2022);
    expect(getMostRecentDate(date2020, undefined)).toBe(date2020);
  });

  it("returns whichever is defined if one is undefined/null", () => {
    expect(getMostRecentDate("2026-10-10T22:00:00Z", undefined)).toBe("2026-10-10T22:00:00Z");
    expect(getMostRecentDate(undefined, "2026-10-10T22:00:00Z")).toBe("2026-10-10T22:00:00Z");
    expect(getMostRecentDate(undefined, undefined)).toBeUndefined();
  });
});

