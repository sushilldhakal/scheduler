import type { Shift } from "../types"
import { ROLE_HDR, SHIFT_H, ADD_BTN_H } from "../constants"

export function packShifts(shifts: Shift[]): number[] {
  const ends: number[] = []
  return shifts.map((s) => {
    let t = ends.findIndex((e) => e <= s.startH)
    if (t < 0) {
      t = ends.length
      ends.push(0)
    }
    ends[t] = s.endH
    return t
  })
}

export function getCategoryRowHeight(categoryId: string, dayShifts: Shift[]): number {
  const rs = dayShifts.filter((s) => s.categoryId === categoryId)
  if (rs.length === 0) return ROLE_HDR + SHIFT_H + ADD_BTN_H
  const sorted = [...rs].sort((a, b) => a.startH - b.startH)
  const trackCount = packShifts(sorted).reduce((mx, t) => Math.max(mx, t + 1), 1)
  return ROLE_HDR + trackCount * SHIFT_H + ADD_BTN_H
}
