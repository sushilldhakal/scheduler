// Grid engine utilities

import type { GridRow, GridColumn, GridLayout } from './types'
import type { Resource } from '@shadcn-scheduler/core'

export function createGridRows(resources: Resource[], rowHeight = 60): GridRow[] {
  return resources.map(resource => ({
    id: resource.id,
    resource,
    height: rowHeight
  }))
}

export function createGridColumns(dates: Date[], columnWidth = 120): GridColumn[] {
  return dates.map((date, index) => ({
    id: `col-${index}`,
    date,
    width: columnWidth,
    label: date.toLocaleDateString()
  }))
}

export function calculateGridDimensions(layout: GridLayout): { width: number; height: number } {
  const width = layout.columns.reduce((sum, col) => sum + col.width, 0)
  const height = layout.rows.reduce((sum, row) => sum + row.height, 0)
  
  return { width, height }
}

export function findCellAtPosition(
  x: number, 
  y: number, 
  layout: GridLayout
): { row: number; column: number } | null {
  let currentY = 0
  let rowIndex = -1
  
  for (let i = 0; i < layout.rows.length; i++) {
    if (y >= currentY && y < currentY + layout.rows[i].height) {
      rowIndex = i
      break
    }
    currentY += layout.rows[i].height
  }
  
  if (rowIndex === -1) return null
  
  let currentX = 0
  let columnIndex = -1
  
  for (let i = 0; i < layout.columns.length; i++) {
    if (x >= currentX && x < currentX + layout.columns[i].width) {
      columnIndex = i
      break
    }
    currentX += layout.columns[i].width
  }
  
  if (columnIndex === -1) return null
  
  return { row: rowIndex, column: columnIndex }
}