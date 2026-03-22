import type { ReactNode, RefObject } from "react"

// ─── Core Data Types ─────────────────────────────────────────────────────────


// ─── Recurrence ───────────────────────────────────────────────────────────────

/**
 * RFC 5545-compatible recurrence rule (subset).
 * Stored on the "master" block; occurrences are generated at render time.
 */
export type RecurrenceFreq = "daily" | "weekly" | "monthly"

export interface RecurrenceRule {
  freq: RecurrenceFreq
  /** Repeat every N periods. Default 1. */
  interval?: number
  /** Days of week (0=Sun…6=Sat). Only meaningful when freq="weekly". */
  byDay?: number[]
  /** ISO date string (YYYY-MM-DD) — last occurrence date (inclusive). */
  until?: string
  /** Stop after N occurrences (ignored when until is set). */
  count?: number
}

// ─── Shift dependencies ───────────────────────────────────────────────────────

/**
 * A directed relationship between two blocks.
 * Rendered as an SVG arrow from the end of `fromId` to the start of `toId`.
 */
export type DependencyType = "finish-to-start" | "start-to-start" | "finish-to-finish" | "start-to-finish"

export interface ShiftDependency {
  id: string
  fromId: string
  toId: string
  type?: DependencyType   // default "finish-to-start"
  color?: string          // CSS color, default var(--primary)
  label?: string
}


// ─── Employee availability ────────────────────────────────────────────────────

/**
 * Declares available time windows for an employee.
 * Slots outside these windows are shaded in the grid (unavailable overlay).
 * If an employee has no entry here they are treated as always available.
 */
export interface AvailabilityWindow {
  /** 0=Sun … 6=Sat. Absent = applies to all days. */
  dayOfWeek?: number
  /** Specific ISO date (YYYY-MM-DD). Takes precedence over dayOfWeek. */
  date?: string
  startH: number
  endH: number
}

export interface EmployeeAvailability {
  employeeId: string
  windows: AvailabilityWindow[]
}

/**
 * A single schedule block (shift/slot). Generic TMeta is the extensibility escape hatch
 * for domain-specific data (e.g. money, episode numbers, qualification codes).
 */
export interface Block<TMeta = Record<string, unknown>> {
  id: string
  categoryId: string
  employeeId: string
  /** Date as ISO date string (YYYY-MM-DD). No bare Date in API. */
  date: string
  startH: number
  endH: number
  /** Break start hour — present when shift has a break */
  breakStartH?: number
  /** Break end hour — present when shift has a break */
  breakEndH?: number
  draggable?: boolean
  resizable?: boolean
  employee: string
  status: "draft" | "published"
  /** Optional domain-specific payload. Fully typed when you use Block<YourMeta>. */
  meta?: TMeta
  /** Recurrence rule — when present, this is a master block; occurrences are generated automatically. */
  recurrence?: RecurrenceRule
  /** When this is a generated occurrence, points to the master block id. */
  recurringMasterId?: string
}

// ─── Tree / flat-row model ────────────────────────────────────────────────────

/**
 * A single virtualizer row. Either:
 *   kind="category" — a group header (collapsible). Shows category name + stats.
 *   kind="employee" — one row per employee inside the category. Shows their shifts.
 *
 * This is the Phase-4 employee-per-row tree model. The grid renders one virtualizer
 * row per FlatRow instead of one per category.
 */
export interface FlatRow {
  /** Unique row key — stable across re-renders */
  key: string
  kind: "category" | "employee"
  /** The category this row belongs to (or is) */
  category: Resource
  /** Present when kind === "employee" */
  employee?: Resource
  /** Depth for indentation (0 = category header, 1 = employee row) */
  depth: number
}


/** Resource kind: row/category (e.g. Delivery, Kitchen) or assignable unit (e.g. person). */
export type ResourceKind = "category" | "employee"

/**
 * Unified resource—row header (category) or assignable staff (employee).
 * Generic TMeta allows domain-specific fields (e.g. artist bio, channel number).
 */
export interface Resource<TMeta = Record<string, unknown>> {
  id: string
  name: string
  colorIdx: number
  kind: ResourceKind
  /** Present when kind === "employee": which category this resource belongs to. */
  categoryId?: string
  /** Present when kind === "employee". */
  avatar?: string
  /** Optional domain-specific payload. Fully typed when you use Resource<YourMeta>. */
  meta?: TMeta
}

export interface WorkingHours {
  from: number
  to: number
}

/** "drag" = drag only, "resize" = resize only, "both" = drag + resize */
export type BadgeVariant = "drag" | "resize" | "both"

/** "category" = one row per category, shifts stacked (default, scales to 200+ staff).
 *  "individual" = one row per employee under each category header. */
export type RowMode = "category" | "individual"

export interface Settings {
  visibleFrom: number
  visibleTo: number
  workingHours: Record<number, WorkingHours | null>
  badgeVariant?: BadgeVariant
  /** Controls how rows are rendered in day/week grid. Default: "category" */
  rowMode?: RowMode
}

export interface CategoryColor {
  bg: string
  light: string
  text: string
  border: string
}

// ─── Config Types (passed via props) ──────────────────────────────────────────

export interface SchedulerLabels {
  category?: string
  employee?: string
  shift?: string
  staff?: string
  roster?: string
  addShift?: string
  publish?: string
  draft?: string
  published?: string
  selectStaff?: string
  copyLastWeek?: string
  fillFromSchedules?: string
  publishAll?: string
  categories?: string
}

/** View keys for the scheduler. Used in config.views to enable/disable tabs. */
export type ViewKey = "day" | "week" | "month" | "year" | "timeline" | "gantt" | "list" | "now"

export interface SchedulerConfig {
  labels?: Partial<SchedulerLabels>
  categoryColors?: CategoryColor[]
  defaultSettings?: Partial<Settings>
  /** When true, day/week view scrolls to current time on mount. Default: false. */
  initialScrollToNow?: boolean
  /** Per-view visibility. Omitted or true = show tab; false = hide. If absent, all views are shown. */
  views?: Partial<Record<ViewKey, boolean>>
  /** When true, show a "live" indicator when current time is within a block's range. Used by e.g. TV preset. */
  showLiveIndicator?: boolean
  /** Snap increment in **minutes** (e.g. 30 = 30-minute snapping, 15 = 15-minute snapping). If absent, defaults to 30. */
  snapMinutes?: number
  /** IANA timezone (e.g. America/New_York). When set, time display uses Intl with this timezone. */
  timezone?: string
  /** Locale for date/time formatting (e.g. en-US). Affects toLocaleDateString and Intl formatters. */
  locale?: string
  /** When true, root container gets dir="rtl" and layout mirrors for RTL. */
  isRTL?: boolean
  /** 0 = Sunday first, 1 = Monday first. Default 1. Passed to getWeekDates. */
  firstDay?: 0 | 1
  /**
   * When true, resize handles can push endH past midnight (endH > 24).
   * The block renders clamped to the day boundary; the overflow renders
   * as a continuation block on the next day automatically.
   * Use for healthcare rotas, overnight shifts, 24h TV schedules.
   */
  allowOvernight?: boolean
  /**
   * When true, the timeline sidebar renders one flat row per resource
   * (name + colour accent only) with no category-group chrome
   * (no progress bar, no staff button, no collapse chevron).
   *
   * Set to true for EPG/TV, conference, venue, and any domain where
   * each resource is its own top-level entity rather than a member of
   * a staffing group. Leave false (default) for workforce scheduling
   * (rostering, healthcare, etc.) where the sidebar groups employees
   * under their department/ward header.
   */
  timelineSidebarFlat?: boolean
}

export interface SchedulerSettingsContext {
  onSettingsChange: (partial: Partial<Settings>) => void
  /** Ref to the main scheduler container for PDF/Image export. */
  containerRef?: React.RefObject<HTMLElement | null>
  /** Current shifts for CSV export. */
  shifts?: Block[]
}

// ─── Render slots (Step 5: override any visual surface) ───────────────────────

export interface BlockSlotProps {
  block: Block
  resource: Resource
  isDraft: boolean
  isDragging: boolean
  hasConflict: boolean
  widthPx: number
  onDoubleClick: () => void
}

export interface ResourceHeaderSlotProps {
  resource: Resource
  scheduledCount: number
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export interface TimeSlotLabelSlotProps {
  hour: number
  date?: Date
}

export interface EmptyCellSlotProps {
  date: Date
  resourceId: string
}

export interface EmptyStateSlotProps {
  view: string
}

/** Optional render slots. When provided, the engine uses these instead of built-in UI. */
export interface SchedulerToolbarContext {
  /** Navigate to a date programmatically */
  goToDate: (date: Date) => void
  /** Scroll the grid so the current time is centred */
  goToNow: () => void
  /** Open the Add Shift modal */
  openAddShift: () => void
  /** Copy last week's shifts to this week */
  copyLastWeek: () => void
  /** Publish all draft shifts */
  publishAllDrafts: () => void
  /** Number of currently-drafted shifts */
  draftCount: number
  /** Current view key ("week" | "day" | "timeline" | ...) */
  view: string
  /** Change the active view */
  setView: (view: string) => void
}

export interface SchedulerSlots {
  block?: (props: BlockSlotProps) => ReactNode
  resourceHeader?: (props: ResourceHeaderSlotProps) => ReactNode
  timeSlotLabel?: (props: TimeSlotLabelSlotProps) => ReactNode
  emptyCell?: (props: EmptyCellSlotProps) => ReactNode
  emptyState?: (props: EmptyStateSlotProps) => ReactNode
  /** Custom tooltip rendered on block hover. Receives the hovered block and its category resource.
   *  When provided, replaces the default tooltip entirely — position/portal handling is unchanged. */
  tooltip?: (block: Block, resource: Resource) => ReactNode
  /**
   * Power-user slot: replaces the entire right side of the header toolbar.
   * When provided, the default Add Shift button, Now button, and headerActions
   * are NOT rendered — you own the full toolbar area.
   * Use simple DX props (addShiftLabel, showAddShiftButton, showNowButton) for
   * common customisations without needing this slot.
   */
  toolbar?: (ctx: SchedulerToolbarContext) => ReactNode
}

// ─── Resource utilisation histogram ──────────────────────────────────────────

/** Optional per-resource capacity override for the utilisation histogram. */
export interface HistogramCapacity {
  resourceId: string   // categoryId or employeeId
  /** Maximum scheduled hours before the bar turns red. */
  hours: number
}

/**
 * Configuration for the resource utilisation histogram rendered below the grid.
 * Pass via the `histogramConfig` prop on <Scheduler>.
 */
export interface HistogramConfig {
  /** Per-resource capacity limits. Bars are colour-coded green / amber / red. */
  capacities?: HistogramCapacity[]
}

/** A vertical marker line rendered over the grid at a specific date+hour. */
export interface SchedulerMarker {
  id: string
  /** ISO date string YYYY-MM-DD */
  date: string
  /** Decimal hour (e.g. 9.5 = 09:30). If absent, renders at the day boundary (left edge of the day column). */
  hour?: number
  label?: string
  /** CSS color. Defaults to var(--destructive). */
  color?: string
  draggable?: boolean
}

