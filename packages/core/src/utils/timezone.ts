/**
 * Format a date + fractional hour in a given IANA timezone using Intl.DateTimeFormat.
 * Used when SchedulerConfig.timezone is set so all time display is timezone-aware.
 */
export function formatInTimezone(
  isoDate: string,
  hour: number,
  tz: string,
  locale?: string
): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const h   = Math.floor(hour)
  const min = Math.round((hour - h) * 60)
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, h, min, 0, 0))
  const formatter = new Intl.DateTimeFormat(locale ?? 'en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: min ? '2-digit' : undefined,
    hour12: true,
  })
  return formatter.format(date)
}

/** Alias kept for compatibility */
export const formatTimeInTimezone = formatInTimezone

export function convertToTimezone(date: Date, timezone: string): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: timezone }))
}

export function getTimezoneOffset(timezone: string): number {
  const now = new Date()
  const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
  const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
  return (target.getTime() - utc.getTime()) / (1000 * 60)
}
