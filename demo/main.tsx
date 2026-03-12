import React from "react"
import ReactDOM from "react-dom/client"
import { useState } from "react"
import { Scheduler, type Shift, type Category, type Employee } from "shadcn-scheduler"
import "./index.css"

const categories: Category[] = [
  { id: "c1", name: "Front Desk", colorIdx: 0 },
  { id: "c2", name: "Kitchen", colorIdx: 1 },
  { id: "c3", name: "Manager", colorIdx: 2 },
]

const employees: Employee[] = [
  { id: "e1", name: "Alice B.", categoryId: "c1", avatar: "AB", colorIdx: 0 },
  { id: "e2", name: "Tom H.", categoryId: "c1", avatar: "TH", colorIdx: 0 },
  { id: "e3", name: "Chef Marco", categoryId: "c2", avatar: "CM", colorIdx: 1 },
  { id: "e4", name: "Sarah K.", categoryId: "c2", avatar: "SK", colorIdx: 1 },
  { id: "e5", name: "Mike R.", categoryId: "c3", avatar: "MR", colorIdx: 2 },
]

const today = new Date()
const nextWeek = new Date(today)
nextWeek.setDate(nextWeek.getDate() + 7)

const initialShifts: Shift[] = [
  {
    id: "s1",
    categoryId: "c1",
    employeeId: "e1",
    date: new Date(today),
    startH: 9,
    endH: 17,
    employee: "Alice B.",
    status: "published",
  },
  {
    id: "s2",
    categoryId: "c1",
    employeeId: "e2",
    date: new Date(today),
    startH: 14,
    endH: 22,
    employee: "Tom H.",
    status: "published",
  },
  {
    id: "s3",
    categoryId: "c2",
    employeeId: "e3",
    date: new Date(today),
    startH: 8,
    endH: 16,
    employee: "Chef Marco",
    status: "published",
  },
  {
    id: "s4",
    categoryId: "c2",
    employeeId: "e4",
    date: new Date(nextWeek),
    startH: 10,
    endH: 18,
    employee: "Sarah K.",
    status: "draft",
  },
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
