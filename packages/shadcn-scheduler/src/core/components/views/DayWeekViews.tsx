import React, { useMemo, useState } from "react"
import type { Block, Resource } from "../../types"
import { getWeeksForBuffer, clamp, toDateISO } from "../../constants"
import { useSchedulerContext } from "../../context"
import { useIsMobile } from "../../hooks/useMediaQuery"
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
  setZoom?: React.Dispatch<React.SetStateAction<number>>
  bufferDays?: number
  onVisibleRangeChange?: (visibleStartDate: Date, visibleEndDate: Date) => void
  prefetchThreshold?: number
  onDeleteShift?: (shiftId: string) => void
  scrollToNowRef?: React.MutableRefObject<(() => void) | null>
  initialScrollToNow?: boolean
  onSwipeNavigate?: (dir: number) => void
  isLoading?: boolean
  onNavigate?: (dir: number) => void
  onBlockMoved?: (block: import("../../types").Block, newDate: string, newStartH: number, newEndH: number) => void
  onFocusedBlockChange?: (blockId: string | null) => void
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
  onSwipeNavigate,
  setZoom,
  isLoading,
  onNavigate,
  onBlockMoved,
  onFocusedBlockChange,
}: DayViewProps): React.ReactElement {
  const { categories } = useSchedulerContext()
  const isMobile = useIsMobile()
  const [centerDate, setCenterDate] = useState(date)
  const [mobileResourceIndex, setMobileResourceIndex] = useState(0)

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

  const visibleShifts = useMemo(() => {
    const dateSet = new Set(dates.map((d) => toDateISO(d)))
    return shifts.filter((s) => dateSet.has(s.date))
  }, [shifts, dates])

  return (
    <GridView
      dates={dates}
      shifts={visibleShifts}
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
      onSwipeNavigate={onSwipeNavigate}
      setZoom={setZoom}
      isLoading={isLoading}
      mobileResourceIndex={isMobile ? mobileResourceIndex : undefined}
      onMobileResourceChange={
        isMobile
          ? (dir) => setMobileResourceIndex((i) => clamp(i + dir, 0, categories.length - 1))
          : undefined
      }
      onNavigate={onNavigate}
      onBlockMoved={onBlockMoved}
      onFocusedBlockChange={onFocusedBlockChange}
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
  onSwipeNavigate?: (dir: number) => void
  setZoom?: React.Dispatch<React.SetStateAction<number>>
  isLoading?: boolean
  onNavigate?: (dir: number) => void
  onBlockMoved?: (block: import("../../types").Block, newDate: string, newStartH: number, newEndH: number) => void
  onFocusedBlockChange?: (blockId: string | null) => void
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
  onSwipeNavigate,
  setZoom,
  isLoading,
  onNavigate,
  onBlockMoved,
  onFocusedBlockChange,
}: WeekViewProps): React.ReactElement {
  const bufferWeeks = Math.max(1, Math.ceil(bufferDays / 7))
  const allDates = useMemo(
    (): Date[] => getWeeksForBuffer(date, bufferWeeks),
    [date, bufferWeeks]
  )
  const visibleShifts = useMemo(() => {
    const dateSet = new Set(allDates.map((d) => toDateISO(d)))
    return shifts.filter((s) => dateSet.has(s.date))
  }, [shifts, allDates])

  return (
    <GridView
      dates={allDates}
      shifts={visibleShifts}
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
      onSwipeNavigate={onSwipeNavigate}
      setZoom={setZoom}
      isLoading={isLoading}
      onNavigate={onNavigate}
      onBlockMoved={onBlockMoved}
      onFocusedBlockChange={onFocusedBlockChange}
    />
  )
}
