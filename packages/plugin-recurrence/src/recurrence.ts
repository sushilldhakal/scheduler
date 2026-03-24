import type { Block, RecurrenceRule } from '@shadcn-scheduler/core'
import { toDateISO, sameDay } from '@shadcn-scheduler/core'

const MAX_AUTO = 365

export function expandRecurrence(
  master: Block,
  rangeStart: Date,
  rangeEnd: Date,
): Block[] {
  const rule = master.recurrence
  if (!rule) return []

  const masterDate = new Date(master.date + 'T12:00:00')
  const freq = rule.freq
  const interval = Math.max(1, rule.interval ?? 1)
  const until = rule.until ? new Date(rule.until + 'T23:59:59') : null
  const maxCount = rule.count ?? MAX_AUTO
  const byDay = rule.byDay ?? null

  const effectiveEnd = until && until < rangeEnd ? until : rangeEnd
  const occurrences: Block[] = []
  let current = new Date(masterDate)
  let count = 0

  while (current <= effectiveEnd && count < maxCount) {
    const dayOk = !byDay || byDay.includes(current.getDay())
    if (dayOk && current >= rangeStart) {
      const dateISO = toDateISO(current)
      occurrences.push({
        ...master,
        id: `${master.id}_r${dateISO}`,
        date: dateISO,
        recurrence: undefined,
        recurringMasterId: master.id,
      })
    }
    if (dayOk) count++
    if (count >= maxCount) break
    current = advance(current, freq, interval, byDay)
  }

  return occurrences
}

function advance(
  from: Date,
  freq: RecurrenceRule['freq'],
  interval: number,
  byDay: number[] | null,
): Date {
  const d = new Date(from)
  if (freq === 'daily') {
    d.setDate(d.getDate() + interval)
  } else if (freq === 'weekly') {
    if (byDay && byDay.length > 1) {
      const sorted = [...byDay].sort((a, b) => a - b)
      const todayDow = from.getDay()
      const next = sorted.find((dow) => dow > todayDow)
      if (next !== undefined) {
        d.setDate(d.getDate() + (next - todayDow))
      } else {
        const firstDow = sorted[0]!
        d.setDate(d.getDate() + 7 * interval - todayDow + firstDow)
      }
    } else {
      d.setDate(d.getDate() + 7 * interval)
    }
  } else if (freq === 'monthly') {
    d.setMonth(d.getMonth() + interval)
  }
  return d
}

export function expandAllRecurring(
  shifts: Block[],
  rangeStart: Date,
  rangeEnd: Date,
): Block[] {
  const out: Block[] = []
  const seen = new Set<string>()

  for (const shift of shifts) {
    if (!shift.recurrence) {
      if (!seen.has(shift.id)) { seen.add(shift.id); out.push(shift) }
      continue
    }
    const expanded = expandRecurrence(shift, rangeStart, rangeEnd)
    for (const occ of expanded) {
      const id = sameDay(occ.date, shift.date) ? shift.id : occ.id
      if (seen.has(id)) continue
      seen.add(id)
      if (sameDay(occ.date, shift.date)) {
        out.push({ ...occ, id: shift.id, recurringMasterId: shift.id })
      } else {
        out.push(occ)
      }
    }
  }

  return out
}
