import type { Block } from "../types"
import { ROLE_HDR, SHIFT_H, ADD_BTN_H } from "../constants"

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
