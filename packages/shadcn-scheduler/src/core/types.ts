import type { ReactNode } from "react"

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
  employee: string
  status: "draft" | "published"
  /** Optional domain-specific payload. Fully typed when you use Block<YourMeta>. */
  meta?: TMeta
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

export interface Settings {
  visibleFrom: number
  visibleTo: number
  workingHours: Record<number, WorkingHours | null>
  badgeVariant?: BadgeVariant
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
}

export interface SchedulerSettingsContext {
  onSettingsChange: (partial: Partial<Settings>) => void
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
