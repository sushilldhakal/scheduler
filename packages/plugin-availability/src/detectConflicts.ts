import type { Block } from '@shadcn-scheduler/core'
import type { EmployeeAvailability, ConflictResult } from './useAvailability'

/**
 * Checks each block against the availability windows and returns
 * an array of conflicts for blocks that are scheduled outside availability.
 */
export function detectConflicts(
  blocks: Block[],
  availability: EmployeeAvailability[]
): ConflictResult[] {
  const availMap = new Map(availability.map((a) => [a.employeeId, a]))
  const conflicts: ConflictResult[] = []

  for (const block of blocks) {
    const emp = availMap.get(block.employeeId)
    if (!emp) continue

    const d = new Date(block.date + 'T12:00:00')
    const dow = d.getDay()
    const covered = emp.windows.some((w) => {
      const dowOk = w.dayOfWeek === undefined || w.dayOfWeek === dow
      const dateOk = w.date === undefined || w.date === block.date
      return dowOk && dateOk && block.startH >= w.startH && block.endH <= w.endH
    })

    if (!covered) {
      conflicts.push({
        blockId: block.id,
        employeeId: block.employeeId,
        reason: `Scheduled outside availability on ${block.date} (${block.startH}–${block.endH})`,
      })
    }
  }

  return conflicts
}
