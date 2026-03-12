import type { Shift } from '../types'
import { ROLE_HDR, SHIFT_H } from '../constants'

/**
 * Packs an array of shifts into non-overlapping horizontal tracks.
 * Shifts must be pre-sorted by startH.
 * Returns an array of track indices (same order as input shifts).
 */
export function packShifts(shifts: Shift[]): number[] {
  const ends: number[] = []
  return shifts.map(s => {
    let t = ends.findIndex(e => e <= s.startH)
    if (t < 0) { t = ends.length; ends.push(0) }
    ends[t] = s.endH
    return t
  })
}

/**
 * Returns the total pixel height for a role row on a given day,
 * accounting for how many simultaneous shift tracks are needed.
 */
export function getRoleRowHeight(roleId: string, dayShifts: Shift[]): number {
  const rs = dayShifts.filter(s => s.roleId === roleId)
  if (rs.length === 0) return ROLE_HDR + SHIFT_H
  const sorted     = [...rs].sort((a, b) => a.startH - b.startH)
  const trackCount = packShifts(sorted).reduce((mx, t) => Math.max(mx, t + 1), 1)
  return ROLE_HDR + trackCount * SHIFT_H
}