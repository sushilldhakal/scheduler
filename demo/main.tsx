import React from "react"
import ReactDOM from "react-dom/client"
import { useState } from "react"
import {
  Scheduler,
  RosterActions,
  SchedulerSettings,
  type Shift,
  type Category,
  type Employee,
} from "shadcn-scheduler"
import "./index.css"

const categories: Category[] = [
  { id: "c1", name: "Front Desk", colorIdx: 0 },
  { id: "c2", name: "Kitchen", colorIdx: 1 },
  { id: "c3", name: "Manager", colorIdx: 2 },
  { id: "c4", name: "Delivery", colorIdx: 3 },
  { id: "c5", name: "Security", colorIdx: 4 },
]



const employees: Employee[] = [
  { id: "e1", name: "Alice B.", categoryId: "c1", avatar: "AB", colorIdx: 0 },
  { id: "e2", name: "Tom H.", categoryId: "c1", avatar: "TH", colorIdx: 0 },
  { id: "e3", name: "Chef Marco", categoryId: "c2", avatar: "CM", colorIdx: 1 },
  { id: "e4", name: "Sarah K.", categoryId: "c2", avatar: "SK", colorIdx: 1 },
  { id: "e5", name: "Mike R.", categoryId: "c3", avatar: "MR", colorIdx: 2 },
  { id: "e6", name: "John D.", categoryId: "c4", avatar: "JD", colorIdx: 3 },
  { id: "e7", name: "Jane S.", categoryId: "c5", avatar: "JS", colorIdx: 4 },
  { id: "e8", name: "Jim R.", categoryId: "c3", avatar: "JR", colorIdx: 5 },
  { id: "e9", name: "Jill T.", categoryId: "c1", avatar: "JT", colorIdx: 6 },
  { id: "e10", name: "Jack U.", categoryId: "c1", avatar: "JU", colorIdx: 7 },
  { id: "e11", name: "Jill V.", categoryId: "c2", avatar: "JV", colorIdx: 8 },
  { id: "e12", name: "Jill W.", categoryId: "c2", avatar: "JW", colorIdx: 9 },
  { id: "e13", name: "Jill X.", categoryId: "c1", avatar: "JX", colorIdx: 10 },
  { id: "e14", name: "Jill Y.", categoryId: "c2", avatar: "JY", colorIdx: 11 },
  { id: "e15", name: "Jill Z.", categoryId: "c3", avatar: "JZ", colorIdx: 12 },
  { id: "e16", name: "Jill A.", categoryId: "c4", avatar: "JA", colorIdx: 13 },
  { id: "e17", name: "Jill B.", categoryId: "c5", avatar: "JB", colorIdx: 14 },
  { id: "e18", name: "Jill C.", categoryId: "c3", avatar: "JC", colorIdx: 15 },
  { id: "e19", name: "Jill D.", categoryId: "c4", avatar: "JD", colorIdx: 16 },
  { id: "e20", name: "Jill E.", categoryId: "c5", avatar: "JE", colorIdx: 17 },
  { id: "e21", name: "Jill F.", categoryId: "c1", avatar: "JF", colorIdx: 18 },
  { id: "e22", name: "Jill G.", categoryId: "c2", avatar: "JG", colorIdx: 19 },
  { id: "e23", name: "Jill H.", categoryId: "c1", avatar: "JH", colorIdx: 20 },
  { id: "e16", name: "Jill A.", categoryId: "c4", avatar: "JA", colorIdx: 13 },
]

const today = new Date()
const yesterday = new Date(today)
yesterday.setDate(yesterday.getDate() - 1)
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 7)
const inTwoWeeks = new Date(today)
inTwoWeeks.setDate(inTwoWeeks.getDate() + 14)

const mkDate = (d: Date) => new Date(d)

const initialShifts: Shift[] = [
  { id: "s1", categoryId: "c1", employeeId: "e1", date: mkDate(today), startH: 9, endH: 17, employee: "Alice B.", status: "published" },
  { id: "s2", categoryId: "c1", employeeId: "e2", date: mkDate(today), startH: 14, endH: 22, employee: "Tom H.", status: "published" },
  { id: "s3", categoryId: "c2", employeeId: "e3", date: mkDate(today), startH: 8, endH: 16, employee: "Chef Marco", status: "published" },
  { id: "s4", categoryId: "c2", employeeId: "e4", date: mkDate(today), startH: 10, endH: 18, employee: "Sarah K.", status: "draft" },
  { id: "s5", categoryId: "c1", employeeId: "e10", date: mkDate(today), startH: 8, endH: 12, employee: "Jack U.", status: "published" },
  { id: "s6", categoryId: "c3", employeeId: "e5", date: mkDate(today), startH: 9, endH: 18, employee: "Mike R.", status: "published" },
  { id: "s7", categoryId: "c4", employeeId: "e6", date: mkDate(today), startH: 11, endH: 19, employee: "John D.", status: "published" },
  { id: "s8", categoryId: "c5", employeeId: "e7", date: mkDate(today), startH: 16, endH: 24, employee: "Jane S.", status: "published" },
  { id: "s9", categoryId: "c1", employeeId: "e2", date: mkDate(yesterday), startH: 10, endH: 18, employee: "Tom H.", status: "published" },
  { id: "s10", categoryId: "c2", employeeId: "e4", date: mkDate(yesterday), startH: 12, endH: 20, employee: "Sarah K.", status: "published" },
  { id: "s11", categoryId: "c1", employeeId: "e1", date: mkDate(nextWeek), startH: 9, endH: 17, employee: "Alice B.", status: "published" },
  { id: "s12", categoryId: "c1", employeeId: "e2", date: mkDate(nextWeek), startH: 14, endH: 22, employee: "Tom H.", status: "draft" },
  { id: "s13", categoryId: "c2", employeeId: "e3", date: mkDate(nextWeek), startH: 8, endH: 16, employee: "Chef Marco", status: "published" },
  { id: "s14", categoryId: "c3", employeeId: "e5", date: mkDate(nextWeek), startH: 10, endH: 18, employee: "Mike R.", status: "published" },
  { id: "s15", categoryId: "c4", employeeId: "e6", date: mkDate(inTwoWeeks), startH: 9, endH: 17, employee: "John D.", status: "draft" },
  { id: "s16", categoryId: "c2", employeeId: "e3", date: mkDate(today), startH: 17, endH: 22, employee: "Chef Marco", status: "published" },
  { id: "s17", categoryId: "c1", employeeId: "e2", date: mkDate(today), startH: 8, endH: 14, employee: "Tom H.", status: "published" },
]

function App() {
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-semibold">shadcn-scheduler Demo</h1>
        <p className="text-sm text-muted-foreground">
          Drag shifts, add new ones, switch views (Day / Week / Month / Year).
        </p>
      </header>
      <div className="h-[calc(100vh-100px)]">
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
