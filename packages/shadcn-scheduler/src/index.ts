// Core engine (default export surface)
export { Scheduler } from "./core/Scheduler"
export type { SchedulerProps, SchedulerHeaderActions } from "./core/Scheduler"
export { RosterActions } from "./core/components/RosterActions"
export { SchedulerSettings } from "./core/components/settings/SchedulerSettings"
export { ChangeBadgeVariantInput } from "./core/components/settings/ChangeBadgeVariantInput"
export { ChangeVisibleHoursInput } from "./core/components/settings/ChangeVisibleHoursInput"
export { ChangeWorkingHoursInput } from "./core/components/settings/ChangeWorkingHoursInput"
export { SchedulerProvider, useSchedulerContext } from "./core/context"
export type { SchedulerProviderProps, SchedulerContextValue } from "./core/context"
export type {
  Block,
  Resource,
  ResourceKind,
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
} from "./core/types"
export { createSchedulerConfig } from "./core/config"
export type { SchedulerPresetName } from "./core/config"
export { DEFAULT_SETTINGS, DEFAULT_CATEGORY_COLORS, getCategoryColor, toDateISO, parseBlockDate, sameDay } from "./core/constants"
export { findConflicts } from "./core/utils/packing"
export { nextUid } from "./core/context"

// Domain wrappers
export { SchedulerDefault } from "./domains/default"
export type { SchedulerDefaultProps } from "./domains/default"
export { SchedulerTV } from "./domains/tv"
export type { SchedulerTVProps } from "./domains/tv"
