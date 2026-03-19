import { SHIFT_H, ROLE_HDR } from "../constants"
import { clamp, snapToInterval } from "../constants"

export interface GridConfig {
  visibleFrom:    number
  visibleTo:      number
  hourW:          number   // 88 * zoom
  colWWeek:       number   // computed from zoom + visibleHours
  pxWeek:         number   // colWWeek / visibleHours
  dayWidth:       number   // visibleHours * hourW
  isWeekView:     boolean
  isDayMultiDay:  boolean
  snapHours:      number
}

export interface BlockRect {
  left:   number
  top:    number
  width:  number
  height: number
}

/** Build a GridConfig from the values already computed in GridView */
export function makeGridConfig(
  zoom: number,
  visibleFrom: number,
  visibleTo: number,
  isWeekView: boolean,
  isDayMultiDay: boolean,
  snapHours: number
): GridConfig {
  const hourW    = 88 * zoom
  const vh       = visibleTo - visibleFrom
  const colWWeek = Math.max(vh * 18, 160) * zoom
  return {
    visibleFrom, visibleTo,
    hourW,
    colWWeek,
    pxWeek:      isWeekView ? colWWeek / Math.max(vh, 1) : 1,
    dayWidth:    vh * hourW,
    isWeekView,
    isDayMultiDay,
    snapHours,
  }
}

/** Pixel rect for a rendered shift block */
export function blockRect(
  startH:    number,
  endH:      number,
  dateIndex: number,
  track:     number,
  catTop:    number,
  cfg:       GridConfig
): BlockRect | null {
  const cs = Math.max(startH, cfg.visibleFrom)
  const ce = Math.min(endH, cfg.visibleTo)
  if (ce <= cs) return null

  let left: number, width: number
  if (cfg.isWeekView) {
    left  = dateIndex * cfg.colWWeek + (cs - cfg.visibleFrom) * cfg.pxWeek + 1
    width = Math.max((ce - cs) * cfg.pxWeek - 2, 12)
  } else if (cfg.isDayMultiDay) {
    left  = dateIndex * cfg.dayWidth + (cs - cfg.visibleFrom) * cfg.hourW + 2
    width = Math.max((ce - cs) * cfg.hourW - 4, 18)
  } else {
    left  = (cs - cfg.visibleFrom) * cfg.hourW + 2
    width = Math.max((ce - cs) * cfg.hourW - 4, 18)
  }

  return {
    left,
    top:    catTop + ROLE_HDR + track * SHIFT_H + 3,
    width,
    height: SHIFT_H - 6,
  }
}

/** Same formula used for the drag ghost */
export function ghostRect(
  ns:        number,
  ne:        number,
  dateIndex: number,
  catTop:    number,
  rowH:      number,
  cfg:       GridConfig
): BlockRect | null {
  const cs = Math.max(ns, cfg.visibleFrom)
  const ce = Math.min(ne, cfg.visibleTo)
  if (ce <= cs) return null

  let left: number, width: number
  if (cfg.isWeekView) {
    left  = dateIndex * cfg.colWWeek + (ns - cfg.visibleFrom) * cfg.pxWeek
    width = Math.max((ne - ns) * cfg.pxWeek - 2, 8)
  } else if (cfg.isDayMultiDay) {
    left  = dateIndex * cfg.dayWidth + (cs - cfg.visibleFrom) * cfg.hourW + 2
    width = Math.max((ce - cs) * cfg.hourW - 4, 10)
  } else {
    left  = (cs - cfg.visibleFrom) * cfg.hourW + 2
    width = Math.max((ce - cs) * cfg.hourW - 4, 10)
  }

  return { left, top: catTop, width, height: rowH }
}

/** Pointer x → hour value */
export function xToHour(x: number, dateIndex: number, cfg: GridConfig): number {
  if (cfg.isWeekView) {
    return clamp(
      cfg.visibleFrom + (x - dateIndex * cfg.colWWeek) / cfg.pxWeek,
      0, 24
    )
  }
  return clamp(
    cfg.visibleFrom + (x - dateIndex * cfg.dayWidth) / cfg.hourW,
    cfg.visibleFrom, cfg.visibleTo
  )
}

/** Pointer x → date column index */
export function xToDateIndex(x: number, cfg: GridConfig, count: number): number {
  if (cfg.isDayMultiDay) return clamp(Math.floor(x / cfg.dayWidth), 0, count - 1)
  if (cfg.isWeekView)    return clamp(Math.floor(x / cfg.colWWeek), 0, count - 1)
  return 0
}