/**
 * Format a date + hour (fractional) in a given IANA timezone using Intl.DateTimeFormat.
 * Use when SchedulerConfig.timezone is set so all time display is timezone-aware.
 */
export function formatInTimezone(
  isoDate: string,
  hour: number,
  tz: string,
  locale?: string
): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const h = Math.floor(hour)
  const min = Math.round((hour - h) * 60)
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, h, min, 0, 0))
  const formatter = new Intl.DateTimeFormat(locale ?? "en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: min ? "2-digit" : undefined,
    hour12: true,
  })
  return formatter.format(date)
}

/**
 * Format a time-only string (e.g. "9:00 AM") in the given timezone for the given date.
 * The date is used to resolve DST; hour is fractional (e.g. 9.5 = 9:30).
 */
export function formatTimeInTimezone(
  isoDate: string,
  hour: number,
  tz: string,
  locale?: string
): string {
  return formatInTimezone(isoDate, hour, tz, locale)
}
