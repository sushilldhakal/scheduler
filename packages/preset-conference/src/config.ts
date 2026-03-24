import type { SchedulerConfig } from '@shadcn-scheduler/core'

/**
 * createConferenceConfig — returns a SchedulerConfig pre-tuned for conference/event scheduling.
 *
 * - 08:00–20:00 visible window covering typical conference days
 * - snapMinutes: 15 for precise session scheduling
 * - showLiveIndicator: true to highlight the current session
 */
export function createConferenceConfig(
  overrides: Partial<SchedulerConfig> = {}
): SchedulerConfig {
  return {
    defaultSettings: {
      visibleFrom: 8,
      visibleTo: 20,
      workingHours: {
        0: { from: 8, to: 18 },
        1: { from: 8, to: 18 },
        2: { from: 8, to: 18 },
        3: { from: 8, to: 18 },
        4: { from: 8, to: 18 },
        5: { from: 8, to: 18 },
        6: { from: 8, to: 18 },
      },
    },
    snapMinutes: 15,
    showLiveIndicator: true,
    views: {
      day: true,
      week: true,
      list: true,
      month: false,
      year: false,
      timeline: false,
    },
    labels: {
      category: 'Track',
      shift: 'Session',
      staff: 'Speaker',
      employee: 'Speaker',
    },
    ...overrides,
  }
}
