// Date utilities - pure functions with zero React dependencies

import { MINUTES_PER_HOUR } from '../constants'

export function snapToInterval(date: Date, intervalMinutes: number): Date {
  const minutes = date.getMinutes()
  const snappedMinutes = Math.round(minutes / intervalMinutes) * intervalMinutes
  
  const snappedDate = new Date(date)
  snappedDate.setMinutes(snappedMinutes, 0, 0)
  
  return snappedDate
}

export function getWeekDates(startDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  
  for (let i = 0; i < 7; i++) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  
  return dates
}

export function isWithinWorkingHours(date: Date, workingHours: { start: string; end: string; days: number[] }): boolean {
  const dayOfWeek = date.getDay()
  if (!workingHours.days.includes(dayOfWeek)) {
    return false
  }
  
  const timeString = date.toTimeString().slice(0, 5) // "HH:MM"
  return timeString >= workingHours.start && timeString <= workingHours.end
}