'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { SchedulerProvider, SchedulerSettings, createSchedulerConfig, toDateISO } from '@sushill/shadcn-scheduler'
import type { Block, Settings } from '@sushill/shadcn-scheduler'
import { KanbanView } from '@shadcn-scheduler/view-kanban'
import { DayView } from '@shadcn-scheduler/view-day'
import { UserSelect, AddShiftModal } from '@shadcn-scheduler/grid-engine'
import { categories, employees, testShifts } from '@/lib/demo/testData'
import { useWidth } from '@/components/docs/width-context'
import {
  ChevronLeft, ChevronRight,
  AlignJustify, Columns, LayoutGrid, Grid,
  Plus,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type KView = 'day' | 'week' | 'month' | 'year'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function todayMidnight(): Date {
  const d = new Date(); d.setHours(0, 0, 0, 0); return d
}

function getWeekDates(anchor: Date): Date[] {
  const dow = anchor.getDay()
  const off = dow === 0 ? -6 : 1 - dow
  const mon = new Date(anchor); mon.setDate(anchor.getDate() + off); mon.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
}

// ─── Shared icon-button style ─────────────────────────────────────────────────

const iconBtn: React.CSSProperties = {
  padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)',
  background: 'transparent', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', color: 'var(--foreground)',
}

// ─── Today / Now calendar button ──────────────────────────────────────────────

function TodayBtn({ onClick }: { onClick: () => void }) {
  const today = new Date()
  return (
    <button onClick={onClick} title="Go to today" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, height: 44, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', cursor: 'pointer', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.04)', flexShrink: 0 }}>
      <span style={{ width: '100%', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 9, fontWeight: 700, textAlign: 'center', padding: '2px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{MONTHS_SHORT[today.getMonth()]}</span>
      <span style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>{today.getDate()}</span>
    </button>
  )
}

// ─── Date navigator ───────────────────────────────────────────────────────────

function DateNav({
  view, date, shifts, onNavigate,
}: { view: KView; date: Date; shifts: Block[]; onNavigate: (dir: number) => void }) {
  const rangeText = useMemo(() => {
    const y = date.getFullYear()
    if (view === 'day') return `${DAYS_SHORT[date.getDay()]}, ${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${y}`
    if (view === 'week') {
      const wd = getWeekDates(date); const s = wd[0]!; const e = wd[6]!
      if (s.getMonth() === e.getMonth()) return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${y}`
      return `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}, ${y}`
    }
    if (view === 'month') return `${MONTHS[date.getMonth()]} ${y}`
    return `${y}`
  }, [view, date])

  const eventCount = useMemo(() => {
    if (view === 'day') { const iso = toDateISO(date); return shifts.filter((s) => s.date === iso).length }
    if (view === 'week') { const isos = new Set(getWeekDates(date).map(toDateISO)); return shifts.filter((s) => isos.has(s.date)).length }
    if (view === 'month') { const y = date.getFullYear(); const m = date.getMonth(); return shifts.filter((s) => { const d = new Date(s.date + 'T12:00:00'); return d.getFullYear() === y && d.getMonth() === m }).length }
    return shifts.length
  }, [view, date, shifts])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gridTemplateRows: 'auto auto', alignItems: 'center', gap: '2px 8px' }}>
      <div style={{ gridColumn: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>
          {view === 'year' ? date.getFullYear() : MONTHS[date.getMonth()]} {view !== 'year' && date.getFullYear()}
        </span>
        <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted-foreground)', background: 'var(--muted)', borderRadius: 999, padding: '1px 7px', border: '1px solid var(--border)' }}>
          {eventCount} event{eventCount !== 1 ? 's' : ''}
        </span>
      </div>
      <div style={{ gridColumn: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        <button onClick={() => onNavigate(-1)} style={iconBtn} title="Previous"><ChevronLeft size={14} /></button>
        <span style={{ fontSize: 13, color: 'var(--foreground)', padding: '0 4px', minWidth: 180, textAlign: 'center' }}>{rangeText}</span>
        <button onClick={() => onNavigate(1)} style={iconBtn} title="Next"><ChevronRight size={14} /></button>
      </div>
    </div>
  )
}

// ─── View tabs (Day / Week / Month / Year) ────────────────────────────────────

const VIEW_TABS: { k: KView; l: string; Icon: React.ElementType }[] = [
  { k: 'day',   l: 'Day',   Icon: AlignJustify },
  { k: 'week',  l: 'Week',  Icon: Columns      },
  { k: 'month', l: 'Month', Icon: LayoutGrid   },
  { k: 'year',  l: 'Year',  Icon: Grid         },
]

function KanbanViewTabs({ view, setView }: { view: KView; setView: (v: KView) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--muted)', borderRadius: 8, padding: 4 }}>
      {VIEW_TABS.map(({ k, l, Icon }) => {
        const active = view === k
        return (
          <button key={k} onClick={() => setView(k)} title={l}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', cursor: 'pointer', height: 28, width: active ? 76 : 32, background: active ? 'var(--background)' : 'transparent', color: active ? 'var(--foreground)' : 'var(--muted-foreground)', boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 200ms ease', gap: 4, fontSize: 12, fontWeight: active ? 600 : 400, overflow: 'hidden' }}
          >
            <Icon size={14} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', maxWidth: active ? 44 : 0, opacity: active ? 1 : 0, transition: 'all 200ms ease', whiteSpace: 'nowrap' }}>{l}</span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Demo page ────────────────────────────────────────────────────────────────

export default function KanbanDemo() {
  const [mounted, setMounted] = useState(false)
  const [date, setDate] = useState<Date | null>(null)
  const [view, setView] = useState<KView>('week')
  const [shifts, setShifts] = useState<Block[]>(testShifts)
  const [selEmps, setSelEmps] = useState<Set<string>>(() => new Set(employees.map((e) => e.id)))
  const [headerAddOpen, setHeaderAddOpen] = useState(false)
  const [settingsOverride, setSettingsOverride] = useState<Partial<Settings>>({})
  const { fullWidth } = useWidth()
  const containerClass = fullWidth ? 'mx-auto w-full px-4 sm:px-6' : 'mx-auto max-w-7xl px-4 sm:px-6'

  const handleSettingsChange = useCallback((partial: Partial<Settings>) => {
    setSettingsOverride((prev) => ({ ...prev, ...partial }))
  }, [])

  const schedulerConfig = useMemo(
    () => createSchedulerConfig({
      snapMinutes: 30,
      defaultSettings: { rowMode: 'individual', ...settingsOverride },
    }),
    [settingsOverride]
  )

  useEffect(() => { setMounted(true); setDate(todayMidnight()) }, [])

  // Draft count for current view range
  const draftCount = useMemo(() => {
    if (!date) return 0
    if (view === 'day') { const iso = toDateISO(date); return shifts.filter((s) => s.date === iso && s.status === 'draft').length }
    if (view === 'week') { const isos = new Set(getWeekDates(date).map(toDateISO)); return shifts.filter((s) => isos.has(s.date) && s.status === 'draft').length }
    if (view === 'month') { const y = date.getFullYear(); const m = date.getMonth(); return shifts.filter((s) => { const d = new Date(s.date + 'T12:00:00'); return d.getFullYear() === y && d.getMonth() === m && s.status === 'draft' }).length }
    return shifts.filter((s) => s.status === 'draft').length
  }, [shifts, date, view])

  const navigate = useCallback((dir: number) => {
    setDate((prev) => {
      if (!prev) return prev
      const nd = new Date(prev)
      if (view === 'day')   nd.setDate(nd.getDate() + dir)
      if (view === 'week')  nd.setDate(nd.getDate() + dir * 7)
      if (view === 'month') nd.setMonth(nd.getMonth() + dir)
      if (view === 'year')  nd.setFullYear(nd.getFullYear() + dir)
      return nd
    })
  }, [view])

  const goToToday = useCallback(() => setDate(todayMidnight()), [])

  const toggleEmp = useCallback((empId: string) => {
    setSelEmps((prev) => { const next = new Set(prev); if (next.has(empId)) next.delete(empId); else next.add(empId); return next })
  }, [])

  const handlePublishAll = useCallback(() => {
    if (!date) return
    let isos: Set<string>
    if (view === 'day') isos = new Set([toDateISO(date)])
    else if (view === 'week') isos = new Set(getWeekDates(date).map(toDateISO))
    else isos = new Set(shifts.map((s) => s.date)) // month/year: all
    setShifts((prev) => prev.map((s) => isos.has(s.date) && s.status === 'draft' ? { ...s, status: 'published' as const } : s))
  }, [date, view, shifts])

  // Drill from year → month
  const handleMonthDrill = useCallback((y: number, m: number) => {
    const nd = new Date(y, m, 1); nd.setHours(0, 0, 0, 0)
    setDate(nd); setView('month')
  }, [])

  const filteredShifts = useMemo(() => shifts.filter((s) => selEmps.has(s.employeeId)), [shifts, selEmps])
  const weekDates = useMemo(() => date ? getWeekDates(date) : [], [date])

  if (!mounted || !date) {
    return (
      <div className={containerClass}>
        <div className="w-full rounded-lg border animate-pulse bg-muted"/>
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <SchedulerProvider categories={categories} employees={employees} config={schedulerConfig}>
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)' }}>

        {/* ── Header ── */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--border)', background: 'var(--background)', padding: '10px 0' }}>

          {/* Draft banner */}
          {draftCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--accent)', borderRadius: 8, padding: '6px 12px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-foreground)' }}>✎ {draftCount} shift{draftCount !== 1 ? 's' : ''} in draft — not visible to staff</span>
              <button onClick={handlePublishAll} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', cursor: 'pointer' }}>
                Publish all
              </button>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TodayBtn onClick={goToToday} />
              <DateNav view={view} date={date} shifts={filteredShifts} onNavigate={navigate} />
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <KanbanViewTabs view={view} setView={setView} />
              <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />
              <UserSelect
                selEmps={selEmps}
                onToggle={toggleEmp}
                onAll={() => setSelEmps(new Set(employees.map((e) => e.id)))}
                onNone={() => setSelEmps(new Set())}
              />
              <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />
              {/* Settings gear — same as demo/page.tsx */}
              <SchedulerSettings
                onSettingsChange={handleSettingsChange}
                shifts={filteredShifts}
              />
              <button
                onClick={() => setHeaderAddOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7, border: 'none', background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
              >
                <Plus size={15} /> Add Shift
              </button>
            </div>
          </div>
        </div>

        {/* ── Board ── */}
        <div className="w-full not-prose" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {view === 'day' ? (
            <DayView
              date={date}
              shifts={filteredShifts}
              setShifts={setShifts}
              selEmps={selEmps}
              onShiftClick={(block, _resource) => {}}
              onAddShift={(d, catId) => setHeaderAddOpen(true)}
              initialScrollToNow
              readOnly={false}
            />
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <KanbanView
                date={date}
                shifts={filteredShifts}
                setShifts={setShifts}
                mode={view}
                dates={view === 'week' ? weekDates : undefined}
                onMonthDrill={handleMonthDrill}
                onGoToDay={(d) => { setDate(d); setView('day') }}
              />
            </div>
          )}
        </div>

        </div>{/* end flex column */}
        {headerAddOpen && (
          <AddShiftModal
            date={date}
            onAdd={(block) => setShifts((prev) => [...prev, block])}
            onClose={() => setHeaderAddOpen(false)}
          />
        )}

      </SchedulerProvider>
    </div>
  )
}
