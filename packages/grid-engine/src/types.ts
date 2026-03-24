// Grid engine types

import type { Block, Resource, CellPosition } from '@shadcn-scheduler/core'
import type { ReactNode, ComponentType } from 'react'

export interface GridRow {
  id: string
  resource: Resource
  height: number
}

export interface GridColumn {
  id: string
  date: Date
  width: number
  label: string
}

export interface GridLayout {
  rows: GridRow[]
  columns: GridColumn[]
  totalWidth: number
  totalHeight: number
}

export interface CellProps {
  position: CellPosition
  row: GridRow
  column: GridColumn
  blocks: Block[]
  onCellClick?: (position: CellPosition) => void
}

export interface GridDragEvent {
  blockId: string
  startPosition: CellPosition
  currentPosition: CellPosition
  deltaX: number
  deltaY: number
}

export interface GridViewProps {
  rows: GridRow[]
  columns: GridColumn[]
  blocks: Block[]
  onBlocksChange?: (blocks: Block[]) => void
  onCellClick?: (position: CellPosition) => void
  onDragStart?: (event: GridDragEvent) => void
  onDragEnd?: (event: GridDragEvent) => void
  cellRenderer?: ComponentType<CellProps>
  headerRenderer?: ComponentType<{ column: GridColumn }>
  sidebarRenderer?: ComponentType<{ row: GridRow }>
}