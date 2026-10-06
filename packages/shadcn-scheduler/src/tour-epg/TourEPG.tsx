import React, { useCallback, useEffect, useMemo, useState } from "react"
import {
  BedDouble,
  Ban,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Truck,
  User,
  Utensils,
} from "lucide-react"
import { Button } from "../core/components/ui/button"
import { Calendar } from "../core/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../core/components/ui/popover"
import { useIsMobile, useIsTablet } from "../core/hooks/useMediaQuery"
import { cn } from "../core/lib/utils"
import { MONTHS } from "../core/constants"
import {
  addDays,
  addMonths,
  dayOfWeek,
  diffDays,
  endOfMonth,
  formatShort,
  isoToLocalDate,
  monthShort,
  startOfMonth,
  startOfWeek,
  toIsoDate,
  todayIso,
  weekdayShort,
  dayOfMonth,
  eachDate,
  epochDay,
  type IsoDate,
} from "./dates"
import { buildRows, normalizeDepartures, type EpgCell, type EpgRow } from "./engine"
import type {
  TourDepartureStatus,
  TourEpgProps,
  TourEpgStatusFilter,
  TourEpgView,
} from "./types"

// ─── presentation maps ───────────────────────────────────────────────────────

const STATUS_LABEL: Record<TourDepartureStatus, string> = {
  upcoming: "Upcoming",
  "starting-today": "Starting today",
  running: "Running",
  "ending-today": "Ending today",
  completed: "Completed",
  cancelled: "Cancelled",
}

const STATUS_BADGE: Record<TourDepartureStatus, string> = {
  upcoming: "border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300",
  "starting-today": "border-emerald-600 bg-emerald-500 text-white",
  running: "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "ending-today": "border-amber-500/40 bg-amber-500/20 text-amber-800 dark:text-amber-300",
  completed: "border-border bg-muted text-muted-foreground",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
}

const STATUS_ACCENT: Record<TourDepartureStatus, string> = {
  upcoming: "border-l-sky-500",
  "starting-today": "border-l-emerald-600",
  running: "border-l-emerald-500",
  "ending-today": "border-l-amber-500",
  completed: "border-l-muted-foreground/40",
  cancelled: "border-l-destructive",
}

const STATUS_BAR: Record<TourDepartureStatus, string> = {
  upcoming: "bg-sky-500/20 border-sky-500/40",
  "starting-today": "bg-emerald-500/30 border-emerald-600",
  running: "bg-emerald-500/20 border-emerald-500/40",
  "ending-today": "bg-amber-500/25 border-amber-500/50",
  completed: "bg-muted border-border",
  cancelled: "bg-destructive/10 border-destructive/40",
}

const FILTER_OPTIONS: { value: TourEpgStatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "running", label: "Running" },
  { value: "upcoming", label: "Upcoming" },
  { value: "starting-today", label: "Starting today" },
  { value: "ending-today", label: "Ending today" },
  { value: "completed", label: "Completed" },
]

const VIEWS: { value: TourEpgView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
]

/** Today column: a continuous vertical rule down the whole table. */
const TODAY_COLUMN = "bg-primary/5 shadow-[inset_2px_0_0_var(--primary),inset_-2px_0_0_var(--primary)]"

// ─── small helpers ───────────────────────────────────────────────────────────

function useControllable<T>(controlled: T | undefined, initial: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = useState<T>(initial)
  const value = controlled !== undefined ? controlled : inner
  const set = useCallback(
    (v: T): void => {
      if (controlled === undefined) setInner(v)
      onChange?.(v)
    },
    [controlled, onChange]
  )
  return [value, set]
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

function rangeLabel(view: TourEpgView, start: IsoDate, end: IsoDate): string {
  const year = (d: IsoDate): string => d.slice(0, 4)
  if (view === "day") return `${weekdayShort(start)}, ${formatShort(start)}, ${year(start)}`
  if (view === "month") return `${MONTHS[Number(start.slice(5, 7)) - 1]} ${year(start)}`
  if (year(start) !== year(end)) return `${formatShort(start)}, ${year(start)} – ${formatShort(end)}, ${year(end)}`
  if (monthShort(start) === monthShort(end)) return `${formatShort(start)} – ${dayOfMonth(end)}, ${year(start)}`
  return `${formatShort(start)} – ${formatShort(end)}, ${year(start)}`
}

/** Per-row caption derived from today's date, e.g. "Day 4 of 7" or "Starts in 3 days". */
function progressCaption(row: EpgRow, today: IsoDate): string {
  const n = row.normalized
  switch (row.status) {
    case "upcoming":
      return `Starts in ${plural(diffDays(today, n.start), "day", "days")}`
    case "completed":
      return `Ended ${formatShort(n.end)}`
    case "cancelled":
      return "" // the status badge already says it
    default:
      return `Day ${diffDays(n.start, today) + 1} of ${n.durationDays}`
  }
}

function cellLabel(row: EpgRow, cell: EpgCell): string {
  const dep = row.departure
  const code = dep.departureCode ? ` ${dep.departureCode}` : ""
  const dest = cell.day?.destination ? `: ${cell.day.destination}` : ""
  return `${dep.tourName}${code}, day ${cell.dayNumber}, ${formatShort(cell.date)}${dest}`
}

/**
 * Arrow-key navigation between itinerary cells (and month day markers).
 * Left/Right move along a departure, Up/Down move to the same date on the
 * neighbouring departure (nearest date if that departure isn't running then).
 * Home/End jump to the first/last cell of the row.
 */
function handleGridKeyDown(e: React.KeyboardEvent<HTMLElement>): void {
  const target = e.target as HTMLElement
  if (!target.matches?.("button[data-date]")) return
  const rowEl = target.closest<HTMLElement>("[data-departure-id]")
  if (!rowEl) return
  const cellsOf = (row: Element): HTMLElement[] => Array.from(row.querySelectorAll<HTMLElement>("button[data-date]"))
  let next: HTMLElement | undefined
  const cells = cellsOf(rowEl)
  const i = cells.indexOf(target)
  switch (e.key) {
    case "ArrowRight": next = cells[i + 1]; break
    case "ArrowLeft": next = cells[i - 1]; break
    case "Home": next = cells[0]; break
    case "End": next = cells[cells.length - 1]; break
    case "ArrowDown":
    case "ArrowUp": {
      const sibling = e.key === "ArrowDown" ? rowEl.nextElementSibling : rowEl.previousElementSibling
      if (!(sibling instanceof HTMLElement) || !sibling.hasAttribute("data-departure-id")) break
      const want = epochDay(target.dataset.date as IsoDate)
      let best = Infinity
      for (const c of cellsOf(sibling)) {
        const dist = Math.abs(epochDay(c.dataset.date as IsoDate) - want)
        if (dist < best) { best = dist; next = c }
      }
      break
    }
    default:
      return
  }
  e.preventDefault()
  if (next) {
    next.focus()
    next.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }
}

// ─── pieces ──────────────────────────────────────────────────────────────────

function StatusBadge({ status, className }: { status: TourDepartureStatus; className?: string }): React.ReactElement {
  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-0 text-[10px] font-semibold uppercase leading-4 tracking-wide",
        STATUS_BADGE[status],
        className
      )}
    >
      {status === "cancelled" && <Ban size={9} aria-hidden />}
      {STATUS_LABEL[status]}
    </span>
  )
}

function DetailLine({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }): React.ReactElement | null {
  if (!value) return null
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="sr-only">{label}: </span>
        {value}
      </span>
    </div>
  )
}

/** Hover/focus popover. Controlled so it opens on hover and keyboard focus, not only on click. */
function HoverCard({
  trigger,
  children,
}: {
  trigger: (handlers: {
    onMouseEnter: () => void
    onMouseLeave: () => void
    onFocus: () => void
    onBlur: () => void
  }) => React.ReactElement
  children: React.ReactNode
}): React.ReactElement {
  const [open, setOpen] = useState(false)
  const show = useCallback(() => setOpen(true), [])
  const hide = useCallback(() => setOpen(false), [])
  return (
    <Popover open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <PopoverTrigger asChild>{trigger({ onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide })}</PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="pointer-events-none w-64 space-y-1.5 p-3 text-xs"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

function CellDetails({ row, cell }: { row: EpgRow; cell: EpgCell }): React.ReactElement {
  const dep = row.departure
  const day = cell.day
  const guide = day?.guide?.name ?? dep.guide?.name
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 font-semibold leading-tight">
          {dep.tourName}
          {dep.departureCode ? <span className="ml-1 font-normal text-muted-foreground">{dep.departureCode}</span> : null}
        </div>
        <StatusBadge status={row.status} />
      </div>
      <div className="text-muted-foreground">
        Day {cell.dayNumber} · {weekdayShort(cell.date)} {formatShort(cell.date)}
      </div>
      {day ? (
        <div className="space-y-1 border-t border-border pt-1.5">
          <DetailLine icon={<MapPin size={12} />} label="Destination" value={day.destination} />
          <DetailLine icon={<BedDouble size={12} />} label="Accommodation" value={day.accommodation?.name} />
          <DetailLine icon={<Utensils size={12} />} label="Restaurant" value={day.restaurant?.name} />
          <DetailLine icon={<User size={12} />} label="Guide" value={guide} />
          <DetailLine icon={<Truck size={12} />} label="Transportation" value={day.transportation?.name} />
          {day.activities?.length ? (
            <div>
              <span className="text-muted-foreground">Activities: </span>
              {day.activities.join(", ")}
            </div>
          ) : null}
          {day.notes ? <div className="text-muted-foreground">{day.notes}</div> : null}
        </div>
      ) : (
        <div className="border-t border-border pt-1.5 text-muted-foreground">No itinerary entry for this day.</div>
      )}
    </>
  )
}

interface ItineraryCellProps {
  row: EpgRow
  cell: EpgCell
  isToday: boolean
  /** "full" = day view, "normal" = week view, "compact" = tablet/mobile */
  density: "full" | "normal" | "compact"
  onClick?: () => void
}

function ItineraryCell({ row, cell, isToday, density, onClick }: ItineraryCellProps): React.ReactElement {
  const day = cell.day
  const guide = day?.guide?.name ?? row.departure.guide?.name
  const cancelled = row.status === "cancelled"
  const showMeta = density !== "compact"
  const meta: { icon: React.ReactNode; text?: string }[] = [
    { icon: <BedDouble size={10} />, text: day?.accommodation?.name },
    { icon: <User size={10} />, text: guide },
    { icon: <Truck size={10} />, text: day?.transportation?.name },
    ...(density === "full"
      ? [
          { icon: <Utensils size={10} />, text: day?.restaurant?.name },
          { icon: <MapPin size={10} />, text: day?.activities?.join(", ") },
        ]
      : []),
  ]
  return (
    <HoverCard
      trigger={(h) => (
        <button
          type="button"
          aria-label={cellLabel(row, cell)}
          data-day-number={cell.dayNumber}
          data-date={cell.date}
          onClick={onClick}
          {...h}
          className={cn(
            "flex h-full w-full min-w-0 flex-col items-stretch gap-0.5 rounded-sm border border-l-[3px] border-border bg-card p-1.5 text-left text-xs shadow-sm transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            STATUS_ACCENT[row.status],
            cancelled && "opacity-60",
            isToday && "ring-1 ring-primary/40"
          )}
        >
          <span className="flex items-center gap-1">
            <span className="rounded bg-primary px-1 text-[10px] font-bold leading-4 tabular-nums text-primary-foreground">
              D{cell.dayNumber}
            </span>
            {cell.isStart && <span className="text-[9px] font-semibold uppercase text-muted-foreground">Start</span>}
            {cell.isEnd && !cell.isStart && <span className="text-[9px] font-semibold uppercase text-muted-foreground">End</span>}
          </span>
          <span className={cn("line-clamp-2 break-words font-medium leading-tight", cancelled && "line-through")}>
            {day?.destination ?? <span className="font-normal text-muted-foreground">—</span>}
          </span>
          {showMeta &&
            meta
              .filter((m) => m.text)
              .map((m, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="shrink-0" aria-hidden>
                    {m.icon}
                  </span>
                  <span className="truncate">{m.text}</span>
                </span>
              ))}
        </button>
      )}
    >
      <CellDetails row={row} cell={cell} />
    </HoverCard>
  )
}

interface LeftPanelProps {
  row: EpgRow
  today: IsoDate
  narrow: boolean
  onClick: () => void
}

function LeftPanel({ row, today, narrow, onClick }: LeftPanelProps): React.ReactElement {
  const dep = row.departure
  const cancelled = row.status === "cancelled"
  const caption = progressCaption(row, today)
  const facts = [
    plural(row.normalized.durationDays, "Day", "Days"),
    dep.guestCount !== undefined ? plural(dep.guestCount, "Guest", "Guests") : null,
  ].filter(Boolean)
  return (
    <div role="rowheader" className="sticky left-0 z-20 flex border-b border-r border-border bg-background">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open ${dep.tourName}${dep.departureCode ? ` ${dep.departureCode}` : ""}, ${STATUS_LABEL[row.status]}`}
        className="flex w-full min-w-0 flex-col justify-center gap-0.5 px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span className={cn("truncate text-sm font-semibold leading-tight", cancelled && "line-through")}>
          {dep.tourName}
          {dep.departureCode ? <span className="ml-1 font-normal text-muted-foreground">{dep.departureCode}</span> : null}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">{facts.join(" • ")}</span>
        {!narrow && dep.guide && <span className="truncate text-[11px] text-muted-foreground">Guide: {dep.guide.name}</span>}
        <span className="flex items-center gap-1.5">
          <StatusBadge status={row.status} />
          {!narrow && caption && <span className="truncate text-[10px] text-muted-foreground">{caption}</span>}
        </span>
      </button>
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

/**
 * Tour Operations EPG — rows are tour departures, columns are real calendar
 * dates, and each cell shows that departure's own itinerary day.
 * A view over host-supplied itinerary data; it never edits it.
 */
export function TourEPG({
  departures,
  initialView = "week",
  view: viewProp,
  onViewChange,
  initialDate,
  date: dateProp,
  onDateChange,
  today: todayProp,
  weekStartsOn = 1,
  statusFilter: statusProp,
  onStatusFilterChange,
  filters,
  search: searchProp,
  onSearchChange,
  filterDeparture,
  onTourClick,
  onDepartureClick,
  onItineraryDayClick,
  title = "Tour EPG",
  showFilters = true,
  showSearch = true,
  emptyMessage = "No departures in this period.",
  maxHeight = "70vh",
  className,
}: TourEpgProps): React.ReactElement {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  // today — live unless the host pins it
  const pinnedToday = toIsoDate(todayProp)
  const [liveToday, setLiveToday] = useState<IsoDate>(() => todayIso())
  useEffect(() => {
    if (pinnedToday) return
    const id = setInterval(() => setLiveToday((prev) => {
      const next = todayIso()
      return next === prev ? prev : next
    }), 60_000)
    return () => clearInterval(id)
  }, [pinnedToday])
  const today = pinnedToday ?? liveToday

  const [view, setView] = useControllable<TourEpgView>(viewProp, initialView, onViewChange)
  const [statusFilter, setStatusFilter] = useControllable<TourEpgStatusFilter>(statusProp, "all", onStatusFilterChange)
  const [search, setSearch] = useControllable<string>(searchProp, "", onSearchChange)

  const controlledDate = toIsoDate(dateProp)
  const [innerDate, setInnerDate] = useState<IsoDate>(() => toIsoDate(initialDate) ?? today)
  const isDateControlled = controlledDate !== null
  const anchor = controlledDate ?? innerDate
  const setAnchor = useCallback(
    (iso: IsoDate): void => {
      if (!isDateControlled) setInnerDate(iso)
      onDateChange?.(isoToLocalDate(iso))
    },
    [isDateControlled, onDateChange]
  )

  const [calendarOpen, setCalendarOpen] = useState(false)

  const [rangeStart, rangeEnd] = useMemo((): [IsoDate, IsoDate] => {
    if (view === "day") return [anchor, anchor]
    if (view === "week") {
      const s = startOfWeek(anchor, weekStartsOn)
      return [s, addDays(s, 6)]
    }
    return [startOfMonth(anchor), endOfMonth(anchor)]
  }, [view, anchor, weekStartsOn])

  const dates = useMemo(() => eachDate(rangeStart, rangeEnd), [rangeStart, rangeEnd])

  // Normalise once per data change; filter/slice per range change.
  const normalized = useMemo(() => normalizeDepartures(departures), [departures])
  const rows = useMemo(
    () => buildRows(normalized, { rangeStart, rangeEnd, today, statusFilter, filters, search, filterDeparture }),
    [normalized, rangeStart, rangeEnd, today, statusFilter, filters, search, filterDeparture]
  )

  const step = (dir: 1 | -1): void => {
    if (view === "day") setAnchor(addDays(anchor, dir))
    else if (view === "week") setAnchor(addDays(anchor, dir * 7))
    else setAnchor(addMonths(anchor, dir))
  }

  // sizing
  const leftW = isMobile ? 132 : isTablet ? 188 : 248
  const colMin = view === "month" ? (isMobile ? 28 : 34) : view === "day" ? (isMobile ? 220 : 320) : isMobile ? 104 : isTablet ? 120 : 140
  const density: ItineraryCellProps["density"] = view === "day" ? "full" : isMobile || isTablet ? "compact" : "normal"
  const template = `${leftW}px repeat(${dates.length}, minmax(${colMin}px, 1fr))`
  const minWidth = leftW + dates.length * colMin

  const openDeparture = (row: EpgRow): void => {
    onTourClick?.(row.departure.tourId, row.departure)
    onDepartureClick?.(row.departure)
  }
  const openDay = (row: EpgRow, cell: EpgCell): void =>
    onItineraryDayClick?.({
      departure: row.departure,
      day: cell.day,
      dayNumber: cell.dayNumber,
      date: cell.date,
      status: row.status,
    })

  const isWeekendCol = (iso: IsoDate): boolean => {
    const d = dayOfWeek(iso)
    return d === 0 || d === 6
  }

  const rangeText = rangeLabel(view, rangeStart, rangeEnd)

  return (
    <section aria-label={title} className={cn("flex w-full min-w-0 max-w-full flex-col gap-3 text-foreground", className)}>
      {/* ── header ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-base font-semibold">{title}</h2>

        <div role="group" aria-label="View" className="flex items-center rounded-lg bg-muted p-1">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              aria-pressed={view === v.value}
              onClick={() => setView(v.value)}
              className={cn(
                "h-7 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                view === v.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" className="h-7" onClick={() => setAnchor(today)}>
          Today
        </Button>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon" className="h-7 w-7 rounded" aria-label={`Previous ${view}`} onClick={() => step(-1)}>
            <ChevronLeft size={14} />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 min-w-0 gap-1.5 border-transparent bg-transparent px-2 font-normal shadow-none hover:bg-muted/50" aria-label={`${rangeText}. Pick a date`}>
                <CalendarDays size={13} aria-hidden />
                {rangeText}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={isoToLocalDate(anchor)}
                onSelect={(d) => {
                  const iso = toIsoDate(d)
                  if (iso) {
                    setAnchor(iso)
                    setCalendarOpen(false)
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" className="h-7 w-7 rounded" aria-label={`Next ${view}`} onClick={() => step(1)}>
            <ChevronRight size={14} />
          </Button>
        </div>

        {showSearch && (
          <label className="relative ml-auto flex items-center">
            <Search size={13} className="pointer-events-none absolute left-2 text-muted-foreground" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tours"
              aria-label="Search tours"
              className="h-7 w-44 rounded-md border border-input bg-background pl-7 pr-2 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </label>
        )}
      </div>

      {showFilters && (
        <div role="group" aria-label="Filter by status" className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {FILTER_OPTIONS.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "h-6 shrink-0 whitespace-nowrap rounded-full border px-2.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                statusFilter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-1 shrink-0 text-[11px] text-muted-foreground" aria-live="polite">
            {plural(rows.length, "departure", "departures")}
          </span>
        </div>
      )}

      {/* ── grid ── */}
      <div
        className="overflow-auto rounded-md border border-border bg-background"
        // keep keyboard-focused cells clear of the sticky column and header
        style={{ maxHeight, scrollPaddingLeft: leftW, scrollPaddingTop: 64 }}
        data-testid="tour-epg-scroll"
      >
        <div role="table" aria-label={`${title}, ${rangeText}`} style={{ minWidth }} onKeyDown={handleGridKeyDown}>
          {/* global date header: real calendar dates only */}
          <div role="row" className="sticky top-0 z-30 grid bg-background" style={{ gridTemplateColumns: template }}>
            <div role="columnheader" className="sticky left-0 z-40 flex items-end border-b border-r border-border bg-background px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Departure
            </div>
            {dates.map((iso) => {
              const isToday = iso === today
              return (
                <div
                  key={iso}
                  role="columnheader"
                  data-date={iso}
                  data-today={isToday ? "true" : undefined}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "flex flex-col items-center justify-center border-b border-border py-1 text-center",
                    isWeekendCol(iso) && "bg-muted/40",
                    isToday && TODAY_COLUMN
                  )}
                >
                  {isToday && (
                    <span className="mb-0.5 rounded-sm bg-primary px-1 text-[9px] font-bold uppercase leading-3 tracking-wider text-primary-foreground">
                      Today
                    </span>
                  )}
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">{weekdayShort(iso)}</span>
                  <span className="text-xs font-semibold uppercase tabular-nums">
                    {view === "month" ? dayOfMonth(iso) : `${monthShort(iso)} ${dayOfMonth(iso)}`}
                  </span>
                </div>
              )
            })}
          </div>

          {rows.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground" role="row">
              <span role="cell">{emptyMessage}</span>
            </div>
          )}

          {rows.map((row) => (
            <div
              key={row.key}
              role="row"
              data-departure-id={row.departure.id}
              className="grid"
              style={{ gridTemplateColumns: template, minHeight: view === "month" ? 64 : density === "compact" ? 76 : 96 }}
            >
              <LeftPanel row={row} today={today} narrow={isMobile || isTablet} onClick={() => openDeparture(row)} />

              {/* background cells: weekend tint + today rule */}
              {dates.map((iso, i) => (
                <div
                  key={iso}
                  role={view === "month" ? "presentation" : "cell"}
                  style={{ gridColumn: i + 2, gridRow: 1 }}
                  className={cn(
                    "border-b border-border",
                    view !== "month" && "p-1",
                    isWeekendCol(iso) && "bg-muted/30",
                    iso === today && TODAY_COLUMN
                  )}
                >
                  {view !== "month" && row.cells[i] && (
                    <ItineraryCell
                      row={row}
                      cell={row.cells[i] as EpgCell}
                      isToday={iso === today}
                      density={density}
                      onClick={() => openDay(row, row.cells[i] as EpgCell)}
                    />
                  )}
                </div>
              ))}

              {view === "month" && row.bar && (
                <MonthBar row={row} today={today} onOpen={() => openDeparture(row)} onDay={(cell) => openDay(row, cell)} narrow={isMobile} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function MonthBar({
  row,
  onOpen,
  onDay,
  narrow,
}: {
  row: EpgRow
  today: IsoDate
  onOpen: () => void
  onDay: (cell: EpgCell) => void
  narrow: boolean
}): React.ReactElement {
  const bar = row.bar as NonNullable<EpgRow["bar"]>
  const n = row.normalized
  const dep = row.departure
  const cancelled = row.status === "cancelled"
  const cells = row.cells.slice(bar.startCol, bar.endCol + 1) as EpgCell[]
  // Short bars give the name all the room; dates and codes only appear when there is space.
  const cols = cells.length
  const showCode = cols >= 5
  const showDates = cols >= 6 && !narrow
  return (
    <div
      className={cn(
        "z-10 my-1.5 flex min-w-0 flex-col justify-between overflow-hidden border px-1 py-0.5",
        STATUS_BAR[row.status],
        bar.continuesBefore ? "rounded-l-none border-l-0" : "rounded-l-md",
        bar.continuesAfter ? "rounded-r-none border-r-0" : "rounded-r-md"
      )}
      style={{ gridColumn: `${bar.startCol + 2} / ${bar.endCol + 3}`, gridRow: 1 }}
      data-testid="tour-epg-bar"
      data-start-col={bar.startCol}
      data-end-col={bar.endCol}
    >
      <HoverCard
        trigger={(h) => (
          <button
            type="button"
            onClick={onOpen}
            {...h}
            aria-label={`${dep.tourName}${dep.departureCode ? ` ${dep.departureCode}` : ""}, ${formatShort(n.start)} to ${formatShort(n.end)}, ${STATUS_LABEL[row.status]}`}
            className="flex min-w-0 items-baseline gap-1 rounded-sm text-left text-[11px] leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className={cn("truncate font-semibold", cancelled && "line-through")}>
              {dep.tourName}
              {showCode && dep.departureCode ? ` ${dep.departureCode}` : ""}
            </span>
            {showDates && (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {formatShort(n.start)} → {formatShort(n.end)}
              </span>
            )}
          </button>
        )}
      >
        <div className="font-semibold">
          {dep.tourName}
          {dep.departureCode ? <span className="ml-1 font-normal text-muted-foreground">{dep.departureCode}</span> : null}
        </div>
        <StatusBadge status={row.status} />
        <div className="text-muted-foreground">
          {formatShort(n.start)} → {formatShort(n.end)} · {plural(n.durationDays, "day", "days")}
        </div>
        {dep.guestCount !== undefined && <div>{plural(dep.guestCount, "guest", "guests")}</div>}
        {dep.guide && <div>Guide: {dep.guide.name}</div>}
        {n.destinations.length > 0 && (
          <div className="text-muted-foreground">{Array.from(new Set(n.destinations)).slice(0, 6).join(" → ")}</div>
        )}
      </HoverCard>
      <div className="flex min-w-0">
        {cells.map((cell) => (
          <button
            key={cell.date}
            type="button"
            onClick={() => onDay(cell)}
            title={`D${cell.dayNumber} · ${formatShort(cell.date)}${cell.day?.destination ? ` · ${cell.day.destination}` : ""}`}
            aria-label={cellLabel(row, cell)}
            data-day-number={cell.dayNumber}
            data-date={cell.date}
            className="min-w-0 flex-1 truncate rounded-sm text-center text-[9px] font-medium tabular-nums text-foreground/70 hover:bg-background/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {narrow && !cell.isStart && !cell.isEnd ? "·" : `D${cell.dayNumber}`}
          </button>
        ))}
      </div>
    </div>
  )
}
