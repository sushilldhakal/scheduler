/**
 * Pure EPG engine: maps calendar dates → itinerary days per departure.
 * No React, no itinerary invention — only lookups over host data.
 */
import { addDays, epochDay, eachDate, toIsoDate, type IsoDate } from "./dates"
import type {
  TourDeparture,
  TourDepartureStatus,
  TourEpgFilters,
  TourEpgStatusFilter,
  TourItineraryDay,
} from "./types"

export interface NormalizedDeparture {
  departure: TourDeparture
  start: IsoDate
  end: IsoDate
  startDay: number
  endDay: number
  /** Inclusive number of calendar days. */
  durationDays: number
  byNumber: Map<number, TourItineraryDay>
  byDate: Map<IsoDate, TourItineraryDay>
  destinations: string[]
  guides: { id?: string; name: string }[]
  vehicles: string[]
  searchText: string
}

export interface EpgCell {
  date: IsoDate
  dayNumber: number
  /** null when the host has no itinerary entry for this day. */
  day: TourItineraryDay | null
  isStart: boolean
  isEnd: boolean
}

export interface EpgBar {
  /** 0-based column indexes within the visible range (inclusive), already clipped. */
  startCol: number
  endCol: number
  continuesBefore: boolean
  continuesAfter: boolean
}

export interface EpgRow {
  key: string
  departure: TourDeparture
  normalized: NormalizedDeparture
  status: TourDepartureStatus
  /** One entry per visible date; null where the departure isn't operating. */
  cells: (EpgCell | null)[]
  bar: EpgBar | null
}

const lc = (s: string): string => s.toLowerCase()

/** Returns null when the start date is unusable (such a departure can't be placed on a calendar). */
export function normalizeDeparture(departure: TourDeparture): NormalizedDeparture | null {
  const start = toIsoDate(departure.startDate)
  if (!start) return null

  const byNumber = new Map<number, TourItineraryDay>()
  const byDate = new Map<IsoDate, TourItineraryDay>()
  let maxDayNumber = 1
  let maxExplicit: IsoDate | null = null
  for (const day of departure.itinerary ?? []) {
    byNumber.set(day.dayNumber, day)
    if (day.dayNumber > maxDayNumber) maxDayNumber = day.dayNumber
    const d = toIsoDate(day.date)
    if (d) {
      byDate.set(d, day)
      if (!maxExplicit || d > maxExplicit) maxExplicit = d
    }
  }

  let end = toIsoDate(departure.endDate)
  if (!end) {
    end = addDays(start, maxDayNumber - 1)
    if (maxExplicit && maxExplicit > end) end = maxExplicit
  }
  if (end < start) end = start

  const destinations: string[] = []
  const vehicles: string[] = []
  const guides: { id?: string; name: string }[] = []
  if (departure.guide) guides.push(departure.guide)
  for (const day of byNumber.values()) {
    if (day.destination) destinations.push(day.destination)
    if (day.transportation?.name) vehicles.push(day.transportation.name)
    if (day.guide) guides.push(day.guide)
  }

  const searchText = lc(
    [
      departure.tourName,
      departure.departureCode ?? "",
      ...destinations,
      ...guides.map((g) => g.name),
      ...vehicles,
    ].join("\n")
  )

  return {
    departure,
    start,
    end,
    startDay: epochDay(start),
    endDay: epochDay(end),
    durationDays: epochDay(end) - epochDay(start) + 1,
    byNumber,
    byDate,
    destinations,
    guides,
    vehicles,
    searchText,
  }
}

export function normalizeDepartures(departures: readonly TourDeparture[]): NormalizedDeparture[] {
  const out: NormalizedDeparture[] = []
  for (const d of departures) {
    const n = normalizeDeparture(d)
    if (n) out.push(n)
  }
  return out
}

/** Calendar date → this departure's itinerary day, or null outside its range. */
export function cellOn(n: NormalizedDeparture, date: IsoDate): EpgCell | null {
  const day = epochDay(date)
  if (day < n.startDay || day > n.endDay) return null
  // Explicit host dates win. Offset matching only applies to days the host left undated,
  // so a dated day can't leak onto the wrong calendar date (e.g. around a rest day).
  let match = n.byDate.get(date) ?? null
  if (!match) {
    const byOffset = n.byNumber.get(day - n.startDay + 1) ?? null
    if (byOffset && toIsoDate(byOffset.date) === null) match = byOffset
  }
  return {
    date,
    dayNumber: match?.dayNumber ?? day - n.startDay + 1,
    day: match,
    isStart: day === n.startDay,
    isEnd: day === n.endDay,
  }
}

/** Lifecycle status on `today`; a host-supplied "cancelled" always wins. Single-day tours report "starting-today". */
export function deriveStatus(n: NormalizedDeparture, today: IsoDate): TourDepartureStatus {
  if (n.departure.status === "cancelled") return "cancelled"
  const t = epochDay(today)
  if (t < n.startDay) return "upcoming"
  if (t > n.endDay) return "completed"
  if (t === n.startDay) return "starting-today"
  if (t === n.endDay) return "ending-today"
  return "running"
}

export function matchesStatusFilter(status: TourDepartureStatus, filter: TourEpgStatusFilter): boolean {
  switch (filter) {
    case "all":
      return true
    case "running":
      // Operationally "running" includes the first and last day.
      return status === "running" || status === "starting-today" || status === "ending-today"
    default:
      return status === filter
  }
}

function matchesFacets(n: NormalizedDeparture, f: TourEpgFilters | undefined): boolean {
  if (!f) return true
  const d = n.departure
  if (f.tourIds?.length && !f.tourIds.includes(d.tourId)) return false
  if (f.departureIds?.length && !f.departureIds.includes(d.id)) return false
  if (f.destinations?.length) {
    const wanted = f.destinations.map(lc)
    if (!n.destinations.some((x) => wanted.includes(lc(x)))) return false
  }
  if (f.guides?.length) {
    const wanted = f.guides.map(lc)
    if (!n.guides.some((g) => wanted.includes(lc(g.name)) || (g.id !== undefined && wanted.includes(lc(g.id))))) return false
  }
  if (f.vehicles?.length) {
    const wanted = f.vehicles.map(lc)
    if (!n.vehicles.some((x) => wanted.includes(lc(x)))) return false
  }
  return true
}

/** All whitespace-separated tokens must appear somewhere in the searchable text. */
export function matchesSearch(n: NormalizedDeparture, search: string | undefined): boolean {
  const tokens = (search ?? "").toLowerCase().split(/\s+/).filter(Boolean)
  return tokens.every((t) => n.searchText.includes(t))
}

export interface BuildRowsOptions {
  rangeStart: IsoDate
  rangeEnd: IsoDate
  today: IsoDate
  statusFilter?: TourEpgStatusFilter
  filters?: TourEpgFilters
  search?: string
  filterDeparture?: (d: TourDeparture) => boolean
}

/**
 * One row per departure overlapping the visible range. Departures outside the
 * range are skipped with two integer comparisons, so cost scales with what is
 * visible rather than with history.
 */
export function buildRows(departures: readonly NormalizedDeparture[], opts: BuildRowsOptions): EpgRow[] {
  const { rangeStart, rangeEnd, today } = opts
  const rs = epochDay(rangeStart)
  const re = epochDay(rangeEnd)
  const dates = eachDate(rangeStart, rangeEnd)
  const rows: EpgRow[] = []

  for (const n of departures) {
    if (n.endDay < rs || n.startDay > re) continue
    const status = deriveStatus(n, today)
    if (!matchesStatusFilter(status, opts.statusFilter ?? "all")) continue
    if (!matchesFacets(n, opts.filters)) continue
    if (!matchesSearch(n, opts.search)) continue
    if (opts.filterDeparture && !opts.filterDeparture(n.departure)) continue

    const cells = dates.map((d) => cellOn(n, d))
    const first = Math.max(n.startDay, rs) - rs
    const last = Math.min(n.endDay, re) - rs
    rows.push({
      key: n.departure.id,
      departure: n.departure,
      normalized: n,
      status,
      cells,
      bar: {
        startCol: first,
        endCol: last,
        continuesBefore: n.startDay < rs,
        continuesAfter: n.endDay > re,
      },
    })
  }

  rows.sort(
    (a, b) =>
      a.normalized.startDay - b.normalized.startDay ||
      a.departure.tourName.localeCompare(b.departure.tourName) ||
      (a.departure.departureCode ?? "").localeCompare(b.departure.departureCode ?? "") ||
      a.departure.id.localeCompare(b.departure.id)
  )
  return rows
}

