import React, { useMemo } from "react"
import type { Shift, Role, Settings } from "../../types"
import { get3Weeks } from "../../constants"
import { GridView } from "../GridView"

interface DayViewProps {
  date: Date
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  selEmps: Set<string>
  onShiftClick: (shift: Shift, role: Role) => void
  onAddShift: (date: Date, roleId?: string, empId?: string) => void
  settings: Settings
}

export function DayView({ date, shifts, setShifts, selEmps, onShiftClick, onAddShift, settings }: DayViewProps): JSX.Element {
  return (
    <GridView
      dates={[date]}
      shifts={shifts}
      setShifts={setShifts}
      selEmps={selEmps}
      onShiftClick={onShiftClick}
      onAddShift={onAddShift}
      settings={settings}
      isWeekView={false}
      setDate={undefined}
    />
  )
}

interface WeekViewProps {
  date: Date
  setDate: React.Dispatch<React.SetStateAction<Date>>
  shifts: Shift[]
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>
  selEmps: Set<string>
  onShiftClick: (shift: Shift, role: Role) => void
  onAddShift: (date: Date, roleId?: string, empId?: string) => void
  settings: Settings
}

export function WeekView({ date, setDate, shifts, setShifts, selEmps, onShiftClick, onAddShift, settings }: WeekViewProps): JSX.Element {
  const allDates = useMemo((): Date[] => get3Weeks(date).flat(), [date])
  return (
    <GridView
      dates={allDates}
      shifts={shifts}
      setShifts={setShifts}
      selEmps={selEmps}
      onShiftClick={onShiftClick}
      onAddShift={onAddShift}
      settings={settings}
      isWeekView={true}
      setDate={setDate}
    />
  )
}