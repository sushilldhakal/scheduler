import type { Block, EmployeeAvailability } from "../types"
import { ROLE_HDR, SHIFT_H, ADD_BTN_H } from "../constants"

/**
 * Returns true if moving a block to the given position would create a conflict
 * (same employee, same date, overlapping [startH, endH) with another block).
 */
export function wouldConflictAt(
  blocks: Block[],
  movingId: string,
  patch: { date: string; categoryId: string; startH: number; endH: number }
): boolean {
  const next = blocks.map((b) =>
    b.id === movingId ? { ...b, ...patch } : b
  )
  return findConflicts(next).has(movingId)
}

/**
 * Returns the set of block IDs that are part of at least one conflict.
 * A conflict is two or more blocks for the same employee on the same date with overlapping [startH, endH).
 */
export function findConflicts(blocks: Block[]): Set<string> {
  const conflictIds = new Set<string>()
  const byEmployeeAndDay = new Map<string, Block[]>()
  for (const s of blocks) {
    const key = `${s.employeeId}:${s.date}`
    const list = byEmployeeAndDay.get(key)
    if (list) list.push(s)
    else byEmployeeAndDay.set(key, [s])
  }
  for (const [, list] of byEmployeeAndDay) {
    if (list.length < 2) continue
    const sorted = [...list].sort((a, b) => a.startH - b.startH)
    for (let i = 0; i < sorted.length; i++) {
      const a = sorted[i]
      for (let j = i + 1; j < sorted.length; j++) {
        const b = sorted[j]
        if (b.startH >= a.endH) break
        conflictIds.add(a.id)
        conflictIds.add(b.id)
      }
    }
  }
  return conflictIds
}

/** Returns how many other blocks overlap the given block (same employee, same date). */
export function getConflictCount(blocks: Block[], blockId: string): number {
  const block = blocks.find((b) => b.id === blockId)
  if (!block) return 0
  const sameEmployeeDay = blocks.filter(
    (b) => b.id !== blockId && b.employeeId === block.employeeId && b.date === block.date
  )
  return sameEmployeeDay.filter(
    (b) => b.startH < block.endH && b.endH > block.startH
  ).length
}

export function packShifts(blocks: Block[]): number[] {
  const ends: number[] = []
  return blocks.map((s) => {
    let t = ends.findIndex((e) => e <= s.startH)
    if (t < 0) {
      t = ends.length
      ends.push(0)
    }
    ends[t] = s.endH
    return t
  })
}

export function getCategoryRowHeight(categoryId: string, dayBlocks: Block[]): number {
  const rs = dayBlocks.filter((s) => s.categoryId === categoryId)
  if (rs.length === 0) return ROLE_HDR + SHIFT_H + ADD_BTN_H
  const sorted = [...rs].sort((a, b) => a.startH - b.startH)
  const trackCount = packShifts(sorted).reduce((mx, t) => Math.max(mx, t + 1), 1)
  return ROLE_HDR + trackCount * SHIFT_H + ADD_BTN_H
}

/**
 * Returns true if the given hour slot is UNAVAILABLE for the employee on that date.
 * If no availability entry exists for the employee, they are always available.
 */
export function isUnavailable(
  employeeId: string,
  date: Date,
  hour: number,
  availability: EmployeeAvailability[],
): boolean {
  const entry = availability.find((a) => a.employeeId === employeeId)
  if (!entry || entry.windows.length === 0) return false

  const dateISO = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
  const dow = date.getDay()

  // Find matching windows (date-specific overrides dayOfWeek)
  const matching = entry.windows.filter((w) =>
    (w.date && w.date === dateISO) ||
    (!w.date && (w.dayOfWeek === undefined || w.dayOfWeek === dow))
  )

  if (matching.length === 0) return true // no window covers this day → unavailable

  // Available if any window covers this hour
  return !matching.some((w) => hour >= w.startH && hour < w.endH)
}
