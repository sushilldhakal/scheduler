// Core types — aligned with the real Block data model used across the scheduler.
// These are the canonical types shared by all @shadcn-scheduler/* packages.

import type { ReactNode, RefObject } from 'react'

// ─── Recurrence ───────────────────────────────────────────────────────────────

export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly'

export interface RecurrenceRule {
  freq: RecurrenceFreq
  interval?: number
  byDay?: number[]
  until?: string
  count?: number
}

// ─── Shift dependencies ───────────────────────────────────────────────────────

export type DependencyType =
  | 'finish-to-start'
  | 'start-to-start'
  | 'finish-to-finish'
  | 'start-to-finish'

export interface ShiftDependency {
  id: string
  fromId: string
  toId: string
  type?: DependencyType
  color?: string
  label?: string
}

// ─── Employee availability ────────────────────────────────────────────────────

export interface AvailabilityWindow {
  dayOfWeek?: number
  date?: string
  startH: number
  endH: number
}

export interface EmployeeAvailability {
  employeeId: string
  windows: AvailabilityWindow[]
}

// ─── Core Block (shift/slot) ──────────────────────────────────────────────────

export interface Block<TMeta = Record<string, unknown>> {
  id: string
  categoryId: string
  employeeId: string
  /** ISO date string YYYY-MM-DD */
  date: string
  startH: number
  endH: number
  breakStartH?: number
  breakEndH?: number
  draggable?: boolean
  resizable?: boolean
  employee: string
  status: 'draft' | 'published'
  meta?: TMeta
  recurrence?: RecurrenceRule
  recurringMasterId?: string
}

// ─── Resource ─────────────────────────────────────────────────────────────────

export type ResourceKind = 'category' | 'employee'

export interface Resource<TMeta = Record<string, unknown>> {
  id: string
  name: string
  colorIdx: number
  kind: ResourceKind
  categoryId?: string
  avatar?: string
  meta?: TMeta
}

// ─── Tree / flat-row model ────────────────────────────────────────────────────

export interface FlatRow {
  key: string
  kind: 'category' | 'employee'
  category: Resource
  employee?: Resource
  depth: number
}

export type RowMode = 'category' | 'individual'

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface WorkingHours {
  from: number
  to: number
}

export type BadgeVariant = 'drag' | 'resize' | 'both'

export interface Settings {
  visibleFrom: number
  visibleTo: number
  workingHours: Record<number, WorkingHours | null>
  badgeVariant?: BadgeVariant
  rowMode?: RowMode
}

// ─── Category colors ──────────────────────────────────────────────────────────

export interface CategoryColor {
  bg: string
  light: string
  text: string
  border: string
}

// ─── Labels ───────────────────────────────────────────────────────────────────

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

// ─── Config ───────────────────────────────────────────────────────────────────

export type ViewKey =
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'timeline'
  | 'gantt'
  | 'list'
  | 'now'

export interface SchedulerConfig {
  labels?: Partial<SchedulerLabels>
  categoryColors?: CategoryColor[]
  defaultSettings?: Partial<Settings>
  initialScrollToNow?: boolean
  views?: Partial<Record<ViewKey, boolean>>
  showLiveIndicator?: boolean
  snapMinutes?: number
  timezone?: string
  locale?: string
  isRTL?: boolean
  firstDay?: 0 | 1
  allowOvernight?: boolean
  timelineSidebarFlat?: boolean
}

// ─── Slots ────────────────────────────────────────────────────────────────────

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

export interface SchedulerToolbarContext {
  goToDate: (date: Date) => void
  goToNow: () => void
  openAddShift: () => void
  copyLastWeek: () => void
  publishAllDrafts: () => void
  draftCount: number
  view: string
  setView: (view: string) => void
}

export interface SchedulerSlots {
  block?: (props: BlockSlotProps) => ReactNode
  resourceHeader?: (props: ResourceHeaderSlotProps) => ReactNode
  timeSlotLabel?: (props: TimeSlotLabelSlotProps) => ReactNode
  emptyCell?: (props: EmptyCellSlotProps) => ReactNode
  emptyState?: (props: EmptyStateSlotProps) => ReactNode
  tooltip?: (block: Block, resource: Resource) => ReactNode
  toolbar?: (ctx: SchedulerToolbarContext) => ReactNode
}

// ─── Markers ──────────────────────────────────────────────────────────────────

export interface SchedulerMarker {
  id: string
  date: string
  hour?: number
  label?: string
  color?: string
  draggable?: boolean
}

// ─── Histogram ────────────────────────────────────────────────────────────────

export interface HistogramCapacity {
  resourceId: string
  hours: number
}

export interface HistogramConfig {
  capacities?: HistogramCapacity[]
}

export interface SchedulerSettingsContext {
  onSettingsChange: (partial: Partial<Settings>) => void
  /** Ref to the main scheduler container for PDF/Image export. */
  containerRef?: RefObject<HTMLElement | null>
  /** Current shifts for CSV export. */
  shifts?: Block[]
}

// ─── Grid geometry ────────────────────────────────────────────────────────────

export interface GridGeometry {
  cellWidth: number
  cellHeight: number
  headerHeight: number
  sidebarWidth: number
  totalWidth: number
  totalHeight: number
}

export interface CellPosition {
  row: number
  column: number
  x: number
  y: number
  width: number
  height: number
}

export interface DateRange {
  start: Date
  end: Date
}
