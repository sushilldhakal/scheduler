import React from "react"
import { Button } from "./ui/button"
import { cn } from "../lib/utils"
import type { ViewKey } from "../types"
import {
  LayoutGrid,
  List,
  Columns,
  Grid,
  AlignJustify,
  GanttChart,
  type LucideIcon,
} from "lucide-react"

interface ViewTab {
  k: string
  l: string
  Icon: LucideIcon
}

const VIEW_TABS: readonly ViewTab[] = [
  { k: "day", l: "Day", Icon: AlignJustify },
  { k: "week", l: "Week", Icon: Columns },
  { k: "month", l: "Month", Icon: LayoutGrid },
  { k: "year", l: "Year", Icon: Grid },
  { k: "timeline", l: "Timeline", Icon: GanttChart },
]

interface ViewTabsProps {
  view: string
  setView: (view: string) => void
  /** Per-view visibility. false = hide tab. If absent, all views are shown. */
  views?: Partial<Record<ViewKey, boolean>>
}

export function ViewTabs({ view, setView, views }: ViewTabsProps): React.ReactElement {
  const isGrid = !view.startsWith("list")
  const base = view.replace("list", "") || "day"

  const tabsToShow = views
    ? VIEW_TABS.filter((t) => views[t.k as ViewKey] !== false)
    : VIEW_TABS

  const handleTabChange = (value: string): void => {
    setView(isGrid ? value : `list${value}`)
  }

  const toggleViewMode = (): void => {
    setView(isGrid ? `list${base}` : base)
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-lg bg-muted p-1">
        {tabsToShow.map(({ k, l, Icon }) => {
          const isActive = base === k
          return (
            <button
              key={k}
              onClick={() => handleTabChange(k)}
              title={l}
              className={cn(
                "flex items-center justify-center rounded-md transition-all duration-300 ease-in-out h-7",
                isActive
                  ? "bg-background text-foreground shadow-sm w-[72px]"
                  : "text-muted-foreground hover:text-foreground w-8"
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon size={14} className="shrink-0" />
              </div>
              <span
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-medium",
                  isActive ? "ml-1.5 max-w-[50px] opacity-100" : "max-w-0 opacity-0 m-0"
                )}
              >
                {l}
              </span>
            </button>
          )
        })}
      </div>

      <div className="h-6 w-px shrink-0 bg-border" aria-hidden />

      <Button
        variant="outline"
        size="icon"
        className="relative h-9 w-9 shrink-0 overflow-hidden text-muted-foreground hover:text-foreground"
        onClick={toggleViewMode}
        title={isGrid ? "Switch to List view" : "Switch to Grid view"}
      >
        <div
          className={cn(
            "absolute flex items-center justify-center transition-all duration-300",
            isGrid ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 rotate-90"
          )}
        >
          <List size={16} />
        </div>
        <div
          className={cn(
            "absolute flex items-center justify-center transition-all duration-300",
            !isGrid ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 -rotate-90"
          )}
        >
          <LayoutGrid size={16} />
        </div>
      </Button>
    </div>
  )
}
