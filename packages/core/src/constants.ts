// Core constants and utilities — shared across all @shadcn-scheduler/* packages.
import type { CategoryColor, Settings } from './types'

// ─── Grid dimensions ──────────────────────────────────────────────────────────

export const HOUR_W = 96
export const WEEK_TIME_LABEL_GAP = 2
export const SNAP = 0.25
export const SIDEBAR_W = 220
export const SHIFT_H = 56
export const ROLE_HDR = 48
export const HOUR_HDR_H = 56
export const ADD_BTN_H = 32
export const DAY_SCROLL_BUFFER = 400
export const DRAG_THRESHOLD = 5
export const SNAP_INTERVAL = 15

// ─── Responsive breakpoints ───────────────────────────────────────────────────

export const BREAKPOINT_MOBILE_PX = 768
export const BREAKPOINT_TABLET_PX = 1200
export const LONG_PRESS_DELAY_MS = 500
export const LONG_PRESS_MOVE_THRESHOLD_PX = 8
export const SWIPE_MIN_DELTA_X_PX = 50
export const SWIPE_MAX_DELTA_Y_PX = 30
export const RESIZE_HANDLE_MIN_TOUCH_PX = 20
export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const

// ─── Date/time arrays ─────────────────────────────────────────────────────────

export const HOURS: readonly number[] = Array.from({ length: 24 }, (_, i) => i)

export const DAY_NAMES: readonly string[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

export const DOW_MON_FIRST: readonly string[] = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
]

export const MONTHS: readonly string[] = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const MONTHS_SHORT: readonly string[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ─── Default theme values ─────────────────────────────────────────────────────

export const DEFAULT_CATEGORY_COLORS: readonly CategoryColor[] = [
  { bg: '#3b82f6', light: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  { bg: '#8b5cf6', light: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  { bg: '#10b981', light: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  { bg: '#f59e0b', light: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  { bg: '#ef4444', light: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  { bg: '#06b6d4', light: '#cffafe', text: '#164e63', border: '#67e8f9' },
  { bg: '#ec4899', light: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  { bg: '#84cc16', light: '#ecfccb', text: '#3f6212', border: '#bef264' },
]

export const DEFAULT_SETTINGS: Settings = {
  visibleFrom: 7,
  visibleTo: 20,
  workingHours: {
    0: null,
    1: { from: 8, to: 17 },
    2: { from: 8, to: 17 },
    3: { from: 8, to: 17 },
    4: { from: 8, to: 17 },
    5: { from: 8, to: 17 },
    6: { from: 8, to: 12 },
  },
  badgeVariant: 'both',
  rowMode: 'category',
}

// ─── Math helpers ─────────────────────────────────────────────────────────────

export const snapH = (v: number): number => Math.round(v / SNAP) * SNAP

export function snapToInterval(v: number, snapHours: number): number {
  return Math.round(v / snapHours) * snapHours
}

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v))

export function getCategoryColor(
  idx: number,
  colors?: readonly CategoryColor[]
): CategoryColor {
  const palette = colors ?? DEFAULT_CATEGORY_COLORS
  return palette[idx % palette.length]
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const sameDay = (a: Date | string, b: Date | string): boolean => {
  const d1 = typeof a === 'string' ? new Date(a + 'T12:00:00') : a
  const d2 = typeof b === 'string' ? new Date(b + 'T12:00:00') : b
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

export function toDateISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseBlockDate(block: { date: string }): Date {
  return new Date(block.date + 'T12:00:00')
}

export const isToday = (d: Date): boolean => sameDay(d, new Date())

export const getDIM = (y: number, m: number): number =>
  new Date(y, m + 1, 0).getDate()

export const getFirst = (y: number, m: number): number => {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export function fmt12(h: number): string {
  const normalized = h >= 24 ? h % 24 : h
  const w = Math.floor(normalized),
    m = Math.round((normalized - w) * 60)
  if ((w === 0 || w === 24) && !m) return '12am'
  if (w === 12 && !m) return '12pm'
  const ms = m ? `:${String(m).padStart(2, '0')}` : ''
  return w < 12 ? `${w}${ms}am` : `${w === 12 ? 12 : w - 12}${ms}pm`
}

export function fmtHourOpt(h: number): string {
  if (h === 0 || h === 24) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export function getWeekDates(date: Date, firstDay: 0 | 1 = 1): Date[] {
  const d = new Date(date),
    day = d.getDay()
  const start = new Date(d)
  if (firstDay === 1) {
    start.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  } else {
    start.setDate(d.getDate() - day)
  }
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(start)
    dd.setDate(start.getDate() + i)
    return dd
  })
}

export function get3Weeks(date: Date): Date[][] {
  const c = getWeekDates(date)
  const p = new Date(c[0])
  p.setDate(p.getDate() - 7)
  const n = new Date(c[0])
  n.setDate(n.getDate() + 7)
  return [getWeekDates(p), c, getWeekDates(n)]
}

export function getWeeksForBuffer(date: Date, bufferWeeks: number): Date[] {
  const buffer = Math.max(1, bufferWeeks)
  const center = getWeekDates(date)
  const weeks: Date[] = []
  for (let i = -buffer; i <= buffer; i++) {
    const wd = new Date(center[0])
    wd.setDate(wd.getDate() + i * 7)
    weeks.push(...getWeekDates(wd))
  }
  return weeks
}

export function hourBg(h: number, settings: Settings, dow: number): string {
  const wh = settings.workingHours[dow]
  const inV = h >= settings.visibleFrom && h < settings.visibleTo
  if (!inV) return 'var(--muted)'
  if (wh === null) return 'var(--muted)'
  if (h < wh.from || h >= wh.to) return 'var(--muted)'
  return 'var(--background)'
}

export function isOutsideWorkingHours(
  h: number,
  settings: Settings,
  dow: number
): boolean {
  const wh = settings.workingHours[dow]
  if (wh === null) return false
  return h < wh.from || h >= wh.to
}

export const DASHED_BG = 'var(--muted)'
export const WEEKEND_BG = 'color-mix(in srgb, var(--muted) 60%, transparent)'

// ─── ID generation ────────────────────────────────────────────────────────────

export function nextUid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `s${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`
  }
  return `s${Math.random().toString(36).slice(2, 14)}`
}
