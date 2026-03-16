"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Scheduler,
  RosterActions,
  SchedulerSettings,
  createSchedulerConfig,
  type Block,
} from "@sushill/shadcn-scheduler";
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
} from "lucide-react";
import {
  categories,
  employees,
  smallCategories,
  smallEmployees,
  perfCategories,
  perfEmployees,
  perfShifts,
  testShifts,
  smallShifts,
} from "@/lib/demo/testData";

export type DemoId =
  | "full"
  | "day"
  | "month"
  | "year"
  | "list"
  | "minimal"
  | "prefetch"
  | "tv";

const DEMO_IDS: DemoId[] = [
  "full", "day", "month", "year", "list", "minimal", "prefetch", "tv",
];

const DEMOS: {
  id: DemoId;
  label: string;
  icon: React.ReactNode;
  description: string;
  path: string;
}[] = [
  { id: "full", label: "Full Roster", icon: <CalendarDays size={18} />, description: "Week view with all features: copy week, publish drafts, settings, zoom.", path: "/full" },
  { id: "day", label: "Day View", icon: <Calendar size={18} />, description: "Single-day focus. Zoom in to see 30-minute slots.", path: "/day" },
  { id: "month", label: "Month View", icon: <LayoutGrid size={18} />, description: "Calendar month. Hover '+X more', click for day dialog. Double-click date → week.", path: "/month" },
  { id: "year", label: "Year View", icon: <LayoutGrid size={18} />, description: "Year overview. Scheduled dates highlighted. Click month → month view.", path: "/year" },
  { id: "list", label: "List View", icon: <List size={18} />, description: "Shifts in a list by day/week/month/year. Drag to reorder.", path: "/list" },
  { id: "minimal", label: "Minimal", icon: <Sparkles size={18} />, description: "Small team, custom labels. No extra actions—just the scheduler.", path: "/minimal" },
  { id: "prefetch", label: "Prefetching", icon: <ZoomIn size={18} />, description: "Buffer + onVisibleRangeChange. Last visible range shown below.", path: "/prefetch" },
  { id: "tv", label: "TV Preset", icon: <LayoutGrid size={18} />, description: "Preset: Channel/Program labels, 24h range, timeline view, scroll-to-now.", path: "/tv" },
];

const DEFAULT_DEMO: DemoId = "full";

function getDemoIdFromPathname(pathname: string): DemoId {
  const segment = pathname.replace(/^\/demo\/?/, "").split("/")[0] || "";
  if (segment && DEMO_IDS.includes(segment as DemoId)) return segment as DemoId;
  return DEFAULT_DEMO;
}

function useDemoRoute(): [DemoId, (id: DemoId) => void] {
  const pathname = usePathname();
  const router = useRouter();
  const demoId = getDemoIdFromPathname(pathname ?? "/demo");

  const setRoute = useCallback(
    (id: DemoId) => {
      const path = DEMOS.find((d) => d.id === id)?.path ?? "/full";
      const newPath = `/demo${path}`;
      if (pathname !== newPath) router.push(newPath);
    },
    [pathname, router]
  );

  return [demoId, setRoute];
}

const isPerfMode =
  typeof window !== "undefined" && window.location.search.includes("perf=true");

export default function DemoPage() {
  const [currentDemo, setCurrentDemo] = useDemoRoute();
  const [shifts, setShifts] = useState<Block[]>(() => (isPerfMode ? perfShifts : testShifts));
  const [smallShiftsState, setSmallShiftsState] = useState<Block[]>(smallShifts);
  const [isDark, setIsDark] = useState(false);
  const [prefetchRange, setPrefetchRange] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setIsDark(localStorage.getItem("scheduler-demo-theme") === "dark");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("scheduler-demo-theme", isDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [isDark]);

  const handleVisibleRangeChange = (start: Date, end: Date) => {
    setPrefetchRange(`${start.toLocaleDateString()} – ${end.toLocaleDateString()}`);
  };

  const demoCategories = isPerfMode && currentDemo === "full" ? perfCategories : categories;
  const demoEmployees = isPerfMode && currentDemo === "full" ? perfEmployees : employees;
  const isSmallDemo = currentDemo === "minimal" || currentDemo === "tv";
  const currentMeta = DEMOS.find((d) => d.id === currentDemo);

  return (
    <div className="min-h-screen h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <header className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-background">
        <div className="flex items-center gap-3">
          <a
            href="/demo"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
            title="Demo home"
          >
            <Home size={22} />
            <div>
              <h1 className="text-xl font-semibold">shadcn-scheduler Demo</h1>
              <p className="text-sm text-muted-foreground">
                {isPerfMode && currentDemo === "full"
                  ? `Perf: ${shifts.length} shifts, ${demoEmployees.length} staff`
                  : isSmallDemo
                    ? `${smallShiftsState.length} shifts, ${smallEmployees.length} staff`
                    : `${shifts.length} shifts, ${employees.length} staff`}
              </p>
            </div>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <nav className="flex flex-wrap gap-1" aria-label="Demo pages">
            {DEMOS.map((d) => {
              const href = `/demo${d.path}`;
              const isActive = currentDemo === d.id;
              return (
                <Link
                  key={d.id}
                  href={href}
                  onClick={() => setCurrentDemo(d.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  title={d.description}
                >
                  <>{d.icon}</>
                  <span className="hidden sm:inline">{d.label}</span>
                </Link>
              );
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

      <main className="flex-1 min-h-0 flex flex-col overflow-auto" role="main">
        {currentDemo === "full" && (
          <div className="flex-1 min-h-0">
            <Scheduler
              categories={demoCategories}
              employees={demoEmployees}
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
              footerSlot={(ctx) => <SchedulerSettings {...ctx} />}
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
              footerSlot={(ctx) => <SchedulerSettings {...ctx} />}
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
              footerSlot={(ctx) => <SchedulerSettings {...ctx} />}
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
              footerSlot={(ctx) => <SchedulerSettings {...ctx} />}
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
                footerSlot={(ctx) => <SchedulerSettings {...ctx} />}
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
      <footer className="shrink-0 border-t border-border px-4 py-2 flex items-center justify-center gap-4 text-sm text-muted-foreground bg-muted/30">
        <a
          href="https://github.com/sushilldhakal/scheduler"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline"
        >
          View source
        </a>
      </footer>
    </div>
  );
}
