import React from "react"
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group"
import { LayoutGrid, List } from "lucide-react"

interface ViewTab {
  k: string
  l: string
}

const VIEW_TABS: readonly ViewTab[] = [
  { k: "day", l: "Day" },
  { k: "week", l: "Week" },
  { k: "month", l: "Month" },
  { k: "year", l: "Year" },
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
        <TabsList className="h-8">
          {VIEW_TABS.map(({ k, l }) => {
            const isActive = base === k
            return (
              <TabsTrigger
                key={k}
                value={k}
                className={`h-6 text-xs font-medium ${isActive ? "px-3" : "px-2"}`}
              >
                {isActive ? l : l.charAt(0)}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      <ToggleGroup
        type="single"
        value={isGrid ? "grid" : "list"}
        onValueChange={handleToggleChange}
        className="h-8"
      >
        <ToggleGroupItem value="list" className="h-6 w-6 p-0">
          <List size={14} />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" className="h-6 w-6 p-0">
          <LayoutGrid size={14} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
