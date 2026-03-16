import { describe, it, expect } from "vitest"
import { packShifts, findConflicts, getCategoryRowHeight } from "./packing"
import type { Block } from "../types"
import { ROLE_HDR, SHIFT_H, ADD_BTN_H } from "../constants"

const baseBlock = (
  id: string,
  employeeId: string,
  categoryId: string,
  date: string,
  startH: number,
  endH: number
): Block =>
  ({
    id,
    categoryId,
    employeeId,
    date,
    startH,
    endH,
    employee: "Test",
    status: "published",
  }) as Block

describe("packShifts", () => {
  it("returns empty array for no blocks", () => {
    expect(packShifts([])).toEqual([])
  })

  it("returns [0] for one block", () => {
    const blocks = [baseBlock("1", "e1", "c1", "2026-03-15", 9, 17)]
    expect(packShifts(blocks)).toEqual([0])
  })

  it("assigns same track for non-overlapping blocks", () => {
    const blocks = [
      baseBlock("1", "e1", "c1", "2026-03-15", 9, 12),
      baseBlock("2", "e1", "c1", "2026-03-15", 13, 17),
    ]
    expect(packShifts(blocks)).toEqual([0, 0])
  })

  it("assigns different tracks for overlapping blocks", () => {
    const blocks = [
      baseBlock("1", "e1", "c1", "2026-03-15", 9, 12),
      baseBlock("2", "e1", "c1", "2026-03-15", 10, 14),
    ]
    expect(packShifts(blocks)).toEqual([0, 1])
  })

  it("packs three overlapping blocks", () => {
    const blocks = [
      baseBlock("1", "e1", "c1", "2026-03-15", 9, 12),
      baseBlock("2", "e1", "c1", "2026-03-15", 10, 14),
      baseBlock("3", "e1", "c1", "2026-03-15", 11, 13),
    ]
    expect(packShifts(blocks)).toEqual([0, 1, 2])
  })
})

describe("findConflicts", () => {
  it("returns empty set for no blocks", () => {
    expect(findConflicts([])).toEqual(new Set())
  })

  it("returns empty set for one block", () => {
    const blocks = [baseBlock("1", "e1", "c1", "2026-03-15", 9, 17)]
    expect(findConflicts(blocks)).toEqual(new Set())
  })

  it("returns both ids for two overlapping same employee same day", () => {
    const blocks = [
      baseBlock("1", "e1", "c1", "2026-03-15", 9, 12),
      baseBlock("2", "e1", "c1", "2026-03-15", 10, 14),
    ]
    expect(findConflicts(blocks)).toEqual(new Set(["1", "2"]))
  })

  it("returns empty for same employee different days", () => {
    const blocks = [
      baseBlock("1", "e1", "c1", "2026-03-15", 9, 12),
      baseBlock("2", "e1", "c1", "2026-03-16", 9, 12),
    ]
    expect(findConflicts(blocks)).toEqual(new Set())
  })

  it("returns both ids when same person has overlapping shifts in different categories (e.g. Bar and Kitchen)", () => {
    // Paul (id 4) assigned to Bar 8am-4pm and Kitchen 8am-4pm on same day = conflict
    const blocks = [
      baseBlock("bar-1", "4", "bar", "2026-03-16", 8, 16),
      baseBlock("kitchen-1", "4", "kitchen", "2026-03-16", 8, 16),
    ]
    expect(findConflicts(blocks)).toEqual(new Set(["bar-1", "kitchen-1"]))
  })
})

describe("getCategoryRowHeight", () => {
  it("returns base height for no blocks", () => {
    expect(getCategoryRowHeight("c1", [])).toBe(ROLE_HDR + SHIFT_H + ADD_BTN_H)
  })

  it("returns height for one block", () => {
    const blocks = [baseBlock("1", "e1", "c1", "2026-03-15", 9, 17)]
    expect(getCategoryRowHeight("c1", blocks)).toBe(ROLE_HDR + SHIFT_H + ADD_BTN_H)
  })

  it("returns taller height for two overlapping blocks", () => {
    const blocks = [
      baseBlock("1", "e1", "c1", "2026-03-15", 9, 12),
      baseBlock("2", "e2", "c1", "2026-03-15", 10, 14),
    ]
    expect(getCategoryRowHeight("c1", blocks)).toBe(ROLE_HDR + 2 * SHIFT_H + ADD_BTN_H)
  })
})
