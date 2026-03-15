import type { CategoryColor, Settings } from "./types"

export const HOUR_W = 88
/** Week view: hours between time labels (e.g. 2 = 7am, 9am, 11am...) */
export const WEEK_TIME_LABEL_GAP = 2
export const SNAP = 0.5
export const SIDEBAR_W = 190
export const SHIFT_H = 42
export const ROLE_HDR = 38
export const HOUR_HDR_H = 44
/** Reserved height at bottom of each category row for the add-shift + button */
export const ADD_BTN_H = 32
/** Horizontal scroll buffer (px) for day view - scroll into buffer to navigate prev/next day */
export const DAY_SCROLL_BUFFER = 400

export const HOURS: readonly number[] = Array.from({ length: 24 }, (_, i) => i)

export const DAY_NAMES: readonly string[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
export const DOW_MON_FIRST: readonly string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
export const MONTHS: readonly string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
export const MONTHS_SHORT: readonly string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

export const DEFAULT_CATEGORY_COLORS: readonly CategoryColor[] = [
  { bg: "#3b82f6", light: "#dbeafe", text: "#1e40af", border: "#93c5fd" },
  { bg: "#8b5cf6", light: "#ede9fe", text: "#5b21b6", border: "#c4b5fd" },
  { bg: "#10b981", light: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  { bg: "#f59e0b", light: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  { bg: "#ef4444", light: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  { bg: "#06b6d4", light: "#cffafe", text: "#164e63", border: "#67e8f9" },
  { bg: "#ec4899", light: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  { bg: "#84cc16", light: "#ecfccb", text: "#3f6212", border: "#bef264" },
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
  badgeVariant: "both",
}

export const snapH = (v: number): number => Math.round(v / SNAP) * SNAP
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v))

export function getCategoryColor(
  idx: number,
  colors?: readonly CategoryColor[]
): CategoryColor {
  const palette = colors ?? DEFAULT_CATEGORY_COLORS
  return palette[idx % palette.length]
}

export const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const isToday = (d: Date): boolean => sameDay(d, new Date())
export const getDIM = (y: number, m: number): number => new Date(y, m + 1, 0).getDate()
export const getFirst = (y: number, m: number): number => {
  const d = new Date(y, m, 1).getDay()
  return d === 0 ? 6 : d - 1
}

export function fmt12(h: number): string {
  const w = Math.floor(h),
    m = Math.round((h - w) * 60)
  if ((w === 0 || w === 24) && !m) return "12am"
  if (w === 12 && !m) return "12pm"
  const ms = m ? `:${String(m).padStart(2, "0")}` : ""
  return w < 12 ? `${w}${ms}am` : `${w === 12 ? 12 : w - 12}${ms}pm`
}

export function fmtHourOpt(h: number): string {
  if (h === 0 || h === 24) return "12 AM"
  if (h === 12) return "12 PM"
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

export function getWeekDates(date: Date): Date[] {
  const d = new Date(date),
    day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon)
    dd.setDate(mon.getDate() + i)
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

/** Returns (1 + 2*bufferWeeks) weeks of dates centered around the given date. */
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
  if (!inV) return "hsl(var(--border))"
  if (wh === null) return "hsl(var(--muted))"
  if (h < wh.from || h >= wh.to) return "hsl(var(--muted))"
  return "hsl(var(--background))"
}

/** Returns true if hour is outside working hours (for dashed background in week/day view) */
export function isOutsideWorkingHours(h: number, settings: Settings, dow: number): boolean {
  const wh = settings.workingHours[dow]
  if (wh === null) return false
  return h < wh.from || h >= wh.to
}

/** CSS for dashed background (outside working hours) */
export const DASHED_BG =
  "repeating-linear-gradient(-45deg, hsl(var(--muted)), hsl(var(--muted)) 2px, hsl(var(--background)) 2px, hsl(var(--background)) 4px)"
