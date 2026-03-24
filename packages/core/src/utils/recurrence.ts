// Recurrence rule expansion — pure functions with no React dependencies.

import type { RecurrenceRule, DateRange } from '../types'

export function expandRecurrence(rule: RecurrenceRule, dateRange: DateRange): Date[] {
  const dates: Date[] = []
  const start = new Date(dateRange.start)
  const end = new Date(dateRange.end)

  let current = new Date(start)
  let count = 0

  while (current <= end && (!rule.count || count < rule.count)) {
    if (rule.until && current > new Date(rule.until + 'T23:59:59')) break

    dates.push(new Date(current))
    count++

    switch (rule.freq) {
      case 'daily':
        current.setDate(current.getDate() + (rule.interval ?? 1))
        break
      case 'weekly':
        current.setDate(current.getDate() + 7 * (rule.interval ?? 1))
        break
      case 'monthly':
        current.setMonth(current.getMonth() + (rule.interval ?? 1))
        break
    }
  }

  return dates
}
