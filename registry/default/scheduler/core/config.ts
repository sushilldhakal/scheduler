import type { SchedulerConfig, SchedulerLabels, Settings, CategoryColor, ViewKey } from "./types"
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
export type SchedulerPresetName =
  | "roster"
  | "default"
  | "tv"
  | "conference"
  | "festival"
  | "healthcare"
  | "gantt"
  | "venue"

const PRESETS: Record<SchedulerPresetName, Partial<SchedulerConfig>> = {
  default: {
    labels: DEFAULT_LABELS,
    defaultSettings: { ...DEFAULT_SETTINGS },
    initialScrollToNow: false,
  },
  roster: {
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
    views: { year: false, list: false },
    snapMinutes: 0.25,
  },
  conference: {
    labels: {
      category: "Track",
      employee: "Session",
      shift: "Session",
      staff: "Sessions",
      roster: "Agenda",
      addShift: "Add Session",
      categories: "Tracks",
    },
    defaultSettings: { ...DEFAULT_SETTINGS, visibleFrom: 7, visibleTo: 22 },
    views: { gantt: false, now: false },
  },
  festival: {
    labels: {
      category: "Stage",
      employee: "Set",
      shift: "Set",
      staff: "Sets",
      roster: "Lineup",
      addShift: "Add Set",
      categories: "Stages",
    },
    defaultSettings: { ...DEFAULT_SETTINGS, visibleFrom: 10, visibleTo: 24 },
    views: { gantt: false, now: false },
  },
  healthcare: {
    labels: {
      category: "Ward",
      employee: "Staff",
      shift: "Shift",
      staff: "Staff",
      roster: "Rota",
      addShift: "Add Shift",
      categories: "Wards",
    },
    defaultSettings: { ...DEFAULT_SETTINGS },
    views: { gantt: false, now: false },
  },
  gantt: {
    labels: {
      category: "Project",
      employee: "Task",
      shift: "Task",
      staff: "Tasks",
      roster: "Plan",
      addShift: "Add Task",
      categories: "Projects",
    },
    defaultSettings: { ...DEFAULT_SETTINGS },
    views: { day: true, week: true, month: true, year: true, timeline: true, gantt: true, list: true, now: false },
  },
  venue: {
    labels: {
      category: "Space",
      employee: "Booking",
      shift: "Booking",
      staff: "Bookings",
      roster: "Schedule",
      addShift: "Add Booking",
      categories: "Spaces",
    },
    defaultSettings: { ...DEFAULT_SETTINGS },
    views: { gantt: false, now: false },
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
    views: mergeViews(presetConfig.views, overrides.views),
    showLiveIndicator: overrides.showLiveIndicator ?? presetConfig.showLiveIndicator,
    snapMinutes: overrides.snapMinutes ?? presetConfig.snapMinutes,
  }
}

function mergeViews(
  ...partials: (Partial<Record<ViewKey, boolean>> | undefined)[]
): Partial<Record<ViewKey, boolean>> | undefined {
  const out: Partial<Record<ViewKey, boolean>> = {}
  let hasAny = false
  for (const p of partials) {
    if (!p) continue
    hasAny = true
    for (const k of Object.keys(p) as ViewKey[]) {
      if (p[k] !== undefined) out[k] = p[k] as boolean
    }
  }
  return hasAny ? out : undefined
}

function mergeSettings(
  ...partials: (Partial<Settings> | undefined)[]
): Partial<Settings> {
  return partials.reduce<Partial<Settings>>(
    (acc, p) => (p ? { ...acc, ...p } : acc),
    { ...DEFAULT_SETTINGS }
  )
}
