// Grid geometry calculations - pure functions with zero React dependencies

import type { GridGeometry, CellPosition, DateRange, Block } from '../types'
import { DEFAULT_CELL_HEIGHT, DEFAULT_CELL_WIDTH, DEFAULT_HEADER_HEIGHT, DEFAULT_SIDEBAR_WIDTH, SNAP_INTERVAL } from '../constants'

export interface GridConfig {
  cellWidth?: number
  cellHeight?: number
  headerHeight?: number
  sidebarWidth?: number
  columns: number
  rows: number
  // Enhanced config for scheduler views
  visibleFrom?: number
  visibleTo?: number
  hourWidth?: number
  dayWidth?: number
  isWeekView?: boolean
  isDayMultiDay?: boolean
  snapHours?: number
  zoom?: number
}

export interface BlockRect {
  left: number
  top: number
  width: number
  height: number
}

export function calculateGridGeometry(config: GridConfig): GridGeometry {
  const cellWidth = config.cellWidth ?? DEFAULT_CELL_WIDTH
  const cellHeight = config.cellHeight ?? DEFAULT_CELL_HEIGHT
  const headerHeight = config.headerHeight ?? DEFAULT_HEADER_HEIGHT
  const sidebarWidth = config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH

  return {
    cellWidth,
    cellHeight,
    headerHeight,
    sidebarWidth,
    totalWidth: sidebarWidth + (cellWidth * config.columns),
    totalHeight: headerHeight + (cellHeight * config.rows)
  }
}

export function calculateCellPosition(
  row: number,
  column: number,
  geometry: GridGeometry
): CellPosition {
  return {
    row,
    column,
    x: geometry.sidebarWidth + (column * geometry.cellWidth),
    y: geometry.headerHeight + (row * geometry.cellHeight),
    width: geometry.cellWidth,
    height: geometry.cellHeight
  }
}

/**
 * Create a scheduler-specific grid configuration
 */
export function makeSchedulerGridConfig(
  zoom: number,
  visibleFrom: number,
  visibleTo: number,
  isWeekView: boolean,
  isDayMultiDay: boolean,
  snapHours: number
): GridConfig {
  const hourWidth = 96 * zoom
  const visibleHours = visibleTo - visibleFrom
  const colWidthWeek = Math.max(visibleHours * 18, 160) * zoom
  
  return {
    visibleFrom,
    visibleTo,
    hourWidth,
    dayWidth: visibleHours * hourWidth,
    isWeekView,
    isDayMultiDay,
    snapHours,
    zoom,
    columns: isWeekView ? 7 : 1,
    rows: 1
  }
}

/**
 * Calculate pixel rectangle for a block/shift
 */
export function calculateBlockRect(
  startHour: number,
  endHour: number,
  dateIndex: number,
  track: number,
  categoryTop: number,
  config: GridConfig,
  shiftHeight: number = 32
): BlockRect | null {
  const visibleFrom = config.visibleFrom ?? 0
  const visibleTo = config.visibleTo ?? 24
  const hourWidth = config.hourWidth ?? DEFAULT_CELL_WIDTH
  const dayWidth = config.dayWidth ?? hourWidth * 24
  
  const clampedStart = Math.max(startHour, visibleFrom)
  const clampedEnd = Math.min(endHour, visibleTo)
  
  if (clampedEnd <= clampedStart) return null

  let left: number, width: number
  
  if (config.isWeekView) {
    const colWidthWeek = Math.max((visibleTo - visibleFrom) * 18, 160) * (config.zoom ?? 1)
    const pxPerHour = colWidthWeek / Math.max(visibleTo - visibleFrom, 1)
    left = dateIndex * colWidthWeek + (clampedStart - visibleFrom) * pxPerHour + 1
    width = Math.max((clampedEnd - clampedStart) * pxPerHour - 2, 12)
  } else if (config.isDayMultiDay) {
    left = dateIndex * dayWidth + (clampedStart - visibleFrom) * hourWidth + 2
    width = Math.max((clampedEnd - clampedStart) * hourWidth - 4, 18)
  } else {
    left = (clampedStart - visibleFrom) * hourWidth + 2
    width = Math.max((clampedEnd - clampedStart) * hourWidth - 4, 18)
  }

  return {
    left,
    top: categoryTop + 40 + track * shiftHeight + 4, // 40 is role header height
    width,
    height: shiftHeight - 8
  }
}

/**
 * Calculate ghost rectangle for drag operations
 */
export function calculateGhostRect(
  startHour: number,
  endHour: number,
  dateIndex: number,
  categoryTop: number,
  rowHeight: number,
  config: GridConfig
): BlockRect | null {
  const visibleFrom = config.visibleFrom ?? 0
  const visibleTo = config.visibleTo ?? 24
  const hourWidth = config.hourWidth ?? DEFAULT_CELL_WIDTH
  const dayWidth = config.dayWidth ?? hourWidth * 24
  
  const clampedStart = Math.max(startHour, visibleFrom)
  const clampedEnd = Math.min(endHour, visibleTo)
  
  if (clampedEnd <= clampedStart) return null

  let left: number, width: number
  
  if (config.isWeekView) {
    const colWidthWeek = Math.max((visibleTo - visibleFrom) * 18, 160) * (config.zoom ?? 1)
    const pxPerHour = colWidthWeek / Math.max(visibleTo - visibleFrom, 1)
    left = dateIndex * colWidthWeek + (startHour - visibleFrom) * pxPerHour
    width = Math.max((endHour - startHour) * pxPerHour - 2, 8)
  } else if (config.isDayMultiDay) {
    left = dateIndex * dayWidth + (clampedStart - visibleFrom) * hourWidth + 2
    width = Math.max((clampedEnd - clampedStart) * hourWidth - 4, 10)
  } else {
    left = (clampedStart - visibleFrom) * hourWidth + 2
    width = Math.max((clampedEnd - clampedStart) * hourWidth - 4, 10)
  }

  return { 
    left, 
    top: categoryTop, 
    width, 
    height: rowHeight 
  }
}

/**
 * Convert pointer x coordinate to hour value
 */
export function xToHour(x: number, dateIndex: number, config: GridConfig): number {
  const visibleFrom = config.visibleFrom ?? 0
  const visibleTo = config.visibleTo ?? 24
  const hourWidth = config.hourWidth ?? DEFAULT_CELL_WIDTH
  const dayWidth = config.dayWidth ?? hourWidth * 24
  
  if (config.isWeekView) {
    const colWidthWeek = Math.max((visibleTo - visibleFrom) * 18, 160) * (config.zoom ?? 1)
    const pxPerHour = colWidthWeek / Math.max(visibleTo - visibleFrom, 1)
    return clamp(
      visibleFrom + (x - dateIndex * colWidthWeek) / pxPerHour,
      0, 24
    )
  }
  
  return clamp(
    visibleFrom + (x - dateIndex * dayWidth) / hourWidth,
    visibleFrom, visibleTo
  )
}

/**
 * Convert pointer x coordinate to date column index
 */
export function xToDateIndex(x: number, config: GridConfig, dateCount: number): number {
  const dayWidth = config.dayWidth ?? (config.hourWidth ?? DEFAULT_CELL_WIDTH) * 24
  
  if (config.isDayMultiDay) {
    return clamp(Math.floor(x / dayWidth), 0, dateCount - 1)
  }
  
  if (config.isWeekView) {
    const colWidthWeek = Math.max((config.visibleTo ?? 24) - (config.visibleFrom ?? 0) * 18, 160) * (config.zoom ?? 1)
    return clamp(Math.floor(x / colWidthWeek), 0, dateCount - 1)
  }
  
  return 0
}

/**
 * Snap a value to the nearest interval
 */
export function snapToInterval(value: number, interval: number): number {
  return Math.round(value / interval) * interval
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}