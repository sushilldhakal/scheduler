// @shadcn-scheduler/scheduler — backward-compatible bundle
//
// Composes all @shadcn-scheduler/* packages. For tree-shaking, import
// individual packages instead.

// Core and shell
export * from '@shadcn-scheduler/core'
export * from '@shadcn-scheduler/shell'

// Grid engine
export type {
  GridViewProps,
  GridConfig,
  BlockRect,
  DragCommit,
  DragEngineOptions,
  LongPressOptions,
} from '@shadcn-scheduler/grid-engine'
export {
  GridView,
  GridViewSidebar,
  StaffPanel,
  UserSelect,
  AddShiftModal,
  RoleWarningModal,
  ShiftModal,
  DayShiftsDialog,
  Button,
  BottomSheet,
  DragEngine,
  makeGridConfig,
  blockRect,
  ghostRect,
  xToHour,
  xToDateIndex,
  cn,
  useDragEngine,
  useFlatRows,
  buildFlatRowTops,
  useScrollToNow,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useLongPress,
} from '@shadcn-scheduler/grid-engine'

// Views
export { DayView } from '@shadcn-scheduler/view-day'
export type { DayViewProps } from '@shadcn-scheduler/view-day'
export { WeekView } from '@shadcn-scheduler/view-week'
export type { WeekViewProps } from '@shadcn-scheduler/view-week'
export { TimelineView } from '@shadcn-scheduler/view-timeline'
export type { TimelineViewProps } from '@shadcn-scheduler/view-timeline'
export { MonthView } from '@shadcn-scheduler/view-month'
export type { MonthViewProps } from '@shadcn-scheduler/view-month'
export { YearView } from '@shadcn-scheduler/view-year'
export type { YearViewProps } from '@shadcn-scheduler/view-year'
export { ListView } from '@shadcn-scheduler/view-list'
export type { ListViewProps } from '@shadcn-scheduler/view-list'
export { KanbanView } from '@shadcn-scheduler/view-kanban'
export type { KanbanViewProps } from '@shadcn-scheduler/view-kanban'

// Plugins — explicit named exports to avoid re-export ambiguity with core types
export { useMarkers } from '@shadcn-scheduler/plugin-markers'
export type { UseMarkersReturn } from '@shadcn-scheduler/plugin-markers'
export { useDependencies } from '@shadcn-scheduler/plugin-dependencies'
export type { UseDependenciesReturn } from '@shadcn-scheduler/plugin-dependencies'
export { useHistogram, ResourceHistogram } from '@shadcn-scheduler/plugin-histogram'
export type { UseHistogramReturn, HistogramBar } from '@shadcn-scheduler/plugin-histogram'
export { useAvailability } from '@shadcn-scheduler/plugin-availability'
export type { UseAvailabilityReturn } from '@shadcn-scheduler/plugin-availability'
export { exportToCSV, exportToImage, exportToPDF, exportToICS } from '@shadcn-scheduler/plugin-export'
export { expandRecurrence, expandAllRecurring } from '@shadcn-scheduler/plugin-recurrence'
export { useAuditTrail } from '@shadcn-scheduler/plugin-audit'
export type { AuditEntry, AuditAction, UseAuditTrailReturn } from '@shadcn-scheduler/plugin-audit'

// Backward-compat Scheduler component
export { default as Scheduler } from './Scheduler'
export type { SchedulerProps } from './Scheduler'
