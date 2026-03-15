import React, { useEffect, useState } from "react"
import ReactDOM from "react-dom/client"
import {
  Scheduler,
  RosterActions,
  SchedulerSettings,
  type Shift,
} from "@sushill/shadcn-scheduler"
import "./index.css"
import { Sun, Moon, Calendar, CalendarDays, List, LayoutGrid, ZoomIn, Sparkles } from "lucide-react"
import {
  categories,
  employees,
  testShifts,
  smallCategories,
  smallEmployees,
  smallShifts,
} from "./testData"

/** Week (Mon–Sun) containing the given date; weekStart at 00:00, weekEnd at 23:59:59 */
function getWeekBounds(refDate: Date): { weekStart: Date; weekEnd: Date } {
  const d = new Date(refDate)
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  mon.setHours(0, 0, 0, 0)
  const weekStart = mon
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return { weekStart, weekEnd }
}

/** Verify category counts: run same logic as scheduler and log for comparison */
function verifyCategoryCounts(
  shifts: Shift[],
  refDate: Date,
  isWeekView: boolean,
  allEmployeeIds: Set<string>
) {
  let inRange: Shift[]
  if (isWeekView) {
    const { weekStart, weekEnd } = getWeekBounds(refDate)
    inRange = shifts.filter(
      (s) => allEmployeeIds.has(s.employeeId) && s.date >= weekStart && s.date <= weekEnd
    )
  } else {
    const dayStart = new Date(refDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    inRange = shifts.filter(
      (s) => allEmployeeIds.has(s.employeeId) && s.date >= dayStart && s.date <= dayEnd
    )
  }
  const byCategory = categories.map((cat) => ({
    name: cat.name,
    scheduled: inRange.filter((s) => s.categoryId === cat.id).length,
  }))
  const refLabel = refDate.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  console.log("[demo verify] expected category counts (refDate = start of today; compare with [scheduler] if same week)", {
    refDate: refLabel,
    isWeekView,
    totalShiftsInRange: inRange.length,
    byCategory,
  })
}

type DemoId = "full" | "day" | "month" | "year" | "list" | "minimal" | "prefetch"

const DEMOS: { id: DemoId; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "full", label: "Full Roster", icon: <CalendarDays size={18} />, description: "Week view with all features: copy week, publish drafts, settings, zoom." },
  { id: "day", label: "Day View", icon: <Calendar size={18} />, description: "Single-day focus. Zoom in to see 30-minute slots." },
  { id: "month", label: "Month View", icon: <LayoutGrid size={18} />, description: "Calendar month. Hover '+X more', click for day dialog. Double-click date → week." },
  { id: "year", label: "Year View", icon: <LayoutGrid size={18} />, description: "Year overview. Scheduled dates highlighted. Click month → month view." },
  { id: "list", label: "List View", icon: <List size={18} />, description: "Shifts in a list by day/week/month/year. Drag to reorder." },
  { id: "minimal", label: "Minimal", icon: <Sparkles size={18} />, description: "Small team, custom labels. No extra actions—just the scheduler." },
  { id: "prefetch", label: "Prefetching", icon: <ZoomIn size={18} />, description: "Buffer + onVisibleRangeChange. Last visible range shown below." },
]

function App() {
  const [currentDemo, setCurrentDemo] = useState<DemoId>("full")
  const [shifts, setShifts] = useState<Shift[]>(testShifts)
  const [smallShiftsState, setSmallShiftsState] = useState<Shift[]>(smallShifts)
  const [isDark, setIsDark] = useState(false)
  const [prefetchRange, setPrefetchRange] = useState<string | null>(null)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  // Verify category counts match scheduler logic (week of today, all employees selected)
  useEffect(() => {
    if (currentDemo !== "full") return
    const refDate = new Date()
    refDate.setHours(0, 0, 0, 0)
    const allEmpIds = new Set(employees.map((e) => e.id))
    verifyCategoryCounts(shifts, refDate, true, allEmpIds)
  }, [currentDemo, shifts])

  const handleVisibleRangeChange = (start: Date, end: Date) => {
    setPrefetchRange(`${start.toLocaleDateString()} – ${end.toLocaleDateString()}`)
  }

  const isSmallDemo = currentDemo === "minimal"
  const isPrefetchDemo = currentDemo === "prefetch"

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-background">
        <div>
          <h1 className="text-xl font-semibold">shadcn-scheduler Demo</h1>
          <p className="text-sm text-muted-foreground">
            {isSmallDemo
              ? `${smallShiftsState.length} shifts, ${smallEmployees.length} staff`
              : `${shifts.length} shifts, ${employees.length} staff`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex flex-wrap gap-1">
            {DEMOS.map((d) => (
              <button
                key={d.id}
                onClick={() => setCurrentDemo(d.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentDemo === d.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={d.description}
              >
                {d.icon}
                <span className="hidden sm:inline">{d.label}</span>
              </button>
            ))}
          </nav>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="px-2 py-2 bg-muted/30 border-b text-sm text-muted-foreground">
        <strong className="text-foreground">{DEMOS.find((d) => d.id === currentDemo)?.label}:</strong>{" "}
        {DEMOS.find((d) => d.id === currentDemo)?.description}
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {currentDemo === "full" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={categories}
              employees={employees}
              shifts={shifts}
              onShiftsChange={setShifts}
              initialView="week"
              headerActions={({ copyLastWeek, publishAllDrafts, draftCount }) => (
                <RosterActions
                  onCopyLastWeek={copyLastWeek}
                  onFillFromSchedules={() => alert("Connect your scheduling engine")}
                  onPublishAll={publishAllDrafts}
                  draftCount={draftCount}
                />
              )}
              footerSlot={({ onSettingsChange }) => (
                <SchedulerSettings onSettingsChange={onSettingsChange} />
              )}
            />
          </div>
        )}

        {currentDemo === "day" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={categories}
              employees={employees}
              shifts={shifts}
              onShiftsChange={setShifts}
              initialView="day"
              footerSlot={({ onSettingsChange }) => (
                <SchedulerSettings onSettingsChange={onSettingsChange} />
              )}
            />
          </div>
        )}

        {currentDemo === "month" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={categories}
              employees={employees}
              shifts={shifts}
              onShiftsChange={setShifts}
              initialView="month"
              footerSlot={({ onSettingsChange }) => (
                <SchedulerSettings onSettingsChange={onSettingsChange} />
              )}
            />
          </div>
        )}

        {currentDemo === "year" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={categories}
              employees={employees}
              shifts={shifts}
              onShiftsChange={setShifts}
              initialView="year"
            />
          </div>
        )}

        {currentDemo === "list" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={categories}
              employees={employees}
              shifts={shifts}
              onShiftsChange={setShifts}
              initialView="list"
              footerSlot={({ onSettingsChange }) => (
                <SchedulerSettings onSettingsChange={onSettingsChange} />
              )}
            />
          </div>
        )}

        {currentDemo === "minimal" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={smallCategories}
              employees={smallEmployees}
              shifts={smallShiftsState}
              onShiftsChange={setSmallShiftsState}
              initialView="week"
              config={{
                labels: { category: "Role", employee: "Team member", addShift: "Add shift" },
                defaultSettings: { visibleFrom: 8, visibleTo: 20 },
              }}
            />
          </div>
        )}

        {currentDemo === "prefetch" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <Scheduler
                categories={categories}
                employees={employees}
                shifts={shifts}
                onShiftsChange={setShifts}
                initialView="week"
                bufferDays={7}
                prefetchThreshold={0.75}
                onVisibleRangeChange={handleVisibleRangeChange}
                footerSlot={({ onSettingsChange }) => (
                  <SchedulerSettings onSettingsChange={onSettingsChange} />
                )}
              />
            </div>
            <div className="border-t px-4 py-2 bg-muted/40 text-sm">
              <strong>Last visible range (prefetch callback):</strong>{" "}
              {prefetchRange ?? "Scroll near the edge to trigger"}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
