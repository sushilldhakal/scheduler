/**
 * @shadcn-scheduler/view-day
 *
 * Single-day time grid. Wraps the grid-engine DayView with date buffering.
 * For the full drag/resize/zoom experience connect to @shadcn-scheduler/grid-engine.
 */
import React, { useState, useMemo } from 'react'
import type { Block, Resource, SchedulerMarker, ShiftDependency, EmployeeAvailability } from '@shadcn-scheduler/core'
import { toDateISO, fmt12, isToday, sameDay } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'

export interface DayViewProps {
  date: Date
  setDate?: React.Dispatch<React.SetStateAction<Date>>
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps?: Set<string>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  copiedShift?: Block | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Block | null>>
  zoom?: number
  setZoom?: React.Dispatch<React.SetStateAction<number>>
  bufferDays?: number
  onVisibleRangeChange?: (start: Date, end: Date) => void
  prefetchThreshold?: number
  onDeleteShift?: (shiftId: string) => void
  scrollToNowRef?: React.MutableRefObject<(() => void) | null>
  initialScrollToNow?: boolean
  isLoading?: boolean
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
  shifts,
  setShifts,
  selEmps,
  onShiftClick,
  onAddShift,
  copiedShift,
  setCopiedShift,
  readOnly,
  isLoading,
}: DayViewProps): React.ReactElement {
  const { categories, getColor, settings, nextUid } = useSchedulerContext()

  const dayShifts = useMemo(
    () => shifts.filter((s) => sameDay(s.date, date)),
    [shifts, date]
  )

  const hours = useMemo(
    () => Array.from(
      { length: settings.visibleTo - settings.visibleFrom },
      (_, i) => settings.visibleFrom + i
    ),
    [settings.visibleFrom, settings.visibleTo]
  )

  const categoryMap: Record<string, Resource> = Object.fromEntries(
    categories.map((c) => [c.id, c])
  )

  const handleDoubleClick = (h: number, categoryId: string): void => {
    if (readOnly) return
    onAddShift(date, categoryId)
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <div style={{ width: 60, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--muted)' }}>
        {hours.map((h) => (
          <div key={h} style={{ height: 48, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 2, fontSize: 10, color: 'var(--muted-foreground)', borderBottom: '1px solid var(--border)' }}>
            {fmt12(h)}
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '8px 12px', background: 'var(--background)', position: 'sticky', top: 0, zIndex: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: isToday(date) ? 'var(--primary)' : 'var(--foreground)' }}>
            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {isLoading && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--muted-foreground)' }}>Loading…</span>}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          {categories.map((cat) => {
            const c = getColor(cat.colorIdx)
            const catShifts = dayShifts.filter((s) => s.categoryId === cat.id)
            return (
              <div key={cat.id} style={{ borderBottom: '2px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 44, zIndex: 1 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.bg }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{cat.name}</span>
                </div>
                <div style={{ position: 'relative', minHeight: hours.length * 48 }}>
                  {hours.map((h) => {
                    const wh = settings.workingHours[date.getDay()]
                    const isWorking = wh !== null && h >= wh.from && h < wh.to
                    return (
                      <div
                        key={h}
                        onDoubleClick={() => handleDoubleClick(h, cat.id)}
                        style={{ height: 48, borderBottom: '1px solid var(--border)', background: isWorking ? 'var(--background)' : 'var(--muted)', cursor: readOnly ? 'default' : 'crosshair' }}
                      />
                    )
                  })}
                  {catShifts.map((shift) => {
                    const top = (shift.startH - settings.visibleFrom) * 48
                    const height = Math.max((shift.endH - shift.startH) * 48 - 2, 24)
                    const isDraft = shift.status === 'draft'
                    return (
                      <div
                        key={shift.id}
                        onClick={() => onShiftClick(shift, cat)}
                        style={{
                          position: 'absolute',
                          top,
                          left: 4,
                          right: 4,
                          height,
                          background: isDraft ? c.light : c.bg,
                          border: isDraft ? `1.5px dashed ${c.border}` : 'none',
                          color: isDraft ? c.text : 'var(--background)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          zIndex: 1,
                        }}
                      >
                        <div style={{ fontWeight: 700 }}>{shift.employee}</div>
                        <div style={{ opacity: 0.85, fontSize: 10 }}>{fmt12(shift.startH)}–{fmt12(shift.endH)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DayView
