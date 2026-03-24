import React, { useRef, useState, useCallback, useEffect } from 'react'
import type { Block, Resource } from '@shadcn-scheduler/core'
import { sameDay, isToday, fmt12, getDIM, getFirst, DOW_MON_FIRST, toDateISO } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'
import { Plus, Copy, ClipboardPaste } from 'lucide-react'
import { StaffPanel } from './StaffPanel'
import { DayShiftsDialog } from './DayShiftsDialog'

export interface MonthViewProps {
  date: Date
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string | null, empId?: string | null) => void
  copiedShift?: Block | null
  setCopiedShift?: React.Dispatch<React.SetStateAction<Block | null>>
  onDateDoubleClick?: (date: Date) => void
}

interface DragState { id: string }
interface GhostPosition { x: number; y: number }
interface StaffPanelState { categoryId: string; anchorRect: DOMRect }

function MonthViewInner({
  date,
  shifts,
  setShifts,
  onShiftClick,
  onAddShift,
  copiedShift,
  setCopiedShift,
  onDateDoubleClick,
}: MonthViewProps): React.ReactElement {
  const { categories, employees, getColor, settings, nextUid, labels, slots } = useSchedulerContext()
  const [moreShiftsDialog, setMoreShiftsDialog] = useState<Date | null>(null)
  const [hoverMore, setHoverMore] = useState<{ date: Date; rect: DOMRect } | null>(null)
  const y = date.getFullYear()
  const m = date.getMonth()
  const daysInMonth = getDIM(y, m)
  const firstDay = getFirst(y, m)

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))

  const categoryMap: Record<string, Resource> = Object.fromEntries(
    categories.map((c) => [c.id, c])
  )

  const ref = useRef<HTMLDivElement>(null)
  const ds = useRef<DragState | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropT, setDropT] = useState<string | null>(null)
  const [gPos, setGPos] = useState<GhostPosition | null>(null)
  const [staffPanel, setStaffPanel] = useState<StaffPanelState | null>(null)
  const staffDragRef = useRef<{ empId: string; categoryId: string; empName: string; pointerId: number } | null>(null)
  const [isStaffDragging, setIsStaffDragging] = useState(false)

  const getCD = useCallback((cx: number, cy: number): string | null => {
    const el = document.elementFromPoint(cx, cy)
    return el?.closest('[data-cell-date]')?.getAttribute('data-cell-date') ?? null
  }, [])

  const clearStaffDrag = useCallback(() => {
    staffDragRef.current = null
    setIsStaffDragging(false)
    setDropT(null)
  }, [])

  useEffect(() => {
    if (!isStaffDragging) return
    const onMove = (e: PointerEvent) => setDropT(getCD(e.clientX, e.clientY))
    const onUp = (e: PointerEvent) => {
      const drag = staffDragRef.current
      if (!drag) return
      const ymd = getCD(e.clientX, e.clientY)
      if (ymd) {
        const emp = employees.find((x) => x.id === drag.empId)
        setShifts((prev) => [...prev, {
          id: nextUid(),
          categoryId: drag.categoryId,
          employeeId: drag.empId,
          date: ymd,
          startH: 12, endH: 20,
          employee: emp?.name || drag.empName || '?',
          status: 'draft',
        }])
      }
      clearStaffDrag()
    }
    const onCancel = () => { if (staffDragRef.current) clearStaffDrag() }
    document.addEventListener('pointermove', onMove, { capture: true })
    document.addEventListener('pointerup', onUp, { capture: true })
    document.addEventListener('pointercancel', onCancel, { capture: true })
    return () => {
      document.removeEventListener('pointermove', onMove, { capture: true })
      document.removeEventListener('pointerup', onUp, { capture: true })
      document.removeEventListener('pointercancel', onCancel, { capture: true })
    }
  }, [isStaffDragging, getCD, employees, nextUid, setShifts, clearStaffDrag])

  const onSPD = useCallback((e: React.PointerEvent<HTMLDivElement>, shift: Block): void => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    ds.current = { id: shift.id }
    setDragId(shift.id)
  }, [])

  const onPM = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    setGPos({ x: e.clientX, y: e.clientY })
    setDropT(getCD(e.clientX, e.clientY))
  }, [getCD])

  const onPC = useCallback((): void => {
    ds.current = null; setDragId(null); setDropT(null); setGPos(null)
  }, [])

  const onPU = useCallback((e: React.PointerEvent<HTMLDivElement>): void => {
    if (!ds.current) return
    const cd = getCD(e.clientX, e.clientY)
    const id = ds.current.id
    ds.current = null; setDragId(null); setDropT(null); setGPos(null)
    if (cd) {
      const [yr, mo, dy] = cd.split('-').map(Number)
      const newDate = `${yr}-${String(mo).padStart(2, '0')}-${String(dy).padStart(2, '0')}`
      setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, date: newDate } : s)))
    }
  }, [getCD, setShifts])

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', userSelect: 'none' }} onPointerMove={onPM} onPointerUp={onPU} onPointerCancel={onPC}>
      <div style={{ width: 180, flexShrink: 0, borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'var(--muted)' }}>
        {categories.map((cat) => {
          const c = getColor(cat.colorIdx)
          return (
            <div key={cat.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.bg, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{cat.name}</span>
              </div>
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setStaffPanel((p) => p?.categoryId === cat.id ? null : { categoryId: cat.id, anchorRect: rect })
                }}
                style={{ fontSize: 11, fontWeight: 600, color: c.text, background: c.light, border: `1px solid ${c.border}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', width: '100%' }}
              >
                {labels.staff ?? 'Staff'}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '2px solid var(--border)', flexShrink: 0 }}>
          {DOW_MON_FIRST.map((d) => (
            <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: 'minmax(96px,1fr)' }}>
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} style={{ background: 'var(--muted)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
            const today = isToday(d)
            const closed = settings?.workingHours?.[d.getDay()] === null
            const dayShifts = shifts.filter((s) => sameDay(s.date, d))
            const ck = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            const isOver = dropT === ck
            return (
              <div key={d.toISOString()} data-cell-date={ck} style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '5px 4px', background: isOver ? 'var(--accent)' : today ? 'var(--accent)' : closed ? 'var(--muted)' : 'var(--background)', display: 'flex', flexDirection: 'column', gap: 2, outline: isOver ? '2px solid var(--primary)' : 'none', outlineOffset: -2, minHeight: 96, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <div
                    onDoubleClick={(e) => { e.stopPropagation(); onDateDoubleClick?.(d) }}
                    style={{ fontSize: 13, fontWeight: today ? 700 : 500, color: today ? 'var(--primary-foreground)' : closed ? 'var(--muted-foreground)' : 'var(--foreground)', background: today ? 'var(--primary)' : 'transparent', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: onDateDoubleClick ? 'pointer' : 'default' }}
                  >
                    {d.getDate()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {closed && <span style={{ fontSize: 9, color: 'var(--muted-foreground)', fontWeight: 600 }}>CLOSED</span>}
                    <button onClick={() => onAddShift(d, null, null)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px dashed var(--muted-foreground)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', padding: 0, opacity: 0.7 }} title="Add Shift">
                      <Plus size={8} />
                    </button>
                    {copiedShift && (
                      <button onClick={() => { setShifts((prev) => [...prev, { ...copiedShift, id: nextUid(), date: toDateISO(d) }]); setCopiedShift?.(null) }} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px dashed var(--primary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', padding: 0, opacity: 0.7 }} title="Paste Shift">
                        <ClipboardPaste size={8} />
                      </button>
                    )}
                  </div>
                </div>
                {dayShifts.slice(0, 3).map((shift) => {
                  const category = categoryMap[shift.categoryId]
                  if (!category) return null
                  const c = getColor(category.colorIdx)
                  const isDraft = shift.status === 'draft'
                  const isDrag = dragId === shift.id
                  return (
                    <div key={shift.id} onPointerDown={(e) => onSPD(e, shift)} onDoubleClick={(e) => { e.stopPropagation(); if (!dragId) onShiftClick(shift, category) }} style={{ background: isDraft ? 'transparent' : c.bg, border: isDraft ? `1.5px dashed ${c.bg}` : 'none', color: isDraft ? c.bg : 'var(--background)', borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 600, cursor: isDrag ? 'grabbing' : 'grab', opacity: isDrag ? 0.3 : 1, touchAction: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{isDraft && '✎ '}{shift.employee.split(' ')[0]} {fmt12(shift.startH)}</div>
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setCopiedShift?.(shift) }} style={{ background: 'transparent', border: 'none', color: isDraft ? c.bg : 'var(--background)', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center', zIndex: 10 }} title="Copy Shift">
                        <Copy size={10} />
                      </button>
                    </div>
                  )
                })}
                {dayShifts.length > 3 && (
                  <div onMouseEnter={(e) => setHoverMore({ date: d, rect: e.currentTarget.getBoundingClientRect() })} onMouseLeave={() => setHoverMore(null)} onClick={(e) => { e.stopPropagation(); setMoreShiftsDialog(d) }} style={{ fontSize: 10, color: 'var(--primary)', paddingLeft: 2, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }} title="Click to view all shifts">
                    +{dayShifts.length - 3} more
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {hoverMore && (() => {
          const overflowShifts = shifts.filter((s) => sameDay(s.date, hoverMore.date)).slice(3)
          return (
            <div style={{ position: 'fixed', left: hoverMore.rect.right, top: hoverMore.rect.top, marginLeft: 8, background: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9998, maxWidth: 220, fontSize: 11 }}>
              {overflowShifts.map((s) => {
                const cat = categoryMap[s.categoryId]
                const c = cat ? getColor(cat.colorIdx) : { bg: '#666', text: '#fff' }
                return (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                    <span style={{ color: c.text }}>{s.employee.split(' ')[0]}</span>
                    <span style={{ color: 'var(--muted-foreground)' }}>{fmt12(s.startH)}–{fmt12(s.endH)}</span>
                  </div>
                )
              })}
            </div>
          )
        })()}
        {moreShiftsDialog && (
          <DayShiftsDialog
            date={moreShiftsDialog}
            shifts={shifts.filter((s) => sameDay(s.date, moreShiftsDialog))}
            categoryMap={categoryMap}
            onClose={() => setMoreShiftsDialog(null)}
            onShiftClick={(shift, cat) => { setMoreShiftsDialog(null); onShiftClick(shift, cat) }}
          />
        )}
        {gPos && dragId && (() => {
          const s = shifts.find((x) => x.id === dragId)
          if (!s) return null
          const c = getColor(categoryMap[s.categoryId]?.colorIdx ?? 0)
          return <div style={{ position: 'fixed', left: gPos.x + 12, top: gPos.y - 10, background: c.bg, color: 'var(--background)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 700, pointerEvents: 'none', zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>{s.employee.split(' ')[0]} · {fmt12(s.startH)}–{fmt12(s.endH)}</div>
        })()}
      </div>
      {staffPanel && (
        <StaffPanel
          category={categoryMap[staffPanel.categoryId]!}
          date={date}
          dayShifts={[]}
          onDragStaff={({ empId, categoryId, empName, pointerId }) => {
            staffDragRef.current = { empId, categoryId, empName, pointerId }
            setIsStaffDragging(true)
          }}
          anchorRect={staffPanel.anchorRect}
          onClose={() => setStaffPanel(null)}
        />
      )}
    </div>
  )
}

export const MonthView = React.memo(MonthViewInner)
