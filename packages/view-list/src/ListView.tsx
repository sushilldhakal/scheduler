import React, { useRef, useState, useCallback, useMemo } from 'react'
import type { Block, Resource } from '@shadcn-scheduler/core'
import { sameDay, isToday, DAY_NAMES, MONTHS_SHORT, getWeekDates } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'
import { Plus } from 'lucide-react'

export interface ListViewProps {
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  onShiftClick: (block: Block, resource: Resource) => void
  onPublish: (...shiftIds: string[]) => void
  onUnpublish: (shiftId: string) => void
  onAddShift?: (date: Date, categoryId?: string | null, empId?: string | null) => void
  currentDate: Date
  view: string
}

interface DragState { id: string }
interface GhostPosition { x: number; y: number }
interface GroupedDay { date: string; shifts: Block[] }

function ListViewInner({
  shifts,
  setShifts,
  onShiftClick,
  onPublish,
  onUnpublish,
  onAddShift,
  currentDate,
  view,
}: ListViewProps): React.ReactElement {
  const { categories, getColor, labels, slots, getTimeLabel } = useSchedulerContext()
  const base = view.replace('list', '') || 'day'
  const categoryMap: Record<string, Resource> = Object.fromEntries(
    categories.map((c) => [c.id, c])
  )

  const [start, end] = useMemo((): [Date, Date] => {
    if (base === 'day') return [currentDate, currentDate]
    if (base === 'week') {
      const wd = getWeekDates(currentDate)
      return [wd[0], wd[6]]
    }
    if (base === 'month') {
      const y = currentDate.getFullYear(), m = currentDate.getMonth()
      return [new Date(y, m, 1), new Date(y, m + 1, 0)]
    }
    const y = currentDate.getFullYear()
    return [new Date(y, 0, 1), new Date(y, 11, 31)]
  }, [base, currentDate])

  const grouped = useMemo((): GroupedDay[] => {
    const inRange = shifts.filter((s) => {
      const sd = new Date(s.date + 'T12:00:00')
      const st = new Date(start); st.setHours(0, 0, 0, 0)
      const en = new Date(end); en.setHours(23, 59, 59, 999)
      return sd >= st && sd <= en
    })
    inRange.sort((a, b) => a.date.localeCompare(b.date) || a.startH - b.startH)
    const map = new Map<string, GroupedDay>()
    inRange.forEach((s) => {
      const k = s.date
      const list = map.get(k)
      if (list) list.shifts.push(s)
      else map.set(k, { date: s.date, shifts: [s] })
    })
    return Array.from(map.values())
  }, [shifts, start, end])

  const ds = useRef<DragState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropT, setDropT] = useState<string | null>(null)
  const [gPos, setGPos] = useState<GhostPosition | null>(null)

  const onIPD = useCallback((e: React.PointerEvent<HTMLDivElement>, shift: Block): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    ds.current = { id: shift.id }
    setDragId(shift.id)
  }, [])

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    setGPos({ x: e.clientX, y: e.clientY })
    const el = document.elementFromPoint(e.clientX, e.clientY)
    setDropT(el?.closest('[data-drop-date]')?.getAttribute('data-drop-date') ?? null)
  }, [])

  const onPU = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const dt = el?.closest('[data-drop-date]')?.getAttribute('data-drop-date')
    const id = ds.current.id
    ds.current = null; setDragId(null); setDropT(null); setGPos(null)
    if (dt) setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, date: dt } : s)))
  }, [setShifts])

  if (!grouped.length) {
    if (slots.emptyState) {
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {slots.emptyState({ view })}
        </div>
      )
    }
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>No {labels.shift}s in this period</p>
        {onAddShift && (
          <button
            type="button"
            onClick={() => onAddShift(currentDate)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 6, background: 'var(--primary)', padding: '8px 16px', fontSize: 14, fontWeight: 500, color: 'var(--primary-foreground)', border: 'none', cursor: 'pointer' }}
          >
            <Plus size={16} /> Add {labels.shift}
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      style={{ flex: 1, overflowY: 'auto', paddingBottom: 24, userSelect: 'none', position: 'relative' }}
      onPointerMove={onPM}
      onPointerUp={onPU}
    >
      {grouped.map(({ date, shifts: ds_ }) => {
        const drafts = ds_.filter((s) => s.status === 'draft')
        const dateStr = date.slice(0, 10)
        const dateObj = new Date(dateStr + 'T12:00:00')
        const isOT = dropT === dateStr

        return (
          <div key={date}>
            <div
              data-drop-date={dateStr}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px 8px', background: 'var(--background)',
                borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 5,
                outline: isOT ? '2px solid var(--primary)' : 'none', outlineOffset: -2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: isToday(dateObj) ? 'var(--primary)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: isToday(dateObj) ? 'var(--background)' : 'var(--foreground)' }}>{dateObj.getDate()}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>
                    {DAY_NAMES[dateObj.getDay()]}, {MONTHS_SHORT[dateObj.getMonth()]} {dateObj.getDate()}, {dateObj.getFullYear()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {ds_.length} shift{ds_.length !== 1 ? 's' : ''}{drafts.length > 0 ? ` · ${drafts.length} draft` : ''}
                  </div>
                </div>
              </div>
              {drafts.length > 0 && (
                <button
                  onClick={() => onPublish(...drafts.map((s) => s.id))}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', background: 'var(--accent)', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}
                >
                  Publish all
                </button>
              )}
            </div>
            {ds_.map((shift) => {
              const category = categoryMap[shift.categoryId]
              const c = getColor(category?.colorIdx ?? 0)
              const isDraft = shift.status === 'draft'
              const isDrag = dragId === shift.id
              return (
                <div
                  key={shift.id}
                  data-drop-date={dateStr}
                  onPointerDown={(e) => onIPD(e, shift)}
                  onClick={() => { if (!dragId) onShiftClick(shift, category!) }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '10px 20px',
                    borderBottom: '1px solid var(--border)', cursor: isDrag ? 'grabbing' : 'grab',
                    background: isDrag ? 'var(--accent)' : 'var(--background)', opacity: isDrag ? 0.5 : 1,
                    touchAction: 'none', transition: 'background 150ms',
                  }}
                >
                  <div style={{ marginRight: 10, color: 'var(--muted-foreground)', fontSize: 14, flexShrink: 0 }}>⠿</div>
                  <div style={{ width: 3, height: 36, borderRadius: 2, background: c.bg, marginRight: 14, flexShrink: 0, opacity: isDraft ? 0.4 : 1 }} />
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: isDraft ? 'transparent' : c.light, border: isDraft ? `1.5px dashed ${c.bg}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.bg, opacity: isDraft ? 0.6 : 1 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{shift.employee}</span>
                      {isDraft && <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--accent)', color: 'var(--accent-foreground)', borderRadius: 4, padding: '1px 5px' }}>DRAFT</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 1 }}>
                      {category?.name} · {getTimeLabel(shift.date, shift.startH)} – {getTimeLabel(shift.date, shift.endH)} · {shift.endH - shift.startH}h
                    </div>
                  </div>
                  <div
                    onClick={(e) => { e.stopPropagation(); if (isDraft) onPublish(shift.id); else onUnpublish(shift.id) }}
                    style={{ fontSize: 11, fontWeight: 600, color: isDraft ? 'var(--primary)' : 'var(--muted-foreground)', background: isDraft ? 'var(--accent)' : 'var(--border)', borderRadius: 6, padding: '4px 10px', flexShrink: 0, cursor: 'pointer' }}
                  >
                    {isDraft ? 'Publish' : 'Draft'}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
      {gPos && dragId && (() => {
        const s = shifts.find((x) => x.id === dragId)
        if (!s) return null
        const c = getColor(categoryMap[s.categoryId]?.colorIdx ?? 0)
        return (
          <div style={{ position: 'fixed', left: gPos.x + 14, top: gPos.y - 12, background: c.bg, color: 'var(--background)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, pointerEvents: 'none', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
            {s.employee} · {getTimeLabel(s.date, s.startH)}–{getTimeLabel(s.date, s.endH)}
          </div>
        )
      })()}
    </div>
  )
}

export const ListView = React.memo(ListViewInner)
