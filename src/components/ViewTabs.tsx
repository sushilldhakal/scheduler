import React from "react"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import {
  LayoutGrid,
  List,
  CalendarDays,
  CalendarRange,
  Calendar,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react"

interface ViewTab {
  k: string
  l: string
  Icon: LucideIcon
}

const VIEW_TABS: readonly ViewTab[] = [
  { k: "day", l: "Day", Icon: CalendarDays },
  { k: "week", l: "Week", Icon: CalendarRange },
  { k: "month", l: "Month", Icon: Calendar },
  { k: "year", l: "Year", Icon: CalendarCheck },
]

interface ViewTabsProps {
  view: string
  setView: (view: string) => void
}

export function ViewTabs({ view, setView }: ViewTabsProps): JSX.Element {
  const isGrid = !view.startsWith("list")
  const base = view.replace("list", "") || "day"

  const handleTabChange = (value: string): void => {
    setView(isGrid ? value : `list${value}`)
  }

  const handleToggleChange = (value: string): void => {
    if (value) setView(value === "grid" ? base : `list${base}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Tabs value={base} onValueChange={handleTabChange}>
        <TabsList className="h-9 gap-0.5">
          {VIEW_TABS.map(({ k, l, Icon }) => {
            const isActive = base === k
            return (
              <TabsTrigger
                key={k}
                value={k}
                title={l}
                className={`h-7 gap-1.5 text-xs font-medium data-[state=active]:shadow-sm ${
                  isActive ? "px-3" : "w-8 px-0"
                } ${!isActive ? "opacity-70" : ""}`}
              >
                <Icon size={14} className="shrink-0" />
                {isActive && l}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <div className="h-6 w-px shrink-0 bg-border" aria-hidden />

      <ToggleGroup
        type="single"
        value={isGrid ? "grid" : "list"}
        onValueChange={handleToggleChange}
        className="h-9 gap-0.5 rounded-md border border-input bg-muted/30 p-0.5"
      >
        <ToggleGroupItem value="list" className="h-7 w-7 rounded p-0" title="List view">
          <List size={14} />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" className="h-7 w-7 rounded p-0" title="Grid view">
          <LayoutGrid size={14} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
