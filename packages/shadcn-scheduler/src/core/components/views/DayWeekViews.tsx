import React, { useMemo, useState, useEffect } from "react"
import type { Block, Resource } from "../../types"
import { get3Weeks, getWeeksForBuffer } from "../../constants"
import { GridView } from "../GridView"

interface DayViewProps {
  date: Date
  setDate?: React.Dispatch<React.SetStateAction<Date>>
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps: Set<string>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  copiedShift?: Block | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Block | null>>
  zoom?: number
  bufferDays?: number
  onVisibleRangeChange?: (visibleStartDate: Date, visibleEndDate: Date) => void
  prefetchThreshold?: number
  onDeleteShift?: (shiftId: string) => void
  scrollToNowRef?: React.MutableRefObject<(() => void) | null>
  initialScrollToNow?: boolean
}

export function DayView({
  date,
  setDate,
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
  copiedShift,
  setCopiedShift,
  zoom = 1,
  bufferDays = 15,
  onVisibleRangeChange,
  prefetchThreshold = 0.8,
  onDeleteShift,
  scrollToNowRef,
  initialScrollToNow,
}: DayViewProps): React.ReactElement {
  const [centerDate, setCenterDate] = useState(date)

  let currentCenter = centerDate
  if (Math.abs(date.getTime() - centerDate.getTime()) > 1000 * 60 * 60 * 24 * 5) {
    currentCenter = date
    setCenterDate(date)
  }

  const totalDays = 1 + 2 * bufferDays
  const dates = useMemo((): Date[] => {
    if (!setDate) return [currentCenter]
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(currentCenter)
      d.setDate(d.getDate() + i - bufferDays)
      return d
    })
  }, [currentCenter, setDate, bufferDays, totalDays])

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
      copiedShift={copiedShift}
      setCopiedShift={setCopiedShift}
      zoom={zoom}
      onVisibleRangeChange={onVisibleRangeChange}
      prefetchThreshold={prefetchThreshold}
      onDeleteShift={onDeleteShift}
      scrollToNowRef={scrollToNowRef}
      initialScrollToNow={initialScrollToNow}
    />
  )
}

interface WeekViewProps {
  date: Date
  setDate: React.Dispatch<React.SetStateAction<Date>>
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps: Set<string>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  copiedShift?: Block | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Block | null>>
  zoom?: number
  onDateDoubleClick?: (date: Date) => void
  /** Report visible center date for header (does not change buffer). */
  onVisibleCenterChange?: (date: Date) => void
  bufferDays?: number
  onVisibleRangeChange?: (visibleStartDate: Date, visibleEndDate: Date) => void
  prefetchThreshold?: number
  onDeleteShift?: (shiftId: string) => void
  scrollToNowRef?: React.MutableRefObject<(() => void) | null>
  initialScrollToNow?: boolean
}

export function WeekView({
  date,
  setDate,
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
  copiedShift,
  setCopiedShift,
  zoom = 1,
  onDateDoubleClick,
  onVisibleCenterChange,
  bufferDays = 15,
  onVisibleRangeChange,
  prefetchThreshold = 0.8,
  onDeleteShift,
  scrollToNowRef,
  initialScrollToNow,
}: WeekViewProps): React.ReactElement {
  const bufferWeeks = Math.max(1, Math.ceil(bufferDays / 7))
  const allDates = useMemo(
    (): Date[] => getWeeksForBuffer(date, bufferWeeks),
    [date, bufferWeeks]
  )
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
      focusedDate={date}
      copiedShift={copiedShift}
      setCopiedShift={setCopiedShift}
      zoom={zoom}
      onDateDoubleClick={onDateDoubleClick}
      onVisibleCenterChange={onVisibleCenterChange}
      onVisibleRangeChange={onVisibleRangeChange}
      prefetchThreshold={prefetchThreshold}
      onDeleteShift={onDeleteShift}
      scrollToNowRef={scrollToNowRef}
      initialScrollToNow={initialScrollToNow}
    />
  )
}
