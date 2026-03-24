import React, { useMemo, useState } from "react"
import type { Block, Resource, SchedulerMarker, ShiftDependency, EmployeeAvailability } from "@shadcn-scheduler/core"
import { getWeeksForBuffer, clamp, toDateISO } from "@shadcn-scheduler/core"
import { useSchedulerContext } from "@shadcn-scheduler/shell"
import { useIsMobile } from "@shadcn-scheduler/grid-engine"
import { GridView } from "@shadcn-scheduler/grid-engine"

export interface DayViewProps {
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
  onBlockMoved?: (block: Block, newDate: string, newStartH: number, newEndH: number) => void
  onFocusedBlockChange?: (blockId: string | null) => void
  readOnly?: boolean
  onBlockCreate?: (block: Block) => void
  onBlockDelete?: (block: Block) => void
  onBlockMove?: (block: Block) => void
  onBlockResize?: (block: Block) => void
  onBlockPublish?: (block: Block) => void
  markers?: SchedulerMarker[]
  onMarkersChange?: (markers: SchedulerMarker[]) => void
  dependencies?: ShiftDependency[]
  onDependenciesChange?: (deps: ShiftDependency[]) => void
  availability?: EmployeeAvailability[]
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
  readOnly,
  onBlockCreate,
  onBlockDelete,
  onBlockMove,
  onBlockResize,
  onBlockPublish,
  markers = [],
  onMarkersChange,
  dependencies = [],
  onDependenciesChange,
  availability = [],
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

  // Cap bufferDays so the total buffer never fits entirely in the viewport at once.
  // On wide screens (3000px+), a fixed bufferDays=15 means all 31 days render within
  // the viewport simultaneously — scrollLeft is near 0 AND near max, triggering both
  // edge-load conditions and causing a flicker loop.
  // Safe cap: viewport fits ~N days, so buffer at least N+3 each side but clamp to
  // the passed bufferDays prop so we never exceed what the caller requested.
  const effectiveBufferDays = useMemo(() => {
    if (typeof window === "undefined") return bufferDays
    // Estimate DAY_WIDTH: default visibleHours=10, HOUR_W=88px
    const estimatedDayWidth = 10 * 88
    const daysInViewport = Math.ceil(window.innerWidth / estimatedDayWidth)
    // Need at least daysInViewport + 3 on each side to keep edge-load from firing immediately
    const minBuffer = daysInViewport + 3
    return Math.max(minBuffer, Math.min(bufferDays, 30))
  }, [bufferDays])

  const totalDays = 1 + 2 * effectiveBufferDays
  const dates = useMemo((): Date[] => {
    if (!setDate) return [currentCenter]
    return Array.from({ length: totalDays }, (_, i) => {
      const d = new Date(currentCenter)
      d.setDate(d.getDate() + i - effectiveBufferDays)
      return d
    })
  }, [currentCenter, setDate, effectiveBufferDays, totalDays])

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
      readOnly={readOnly}
      onBlockCreate={onBlockCreate}
      onBlockDelete={onBlockDelete}
      onBlockMove={onBlockMove}
      onBlockResize={onBlockResize}
      onBlockPublish={onBlockPublish}
      markers={markers}
      onMarkersChange={onMarkersChange}
      dependencies={dependencies}
      onDependenciesChange={onDependenciesChange}
      availability={availability}
    />
  )
}

export interface WeekViewProps {
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
  onBlockMoved?: (block: Block, newDate: string, newStartH: number, newEndH: number) => void
  onFocusedBlockChange?: (blockId: string | null) => void
  readOnly?: boolean
  onBlockCreate?: (block: Block) => void
  onBlockDelete?: (block: Block) => void
  onBlockMove?: (block: Block) => void
  onBlockResize?: (block: Block) => void
  onBlockPublish?: (block: Block) => void
  markers?: SchedulerMarker[]
  onMarkersChange?: (markers: SchedulerMarker[]) => void
  dependencies?: ShiftDependency[]
  onDependenciesChange?: (deps: ShiftDependency[]) => void
  availability?: EmployeeAvailability[]
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
  readOnly,
  onBlockCreate,
  onBlockDelete,
  onBlockMove,
  onBlockResize,
  onBlockPublish,
  markers = [],
  onMarkersChange,
  dependencies = [],
  onDependenciesChange,
  availability = [],
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
      readOnly={readOnly}
      onBlockCreate={onBlockCreate}
      onBlockDelete={onBlockDelete}
      onBlockMove={onBlockMove}
      onBlockResize={onBlockResize}
      onBlockPublish={onBlockPublish}
      markers={markers}
      onMarkersChange={onMarkersChange}
      dependencies={dependencies}
      onDependenciesChange={onDependenciesChange}
      availability={availability}
    />
  )
}
