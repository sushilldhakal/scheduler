/**
 * @shadcn-scheduler/view-timeline
 *
 * Horizontal Gantt/EPG timeline view. Resources are rows, dates are columns.
 */
import React, { useMemo } from 'react'
import type { Block, Resource, SchedulerMarker, ShiftDependency, EmployeeAvailability } from '@shadcn-scheduler/core'
import { toDateISO, isToday, fmt12, DOW_MON_FIRST, MONTHS_SHORT } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'

export interface TimelineViewProps {
  date: Date
  dates?: Date[]
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  selEmps?: Set<string>
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
  hideFloatingButtons?: boolean
}

export function TimelineView({
  date,
  dates: datesProp,
  shifts,
  onShiftClick,
  onAddShift,
  readOnly,
  isLoading,
}: TimelineViewProps): React.ReactElement {
  const { categories, getColor, settings } = useSchedulerContext()

  const dates = useMemo((): Date[] => {
    if (datesProp?.length) return datesProp
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(date)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [datesProp, date])

  const dateISOs = useMemo(() => dates.map((d) => toDateISO(d)), [dates])
  const visibleShifts = useMemo(
    () => shifts.filter((s) => dateISOs.includes(s.date)),
    [shifts, dateISOs]
  )

  const visibleHours = settings.visibleTo - settings.visibleFrom
  const COL_W = 120

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', flexShrink: 0, borderBottom: '2px solid var(--border)', background: 'var(--background)', overflowX: 'auto' }}>
        <div style={{ width: 160, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '8px 12px', fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700 }}>
          {isLoading ? 'Loading…' : 'Channel / Resource'}
        </div>
        {dates.map((d, i) => {
          const today = isToday(d)
          return (
            <div key={i} style={{ width: COL_W, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '8px 4px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{DOW_MON_FIRST[i % 7]}</div>
              <div style={{ fontSize: 13, fontWeight: today ? 700 : 500, color: today ? 'var(--primary)' : 'var(--foreground)' }}>
                {MONTHS_SHORT[d.getMonth()]} {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {categories.map((cat) => {
          const c = getColor(cat.colorIdx)
          const catShifts = visibleShifts.filter((s) => s.categoryId === cat.id)
          return (
            <div key={cat.id} style={{ display: 'flex', borderBottom: '1px solid var(--border)', minHeight: 64 }}>
              <div style={{ width: 160, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '8px 12px', background: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.bg, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
              </div>
              {dates.map((d, di) => {
                const dISO = toDateISO(d)
                const dayShifts = catShifts.filter((s) => s.date === dISO)
                const closed = settings.workingHours[d.getDay()] === null
                return (
                  <div
                    key={di}
                    onDoubleClick={() => { if (!readOnly) onAddShift(d, cat.id) }}
                    style={{ width: COL_W, flexShrink: 0, borderRight: '1px solid var(--border)', minHeight: 64, background: closed ? 'var(--muted)' : 'var(--background)', position: 'relative', padding: 4, cursor: readOnly ? 'default' : 'crosshair' }}
                  >
                    {dayShifts.map((shift) => {
                      const startFrac = (shift.startH - settings.visibleFrom) / visibleHours
                      const widthFrac = (shift.endH - shift.startH) / visibleHours
                      const isDraft = shift.status === 'draft'
                      return (
                        <div
                          key={shift.id}
                          onClick={() => onShiftClick(shift, cat)}
                          title={`${shift.employee} ${fmt12(shift.startH)}–${fmt12(shift.endH)}`}
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: `${Math.max(0, startFrac * 100)}%`,
                            width: `${Math.max(widthFrac * 100, 4)}%`,
                            height: 'calc(100% - 12px)',
                            background: isDraft ? c.light : c.bg,
                            border: isDraft ? `1.5px dashed ${c.border}` : 'none',
                            color: isDraft ? c.text : 'var(--background)',
                            borderRadius: 4,
                            padding: '3px 6px',
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            zIndex: 1,
                          }}
                        >
                          {isDraft && '✎ '}{shift.employee.split(' ')[0]}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default TimelineView
