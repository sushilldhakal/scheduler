import { describe, it, expect } from "vitest"
import {
  fmt12,
  toDateISO,
  parseBlockDate,
  sameDay,
  getWeekDates,
  snapH,
  SNAP,
} from "./constants"

describe("fmt12", () => {
  it("formats 0 as 12am", () => {
    expect(fmt12(0)).toBe("12am")
  })
  it("formats 13.5 as 1:30pm", () => {
    expect(fmt12(13.5)).toBe("1:30pm")
  })
  it("formats 12 as 12pm", () => {
    expect(fmt12(12)).toBe("12pm")
  })
})

describe("toDateISO and parseBlockDate", () => {
  it("parseBlockDate parses ISO date string to correct calendar day", () => {
    const iso = "2026-03-15"
    const parsed = parseBlockDate({ date: iso })
    expect(parsed.getFullYear()).toBe(2026)
    expect(parsed.getMonth()).toBe(2)
    expect(parsed.getDate()).toBe(15)
  })
  it("toDateISO produces YYYY-MM-DD string", () => {
    const d = new Date(Date.UTC(2026, 2, 15, 12, 0, 0))
    expect(toDateISO(d)).toBe("2026-03-15")
  })
})

describe("sameDay", () => {
  it("returns true for same Date", () => {
    const d = new Date(2026, 2, 15)
    expect(sameDay(d, d)).toBe(true)
  })
  it("returns true for same day string and Date", () => {
    expect(sameDay("2026-03-15", new Date(2026, 2, 15))).toBe(true)
  })
  it("returns false for different days", () => {
    expect(sameDay("2026-03-15", "2026-03-16")).toBe(false)
  })
})

describe("getWeekDates", () => {
  it("returns 7 dates starting Monday when firstDay=1", () => {
    const d = new Date(2026, 2, 15)
    const week = getWeekDates(d, 1)
    expect(week).toHaveLength(7)
    expect(week[0].getDay()).toBe(1)
    expect(week[6].getDay()).toBe(0)
  })
  it("returns 7 dates starting Sunday when firstDay=0", () => {
    const d = new Date(2026, 2, 15)
    const week = getWeekDates(d, 0)
    expect(week).toHaveLength(7)
    expect(week[0].getDay()).toBe(0)
  })
})

describe("snapH", () => {
  it("snaps 1.3 to 1.5 with SNAP=0.5", () => {
    expect(SNAP).toBe(0.5)
    expect(snapH(1.3)).toBe(1.5)
  })
})
