import React, { useEffect, useState, useCallback } from "react"
import ReactDOM from "react-dom/client"
import {
  Scheduler,
  RosterActions,
  SchedulerSettings,
  createSchedulerConfig,
  toDateISO,
  type Block,
} from "@sushill/shadcn-scheduler"
import "./index.css"
import {
  Sun,
  Moon,
  Calendar,
  CalendarDays,
  List,
  LayoutGrid,
  ZoomIn,
  Sparkles,
  Home,
} from "lucide-react"
import {
  categories,
  employees,
  testShifts,
  smallCategories,
  smallEmployees,
  smallShifts,
} from "./testData"

/** Week (Mon–Sun) containing the given date */
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

function verifyCategoryCounts(
  shifts: Block[],
  refDate: Date,
  isWeekView: boolean,
  allEmployeeIds: Set<string>
) {
  let inRange: Block[]
  if (isWeekView) {
    const { weekStart, weekEnd } = getWeekBounds(refDate)
    const weekStartISO = toDateISO(weekStart)
    const weekEndISO = toDateISO(weekEnd)
    inRange = shifts.filter(
      (s) => allEmployeeIds.has(s.employeeId) && s.date >= weekStartISO && s.date <= weekEndISO
    )
  } else {
    const dayStart = new Date(refDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    const dayStartISO = toDateISO(dayStart)
    const dayEndISO = toDateISO(dayEnd)
    inRange = shifts.filter(
      (s) => allEmployeeIds.has(s.employeeId) && s.date >= dayStartISO && s.date <= dayEndISO
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
  console.log("[demo verify] expected category counts", {
    refDate: refLabel,
    isWeekView,
    totalShiftsInRange: inRange.length,
    byCategory,
  })
}

export type DemoId =
  | "full"
  | "day"
  | "month"
  | "year"
  | "list"
  | "minimal"
  | "prefetch"
  | "tv"

const DEMO_IDS: DemoId[] = [
  "full",
  "day",
  "month",
  "year",
  "list",
  "minimal",
  "prefetch",
  "tv",
]

const DEMOS: {
  id: DemoId
  label: string
  icon: React.ReactNode
  description: string
  path: string
}[] = [
  {
    id: "full",
    label: "Full Roster",
    icon: <CalendarDays size={18} />,
    description:
      "Week view with all features: copy week, publish drafts, settings, zoom.",
    path: "/full",
  },
  {
    id: "day",
    label: "Day View",
    icon: <Calendar size={18} />,
    description: "Single-day focus. Zoom in to see 30-minute slots.",
    path: "/day",
  },
  {
    id: "month",
    label: "Month View",
    icon: <LayoutGrid size={18} />,
    description:
      "Calendar month. Hover '+X more', click for day dialog. Double-click date → week.",
    path: "/month",
  },
  {
    id: "year",
    label: "Year View",
    icon: <LayoutGrid size={18} />,
    description: "Year overview. Scheduled dates highlighted. Click month → month view.",
    path: "/year",
  },
  {
    id: "list",
    label: "List View",
    icon: <List size={18} />,
    description: "Shifts in a list by day/week/month/year. Drag to reorder.",
    path: "/list",
  },
  {
    id: "minimal",
    label: "Minimal",
    icon: <Sparkles size={18} />,
    description: "Small team, custom labels. No extra actions—just the scheduler.",
    path: "/minimal",
  },
  {
    id: "prefetch",
    label: "Prefetching",
    icon: <ZoomIn size={18} />,
    description:
      "Buffer + onVisibleRangeChange. Last visible range shown below.",
    path: "/prefetch",
  },
  {
    id: "tv",
    label: "TV Preset",
    icon: <LayoutGrid size={18} />,
    description:
      "Preset: Channel/Program labels, 24h range, timeline view, scroll-to-now.",
    path: "/tv",
  },
]

const DEFAULT_DEMO: DemoId = "full"

/** Base path for the app (e.g. /scheduler/ on GitHub Pages). Must match Vite base. */
const BASE = typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
  ? import.meta.env.BASE_URL
  : "/"

/** Parse location (pathname or hash) to demo id. Hash in dev (#/tv), pathname on GitHub Pages (/scheduler/tv). */
function getDemoIdFromLocation(): DemoId {
  if (typeof window === "undefined") return DEFAULT_DEMO
  if (BASE !== "/") {
    const pathname = window.location.pathname
    const basePath = BASE.replace(/\/$/, "")
    const pathAfterBase = pathname.replace(new RegExp("^" + basePath.replace(/\//g, "\\/") + "\\/?"), "").split("/")[0] || ""
    if (pathAfterBase && DEMO_IDS.includes(pathAfterBase as DemoId)) return pathAfterBase as DemoId
  }
  const raw = window.location.hash
  const path = raw.slice(1).replace(/^\/+/, "").toLowerCase() || ""
  const id = path ? (path as DemoId) : DEFAULT_DEMO
  return DEMO_IDS.includes(id) ? id : DEFAULT_DEMO
}

/** Hash/path-based routing for GitHub Pages. Each demo has its own URL (#/tv or /scheduler/tv). */
function useHashRoute(): [DemoId, (id: DemoId) => void] {
  const [demoId, setDemoId] = useState<DemoId>(() => getDemoIdFromLocation())

  const setRoute = useCallback((id: DemoId) => {
    const path = DEMOS.find((d) => d.id === id)?.path ?? "/full"
    if (typeof window === "undefined") {
      setDemoId(id)
      return
    }
    if (BASE === "/") {
      const hash = "#" + path
      if (window.location.hash !== hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search + hash)
      }
    } else {
      const basePath = BASE.replace(/\/$/, "")
      const newUrl = window.location.origin + basePath + path + window.location.search
      if (window.location.pathname + window.location.hash !== basePath + path && window.history.replaceState) {
        window.history.replaceState(null, "", newUrl)
      }
    }
    setDemoId(id)
  }, [])

  useEffect(() => {
    const onHashChange = () => setDemoId(getDemoIdFromLocation())
    const onPopState = () => setDemoId(getDemoIdFromLocation())
    window.addEventListener("hashchange", onHashChange)
    window.addEventListener("popstate", onPopState)
    return () => {
      window.removeEventListener("hashchange", onHashChange)
      window.removeEventListener("popstate", onPopState)
    }
  }, [])

  return [demoId, setRoute]
}

function App() {
  const [currentDemo, setCurrentDemo] = useHashRoute()
  const [shifts, setShifts] = useState<Block[]>(testShifts)
  const [smallShiftsState, setSmallShiftsState] = useState<Block[]>(smallShifts)
  const [isDark, setIsDark] = useState(false)
  const [prefetchRange, setPrefetchRange] = useState<string | null>(null)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

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

  const isSmallDemo = currentDemo === "minimal" || currentDemo === "tv"
  const currentMeta = DEMOS.find((d) => d.id === currentDemo)

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-background">
        <div className="flex items-center gap-3">
          <a
            href={BASE === "/" ? "#/full" : BASE.replace(/\/$/, "") + "/full"}
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            title="Demo home"
          >
            <Home size={22} />
            <div>
              <h1 className="text-xl font-semibold">shadcn-scheduler Demo</h1>
              <p className="text-sm text-muted-foreground">
                {isSmallDemo
                  ? `${smallShiftsState.length} shifts, ${smallEmployees.length} staff`
                  : `${shifts.length} shifts, ${employees.length} staff`}
              </p>
            </div>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex flex-wrap gap-1" aria-label="Demo pages">
            {DEMOS.map((d) => {
              const href = BASE === "/" ? "#" + d.path : BASE.replace(/\/$/, "") + d.path
              const isActive = currentDemo === d.id
              return (
                <a
                  key={d.id}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrentDemo(d.id)
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={d.description}
                >
                  {d.icon}
                  <span className="hidden sm:inline">{d.label}</span>
                </a>
              )
            })}
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

      <div className="px-4 py-2 bg-muted/30 border-b text-sm text-muted-foreground">
        <strong className="text-foreground">{currentMeta?.label}:</strong>{" "}
        {currentMeta?.description}
      </div>

      <main className="flex-1 min-h-0 flex flex-col" role="main">
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
                labels: {
                  category: "Role",
                  employee: "Team member",
                  addShift: "Add shift",
                },
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

        {currentDemo === "tv" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={smallCategories}
              employees={smallEmployees}
              shifts={smallShiftsState}
              onShiftsChange={setSmallShiftsState}
              config={createSchedulerConfig({ preset: "tv" })}
              initialView="timeline"
            />
          </div>
        )}
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
