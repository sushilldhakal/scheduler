'use client'
/**
 * Demonstrates using individual @shadcn-scheduler/* packages directly,
 * WITHOUT the fat @shadcn-scheduler/scheduler bundle.
 *
 * Imports:
 *   SchedulerProvider  ← @shadcn-scheduler/shell
 *   MonthView          ← @shadcn-scheduler/view-month
 *   YearView           ← @shadcn-scheduler/view-year
 *   ListView           ← @shadcn-scheduler/view-list
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { SchedulerProvider } from '@shadcn-scheduler/shell'
import { MonthView } from '@shadcn-scheduler/view-month'
import { YearView } from '@shadcn-scheduler/view-year'
import { ListView } from '@shadcn-scheduler/view-list'
import type { Block, Resource, SchedulerConfig } from '@shadcn-scheduler/core'
import { categories, employees, testShifts } from '@/lib/demo/testData'
import { DemoShell } from '../_demoShell'

const VIEWS = ['month', 'year', 'list'] as const
type View = typeof VIEWS[number]

const config: SchedulerConfig = {
  snapMinutes: 30,
  defaultSettings: { visibleFrom: 6, visibleTo: 22 },
}

export default function PackagesRawDemo() {
  const [mounted, setMounted]   = useState(false)
  const [view, setView]         = useState<View>('month')
  const [date, setDate]         = useState<Date>(new Date())
  const [shifts, setShifts]     = useState<Block[]>(testShifts.slice(0, 40))

  useEffect(() => { setMounted(true) }, [])

  const handleMonthClick = useCallback((year: number, month: number) => {
    setDate(new Date(year, month, 1))
    setView('month')
  }, [])

  const handleShiftClick = useCallback((_block: Block, _resource: Resource) => {}, [])

  const handleAddShift = useCallback(
    (d: Date, categoryId?: string | null) => {
      const cat = categories.find((c) => c.id === categoryId) ?? categories[0]
      if (!cat) return
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      setShifts((prev) => [
        ...prev,
        { id: `new_${Date.now()}`, categoryId: cat.id, employeeId: '', employee: '', date: iso, startH: 9, endH: 17, status: 'draft' },
      ])
    },
    []
  )

  const handlePublish = useCallback((...ids: string[]) => {
    setShifts((prev) => prev.map((s) => ids.includes(s.id) ? { ...s, status: 'published' } : s))
  }, [])

  const handleUnpublish = useCallback((id: string) => {
    setShifts((prev) => prev.map((s) => s.id === id ? { ...s, status: 'draft' } : s))
  }, [])

  return (
    <DemoShell
      title="Individual Packages (no bundle)"
      description="SchedulerProvider + MonthView / YearView / ListView — imported separately for tree-shaking"
      docsHref="/docs/packages"
    >
      {/* Package import badges */}
      <div className="shrink-0 flex flex-wrap gap-1.5 py-2 border-b border-border">
        {[
          '@shadcn-scheduler/shell',
          `@shadcn-scheduler/view-${view}`,
          '@shadcn-scheduler/core',
        ].map((pkg) => (
          <span
            key={pkg}
            className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono text-blue-700 dark:text-blue-400"
          >
            {pkg}
          </span>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center">
          Only the active view package is imported
        </span>
      </div>

      {/* View switcher */}
      <div className="shrink-0 flex gap-1 py-2 border-b border-border">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              view === v
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {mounted ? (
          <SchedulerProvider
            categories={categories}
            employees={employees}
            config={config}
          >
            {view === 'month' && (
              <MonthView
                date={date}
                shifts={shifts}
                setShifts={setShifts}
                onShiftClick={handleShiftClick}
                onAddShift={handleAddShift}
              />
            )}
            {view === 'year' && (
              <YearView
                date={date}
                shifts={shifts}
                onMonthClick={handleMonthClick}
              />
            )}
            {view === 'list' && (
              <ListView
                shifts={shifts}
                setShifts={setShifts}
                onShiftClick={handleShiftClick}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onAddShift={handleAddShift}
                currentDate={date}
                view="weeklist"
              />
            )}
          </SchedulerProvider>
        ) : (
          <div className="w-full h-full animate-pulse bg-muted rounded" />
        )}
      </div>

      {/* Code snippet */}
      <div className="shrink-0 border-t border-border bg-muted/30">
        <details className="group">
          <summary className="cursor-pointer px-4 py-2 text-xs text-muted-foreground hover:text-foreground select-none list-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            View source snippet for current view
          </summary>
          <pre className="overflow-x-auto px-4 pb-3 text-[11px] font-mono text-foreground leading-relaxed">
            <code>{getCodeSnippet(view)}</code>
          </pre>
        </details>
      </div>
    </DemoShell>
  )
}

function getCodeSnippet(view: View): string {
  const imports: Record<View, string> = {
    month: `import { MonthView } from '@shadcn-scheduler/view-month'`,
    year:  `import { YearView }  from '@shadcn-scheduler/view-year'`,
    list:  `import { ListView }  from '@shadcn-scheduler/view-list'`,
  }
  const jsx: Record<View, string> = {
    month: `<MonthView date={date} shifts={shifts} setShifts={setShifts} onAddShift={handleAdd} />`,
    year:  `<YearView date={date} shifts={shifts} onMonthClick={handleMonthClick} />`,
    list:  `<ListView shifts={shifts} setShifts={setShifts} onPublish={handlePublish} currentDate={date} view="weeklist" />`,
  }
  return `import { SchedulerProvider } from '@shadcn-scheduler/shell'
${imports[view]}
import type { SchedulerConfig } from '@shadcn-scheduler/core'

const config: SchedulerConfig = { snapMinutes: 30 }

<SchedulerProvider categories={categories} employees={employees} config={config}>
  ${jsx[view]}
</SchedulerProvider>`
}
