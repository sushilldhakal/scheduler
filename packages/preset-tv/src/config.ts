import type { SchedulerConfig } from '@shadcn-scheduler/core'

/**
 * createTvConfig — returns a SchedulerConfig pre-tuned for TV/EPG scheduling.
 *
 * - 24h visible window (0–24) so overnight programmes display correctly
 * - allowOvernight: true for shows that span midnight
 * - timelineSidebarFlat: true so channels render as flat rows (no category grouping)
 * - showLiveIndicator: true for the live programme highlight
 * - snapMinutes: 15 for quarter-hour scheduling
 */
export function createTvConfig(overrides: Partial<SchedulerConfig> = {}): SchedulerConfig {
  return {
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
    allowOvernight: true,
    timelineSidebarFlat: true,
    showLiveIndicator: true,
    snapMinutes: 15,
    views: {
      timeline: true,
      day: false,
      week: false,
      month: false,
      year: false,
      list: false,
    },
    labels: {
      category: 'Channel',
      shift: 'Programme',
      staff: 'Presenter',
    },
    ...overrides,
  }
}
