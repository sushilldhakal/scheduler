// Core engine + compound namespace (Scheduler.roster, Scheduler.tv, …)
import { Scheduler as SchedulerCore } from "./core/Scheduler"
import { SchedulerDefault } from "./domains/default"
import { SchedulerTV } from "./domains/tv"
import { SchedulerConference } from "./domains/conference"
import { SchedulerFestival } from "./domains/festival"
import { SchedulerHealthcare } from "./domains/healthcare"
import { SchedulerGantt } from "./domains/gantt"
import { SchedulerVenue } from "./domains/venue"

export const Scheduler = Object.assign(SchedulerCore, {
  roster: SchedulerDefault,
  tv: SchedulerTV,
  conference: SchedulerConference,
  festival: SchedulerFestival,
  healthcare: SchedulerHealthcare,
  gantt: SchedulerGantt,
  venue: SchedulerVenue,
})

export type { SchedulerProps, SchedulerHeaderActions } from "./core/Scheduler"
export { RosterActions } from "./core/components/RosterActions"
export { SchedulerSettings } from "./core/components/settings/SchedulerSettings"
export { ResourceHistogram } from "./core/components/ResourceHistogram"
export { ChangeBadgeVariantInput } from "./core/components/settings/ChangeBadgeVariantInput"
export { ChangeVisibleHoursInput } from "./core/components/settings/ChangeVisibleHoursInput"
export { ChangeWorkingHoursInput } from "./core/components/settings/ChangeWorkingHoursInput"
export { SchedulerProvider, useSchedulerContext } from "./core/context"
export type { SchedulerProviderProps, SchedulerContextValue } from "./core/context"
export type {
  Block,
  Resource,
  ResourceKind,
  ViewKey,
  Settings,
  WorkingHours,
  BadgeVariant,
  CategoryColor,
  SchedulerConfig,
  SchedulerLabels,
  SchedulerSettingsContext,
  SchedulerSlots,
  BlockSlotProps,
  ResourceHeaderSlotProps,
  TimeSlotLabelSlotProps,
  EmptyCellSlotProps,
  EmptyStateSlotProps,
  SchedulerToolbarContext,
  RecurrenceRule, RecurrenceFreq, ShiftDependency, DependencyType, EmployeeAvailability, AvailabilityWindow , HistogramConfig, HistogramCapacity , SchedulerMarker } from "./core/types"
export {
  createSchedulerConfig,
  extendConfig,
  createRosterConfig,
  createTvConfig,
  createConferenceConfig,
  createFestivalConfig,
  createHealthcareConfig,
  createGanttConfig,
  createVenueConfig,
} from "./core/config"
export type { SchedulerPresetName } from "./core/config"
export { DEFAULT_SETTINGS, DEFAULT_CATEGORY_COLORS, getCategoryColor, toDateISO, parseBlockDate, sameDay, snapToInterval } from "./core/constants"
export { findConflicts } from "./core/utils/packing"
export { exportToCSV, exportToImage, exportToPDF, exportToICS } from "./core/utils/export"
export { expandRecurrence, expandAllRecurring } from "./core/utils/recurrence"
export { formatInTimezone, formatTimeInTimezone } from "./core/utils/timezone"
export { nextUid } from "./core/context"
export { useLongPress } from "./core/hooks/useLongPress"
export type { LongPressOptions } from "./core/hooks/useLongPress"
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop } from "./core/hooks/useMediaQuery"
export { useAuditTrail } from "./core/hooks/useAuditTrail"
export type { AuditEntry, AuditAction, UseAuditTrailReturn } from "./core/hooks/useAuditTrail"

// Domain wrappers (also available as Scheduler.roster, Scheduler.tv, etc.)
export { SchedulerDefault } from "./domains/default"
export type { SchedulerDefaultProps } from "./domains/default"
export { SchedulerTV } from "./domains/tv"
export type { SchedulerTVProps } from "./domains/tv"
export { SchedulerConference } from "./domains/conference"
export type { SchedulerConferenceProps } from "./domains/conference"
export { SchedulerFestival } from "./domains/festival"
export type { SchedulerFestivalProps } from "./domains/festival"
export { SchedulerHealthcare } from "./domains/healthcare"
export type { SchedulerHealthcareProps } from "./domains/healthcare"
export { SchedulerGantt } from "./domains/gantt"
export type { SchedulerGanttProps } from "./domains/gantt"
export { SchedulerVenue } from "./domains/venue"
export type { SchedulerVenueProps } from "./domains/venue"

// Phase 4 — employee-per-row tree model
export { useFlatRows, buildFlatRowTops } from "./core/hooks/useFlatRows"
export type { FlatRow, RowMode } from "./core/types"
export { ChangeRowModeInput } from "./core/components/settings/ChangeRowModeInput"

// ─── Grid views — exported so @shadcn-scheduler/view-* packages can wrap them ──
export { DayView } from "./core/components/views/DayWeekViews"
export type { DayViewProps } from "./core/components/views/DayWeekViews"
export { WeekView } from "./core/components/views/DayWeekViews"
export type { WeekViewProps } from "./core/components/views/DayWeekViews"
export { TimelineView } from "./core/components/views/TimelineView"
export type { TimelineViewProps } from "./core/components/views/TimelineView"
export { GridView } from "@shadcn-scheduler/grid-engine"
