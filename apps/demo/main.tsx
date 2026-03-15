import React, { useEffect } from "react"
import ReactDOM from "react-dom/client"
import { useState } from "react"
import {
  Scheduler,
  RosterActions,
  SchedulerSettings,
  type Shift,
} from "@sushill/shadcn-scheduler"
import "./index.css"
import { Sun, Moon } from "lucide-react"
import { categories, employees, testShifts } from "./testData"

function App() {
  const [shifts, setShifts] = useState<Shift[]>(testShifts)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark])

  return (
    <div className="min-h-screen">
      <header className="border-b  px-6 py-4 flex items-center justify-between bg-background text-foreground">
        <div>
          <h1 className="text-xl font-semibold">shadcn-scheduler Demo</h1>
          <p className="text-sm text-muted-foreground">
            Drag shifts, add new ones, switch views. {shifts.length} shifts, {employees.length} staff.
          </p>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>
      <div className="h-full">
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
    </div>
  )
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
