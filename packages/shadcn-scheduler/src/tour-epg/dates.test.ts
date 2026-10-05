import { describe, it, expect } from "vitest"
import { addDays, addMonths, diffDays, eachDate, endOfMonth, startOfWeek, toIsoDate, todayIso } from "./dates"

describe("toIsoDate", () => {
  it("reads the written calendar date from strings, ignoring time and zone", () => {
    expect(toIsoDate("2026-10-05")).toBe("2026-10-05")
    expect(toIsoDate("2026-10-05T00:00:00Z")).toBe("2026-10-05")
    expect(toIsoDate("2026-10-05T23:30:00-05:00")).toBe("2026-10-05")
  })
  it("uses local calendar fields for Date objects (no UTC shift around midnight)", () => {
    expect(toIsoDate(new Date(2026, 9, 5, 0, 0, 0))).toBe("2026-10-05")
    expect(toIsoDate(new Date(2026, 9, 5, 23, 59, 59))).toBe("2026-10-05")
  })
  it("rejects invalid input", () => {
    expect(toIsoDate("2026-02-30")).toBeNull()
    expect(toIsoDate("nope")).toBeNull()
    expect(toIsoDate(new Date("x"))).toBeNull()
    expect(toIsoDate(undefined)).toBeNull()
  })
})

describe("date arithmetic", () => {
  it("is not moved by DST transitions (Sydney Apr 5 2026, LA Mar 8 2026)", () => {
    expect(diffDays("2026-04-04", "2026-04-06")).toBe(2)
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09")
    expect(eachDate("2026-10-03", "2026-10-05")).toEqual(["2026-10-03", "2026-10-04", "2026-10-05"])
  })
  it("crosses month, year and leap boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29")
    expect(endOfMonth("2026-02-10")).toBe("2026-02-28")
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28")
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15")
  })
  it("finds week starts for Monday- and Sunday-first weeks", () => {
    expect(startOfWeek("2026-10-08", 1)).toBe("2026-10-05") // Oct 5 2026 is a Monday
    expect(startOfWeek("2026-10-11", 1)).toBe("2026-10-05")
    expect(startOfWeek("2026-10-08", 0)).toBe("2026-10-04")
  })
  it("todayIso uses the local calendar date", () => {
    expect(todayIso(new Date(2026, 9, 5, 0, 5))).toBe("2026-10-05")
    expect(todayIso(new Date(2026, 9, 5, 23, 55))).toBe("2026-10-05")
  })
})
