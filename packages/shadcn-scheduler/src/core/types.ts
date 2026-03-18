import type { ReactNode, RefObject } from "react"

// ─── Core Data Types ─────────────────────────────────────────────────────────

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
  /**
   * When false, this block cannot be dragged to move it.
   * Defaults to true when omitted.
   */
  draggable?: boolean
  /**
   * When false, this block cannot be resized (left or right).
   * Defaults to true when omitted.
   */
  resizable?: boolean
  employee: string
  status: "draft" | "published"
  /** Optional domain-specific payload. Fully typed when you use Block<YourMeta>. */
  meta?: TMeta
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
  /** Snap grid in fractional hours (e.g. 0.5 = 30 min). If absent, uses engine default. */
  snapMinutes?: number
  /** IANA timezone (e.g. America/New_York). When set, time display uses Intl with this timezone. */
  timezone?: string
  /** Locale for date/time formatting (e.g. en-US). Affects toLocaleDateString and Intl formatters. */
  locale?: string
  /** When true, root container gets dir="rtl" and layout mirrors for RTL. */
  isRTL?: boolean
  /** 0 = Sunday first, 1 = Monday first. Default 1. Passed to getWeekDates. */
  firstDay?: 0 | 1
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
export interface SchedulerSlots {
  block?: (props: BlockSlotProps) => ReactNode
  resourceHeader?: (props: ResourceHeaderSlotProps) => ReactNode
  timeSlotLabel?: (props: TimeSlotLabelSlotProps) => ReactNode
  emptyCell?: (props: EmptyCellSlotProps) => ReactNode
  emptyState?: (props: EmptyStateSlotProps) => ReactNode
}
