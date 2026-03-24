'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Scheduler,
  type Block,
  type SchedulerConfig,
} from '@shadcn-scheduler/scheduler'
import { categories, employees, testShifts } from '@/lib/demo/testData'
import { DemoShell } from '../_demoShell'
import { Package, Layers, Puzzle, Zap } from 'lucide-react'

const config: SchedulerConfig = {
  snapMinutes: 30,
  defaultSettings: { visibleFrom: 6, visibleTo: 22 },
}

const PKG_BADGES = [
  { pkg: '@shadcn-scheduler/scheduler',    color: 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400',  label: 'scheduler' },
  { pkg: '@shadcn-scheduler/shell',        color: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400',           label: 'shell' },
  { pkg: '@shadcn-scheduler/view-month',   color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400', label: 'view-month' },
  { pkg: '@shadcn-scheduler/view-year',    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400', label: 'view-year' },
  { pkg: '@shadcn-scheduler/view-list',    color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400', label: 'view-list' },
  { pkg: '@shadcn-scheduler/core',         color: 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',       label: 'core' },
]

const TABS = [
  { id: 'demo',     label: 'Live Demo',     icon: Zap },
  { id: 'packages', label: 'Package Map',   icon: Layers },
  { id: 'usage',    label: 'Usage',         icon: Package },
]

export default function PackagesDemo() {
  const [mounted, setMounted]   = useState(false)
  const [shifts, setShifts]     = useState<Block[]>(testShifts.slice(0, 40))
  const [tab, setTab]           = useState<'demo' | 'packages' | 'usage'>('demo')

  useEffect(() => { setMounted(true) }, [])

  return (
    <DemoShell
      title="New Modular Packages"
      description="@shadcn-scheduler/* monorepo — pick only the packages you need"
      docsHref="/docs/packages"
    >
      {/* Tab bar */}
      <div className="shrink-0 flex gap-1 border-b border-border py-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-1.5 items-center">
          {PKG_BADGES.map(({ label, color }) => (
            <span key={label} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Demo tab */}
      {tab === 'demo' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="shrink-0 py-2 text-xs text-muted-foreground">
            This demo uses <code className="rounded bg-muted px-1 py-0.5">@shadcn-scheduler/scheduler</code> — the backward-compatible fat bundle that re-exports all views and plugins.
            Switch to <strong>Month</strong>, <strong>Year</strong>, or <strong>List</strong> to see the modular views.
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {mounted ? (
              <Scheduler
                categories={categories}
                employees={employees}
                shifts={shifts}
                onShiftsChange={setShifts}
                initialView="month"
                config={config}
              />
            ) : (
              <div className="w-full h-full animate-pulse bg-muted rounded" />
            )}
          </div>
        </div>
      )}

      {/* Package map tab */}
      {tab === 'packages' && (
        <div className="flex-1 overflow-auto py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Core */}
            <PackageCard
              name="@shadcn-scheduler/core"
              color="amber"
              icon="⚙️"
              description="Pure TypeScript engine — types, constants, utilities, packing algorithm, recurrence expander. Zero React dependency."
              exports={['Block', 'Resource', 'Settings', 'RecurrenceRule', 'sameDay', 'toDateISO', 'fmt12', 'getWeekDates', 'packShifts', 'expandRecurrence']}
            />
            {/* Shell */}
            <PackageCard
              name="@shadcn-scheduler/shell"
              color="blue"
              icon="🐚"
              description="React context + SchedulerProvider + plugin registration. All view packages consume this context."
              exports={['SchedulerProvider', 'useSchedulerContext', 'PluginManager', 'SlotRenderer']}
            />
            {/* Views */}
            <PackageCard
              name="@shadcn-scheduler/view-month"
              color="emerald"
              icon="📅"
              description="Full month calendar with shift pills, staff panel, and day-shifts dialog."
              exports={['MonthView']}
              status="ready"
            />
            <PackageCard
              name="@shadcn-scheduler/view-year"
              color="emerald"
              icon="📆"
              description="Year overview with shift-count heatmap per day and month-click to drill down."
              exports={['YearView']}
              status="ready"
            />
            <PackageCard
              name="@shadcn-scheduler/view-list"
              color="emerald"
              icon="📋"
              description="Tabular list view with week / day grouping, publish actions, and add-shift support."
              exports={['ListView']}
              status="ready"
            />
            <PackageCard
              name="@shadcn-scheduler/view-day"
              color="emerald"
              icon="🗓️"
              description="Single-day grid with per-employee rows."
              exports={['DayView']}
              status="beta"
            />
            <PackageCard
              name="@shadcn-scheduler/view-week"
              color="emerald"
              icon="🗓️"
              description="7-day grid view with horizontal scroll."
              exports={['WeekView']}
              status="beta"
            />
            <PackageCard
              name="@shadcn-scheduler/view-timeline"
              color="emerald"
              icon="⏱️"
              description="Horizontal Gantt-style timeline across multiple days."
              exports={['TimelineView']}
              status="beta"
            />
            <PackageCard
              name="@shadcn-scheduler/view-kanban"
              color="emerald"
              icon="🔲"
              description="Kanban board grouped by category."
              exports={['KanbanView']}
              status="beta"
            />
            {/* Plugins */}
            <PackageCard
              name="@shadcn-scheduler/plugin-audit"
              color="rose"
              icon="📋"
              description="Tracks every create/move/resize/delete action with a timestamped audit trail."
              exports={['useAuditTrail', 'AuditEntry']}
            />
            <PackageCard
              name="@shadcn-scheduler/plugin-recurrence"
              color="rose"
              icon="🔁"
              description="Expands recurring shift rules (RRULE-style) into concrete Block instances."
              exports={['expandRecurrence', 'RecurrenceRule']}
            />
            <PackageCard
              name="@shadcn-scheduler/plugin-export"
              color="rose"
              icon="📤"
              description="Export shifts to CSV, ICS (iCalendar), PNG image, or PDF."
              exports={['exportToCSV', 'exportToICS', 'exportToImage', 'exportToPDF']}
            />
            <PackageCard
              name="@shadcn-scheduler/plugin-markers"
              color="rose"
              icon="📍"
              description="Draggable vertical marker lines for deadlines and events on the grid."
              exports={['useMarkers', 'SchedulerMarker']}
            />
            <PackageCard
              name="@shadcn-scheduler/plugin-dependencies"
              color="rose"
              icon="🔗"
              description="SVG curved arrows showing shift handover dependencies between blocks."
              exports={['useDependencies', 'ShiftDependency']}
            />
            <PackageCard
              name="@shadcn-scheduler/plugin-histogram"
              color="rose"
              icon="📊"
              description="Resource utilization histogram — hours-worked vs capacity bar chart."
              exports={['useHistogram', 'ResourceHistogram', 'HistogramConfig']}
            />
            <PackageCard
              name="@shadcn-scheduler/plugin-availability"
              color="rose"
              icon="🕐"
              description="Employee availability windows — striped overlays for unavailable hours."
              exports={['useAvailability', 'detectConflicts', 'EmployeeAvailability']}
            />
            {/* Presets */}
            <PackageCard
              name="@shadcn-scheduler/preset-tv"
              color="purple"
              icon="📺"
              description="EPG / TV guide config — midnight-to-midnight, 15-min snap, packed wall-to-wall."
              exports={['createTvConfig']}
            />
            <PackageCard
              name="@shadcn-scheduler/preset-healthcare"
              color="purple"
              icon="🏥"
              description="Hospital rota config — 24hr, overnight shifts, ward-based categories."
              exports={['createHealthcareConfig']}
            />
            <PackageCard
              name="@shadcn-scheduler/preset-conference"
              color="purple"
              icon="🎤"
              description="Conference schedule config — room-based categories, 30-min sessions."
              exports={['createConferenceConfig']}
            />
            {/* Scheduler bundle */}
            <PackageCard
              name="@shadcn-scheduler/scheduler"
              color="violet"
              icon="📦"
              description="Fat backward-compatible bundle. Composes all packages into a single Scheduler component matching the original API."
              exports={['Scheduler', '...all re-exports']}
            />
          </div>
        </div>
      )}

      {/* Usage tab */}
      {tab === 'usage' && (
        <div className="flex-1 overflow-auto py-4 space-y-6 text-sm">
          <UsageSection
            title="Option 1 — Fat bundle (drop-in replacement)"
            description="Use the backward-compatible package. Same API as @sushill/shadcn-scheduler."
            code={`import { Scheduler } from '@shadcn-scheduler/scheduler'

<Scheduler
  categories={categories}
  employees={employees}
  shifts={shifts}
  onShiftsChange={setShifts}
  initialView="month"
/>`}
          />
          <UsageSection
            title="Option 2 — Individual view packages (tree-shakeable)"
            description="Import only the views you need. Wrap with SchedulerProvider from shell."
            code={`import { SchedulerProvider } from '@shadcn-scheduler/shell'
import { MonthView }  from '@shadcn-scheduler/view-month'
import { ListView }   from '@shadcn-scheduler/view-list'

<SchedulerProvider categories={categories} employees={employees} config={config}>
  <MonthView
    date={currentDate}
    shifts={shifts}
    setShifts={setShifts}
    onShiftClick={handleClick}
    onAddShift={handleAdd}
  />
</SchedulerProvider>`}
          />
          <UsageSection
            title="Option 3 — Core utilities only (no React)"
            description="Use pure computation utilities without any React dependency."
            code={`import { packShifts, expandRecurrence, sameDay, fmt12 } from '@shadcn-scheduler/core'

const { conflicts, utilization } = packShifts(blocks, resources)

const expanded = expandRecurrence(templateBlock, {
  freq: 'daily',
  interval: 1,
  until: '2026-12-31',
})`}
          />
          <UsageSection
            title="Option 4 — Add individual plugins"
            description="Each plugin is a separate package. Add only what you use."
            code={`import { useAuditTrail }   from '@shadcn-scheduler/plugin-audit'
import { expandRecurrence } from '@shadcn-scheduler/plugin-recurrence'
import { exportToCSV }      from '@shadcn-scheduler/plugin-export'
import { useMarkers }       from '@shadcn-scheduler/plugin-markers'

// Inside your component:
const { log, onEvent } = useAuditTrail()
const csv = exportToCSV(shifts, categories)`}
          />
          <UsageSection
            title="Option 5 — Preset configs"
            description="Start with a domain-specific configuration factory."
            code={`import { createTvConfig }          from '@shadcn-scheduler/preset-tv'
import { createHealthcareConfig }  from '@shadcn-scheduler/preset-healthcare'
import { createConferenceConfig }  from '@shadcn-scheduler/preset-conference'

const config = createHealthcareConfig({
  defaultSettings: { visibleFrom: 0, visibleTo: 24 },
  snapMinutes: 30,
})`}
          />
        </div>
      )}
    </DemoShell>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

type PkgColor = 'amber' | 'blue' | 'emerald' | 'rose' | 'purple' | 'violet'
const colorMap: Record<PkgColor, { border: string; badge: string; dot: string }> = {
  amber:   { border: 'border-amber-500/30',   badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',    dot: 'bg-amber-500' },
  blue:    { border: 'border-blue-500/30',    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',       dot: 'bg-blue-500' },
  emerald: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  rose:    { border: 'border-rose-500/30',    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',       dot: 'bg-rose-500' },
  purple:  { border: 'border-purple-500/30',  badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-400', dot: 'bg-purple-500' },
  violet:  { border: 'border-violet-500/30',  badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-400', dot: 'bg-violet-500' },
}

function PackageCard({
  name, color, icon, description, exports: exps, status,
}: {
  name: string
  color: PkgColor
  icon: string
  description: string
  exports: string[]
  status?: 'ready' | 'beta'
}) {
  const c = colorMap[color]
  return (
    <div className={`rounded-lg border ${c.border} bg-card p-4 flex flex-col gap-2`}>
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-semibold text-foreground truncate">{name}</p>
          {status && (
            <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-px rounded-full font-medium ${
              status === 'ready'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
            }`}>
              {status === 'ready' ? '✓ ready' : '⚡ beta'}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-1 mt-auto pt-1">
        {exps.map((e) => (
          <span key={e} className={`inline-block rounded px-1.5 py-px text-[10px] font-mono ${c.badge}`}>
            {e}
          </span>
        ))}
      </div>
    </div>
  )
}

function UsageSection({ title, description, code }: { title: string; description: string; code: string }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <pre className="p-4 text-xs text-foreground overflow-x-auto font-mono leading-relaxed bg-background">
        <code>{code}</code>
      </pre>
    </div>
  )
}
