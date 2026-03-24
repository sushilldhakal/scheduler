// Packing algorithms for shift scheduling — pure functions with no React dependencies.

import type { Block, Resource } from '../types'

export interface PackedLayout {
  blocks: Block[]
  conflicts: string[]
  utilization: number
}

export interface Position {
  x: number
  y: number
  width: number
  height: number
}

export interface Constraint {
  type: 'time' | 'resource' | 'capacity'
  value: unknown
}

/**
 * Computes utilization across all resources and identifies overlapping blocks (conflicts).
 */
export function packShifts(blocks: Block[], resources: Resource[]): PackedLayout {
  const conflicts: string[] = []
  let totalHours = 0
  let usedHours = 0

  resources.forEach((resource) => {
    const rBlocks = blocks.filter(
      (b) => b.categoryId === resource.id || b.employeeId === resource.id
    )
    totalHours += 24
    rBlocks.forEach((b) => {
      usedHours += b.endH - b.startH
    })
    // Simple overlap detection
    for (let i = 0; i < rBlocks.length; i++) {
      for (let j = i + 1; j < rBlocks.length; j++) {
        const a = rBlocks[i]!, b = rBlocks[j]!
        if (a.date === b.date && a.startH < b.endH && b.startH < a.endH) {
          if (!conflicts.includes(a.id)) conflicts.push(a.id)
          if (!conflicts.includes(b.id)) conflicts.push(b.id)
        }
      }
    }
  })

  const utilization = totalHours > 0 ? usedHours / totalHours : 0
  return { blocks, conflicts, utilization }
}

export function findOptimalPlacement(_block: Block, _constraints: Constraint[]): Position {
  return { x: 0, y: 0, width: 100, height: 60 }
}
