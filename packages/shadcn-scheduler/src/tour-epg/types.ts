/**
 * Tour EPG types.
 *
 * The EPG is a *view* over itinerary data the host application already owns.
 * Nothing here invents or stores itinerary content — it only maps
 * calendar date → itinerary day for each departure.
 */

/** A calendar date. Strings are read as the written `YYYY-MM-DD` (time/zone suffix ignored); Dates use local calendar fields. */
export type TourDateInput = Date | string

/** Derived lifecycle status shown on each row. */
export type TourDepartureStatus =
  | "upcoming"
  | "starting-today"
  | "running"
  | "ending-today"
  | "completed"
  | "cancelled"

export interface TourEntityRef {
  id?: string
  name: string
}

export interface TourItineraryDay {
  id: string
  dayNumber: number
  /** Prefer supplying this when the host already has it; otherwise it is derived from the departure start date + dayNumber. */
  date?: TourDateInput
  destination?: string
  accommodation?: TourEntityRef
  transportation?: TourEntityRef
  guide?: TourEntityRef
  restaurant?: TourEntityRef
  activities?: string[]
  notes?: string
  meta?: Record<string, unknown>
}

export interface TourDeparture {
  id: string
  tourId: string
  tourName: string
  departureCode?: string
  startDate: TourDateInput
  /** Optional. Defaults to the last itinerary day (or startDate when there is no itinerary). */
  endDate?: TourDateInput
  /** Only `"cancelled"` is honoured; every other status is derived from the dates. */
  status?: TourDepartureStatus
  guide?: TourEntityRef
  guestCount?: number
  itinerary: TourItineraryDay[]
  meta?: Record<string, unknown>
}

export type TourEpgView = "day" | "week" | "month"

export type TourEpgStatusFilter =
  | "all"
  | "running"
  | "upcoming"
  | "starting-today"
  | "ending-today"
  | "completed"
  | "cancelled"

/** Facet filters supplied by the host. Empty/undefined = no restriction. Names match case-insensitively; guides also match by id. */
export interface TourEpgFilters {
  destinations?: string[]
  guides?: string[]
  vehicles?: string[]
  tourIds?: string[]
  departureIds?: string[]
}

/** Everything the host needs to open an itinerary day. */
export interface TourItineraryDayClickContext {
  departure: TourDeparture
  /** null when the host supplied no itinerary entry for this day (cell still sits inside the departure). */
  day: TourItineraryDay | null
  dayNumber: number
  /** `YYYY-MM-DD` */
  date: string
  status: TourDepartureStatus
}

export interface TourEpgProps {
  departures: TourDeparture[]

  /** Uncontrolled initial view. Default `"week"`. */
  initialView?: TourEpgView
  /** Controlled view. */
  view?: TourEpgView
  onViewChange?: (view: TourEpgView) => void

  /** Uncontrolled initial date. Default: today. */
  initialDate?: TourDateInput
  /** Controlled date. */
  date?: TourDateInput
  onDateChange?: (date: Date) => void

  /** Override "today" (tests, SSR, demos). Default: the live local date, refreshed at midnight. */
  today?: TourDateInput
  /** 0 = Sunday, 1 = Monday (default). */
  weekStartsOn?: 0 | 1

  /** Controlled status filter. */
  statusFilter?: TourEpgStatusFilter
  onStatusFilterChange?: (filter: TourEpgStatusFilter) => void
  filters?: TourEpgFilters
  /** Controlled search text (matches tour, code, destination, guide, vehicle). */
  search?: string
  onSearchChange?: (search: string) => void
  /** Extra host predicate, applied after the built-in filters. */
  filterDeparture?: (departure: TourDeparture) => boolean

  onTourClick?: (tourId: string, departure: TourDeparture) => void
  onDepartureClick?: (departure: TourDeparture) => void
  onItineraryDayClick?: (ctx: TourItineraryDayClickContext) => void

  title?: string
  showFilters?: boolean
  showSearch?: boolean
  emptyMessage?: string
  /** CSS max-height of the scroll area (sticky header needs a bounded height). Default `"70vh"`. */
  maxHeight?: number | string
  className?: string
}
