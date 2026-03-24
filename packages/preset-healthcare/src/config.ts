import type { SchedulerConfig } from '@shadcn-scheduler/core'

/**
 * createHealthcareConfig — returns a SchedulerConfig pre-tuned for healthcare rota scheduling.
 *
 * - 24h visible with standard clinical shifts (07:00–21:00 default but overnight allowed)
 * - allowOvernight: true for night shifts that cross midnight
 * - snapMinutes: 30 for 30-minute precision
 * - Row mode: individual — one row per staff member
 */
export function createHealthcareConfig(
  overrides: Partial<SchedulerConfig> = {}
): SchedulerConfig {
  return {
    defaultSettings: {
      visibleFrom: 6,
      visibleTo: 24,
      rowMode: 'individual',
      workingHours: {
        0: { from: 7, to: 21 },
        1: { from: 7, to: 21 },
        2: { from: 7, to: 21 },
        3: { from: 7, to: 21 },
        4: { from: 7, to: 21 },
        5: { from: 7, to: 21 },
        6: { from: 7, to: 21 },
      },
    },
    allowOvernight: true,
    snapMinutes: 30,
    views: {
      day: true,
      week: true,
      timeline: false,
      month: false,
      year: false,
      list: true,
    },
    labels: {
      category: 'Ward',
      shift: 'Shift',
      staff: 'Clinician',
      employee: 'Clinician',
    },
    ...overrides,
  }
}
