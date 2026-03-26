/**
 * KanbanView — Day / Week / Month / Year board layouts for @shadcn-scheduler.
 *
 * Day    – category columns, full-height cards with break stripe
 * Week   – category rows × day columns, compact cards, table layout (no overflow clip)
 * Month  – 7-col calendar grid, shift pills per day, drag to move, right-click menu
 * Year   – 12 mini-month calendars, click-through to month, heatmap dots
 *
 * Every card: double-click → ShiftModal · right-click → Edit/Copy/Cut/Delete
 * Every empty cell/column: right-click → Add shift · Paste (if clipboard)
 * All cards: HTML5 draggable
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Block, Resource } from '@shadcn-scheduler/core'
import {
  toDateISO, fmt12, isToday as isTodayFn,
  DOW_MON_FIRST, MONTHS_SHORT, MONTHS,
  getDIM, getFirst, sameDay,
} from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'
import {
  AddShiftModal, ShiftModal,
  ContextMenu, ContextMenuTrigger, ContextMenuContent,
  ContextMenuItem, ContextMenuSeparator, ContextMenuLabel,
} from '@shadcn-scheduler/grid-engine'
import { Pencil, Copy, Scissors, Trash2, Plus, ClipboardPaste } from 'lucide-react'

// ─── Public props ─────────────────────────────────────────────────────────────

export interface KanbanViewProps {
  date: Date
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  onShiftClick?: (block: Block, resource: Resource) => void
  onAddShift?: (date: Date, categoryId?: string) => void
  readOnly?: boolean
  mode?: 'day' | 'week' | 'month' | 'year'
  /** Required for week mode — Mon…Sun ordered Dates */
  dates?: Date[]
  /** Called when the user drills from year → month */
  onMonthDrill?: (year: number, month: number) => void
  /** Called when the user clicks "Go to Day View" from a week column header */
  onGoToDay?: (date: Date) => void
  onBlockCreate?: (block: Block) => void
  onBlockUpdate?: (block: Block) => void
  onBlockDelete?: (shiftId: string) => void
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface AddPrompt { date: Date; categoryId?: string }
interface EditTarget { shift: Block; category: Resource }
interface CellMenu { clientX: number; clientY: number; date: Date; categoryId?: string }

interface BoardState {
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  readOnly?: boolean
  onBlockCreate?: (block: Block) => void
  onBlockUpdate?: (block: Block) => void
  onBlockDelete?: (shiftId: string) => void
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function getInitials(shift: Block, employees: Resource[]): string {
  const emp = employees.find((e) => e.id === shift.employeeId)
  return (
    emp?.avatar ??
    shift.employee.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
  )
}

/** Category initials — e.g. "Bar Floating/Polishing" → "BF", "Barista" → "B" */
function getCatInitials(name: string): string {
  // Strip group prefix like "Bar Group · " if present
  const short = name.includes('·') ? name.split('·').pop()!.trim() : name
  return short.split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function useConflicts(subset: Block[]): Set<string> {
  return useMemo(() => {
    const ids = new Set<string>()
    const byEmp = new Map<string, Block[]>()
    subset.forEach((s) => {
      const list = byEmp.get(s.employeeId) ?? []
      list.push(s)
      byEmp.set(s.employeeId, list)
    })
    byEmp.forEach((list) => {
      list.forEach((a, i) => {
        list.slice(i + 1).forEach((b) => {
          if (a.date === b.date && a.startH < b.endH && b.startH < a.endH) {
            ids.add(a.id); ids.add(b.id)
          }
        })
      })
    })
    return ids
  }, [subset])
}

function Av({ initials, color, size = 28 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: `${color}18`, border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size <= 24 ? 8 : 10, fontWeight: 800, color, flexShrink: 0, letterSpacing: 0.5 }}>
      {initials}
    </div>
  )
}

/** Compute proportional break position within a shift. Returns null if no break. */
function breakOverlayProps(shift: Block): { leftPct: number; widthPct: number; title: string } | null {
  if (shift.breakStartH === undefined || shift.breakEndH === undefined) return null
  const dur = shift.endH - shift.startH
  if (dur <= 0) return null
  const leftPct  = ((shift.breakStartH - shift.startH) / dur) * 100
  const widthPct = ((shift.breakEndH   - shift.breakStartH) / dur) * 100
  const mins = Math.round((shift.breakEndH - shift.breakStartH) * 60)
  return { leftPct, widthPct, title: `Break ${fmt12(shift.breakStartH)}–${fmt12(shift.breakEndH!)} (${mins}m)` }
}

// ─── Cell right-click popover (portal) ───────────────────────────────────────

function CellCtxMenu({
  menu, readOnly, clipboard, onAddShift, onPaste, onClose,
}: {
  menu: CellMenu; readOnly?: boolean; clipboard: Block | null
  onAddShift: () => void; onPaste: () => void; onClose: () => void
}) {
  useEffect(() => {
    const h = () => onClose()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', h)
    window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('pointerdown', h); window.removeEventListener('keydown', esc) }
  }, [onClose])

  const content = (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onPointerDown={onClose} />
      <div onPointerDown={(e) => e.stopPropagation()} style={{ position: 'fixed', top: menu.clientY + 4, left: menu.clientX, zIndex: 99999, background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, padding: '4px 0', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', minWidth: 180 }}>
        {!readOnly && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--foreground)', textAlign: 'left' }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            onClick={() => { onAddShift(); onClose() }}
          >
            <Plus size={14} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            Add shift
          </button>
        )}
        {(!readOnly && clipboard) && <div style={{ height: 1, margin: '4px 0', background: 'var(--border)' }} />}
        {clipboard && (
          <button
            style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--foreground)', textAlign: 'left' }}
            onPointerEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent)' }}
            onPointerLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none' }}
            onClick={() => { onPaste(); onClose() }}
          >
            <ClipboardPaste size={14} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            Paste — {clipboard.employee}
          </button>
        )}
      </div>
    </>
  )
  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}

// ─── Shift card right-click (Radix) ──────────────────────────────────────────

function ShiftCtxMenu({
  shift, color, readOnly, onEdit, onCopy, onCut, onDelete, children,
}: {
  shift: Block; color: { bg: string }; readOnly?: boolean
  onEdit: () => void; onCopy: () => void; onCut: () => void; onDelete: () => void
  children: React.ReactNode
}) {
  if (readOnly) return <>{children}</>
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div style={{ display: 'contents' }} onContextMenu={(e) => e.stopPropagation()}>
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel style={{ color: color.bg }}>{shift.employee}</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onEdit} className="gap-2"><Pencil size={14} className="text-muted-foreground" />Edit shift</ContextMenuItem>
        <ContextMenuItem onClick={onCopy} className="gap-2"><Copy size={14} className="text-muted-foreground" />Copy shift</ContextMenuItem>
        <ContextMenuItem onClick={onCut} className="gap-2"><Scissors size={14} className="text-muted-foreground" />Cut shift</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onDelete} className="gap-2 text-destructive focus:text-destructive"><Trash2 size={14} />Delete shift</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

// ─── Drop-zone wrapper ────────────────────────────────────────────────────────

function DropZone({
  dropKey, activeDropKey, color, onDragOver, onDragLeave, onDrop, onContextMenu, children, style,
}: {
  dropKey: string; activeDropKey: string | null; color: { bg: string }
  onDragOver: (k: string) => void; onDragLeave: () => void; onDrop: (k: string) => void
  onContextMenu?: (e: React.MouseEvent) => void
  children: React.ReactNode; style?: React.CSSProperties
}) {
  const isOver = activeDropKey === dropKey
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onDragOver(dropKey) }}
      onDragLeave={onDragLeave} onDrop={(e) => { e.preventDefault(); onDrop(dropKey) }}
      onContextMenu={onContextMenu}
      style={{ ...style, background: isOver ? `color-mix(in srgb, ${color.bg} 10%, var(--background))` : (style?.background ?? 'transparent'), outline: isOver ? `2px dashed ${color.bg}60` : undefined, outlineOffset: isOver ? -2 : undefined, transition: 'background 80ms, outline 80ms' }}
    >
      {children}
    </div>
  )
}

// ─── Day-view full card ───────────────────────────────────────────────────────
// The card IS the colored block — same as the grid's shift block.
// Break overlay: position:absolute; top:0; height:100% spanning the full card,
// identical CSS to the GridView break div.

function DayCard({
  shift, color, conflictIds, nowH, iso, dragShiftId, onDoubleClick, onDragStart, onDragEnd,
}: {
  shift: Block; color: { bg: string; text: string }; conflictIds: Set<string>
  nowH: number; iso: string; dragShiftId: string | null
  onDoubleClick: () => void; onDragStart: (e: React.DragEvent) => void; onDragEnd: () => void
}) {
  const { employees } = useSchedulerContext()
  const isDraft = shift.status === 'draft'
  const hasConflict = conflictIds.has(shift.id)
  const isLive = iso === toDateISO(new Date()) && nowH >= shift.startH && nowH < shift.endH
  const dur = shift.endH - shift.startH
  const hrs = dur % 1 === 0 ? `${dur}h` : `${dur.toFixed(1)}h`
  const initials = getInitials(shift, employees)
  const beingDragged = dragShiftId === shift.id
  const brk = breakOverlayProps(shift)

  return (
    <div
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDoubleClick={onDoubleClick}
      title="Double-click to edit · Right-click for options"
      style={{
        /* Solid category color — same as the grid's shift block */
        background: isDraft ? 'var(--background)' : color.bg,
        border: isDraft
          ? `1px dashed ${hasConflict ? 'var(--destructive)' : color.bg}`
          : `1px solid ${hasConflict ? 'var(--destructive)' : 'transparent'}`,
        borderRadius: 10,
        padding: '11px 13px',
        cursor: beingDragged ? 'grabbing' : 'grab',
        boxShadow: beingDragged ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
        /* position:relative + overflow:hidden so the break overlay clips to the card */
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 100ms, transform 100ms, opacity 120ms',
        opacity: beingDragged ? 0.35 : 1,
        minHeight: 80,
        userSelect: 'none',
      }}
      onMouseEnter={(e) => { if (beingDragged) return; const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 4px 14px rgba(0,0,0,0.18)'; el.style.transform = 'translateY(-1px)' }}
      onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; el.style.transform = '' }}
    >
      {/* Left accent strip — 4px darker overlay, exactly like the grid */}
      {!isDraft && <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: 'rgba(0,0,0,0.18)', pointerEvents: 'none', zIndex: 1 }} />}

      {/* Break overlay — same div as GridView: position:absolute; top:0; height:100% */}
      {brk && (
        <div
          title={brk.title}
          style={{
            position: 'absolute',
            top: 0,
            left: `${brk.leftPct}%`,
            width: `${brk.widthPct}%`,
            height: '100%',
            background: 'rgba(0,0,0,0.15)',
            borderLeft:  '1px dashed rgba(255,255,255,0.35)',
            borderRight: '1px dashed rgba(255,255,255,0.35)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      )}

      {/* Content — z-index:3 so it sits above the break overlay */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        {/* Avatar + name + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <Av initials={initials} color={isDraft ? color.bg : 'rgba(255,255,255,0.95)'} size={30} />
          <span style={{ fontSize: 13, fontWeight: 700, color: isDraft ? 'var(--foreground)' : 'rgba(255,255,255,0.97)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shift.employee}</span>
          {hasConflict && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(239,68,68,0.9)', color: 'white', flexShrink: 0 }}>⚡ Conflict</span>}
          {!hasConflict && isLive && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.95)', flexShrink: 0 }}>● Live</span>}
          {!hasConflict && !isLive && isDraft && <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 999, background: 'var(--muted)', color: 'var(--muted-foreground)', flexShrink: 0 }}>Draft</span>}
        </div>

        {/* Time + hours */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: isDraft ? 'var(--muted-foreground)' : 'rgba(255,255,255,0.82)' }}>{fmt12(shift.startH)} – {fmt12(shift.endH)}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: isDraft ? `${color.bg}14` : 'rgba(0,0,0,0.18)', color: isDraft ? color.bg : 'rgba(255,255,255,0.9)' }}>{hrs}</span>
        </div>

        {/* Break label — text only, the visual is the overlay above */}
        {brk && (
          <div style={{ marginTop: 5, fontSize: 10, color: isDraft ? 'var(--muted-foreground)' : 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', gap: 4 }}>
            ☕ {fmt12(shift.breakStartH!)} – {fmt12(shift.breakEndH!)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Week-view compact card ───────────────────────────────────────────────────
// Matches the screenshot: white card · colored square badge · time · name
// Break overlay: position:absolute; top:0; height:100% (same as GridView)

const TOOLTIP_DELAY = 200
const TOOLTIP_LEAVE = 120

function WeekCard({
  shift, color, catInitials, catName, conflictIds, nowH, iso, dragShiftId, onDoubleClick, onDragStart, onDragEnd,
}: {
  shift: Block; color: { bg: string; text: string }; catInitials: string; catName: string
  conflictIds: Set<string>; nowH: number; iso: string; dragShiftId: string | null
  onDoubleClick: () => void; onDragStart: (e: React.DragEvent) => void; onDragEnd: () => void
}) {
  const isDraft = shift.status === 'draft'
  const hasConflict = conflictIds.has(shift.id)
  const isLive = iso === toDateISO(new Date()) && nowH >= shift.startH && nowH < shift.endH
  const beingDragged = dragShiftId === shift.id
  const brk = breakOverlayProps(shift)
  const dur = shift.endH - shift.startH
  const hrs = dur % 1 === 0 ? `${dur}h` : `${dur.toFixed(1)}h`

  const cardRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (beingDragged) return
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    enterTimer.current = setTimeout(() => setShowTooltip(true), TOOLTIP_DELAY)
  }
  const handleLeave = () => {
    if (enterTimer.current) clearTimeout(enterTimer.current)
    leaveTimer.current = setTimeout(() => setShowTooltip(false), TOOLTIP_LEAVE)
  }

  // Tooltip position — same logic as GridView
  const tooltipPortal = showTooltip && cardRef.current ? (() => {
    const r = cardRef.current!.getBoundingClientRect()
    const showBelow = r.top < 140
    const popTop = showBelow ? r.bottom + 8 : r.top - 8
    const popLeft = Math.min(Math.max(r.left + r.width / 2, 120), window.innerWidth - 120)
    return createPortal(
      <div
        onPointerEnter={() => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }}
        onPointerLeave={handleLeave}
        style={{
          position: 'fixed',
          top: showBelow ? popTop : undefined,
          bottom: showBelow ? undefined : `${window.innerHeight - popTop}px`,
          left: popLeft,
          transform: 'translateX(-50%)',
          zIndex: 99999,
          background: 'var(--popover)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '10px 14px',
          minWidth: 190,
          maxWidth: 280,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          pointerEvents: 'auto',
          overflow: 'hidden',
        }}
      >
        {/* Employee + colored dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.bg, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{shift.employee}</span>
        </div>
        {/* Category name */}
        <div style={{ fontSize: 11, color: color.bg, fontWeight: 600, marginBottom: 5 }}>{catName}</div>
        {/* Time + duration */}
        <div style={{ fontSize: 11, color: 'var(--foreground)', fontWeight: 600 }}>
          {fmt12(shift.startH)} – {fmt12(shift.endH)}
          <span style={{ fontWeight: 400, color: 'var(--muted-foreground)', marginLeft: 6 }}>{hrs}</span>
        </div>
        {/* Break */}
        {brk && (
          <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 3 }}>
            Break: {fmt12(shift.breakStartH!)}–{fmt12(shift.breakEndH!)}
          </div>
        )}
        {/* Conflict */}
        {hasConflict && (
          <div style={{ marginTop: 7, padding: '4px 8px', borderRadius: 6, background: 'var(--destructive)', color: 'var(--destructive-foreground)', fontSize: 10, fontWeight: 600 }}>
            ⚡ Shift conflict — cannot publish
          </div>
        )}
        {/* Draft */}
        {isDraft && !hasConflict && (
          <div style={{ marginTop: 5, fontSize: 10, color: 'var(--muted-foreground)' }}>Draft — not published</div>
        )}
      </div>,
      document.body
    )
  })() : null

  return (
    <>
      <div
        ref={cardRef}
        draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDoubleClick={onDoubleClick}
        onPointerEnter={handleEnter} onPointerLeave={handleLeave}
        style={{
          background: isDraft ? 'transparent' : 'var(--background)',
          border: hasConflict
            ? '1.5px solid var(--destructive)'
            : isDraft
              ? `1.5px dashed ${color.bg}`
              : '1px solid var(--border)',
          borderRadius: 6,
          padding: '5px 7px 5px 6px',
          cursor: beingDragged ? 'grabbing' : 'grab',
          position: 'relative', overflow: 'hidden',
          opacity: beingDragged ? 0.35 : 1,
          transition: 'opacity 120ms, box-shadow 100ms',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => { if (!beingDragged) (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
      >
        {/* Break overlay */}
        {brk && (
          <div style={{
            position: 'absolute', top: 0, left: `${brk.leftPct}%`,
            width: `${brk.widthPct}%`, height: '100%',
            background: 'rgba(0,0,0,0.07)',
            borderLeft: '1px dashed rgba(0,0,0,0.2)',
            borderRight: '1px dashed rgba(0,0,0,0.2)',
            pointerEvents: 'none', zIndex: 2,
          }} />
        )}

        {/* Status dot */}
        {(isLive || !isDraft) && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            width: 6, height: 6, borderRadius: '50%',
            background: hasConflict ? 'var(--destructive)' : isLive ? '#22c55e' : `${color.bg}80`,
            zIndex: 3,
          }} />
        )}

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 5, flexShrink: 0,
            background: color.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.95)',
            letterSpacing: 0.3,
          }}>
            {catInitials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: hasConflict ? 'var(--destructive)' : 'var(--foreground)', whiteSpace: 'nowrap' }}>{fmt12(shift.startH)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{fmt12(shift.endH)}</span>
              {isDraft && <span style={{ fontSize: 8, color: color.bg, marginLeft: 2, lineHeight: 1 }}>▶</span>}
              {brk && <span style={{ fontSize: 9, color: 'var(--muted-foreground)', marginLeft: 1 }}>☕</span>}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {shift.employee}
            </div>
          </div>
        </div>
      </div>
      {tooltipPortal}
    </>
  )
}

// ─── Day-view layout ─────────────────────────────────────────────────────────

function DayLayout({ date, shifts, setShifts, readOnly, onBlockCreate, onBlockUpdate, onBlockDelete }: { date: Date } & BoardState) {
  const { categories, getColor, nextUid } = useSchedulerContext()
  const iso = toDateISO(date)
  const nowH = new Date().getHours() + new Date().getMinutes() / 60
  const dayShifts = useMemo(() => shifts.filter((s) => s.date === iso), [shifts, iso])
  const conflictIds = useConflicts(dayShifts)

  const [addPrompt, setAddPrompt] = useState<AddPrompt | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [clipboard, setClipboard] = useState<Block | null>(null)
  const [cellMenu, setCellMenu] = useState<CellMenu | null>(null)
  const dragRef = useRef<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropKey, setDropKey] = useState<string | null>(null)

  const del = (id: string) => { setShifts((p) => p.filter((s) => s.id !== id)); onBlockDelete?.(id) }
  const cut = (s: Block) => { setClipboard(s); del(s.id) }
  const paste = (d: Date, catId: string) => {
    if (!clipboard) return
    const b: Block = { ...clipboard, id: nextUid(), categoryId: catId, date: toDateISO(d), status: 'draft' }
    setShifts((p) => [...p, b]); onBlockCreate?.(b); setClipboard(null)
  }

  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 16px 16px', overflowX: 'auto', overflowY: 'hidden', height: '100%', alignItems: 'flex-start', boxSizing: 'border-box' }}>
      {categories.map((cat) => {
        const c = getColor(cat.colorIdx)
        const catShifts = dayShifts.filter((s) => s.categoryId === cat.id).sort((a, b) => a.startH - b.startH)
        const totalH = catShifts.reduce((acc, s) => acc + (s.endH - s.startH), 0)
        const draftN = catShifts.filter((s) => s.status === 'draft').length
        const pubN = catShifts.filter((s) => s.status === 'published').length
        return (
          <div key={cat.id} style={{ minWidth: 250, width: 250, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--muted)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: '100%' }}>
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', borderTop: `3px solid ${c.bg}`, background: `${c.bg}07`, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.bg, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: `${c.bg}20`, color: c.bg, borderRadius: 999, padding: '2px 8px', flexShrink: 0 }}>{catShifts.length}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 5, fontSize: 10, color: 'var(--muted-foreground)' }}>
                <span>{totalH % 1 === 0 ? totalH : totalH.toFixed(1)}h</span>
                {pubN > 0 && <span style={{ color: c.bg, fontWeight: 600 }}>· {pubN} pub</span>}
                {draftN > 0 && <span style={{ fontWeight: 600 }}>· {draftN} draft</span>}
              </div>
            </div>

            <DropZone dropKey={cat.id} activeDropKey={dropKey} color={c}
              onDragOver={setDropKey} onDragLeave={() => setDropKey(null)}
              onDrop={(k) => { const id = dragRef.current; if (!id) return; setShifts((p) => p.map((s) => s.id === id ? { ...s, categoryId: k } : s)); dragRef.current = null; setDragId(null); setDropKey(null) }}
              onContextMenu={(e) => { if (readOnly && !clipboard) return; e.preventDefault(); setCellMenu({ clientX: e.clientX, clientY: e.clientY, date, categoryId: cat.id }) }}
              style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}
            >
              {catShifts.length === 0 && (
                <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: 11, borderRadius: 8, border: '1.5px dashed var(--border)' }}>No shifts — right-click to add</div>
              )}
              {catShifts.map((shift) => (
                <ShiftCtxMenu key={shift.id} shift={shift} color={c} readOnly={readOnly}
                  onEdit={() => setEditTarget({ shift, category: cat })}
                  onCopy={() => setClipboard(shift)} onCut={() => cut(shift)} onDelete={() => del(shift.id)}
                >
                  <DayCard shift={shift} color={c} conflictIds={conflictIds} nowH={nowH} iso={iso} dragShiftId={dragId}
                    onDoubleClick={() => setEditTarget({ shift, category: cat })}
                    onDragStart={(e) => { dragRef.current = shift.id; setDragId(shift.id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { dragRef.current = null; setDragId(null); setDropKey(null) }}
                  />
                </ShiftCtxMenu>
              ))}
            </DropZone>

            {!readOnly && (
              <div style={{ padding: '0 8px 8px', flexShrink: 0 }}>
                <button onClick={() => setAddPrompt({ date, categoryId: cat.id })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1.5px dashed ${c.bg}35`, background: `${c.bg}04`, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: c.bg, display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${c.bg}10` }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = `${c.bg}04` }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add shift
                </button>
              </div>
            )}
          </div>
        )
      })}

      {cellMenu && <CellCtxMenu menu={cellMenu} readOnly={readOnly} clipboard={clipboard} onAddShift={() => setAddPrompt({ date: cellMenu.date, categoryId: cellMenu.categoryId })} onPaste={() => paste(cellMenu.date, cellMenu.categoryId!)} onClose={() => setCellMenu(null)} />}
      {addPrompt && <AddShiftModal date={addPrompt.date} categoryId={addPrompt.categoryId} onAdd={(b) => { setShifts((p) => [...p, b]); onBlockCreate?.(b) }} onClose={() => setAddPrompt(null)} />}
      {editTarget && (
        <ShiftModal shift={editTarget.shift} category={editTarget.category} allShifts={shifts} onClose={() => setEditTarget(null)}
          onPublish={(id) => setShifts((p) => p.map((s) => s.id === id ? { ...s, status: 'published' as const } : s))}
          onUnpublish={(id) => setShifts((p) => p.map((s) => s.id === id ? { ...s, status: 'draft' as const } : s))}
          onDelete={(id) => { del(id); setEditTarget(null) }}
          onUpdate={(u) => { setShifts((p) => p.map((s) => s.id === u.id ? u : s)); onBlockUpdate?.(u) }}
        />
      )}
    </div>
  )
}

// ─── Week-view layout ─────────────────────────────────────────────────────────

const CAT_W = 180

function WeekLayout({ dates, shifts, setShifts, readOnly, onBlockCreate, onBlockUpdate, onBlockDelete, onGoToDay }: { dates: Date[]; onGoToDay?: (date: Date) => void } & BoardState) {
  const { categories, getColor, nextUid } = useSchedulerContext()
  const nowH = new Date().getHours() + new Date().getMinutes() / 60

  const idx = useMemo(() => {
    const m = new Map<string, Block[]>()
    for (const s of shifts) { const k = `${s.categoryId}:${s.date}`; const l = m.get(k) ?? []; l.push(s); m.set(k, l) }
    return m
  }, [shifts])

  const weekShifts = useMemo(() => shifts.filter((s) => dates.some((d) => toDateISO(d) === s.date)), [shifts, dates])
  const conflictIds = useConflicts(weekShifts)

  const [addPrompt, setAddPrompt] = useState<AddPrompt | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [clipboard, setClipboard] = useState<Block | null>(null)
  const [cellMenu, setCellMenu] = useState<CellMenu | null>(null)
  const dragRef = useRef<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropKey, setDropKey] = useState<string | null>(null)
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set())
  const [dayPopover, setDayPopover] = useState<{ date: Date; rect: DOMRect } | null>(null)

  const toggleCat = (catId: string) =>
    setCollapsedCats((prev) => { const n = new Set(prev); n.has(catId) ? n.delete(catId) : n.add(catId); return n })

  const del = (id: string) => { setShifts((p) => p.filter((s) => s.id !== id)); onBlockDelete?.(id) }
  const cut = (s: Block) => { setClipboard(s); del(s.id) }
  const paste = (d: Date, catId: string) => {
    if (!clipboard) return
    const b: Block = { ...clipboard, id: nextUid(), categoryId: catId, date: toDateISO(d), status: 'draft' }
    setShifts((p) => [...p, b]); onBlockCreate?.(b); setClipboard(null)
  }

  return (
    <div style={{ overflow: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'table', tableLayout: 'fixed', width: '100%', minWidth: CAT_W + dates.length * 140, borderCollapse: 'collapse' }}>
        {/* Header — matches screenshot: day abbrev + date circle + month + total hours */}
        <div style={{ display: 'table-row', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'table-cell', width: CAT_W, minWidth: CAT_W, padding: '10px 14px', borderBottom: '2px solid var(--border)', borderRight: '1px solid var(--border)', background: 'var(--background)', fontSize: 10, fontWeight: 600, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5, verticalAlign: 'bottom' }}>Category</div>
          {dates.map((d, i) => {
            const today = isTodayFn(d); const iso = toDateISO(d)
            const dayShifts = weekShifts.filter((s) => s.date === iso)
            const dayH = dayShifts.reduce((a, s) => a + (s.endH - s.startH), 0)
            return (
              <div
                key={i}
                onClick={(e) => setDayPopover({ date: d, rect: (e.currentTarget as HTMLDivElement).getBoundingClientRect() })}
                style={{ display: 'table-cell', padding: '8px 10px 8px', borderBottom: '2px solid var(--border)', borderRight: i < dates.length - 1 ? '1px solid var(--border)' : undefined, background: today ? 'color-mix(in srgb, var(--primary) 5%, var(--background))' : 'var(--background)', verticalAlign: 'bottom', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: today ? 'var(--primary)' : 'var(--foreground)', whiteSpace: 'nowrap' }}>
                  {DOW_MON_FIRST[(d.getDay() + 6) % 7]} <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: today ? 'var(--primary)' : 'transparent', color: today ? 'var(--primary-foreground)' : 'var(--foreground)', fontSize: 12 }}>{d.getDate()}</span> {MONTHS_SHORT[d.getMonth()]}
                </div>
                {dayH > 0 && <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{dayH % 1 === 0 ? dayH : dayH.toFixed(1)}h</div>}
              </div>
            )
          })}
        </div>

        {/* Rows — each is an accordion; click label to collapse/expand */}
        {categories.map((cat, ci) => {
          const c = getColor(cat.colorIdx)
          const catW = weekShifts.filter((s) => s.categoryId === cat.id)
          const totalH = catW.reduce((a, s) => a + (s.endH - s.startH), 0)
          const uniqueEmployees = new Set(catW.map((s) => s.employee)).size
          const draftN = catW.filter((s) => s.status === 'draft').length
          const isCollapsed = collapsedCats.has(cat.id)
          const borderB = ci < categories.length - 1 ? '1px solid var(--border)' : undefined
          return (
            <div key={cat.id} style={{ display: 'table-row' }}>
              {/* Accordion label — click to collapse / expand */}
              <div
                onClick={() => toggleCat(cat.id)}
                style={{ display: 'table-cell', width: CAT_W, minWidth: CAT_W, padding: isCollapsed ? '6px 10px' : '8px 10px', borderBottom: borderB, borderRight: '1px solid var(--border)', borderLeft: `3px solid ${c.bg}`, background: `${c.bg}06`, verticalAlign: 'middle', cursor: 'pointer', userSelect: 'none' }}
              >
                {/* Row 1: colored square + name + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c.bg, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{cat.name}</span>
                  {/* Chevron rotates when expanded */}
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)', flexShrink: 0, display: 'inline-block', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 150ms' }}>›</span>
                </div>
                {/* Stats row — hidden when collapsed */}
                {!isCollapsed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted-foreground)', flexWrap: 'wrap', marginTop: 4 }}>
                    <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{catW.length}</span>
                    {uniqueEmployees > 0 && <><span>👥</span><span>{uniqueEmployees}</span></>}
                    {draftN > 0 && <><span style={{ fontSize: 11 }}>□</span><span>{draftN}</span></>}
                    {totalH > 0 && <><span>{totalH % 1 === 0 ? totalH : totalH.toFixed(1)}h</span><span>⏱</span></>}
                  </div>
                )}
              </div>
              {dates.map((d, di) => {
                const iso = toDateISO(d); const today = isTodayFn(d)
                const cellKey = `${cat.id}:${iso}`
                const cellShifts = (idx.get(cellKey) ?? []).sort((a, b) => a.startH - b.startH)
                const todayBg = today ? 'color-mix(in srgb, var(--primary) 3%, var(--background))' : 'var(--background)'
                /* When collapsed: render just a thin strip, no content */
                if (isCollapsed) {
                  return (
                    <div key={di} style={{ display: 'table-cell', padding: '6px 0', borderBottom: borderB, borderRight: di < dates.length - 1 ? '1px solid var(--border)' : undefined, background: todayBg }} />
                  )
                }
                return (
                  <DropZone key={di} dropKey={cellKey} activeDropKey={dropKey} color={c}
                    onDragOver={setDropKey} onDragLeave={() => setDropKey(null)}
                    onDrop={(k) => { const id = dragRef.current; if (!id) return; const [nc, nd] = k.split(':') as [string, string]; setShifts((p) => p.map((s) => s.id === id ? { ...s, categoryId: nc, date: nd } : s)); dragRef.current = null; setDragId(null); setDropKey(null) }}
                    onContextMenu={(e) => { if (readOnly && !clipboard) return; e.preventDefault(); setCellMenu({ clientX: e.clientX, clientY: e.clientY, date: d, categoryId: cat.id }) }}
                    style={{ display: 'table-cell', padding: '7px 8px', borderBottom: borderB, borderRight: di < dates.length - 1 ? '1px solid var(--border)' : undefined, background: todayBg, verticalAlign: 'top' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {cellShifts.map((shift) => (
                        <ShiftCtxMenu key={shift.id} shift={shift} color={c} readOnly={readOnly}
                          onEdit={() => setEditTarget({ shift, category: cat })}
                          onCopy={() => setClipboard(shift)} onCut={() => cut(shift)} onDelete={() => del(shift.id)}
                        >
                          <WeekCard shift={shift} color={c} catInitials={getCatInitials(cat.name)} catName={cat.name} conflictIds={conflictIds} nowH={nowH} iso={iso} dragShiftId={dragId}
                            onDoubleClick={() => setEditTarget({ shift, category: cat })}
                            onDragStart={(e) => { dragRef.current = shift.id; setDragId(shift.id); e.dataTransfer.effectAllowed = 'move' }}
                            onDragEnd={() => { dragRef.current = null; setDragId(null); setDropKey(null) }}
                          />
                        </ShiftCtxMenu>
                      ))}
                      {cellShifts.length === 0 && !readOnly && (
                        <div title="Right-click to add a shift" style={{ height: 4, borderRadius: 4, border: '1px dashed transparent', transition: 'all 100ms' }}
                          onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${c.bg}30`; el.style.background = `${c.bg}06`; el.style.height = '28px' }}
                          onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'transparent'; el.style.background = 'transparent'; el.style.height = '4px' }}
                        />
                      )}
                    </div>
                  </DropZone>
                )
              })}
            </div>
          )
        })}
      </div>

      {cellMenu && <CellCtxMenu menu={cellMenu} readOnly={readOnly} clipboard={clipboard} onAddShift={() => setAddPrompt({ date: cellMenu.date, categoryId: cellMenu.categoryId })} onPaste={() => paste(cellMenu.date, cellMenu.categoryId!)} onClose={() => setCellMenu(null)} />}
      {addPrompt && <AddShiftModal date={addPrompt.date} categoryId={addPrompt.categoryId} onAdd={(b) => { setShifts((p) => [...p, b]); onBlockCreate?.(b) }} onClose={() => setAddPrompt(null)} />}
      {editTarget && (
        <ShiftModal shift={editTarget.shift} category={editTarget.category} allShifts={shifts} onClose={() => setEditTarget(null)}
          onPublish={(id) => setShifts((p) => p.map((s) => s.id === id ? { ...s, status: 'published' as const } : s))}
          onUnpublish={(id) => setShifts((p) => p.map((s) => s.id === id ? { ...s, status: 'draft' as const } : s))}
          onDelete={(id) => { del(id); setEditTarget(null) }}
          onUpdate={(u) => { setShifts((p) => p.map((s) => s.id === u.id ? u : s)); onBlockUpdate?.(u) }}
        />
      )}

      {/* Day header click popover — "Go to Day View" */}
      {dayPopover && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setDayPopover(null)} />
          <div style={{
            position: 'fixed',
            top: dayPopover.rect.bottom + 6,
            left: Math.min(dayPopover.rect.left + dayPopover.rect.width / 2, window.innerWidth - 220),
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'var(--popover)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '12px 14px',
            minWidth: 200,
            maxWidth: 240,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}>
            <button onClick={() => setDayPopover(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1, padding: 2 }}>✕</button>
            <button
              onClick={() => { onGoToDay?.(dayPopover.date); setDayPopover(null) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--foreground)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 6 }}
            >
              <span style={{ fontSize: 14 }}>→</span> Go to Day View
            </button>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
              Check the sidebar for more info and actions for this day
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

// ─── Month-view layout ────────────────────────────────────────────────────────

function MonthLayout({ date, shifts, setShifts, readOnly, onBlockCreate, onBlockUpdate, onBlockDelete }: { date: Date } & BoardState) {
  const { categories, getColor, nextUid } = useSchedulerContext()
  const y = date.getFullYear(); const m = date.getMonth()
  const daysInMonth = getDIM(y, m)
  const firstDay = getFirst(y, m)

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d))

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories])

  const [addPrompt, setAddPrompt] = useState<AddPrompt | null>(null)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [clipboard, setClipboard] = useState<Block | null>(null)
  const [cellMenu, setCellMenu] = useState<CellMenu | null>(null)
  const dragRef = useRef<string | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropISO, setDropISO] = useState<string | null>(null)

  const del = (id: string) => { setShifts((p) => p.filter((s) => s.id !== id)); onBlockDelete?.(id) }
  const cut = (s: Block) => { setClipboard(s); del(s.id) }
  const paste = (d: Date) => {
    if (!clipboard) return
    const b: Block = { ...clipboard, id: nextUid(), date: toDateISO(d), status: 'draft' }
    setShifts((p) => [...p, b]); onBlockCreate?.(b); setClipboard(null)
  }

  const getDateFromEl = useCallback((cx: number, cy: number): string | null => {
    const el = document.elementFromPoint(cx, cy)
    return el?.closest('[data-month-cell]')?.getAttribute('data-month-cell') ?? null
  }, [])

  useEffect(() => {
    if (!dragId) return
    const onUp = (e: PointerEvent) => {
      const iso = getDateFromEl(e.clientX, e.clientY)
      if (iso && dragRef.current) {
        setShifts((p) => p.map((s) => s.id === dragRef.current ? { ...s, date: iso } : s))
      }
      dragRef.current = null; setDragId(null); setDropISO(null)
    }
    const onMove = (e: PointerEvent) => setDropISO(getDateFromEl(e.clientX, e.clientY))
    document.addEventListener('pointerup', onUp, { capture: true })
    document.addEventListener('pointermove', onMove, { capture: true })
    return () => { document.removeEventListener('pointerup', onUp, { capture: true }); document.removeEventListener('pointermove', onMove, { capture: true }) }
  }, [dragId, getDateFromEl, setShifts])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Day-of-week header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '2px solid var(--border)', flexShrink: 0 }}>
        {DOW_MON_FIRST.map((d) => (
          <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: 'minmax(100px,1fr)' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} style={{ background: 'var(--muted)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }} />
          const today = isTodayFn(d)
          const iso = toDateISO(d)
          const isOver = dropISO === iso
          const dayShifts = shifts.filter((s) => sameDay(s.date, d))

          return (
            <div
              key={iso}
              data-month-cell={iso}
              onContextMenu={(e) => { if (readOnly && !clipboard) return; e.preventDefault(); setCellMenu({ clientX: e.clientX, clientY: e.clientY, date: d }) }}
              style={{
                borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                padding: '5px 4px',
                background: isOver ? 'var(--accent)' : today ? 'color-mix(in srgb, var(--primary) 6%, var(--background))' : 'var(--background)',
                display: 'flex', flexDirection: 'column', gap: 2,
                outline: isOver ? '2px solid var(--primary)' : 'none', outlineOffset: -2,
                position: 'relative',
              }}
            >
              {/* Day number + buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: today ? 'var(--primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: today ? 700 : 500, color: today ? 'var(--primary-foreground)' : 'var(--foreground)' }}>
                  {d.getDate()}
                </div>
                {!readOnly && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <button onClick={() => setAddPrompt({ date: d })} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px dashed var(--muted-foreground)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)', padding: 0 }} title="Add shift"><Plus size={8} /></button>
                    {clipboard && <button onClick={() => paste(d)} style={{ width: 18, height: 18, borderRadius: '50%', border: '1.5px dashed var(--primary)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', padding: 0 }} title="Paste shift"><ClipboardPaste size={8} /></button>}
                  </div>
                )}
              </div>

              {/* Shift pills — up to 3, then "+N more" */}
              {dayShifts.slice(0, 3).map((shift) => {
                const cat = catMap[shift.categoryId]
                if (!cat) return null
                const c = getColor(cat.colorIdx)
                const isDraft = shift.status === 'draft'
                return (
                  <ShiftCtxMenu key={shift.id} shift={shift} color={c} readOnly={readOnly}
                    onEdit={() => setEditTarget({ shift, category: cat })}
                    onCopy={() => setClipboard(shift)} onCut={() => cut(shift)} onDelete={() => del(shift.id)}
                  >
                    <div
                      onPointerDown={(e) => { e.stopPropagation(); dragRef.current = shift.id; setDragId(shift.id) }}
                      onDoubleClick={(e) => { e.stopPropagation(); setEditTarget({ shift, category: cat }) }}
                      style={{
                        background: isDraft ? 'transparent' : c.bg,
                        border: isDraft ? `1.5px dashed ${c.bg}` : 'none',
                        color: isDraft ? c.bg : 'rgba(255,255,255,0.97)',
                        borderRadius: 4, padding: '2px 5px', fontSize: 10, fontWeight: 600,
                        cursor: dragId === shift.id ? 'grabbing' : 'grab',
                        opacity: dragId === shift.id ? 0.3 : 1,
                        touchAction: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {isDraft && '✎ '}{shift.employee.split(' ')[0]} {fmt12(shift.startH)}
                        {shift.breakStartH !== undefined && ' ☕'}
                      </span>
                      <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); setClipboard(shift) }}
                        style={{ background: 'transparent', border: 'none', color: isDraft ? c.bg : 'rgba(255,255,255,0.85)', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }} title="Copy">
                        <Copy size={9} />
                      </button>
                    </div>
                  </ShiftCtxMenu>
                )
              })}
              {dayShifts.length > 3 && (
                <div style={{ fontSize: 10, color: 'var(--primary)', paddingLeft: 2, cursor: 'pointer' }}>
                  +{dayShifts.length - 3} more
                </div>
              )}
            </div>
          )
        })}
      </div>

      {cellMenu && <CellCtxMenu menu={cellMenu} readOnly={readOnly} clipboard={clipboard} onAddShift={() => setAddPrompt({ date: cellMenu.date })} onPaste={() => paste(cellMenu.date)} onClose={() => setCellMenu(null)} />}
      {addPrompt && <AddShiftModal date={addPrompt.date} categoryId={addPrompt.categoryId} onAdd={(b) => { setShifts((p) => [...p, b]); onBlockCreate?.(b) }} onClose={() => setAddPrompt(null)} />}
      {editTarget && (
        <ShiftModal shift={editTarget.shift} category={editTarget.category} allShifts={shifts} onClose={() => setEditTarget(null)}
          onPublish={(id) => setShifts((p) => p.map((s) => s.id === id ? { ...s, status: 'published' as const } : s))}
          onUnpublish={(id) => setShifts((p) => p.map((s) => s.id === id ? { ...s, status: 'draft' as const } : s))}
          onDelete={(id) => { del(id); setEditTarget(null) }}
          onUpdate={(u) => { setShifts((p) => p.map((s) => s.id === u.id ? u : s)); onBlockUpdate?.(u) }}
        />
      )}
    </div>
  )
}

// ─── Year-view layout ─────────────────────────────────────────────────────────

function YearLayout({ date, shifts, onMonthDrill }: { date: Date; shifts: Block[]; onMonthDrill?: (y: number, m: number) => void }) {
  const year = date.getFullYear()

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
        {MONTHS.map((mName, m) => {
          const days = getDIM(year, m)
          const first = getFirst(year, m)
          const ms = shifts.filter((s) => { const d = new Date(s.date + 'T12:00:00'); return d.getFullYear() === year && d.getMonth() === m })
          const cells: (number | null)[] = []
          for (let i = 0; i < first; i++) cells.push(null)
          for (let d = 1; d <= days; d++) cells.push(d)

          return (
            <div key={m} onClick={() => onMonthDrill?.(year, m)}
              style={{ background: 'var(--background)', borderRadius: 12, border: '1px solid var(--border)', padding: 12, cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; el.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; el.style.transform = '' }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>{mName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
                {'MTWTFSS'.split('').map((c, i) => <div key={i} style={{ textAlign: 'center', fontSize: 8, color: 'var(--muted-foreground)', fontWeight: 700 }}>{c}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
                {cells.map((d, i) => {
                  if (!d) return <div key={`e${i}`} />
                  const has = ms.some((s) => new Date(s.date + 'T12:00:00').getDate() === d)
                  const tod = isTodayFn(new Date(year, m, d))
                  return (
                    <div key={d} style={{ textAlign: 'center', fontSize: 9, fontWeight: tod || has ? 700 : 400, color: tod ? 'var(--background)' : has ? 'var(--primary-foreground)' : 'var(--muted-foreground)', background: tod ? 'var(--primary)' : has ? 'var(--primary)' : 'transparent', borderRadius: 2, lineHeight: '16px' }}>{d}</div>
                  )
                })}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: ms.length > 0 ? 'var(--primary)' : 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: ms.length > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{ms.length} shifts</span>
                </div>
                {ms.filter((s) => s.status === 'draft').length > 0 && (
                  <span style={{ fontSize: 9, color: 'var(--accent-foreground)', fontWeight: 600 }}>{ms.filter((s) => s.status === 'draft').length} draft</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function KanbanView({
  date, shifts, setShifts, readOnly, mode = 'day', dates,
  onMonthDrill, onGoToDay, onBlockCreate, onBlockUpdate, onBlockDelete,
}: KanbanViewProps): React.ReactElement {
  if (mode === 'year') {
    return <YearLayout date={date} shifts={shifts} onMonthDrill={onMonthDrill} />
  }
  if (mode === 'month') {
    return <MonthLayout date={date} shifts={shifts} setShifts={setShifts} readOnly={readOnly} onBlockCreate={onBlockCreate} onBlockUpdate={onBlockUpdate} onBlockDelete={onBlockDelete} />
  }
  if (mode === 'week' && dates && dates.length > 0) {
    return <WeekLayout dates={dates} shifts={shifts} setShifts={setShifts} readOnly={readOnly} onGoToDay={onGoToDay} onBlockCreate={onBlockCreate} onBlockUpdate={onBlockUpdate} onBlockDelete={onBlockDelete} />
  }
  return <DayLayout date={date} shifts={shifts} setShifts={setShifts} readOnly={readOnly} onBlockCreate={onBlockCreate} onBlockUpdate={onBlockUpdate} onBlockDelete={onBlockDelete} />
}
