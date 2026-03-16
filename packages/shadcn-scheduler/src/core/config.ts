import type { SchedulerConfig, SchedulerLabels, Settings, CategoryColor } from "./types"
import { DEFAULT_SETTINGS, DEFAULT_CATEGORY_COLORS } from "./constants"

const DEFAULT_LABELS: SchedulerLabels = {
  category: "Category",
  employee: "Employee",
  shift: "Shift",
  staff: "Staff",
  roster: "Roster",
  addShift: "Add Shift",
  publish: "Publish",
  draft: "Draft",
  published: "Published",
  selectStaff: "Select staff",
  copyLastWeek: "Copy Last Week",
  fillFromSchedules: "Fill from Schedules",
  publishAll: "Publish All",
  categories: "Categories",
}

/** Built-in preset names. Use with createSchedulerConfig({ preset: 'tv' }). */
export type SchedulerPresetName = "default" | "tv"

const PRESETS: Record<SchedulerPresetName, Partial<SchedulerConfig>> = {
  default: {
    labels: DEFAULT_LABELS,
    defaultSettings: { ...DEFAULT_SETTINGS },
    initialScrollToNow: false,
  },
  tv: {
    labels: {
      category: "Channel",
      employee: "Program",
      shift: "Slot",
      staff: "Programs",
      roster: "Schedule",
      addShift: "Add Slot",
      publish: "Publish",
      draft: "Draft",
      published: "Published",
      selectStaff: "Select programs",
      copyLastWeek: "Copy Last Week",
      fillFromSchedules: "Fill from Schedules",
      publishAll: "Publish All",
      categories: "Channels",
    },
    defaultSettings: {
      visibleFrom: 0,
      visibleTo: 24,
      workingHours: {
        0: { from: 0, to: 24 },
        1: { from: 0, to: 24 },
        2: { from: 0, to: 24 },
        3: { from: 0, to: 24 },
        4: { from: 0, to: 24 },
        5: { from: 0, to: 24 },
        6: { from: 0, to: 24 },
      },
    },
    initialScrollToNow: true,
    showLiveIndicator: true,
    enabledViews: ["day", "week", "month", "timeline"],
    snapMinutes: 0.25, // 15 min for TV slots
  },
}

/**
 * Creates a full SchedulerConfig by optionally applying a preset and merging overrides.
 * Presets set domain defaults (labels, time range, feature flags); overrides take precedence.
 *
 * @example
 * createSchedulerConfig() // default roster/scheduling config
 * createSchedulerConfig({ preset: 'tv' }) // TV: channels/programs, 24h, live indicator
 * createSchedulerConfig({ preset: 'tv', labels: { category: 'Station' } }) // TV but override label
 */
export function createSchedulerConfig(
  options?: Partial<SchedulerConfig> & { preset?: SchedulerPresetName }
): SchedulerConfig {
  const { preset, ...overrides } = options ?? {}
  const presetConfig = preset ? PRESETS[preset] ?? {} : {}

  return {
    labels: { ...DEFAULT_LABELS, ...presetConfig.labels, ...overrides.labels },
    categoryColors: overrides.categoryColors ?? presetConfig.categoryColors ?? [...DEFAULT_CATEGORY_COLORS],
    defaultSettings: mergeSettings(presetConfig.defaultSettings, overrides.defaultSettings),
    initialScrollToNow: overrides.initialScrollToNow ?? presetConfig.initialScrollToNow ?? false,
    enabledViews: overrides.enabledViews ?? presetConfig.enabledViews,
    showLiveIndicator: overrides.showLiveIndicator ?? presetConfig.showLiveIndicator,
    snapMinutes: overrides.snapMinutes ?? presetConfig.snapMinutes,
  }
}

function mergeSettings(
  ...partials: (Partial<Settings> | undefined)[]
): Partial<Settings> {
  return partials.reduce<Partial<Settings>>(
    (acc, p) => (p ? { ...acc, ...p } : acc),
    { ...DEFAULT_SETTINGS }
  )
}
