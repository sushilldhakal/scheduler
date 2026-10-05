/**
 * Timezone-safe calendar-date helpers.
 *
 * The EPG deals in calendar dates, never timestamps. Every date is an ISO
 * `YYYY-MM-DD` string and all arithmetic goes through UTC day numbers
 * (days since 1970-01-01), so DST shifts and the viewer's timezone can't
 * move a date.
 */
import { DAY_NAMES, MONTHS_SHORT } from "../core/constants"
import type { TourDateInput } from "./types"

export type IsoDate = string

const ISO_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/
const MS_PER_DAY = 86_400_000

const pad = (n: number): string => String(n).padStart(2, "0")

function isRealDate(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
}

/**
 * Normalise to `YYYY-MM-DD`, or null if invalid.
 * Strings: the written calendar date wins ("2026-10-05T23:00:00-05:00" → "2026-10-05").
 * Date objects: local calendar fields (matches the scheduler's toDateISO).
 */
export function toIsoDate(input: TourDateInput | null | undefined): IsoDate | null {
  if (input == null) return null
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null
    return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())}`
  }
  const match = ISO_PREFIX.exec(input.trim())
  if (!match) return null
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])]
  return isRealDate(y, m, d) ? `${match[1]}-${match[2]}-${match[3]}` : null
}

/** Days since 1970-01-01 for an ISO date. */
export function epochDay(iso: IsoDate): number {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  return Math.round(Date.UTC(y, m - 1, d) / MS_PER_DAY)
}

export function fromEpochDay(day: number): IsoDate {
  const dt = new Date(day * MS_PER_DAY)
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

export const addDays = (iso: IsoDate, n: number): IsoDate => fromEpochDay(epochDay(iso) + n)

/** Whole calendar days from a to b (b - a). */
export const diffDays = (a: IsoDate, b: IsoDate): number => epochDay(b) - epochDay(a)

/** 0 = Sunday … 6 = Saturday. */
export const dayOfWeek = (iso: IsoDate): number => new Date(epochDay(iso) * MS_PER_DAY).getUTCDay()

export const daysInMonth = (year: number, month1: number): number =>
  new Date(Date.UTC(year, month1, 0)).getUTCDate()

export const startOfMonth = (iso: IsoDate): IsoDate => `${iso.slice(0, 7)}-01`

export function endOfMonth(iso: IsoDate): IsoDate {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  return `${iso.slice(0, 7)}-${pad(daysInMonth(y, m))}`
}

/** Add whole months, clamping the day (Jan 31 + 1 month → Feb 28/29). */
export function addMonths(iso: IsoDate, n: number): IsoDate {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7)) - 1 + n
  const ny = y + Math.floor(m / 12)
  const nm = ((m % 12) + 12) % 12 + 1
  const d = Math.min(Number(iso.slice(8, 10)), daysInMonth(ny, nm))
  return `${ny}-${pad(nm)}-${pad(d)}`
}

export function startOfWeek(iso: IsoDate, weekStartsOn: 0 | 1 = 1): IsoDate {
  const offset = (dayOfWeek(iso) - weekStartsOn + 7) % 7
  return addDays(iso, -offset)
}

/** Inclusive list of ISO dates. */
export function eachDate(from: IsoDate, to: IsoDate): IsoDate[] {
  const start = epochDay(from)
  const end = epochDay(to)
  const out: IsoDate[] = []
  for (let d = start; d <= end; d++) out.push(fromEpochDay(d))
  return out
}

/** Today's local calendar date. */
export const todayIso = (now: Date = new Date()): IsoDate => toIsoDate(now) as IsoDate

/** A local Date at noon for the given ISO date (safe for pickers; noon avoids DST midnight gaps). */
export function isoToLocalDate(iso: IsoDate): Date {
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)), 12)
}

export const monthShort = (iso: IsoDate): string => MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]
export const weekdayShort = (iso: IsoDate): string => DAY_NAMES[dayOfWeek(iso)].slice(0, 3)
export const dayOfMonth = (iso: IsoDate): number => Number(iso.slice(8, 10))

/** "Oct 5" */
export const formatShort = (iso: IsoDate): string => `${monthShort(iso)} ${dayOfMonth(iso)}`
