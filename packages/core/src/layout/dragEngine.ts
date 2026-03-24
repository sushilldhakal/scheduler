// Drag and drop logic - pure functions with zero React dependencies

import type { Block, CellPosition, Resource } from '../types'
import { snapToInterval, clamp } from './geometry'

export interface DragEvent {
  blockId: string
  startPosition: CellPosition
  currentPosition: CellPosition
  deltaX: number
  deltaY: number
}

export interface ConflictMap {
  [blockId: string]: string[] // Array of conflicting block IDs
}

export interface DragOperation {
  type: 'move' | 'resize-left' | 'resize-right'
  blockId: string
  startHour: number
  endHour: number
  categoryId: string
  dateIndex: number
}

export interface DragResult {
  operation: DragOperation
  newStartHour: number
  newEndHour: number
  newCategoryId: string
  newDateIndex: number
  hasConflict: boolean
  conflictingBlocks: string[]
}

export function detectConflicts(blocks: Block[]): ConflictMap {
  const conflicts: ConflictMap = {}
  
  for (let i = 0; i < blocks.length; i++) {
    const blockA = blocks[i]
    const conflictingIds: string[] = []
    
    for (let j = i + 1; j < blocks.length; j++) {
      const blockB = blocks[j]
      
      // Check if blocks overlap in time and resource
      if (blockA.resourceId === blockB.resourceId && 
          blockA.start < blockB.end && 
          blockA.end > blockB.start) {
        conflictingIds.push(blockB.id)
        
        // Add reverse conflict
        if (!conflicts[blockB.id]) {
          conflicts[blockB.id] = []
        }
        conflicts[blockB.id].push(blockA.id)
      }
    }
    
    if (conflictingIds.length > 0) {
      conflicts[blockA.id] = conflictingIds
    }
  }
  
  return conflicts
}

/**
 * Calculate the result of a drag operation
 */
export function calculateDragResult(
  operation: DragOperation,
  deltaX: number,
  deltaY: number,
  pixelsPerHour: number,
  snapHours: number,
  targetCategoryId: string,
  targetDateIndex: number,
  allBlocks: Block[]
): DragResult {
  const snap = (value: number) => snapToInterval(value, snapHours)
  let newStartHour = operation.startHour
  let newEndHour = operation.endHour
  let newCategoryId = operation.categoryId
  let newDateIndex = operation.dateIndex
  
  if (operation.type === 'move') {
    // Calculate new time based on horizontal movement
    const hourDelta = deltaX / pixelsPerHour
    newStartHour = snap(clamp(operation.startHour + hourDelta, 0, 24 - (operation.endHour - operation.startHour)))
    newEndHour = newStartHour + (operation.endHour - operation.startHour)
    newCategoryId = targetCategoryId
    newDateIndex = targetDateIndex
  } else if (operation.type === 'resize-right') {
    // Resize end time
    const hourDelta = deltaX / pixelsPerHour
    newEndHour = snap(clamp(operation.endHour + hourDelta, operation.startHour + snapHours, 24))
  } else if (operation.type === 'resize-left') {
    // Resize start time
    const hourDelta = deltaX / pixelsPerHour
    newStartHour = snap(clamp(operation.startHour + hourDelta, 0, operation.endHour - snapHours))
  }
  
  // Check for conflicts
  const conflictingBlocks = findConflictingBlocks(
    operation.blockId,
    newStartHour,
    newEndHour,
    newCategoryId,
    newDateIndex,
    allBlocks
  )
  
  return {
    operation,
    newStartHour,
    newEndHour,
    newCategoryId,
    newDateIndex,
    hasConflict: conflictingBlocks.length > 0,
    conflictingBlocks
  }
}

/**
 * Find blocks that would conflict with a proposed position
 */
export function findConflictingBlocks(
  blockId: string,
  startHour: number,
  endHour: number,
  categoryId: string,
  dateIndex: number,
  allBlocks: Block[]
): string[] {
  const conflicting: string[] = []
  
  for (const block of allBlocks) {
    if (block.id === blockId) continue
    
    // Check if blocks would overlap
    if (block.resourceId === categoryId &&
        startHour < endHour && // Ensure valid time range
        block.start.getHours() + (block.start.getMinutes() / 60) < endHour &&
        block.end.getHours() + (block.end.getMinutes() / 60) > startHour) {
      conflicting.push(block.id)
    }
  }
  
  return conflicting
}

/**
 * Calculate the category/resource at a given Y coordinate
 */
export function getCategoryAtY(
  y: number,
  categoryTops: Record<string, number>,
  categoryHeights: Record<string, number>,
  categories: Resource[]
): Resource {
  // Sort entries by top position for efficient lookup
  const entries = Object.entries(categoryTops).sort((a, b) => a[1] - b[1])
  
  for (const [key, top] of entries) {
    const height = categoryHeights[key] ?? 0
    if (y >= top && y < top + height) {
      // Handle prefixed keys (cat:ID, emp:ID) and legacy plain IDs
      let categoryId = key
      if (key.startsWith('cat:')) {
        categoryId = key.slice(4)
      } else if (key.startsWith('emp:')) {
        // For employee keys, find the parent category
        const empIndex = entries.findIndex(([k]) => k === key)
        for (let i = empIndex - 1; i >= 0; i--) {
          const [prevKey] = entries[i]
          if (prevKey.startsWith('cat:')) {
            categoryId = prevKey.slice(4)
            break
          }
        }
      }
      
      const category = categories.find(c => c.id === categoryId)
      if (category) return category
    }
  }
  
  // Fallback to last category
  return categories[categories.length - 1] || { id: 'default', name: 'Default', kind: 'category' }
}

/**
 * Validate if a drag operation is allowed
 */
export function isDragOperationValid(
  block: Block,
  operation: DragOperation
): boolean {
  // Check if block allows the operation
  if (operation.type === 'move' && block.draggable === false) {
    return false
  }
  
  if ((operation.type === 'resize-left' || operation.type === 'resize-right') && block.resizable === false) {
    return false
  }
  
  // Check time bounds
  if (operation.startHour < 0 || operation.endHour > 24 || operation.startHour >= operation.endHour) {
    return false
  }
  
  return true
}