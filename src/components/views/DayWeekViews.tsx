import React, { useMemo } from "react"
import type { Shift, Category } from "../../types"
import { get3Weeks } from "../../constants"
import { GridView } from "../GridView"

interface DayViewProps {
  date: Date
  setDate?: React.Dispatch<React.SetStateAction<Date>>
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  selEmps: Set<string>
  onShiftClick: (shift: Shift, category: Category) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
}

export function DayView({
  date,
  setDate,
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
}: DayViewProps): JSX.Element {
  const dates = useMemo((): Date[] => {
    if (!setDate) return [date]
    return Array.from({ length: 31 }, (_, i) => {
      const d = new Date(date)
      d.setDate(d.getDate() + i - 15)
      return d
    })
  }, [date, setDate])

  return (
    <GridView
      dates={dates}
      shifts={shifts}
      setShifts={setShifts}
      selEmps={selEmps}
      onShiftClick={onShiftClick}
      onAddShift={onAddShift}
      isWeekView={false}
      setDate={setDate}
      isDayViewMultiDay={!!setDate && dates.length > 1}
      focusedDate={date}
    />
  )
}

interface WeekViewProps {
  date: Date
  setDate: React.Dispatch<React.SetStateAction<Date>>
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  selEmps: Set<string>
  onShiftClick: (shift: Shift, category: Category) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
}

export function WeekView({
  date,
  setDate,
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
}: WeekViewProps): JSX.Element {
  const allDates = useMemo((): Date[] => get3Weeks(date).flat(), [date])
  return (
    <GridView
      dates={allDates}
      shifts={shifts}
      setShifts={setShifts}
      selEmps={selEmps}
      onShiftClick={onShiftClick}
      onAddShift={onAddShift}
      isWeekView={true}
      setDate={setDate}
    />
  )
}
