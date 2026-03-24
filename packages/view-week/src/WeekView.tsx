/**
 * @shadcn-scheduler/view-week
 *
 * Seven-day week grid. Provides a simplified week grid that works
 * directly with @shadcn-scheduler/core and @shadcn-scheduler/shell.
 */
import React, { useMemo } from 'react'
import type { Block, Resource, SchedulerMarker, ShiftDependency, EmployeeAvailability } from '@shadcn-scheduler/core'
import { getWeekDates, toDateISO, isToday, sameDay, fmt12, DOW_MON_FIRST } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'

export interface WeekViewProps {
  date: Date
  setDate: React.Dispatch<React.SetStateAction<Date>>
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps?: Set<string>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  copiedShift?: Block | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Block | null>>
  zoom?: number
  setZoom?: React.Dispatch<React.SetStateAction<number>>
  onDateDoubleClick?: (date: Date) => void
  onVisibleCenterChange?: (date: Date) => void
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

export function WeekView({
  date,
  setDate,
  shifts,
  setShifts,
  onShiftClick,
  onAddShift,
  onDateDoubleClick,
  readOnly,
  isLoading,
}: WeekViewProps): React.ReactElement {
  const { categories, getColor, settings } = useSchedulerContext()
  const weekDates = useMemo(() => getWeekDates(date), [date])
  const weekDateISOs = useMemo(() => weekDates.map((d) => toDateISO(d)), [weekDates])

  const weekShifts = useMemo(
    () => shifts.filter((s) => weekDateISOs.includes(s.date)),
    [shifts, weekDateISOs]
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', background: 'var(--background)', flexShrink: 0 }}>
        <div style={{ width: 120, flexShrink: 0, borderRight: '1px solid var(--border)' }} />
        {weekDates.map((d, i) => {
          const today = isToday(d)
          return (
            <div
              key={i}
              style={{ flex: 1, textAlign: 'center', padding: '8px 4px', borderRight: '1px solid var(--border)', cursor: onDateDoubleClick ? 'pointer' : 'default' }}
              onDoubleClick={() => onDateDoubleClick?.(d)}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{DOW_MON_FIRST[i]}</div>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: today ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px auto 0', fontSize: 13, fontWeight: today ? 700 : 500, color: today ? 'var(--primary-foreground)' : 'var(--foreground)' }}>
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading && <div style={{ padding: '12px', fontSize: 13, color: 'var(--muted-foreground)', textAlign: 'center' }}>Loading…</div>}
        {categories.map((cat) => {
          const c = getColor(cat.colorIdx)
          const catShifts = weekShifts.filter((s) => s.categoryId === cat.id)
          return (
            <div key={cat.id} style={{ borderBottom: '2px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--muted)', borderBottom: '1px solid var(--border)', width: '100%' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.bg }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--foreground)' }}>{cat.name}</span>
              </div>
              <div style={{ display: 'flex', minHeight: 56 }}>
                <div style={{ width: 120, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: c.text, fontWeight: 600 }}>{catShifts.length} shift{catShifts.length !== 1 ? 's' : ''}</span>
                </div>
                {weekDates.map((d, di) => {
                  const dISO = toDateISO(d)
                  const dayShifts = catShifts.filter((s) => s.date === dISO)
                  const closed = settings.workingHours[d.getDay()] === null
                  return (
                    <div
                      key={di}
                      onDoubleClick={() => { if (!readOnly) onAddShift(d, cat.id) }}
                      style={{ flex: 1, borderRight: '1px solid var(--border)', minHeight: 56, padding: 4, background: closed ? 'var(--muted)' : 'var(--background)', cursor: readOnly ? 'default' : 'crosshair', display: 'flex', flexDirection: 'column', gap: 3 }}
                    >
                      {dayShifts.map((shift) => {
                        const isDraft = shift.status === 'draft'
                        return (
                          <div
                            key={shift.id}
                            onClick={() => onShiftClick(shift, cat)}
                            style={{ background: isDraft ? c.light : c.bg, border: isDraft ? `1.5px dashed ${c.border}` : 'none', color: isDraft ? c.text : 'var(--background)', borderRadius: 4, padding: '3px 6px', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {isDraft && '✎ '}{shift.employee.split(' ')[0]} {fmt12(shift.startH)}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WeekView
