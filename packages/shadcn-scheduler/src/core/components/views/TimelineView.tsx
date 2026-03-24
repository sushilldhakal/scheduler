/**
 * TimelineView — thin wrapper around GridView in day-multiday (isDayViewMultiDay) mode.
 *
 * Everything — drag, resize, conflicts, dependencies, markers, availability,
 * sidebar, sticky headers, context menus, now-line — comes from GridView for free.
 * No floating + / paste buttons (hideFloatingButtons=true); use double-click or
 * right-click on empty cells instead.
 */
import React from "react"
import type { Block, Resource, SchedulerMarker, ShiftDependency, EmployeeAvailability } from "@shadcn-scheduler/core"
import { GridView } from "@shadcn-scheduler/grid-engine"

export interface TimelineViewProps {
  date: Date
  dates?: Date[]
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps: Set<string>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  zoom?: number
  setZoom?: React.Dispatch<React.SetStateAction<number>>
  copiedShift?: Block | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Block | null>>
  markers?: SchedulerMarker[]
  onMarkersChange?: (markers: SchedulerMarker[]) => void
  dependencies?: ShiftDependency[]
  onDependenciesChange?: (deps: ShiftDependency[]) => void
  availability?: EmployeeAvailability[]
  onDeleteShift?: (shiftId: string) => void
  scrollToNowRef?: React.MutableRefObject<(() => void) | null>
  initialScrollToNow?: boolean
  onBlockCreate?: (block: Block) => void
  onBlockDelete?: (block: Block) => void
  onBlockMove?: (block: Block) => void
  onBlockResize?: (block: Block) => void
  onBlockPublish?: (block: Block) => void
  readOnly?: boolean
  isLoading?: boolean
  bufferDays?: number
  onVisibleRangeChange?: (start: Date, end: Date) => void
  prefetchThreshold?: number
}

export function TimelineView({
  date,
  dates,
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
  zoom,
  setZoom,
  copiedShift,
  setCopiedShift,
  markers,
  onMarkersChange,
  dependencies,
  onDependenciesChange,
  availability,
  onDeleteShift,
  scrollToNowRef,
  initialScrollToNow,
  onBlockCreate,
  onBlockDelete,
  onBlockMove,
  onBlockResize,
  onBlockPublish,
  readOnly,
  isLoading,
  bufferDays,
  onVisibleRangeChange,
  prefetchThreshold,
}: TimelineViewProps): React.ReactElement {
  // Use dates prop if provided (from Scheduler's timelineDates range),
  // otherwise fall back to single-day array
  const resolvedDates = dates ?? [date]

  return (
    <GridView
      dates={resolvedDates}
      shifts={shifts}
      setShifts={setShifts}
      selEmps={selEmps}
      onShiftClick={onShiftClick}
      onAddShift={onAddShift}
      isDayViewMultiDay
      zoom={zoom}
      setZoom={setZoom}
      copiedShift={copiedShift}
      setCopiedShift={setCopiedShift}
      markers={markers}
      onMarkersChange={onMarkersChange}
      dependencies={dependencies}
      onDependenciesChange={onDependenciesChange}
      availability={availability}
      onDeleteShift={onDeleteShift}
      scrollToNowRef={scrollToNowRef}
      initialScrollToNow={initialScrollToNow}
      onBlockCreate={onBlockCreate}
      onBlockDelete={onBlockDelete}
      onBlockMove={onBlockMove}
      onBlockResize={onBlockResize}
      onBlockPublish={onBlockPublish}
      readOnly={readOnly}
      isLoading={isLoading}
      onVisibleRangeChange={onVisibleRangeChange}
      prefetchThreshold={prefetchThreshold}
      hideFloatingButtons
    />
  )
}

export default TimelineView
