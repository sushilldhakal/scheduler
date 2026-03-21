import type { Block, Resource, RecurrenceRule, ShiftDependency, EmployeeAvailability, SchedulerMarker } from "@sushill/shadcn-scheduler"
import { toDateISO } from "@sushill/shadcn-scheduler"

const FIRST_NAMES = [
  "Alice", "Bob", "Carol", "David", "Eva", "Frank", "Grace", "Henry",
  "Iris", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul",
  "Quinn", "Ryan", "Sara", "Tom", "Uma", "Victor", "Wendy", "Xavier",
  "Yara", "Zane", "Amy", "Ben", "Cora", "Dan", "Ella", "Finn",
]

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export const categories: Resource[] = [
  { id: "c1", name: "Front Desk", colorIdx: 0, kind: "category" },
  { id: "c2", name: "Kitchen", colorIdx: 1, kind: "category" },
  { id: "c3", name: "Manager", colorIdx: 2, kind: "category" },
  { id: "c4", name: "Delivery", colorIdx: 3, kind: "category" },
  { id: "c5", name: "Security", colorIdx: 4, kind: "category" },
]

const CATEGORY_IDS = categories.map((c) => c.id)

function generateEmployees(count: number): Resource[] {
  const list: Resource[] = []
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length]
    const lastInitial = LAST_INITIALS[Math.floor(i / FIRST_NAMES.length) % LAST_INITIALS.length]
    const name = `${firstName} ${lastInitial}.`
    const categoryId = CATEGORY_IDS[i % CATEGORY_IDS.length]
    const avatar = `${firstName[0]}${lastInitial}`
    list.push({
      id: `e${i + 1}`,
      name,
      categoryId,
      avatar,
      colorIdx: i % 8,
      kind: "employee",
    })
  }
  return list
}

export const employees: Resource[] = generateEmployees(50)

const SHIFT_HOURS: [number, number][] = [
  [8, 16], [9, 17], [10, 18], [11, 19], [12, 20], [14, 22],
  [7, 15], [6, 14], [16, 24], [8, 12], [12, 16], [16, 20],
]

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function generateShifts(options?: {
  daysBack?: number
  daysAhead?: number
  activeRatio?: number
}): Block[] {
  const { daysBack = 2, daysAhead = 14, activeRatio = 0.6 } = options ?? {}
  const shifts: Block[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let shiftId = 1
  for (let d = -daysBack; d <= daysAhead; d++) {
    const date = addDays(today, d)
    const dow = date.getDay()
    const isWeekend = dow === 0 || dow === 6
    // Slightly fewer staff scheduled on weekends
    const dailyRatio = isWeekend ? activeRatio * 0.7 : activeRatio
    const dailyEmpCount = Math.floor(employees.length * dailyRatio)
    
    // Pick a random subset of employees for this day
    const dailyEmployees = [...employees].sort(() => Math.random() - 0.5).slice(0, dailyEmpCount)

    for (const emp of dailyEmployees) {
      // Shift length 6 to 10 hours
      const shiftLength = 6 + Math.floor(Math.random() * 5)
      // Start between 6 AM and 14 (2 PM) to avoid shifts crossing midnight in this basic demo
      const startH = 6 + Math.floor(Math.random() * 9)
      const endH = startH + shiftLength
      
      // Break logic: happens roughly in the middle of the shift
      // Break length: 0.5 (30 mins) or 1 hour
      const breakLen = Math.random() > 0.5 ? 0.5 : 1
      const breakStartH = startH + Math.floor(shiftLength / 2) - (breakLen === 1 ? 0.5 : 0)
      const breakEndH = breakStartH + breakLen
      
      const cat = categories.find((c) => c.id === emp.categoryId) ?? categories[0]!
      const status = Math.random() > 0.85 ? "draft" : "published"
      shifts.push({
        id: `s${shiftId++}`,
        categoryId: cat.id,
        employeeId: emp.id,
        date: toDateISO(date),
        startH,
        endH,
        breakStartH,
        breakEndH,
        employee: emp.name,
        status,
      })
    }
  }
  return shifts
}

// ── Recurring shifts — visible in the demo ───────────────────────────────────
const today = new Date()
today.setHours(0, 0, 0, 0)

export const recurringShifts: Block[] = [
  {
    id: "rec-morning",
    categoryId: "c1",
    employeeId: "e1",
    date: toDateISO(today),
    startH: 8,
    endH: 12,
    employee: "Alice A.",
    status: "published",
    recurrence: {
      freq: "weekly",
      byDay: [1, 2, 3, 4, 5], // Mon–Fri
      count: 20,
    } satisfies RecurrenceRule,
  },
  {
    id: "rec-evening",
    categoryId: "c2",
    employeeId: "e2",
    date: toDateISO(today),
    startH: 17,
    endH: 21,
    employee: "Bob B.",
    status: "draft",
    recurrence: {
      freq: "daily",
      interval: 2,
      count: 10,
    } satisfies RecurrenceRule,
  },
]

// ── Shift dependencies & daily handover chains ─────────────────────────────────
// We generate a morning → midday → evening handover chain and a prep → service → cleanup chain for EVERY day in our demo range.
export const { demoDependencies, handoverShifts } = (() => {
  const deps: ShiftDependency[] = []
  const shifts: Block[] = []
  
  const baseDate = new Date()
  baseDate.setHours(0, 0, 0, 0)
  
  // Pick reliable employees for the daily demo chains so they are consistent across days
  const e1 = employees[0]! // Alice A. (Front Desk)
  const e2 = employees[1]! // Bob B. (Kitchen)
  const e3 = employees[2]! // Carol C. (Manager)
  const e4 = employees[3]! // David D. (Delivery)
  const e5 = employees[4]! // Eva E. (Security)
  const e6 = employees[5]! // Frank F. (Front Desk)
  
  for (let d = -2; d <= 14; d++) {
    const date = addDays(baseDate, d)
    const dateStr = toDateISO(date)
    
    // Chain 1: Morning -> Midday -> Evening (across categories)
    const idM = `dep-morning-${d}`
    const idA = `dep-midday-${d}`
    const idE = `dep-evening-${d}`
    
    shifts.push(
      { id: idM, categoryId: e1.categoryId!, employeeId: e1.id, date: dateStr, startH: 6, endH: 12, employee: e1.name, status: "published" },
      { id: idA, categoryId: e3.categoryId!, employeeId: e3.id, date: dateStr, startH: 12, endH: 18, employee: e3.name, status: "published", breakStartH: 14.5, breakEndH: 15 },
      { id: idE, categoryId: e5.categoryId!, employeeId: e5.id, date: dateStr, startH: 18, endH: 24, employee: e5.name, status: "published" }
    )
    
    deps.push(
      { id: `dep-1-${d}`, fromId: idM, toId: idA, type: "finish-to-start", label: "handover", color: "var(--primary)" },
      { id: `dep-2-${d}`, fromId: idA, toId: idE, type: "finish-to-start", label: "handover", color: "var(--primary)" }
    )
    
    // Chain 2: Prep -> Service -> Cleanup (Kitchen team focuses)
    const idPrep = `dep-prep-${d}`
    const idSvc = `dep-service-${d}`
    const idCln = `dep-cleanup-${d}`
    
    shifts.push(
      { id: idPrep, categoryId: e2.categoryId!, employeeId: e2.id, date: dateStr, startH: 6, endH: 10, employee: e2.name, status: "published" },
      { id: idSvc,  categoryId: e4.categoryId!, employeeId: e4.id, date: dateStr, startH: 10, endH: 16, employee: e4.name, status: "published", breakStartH: 12.5, breakEndH: 13 },
      { id: idCln,  categoryId: e6.categoryId!, employeeId: e6.id, date: dateStr, startH: 16, endH: 20, employee: e6.name, status: "published" }
    )
    
    deps.push(
      { id: `dep-3-${d}`, fromId: idPrep, toId: idSvc, type: "finish-to-start", label: "prep ready", color: "var(--color-emerald-500, #10b981)" },
      { id: `dep-4-${d}`, fromId: idSvc, toId: idCln, type: "finish-to-start", label: "cleanup", color: "var(--color-emerald-500, #10b981)" }
    )
  }
  
  return { demoDependencies: deps, handoverShifts: shifts }
})()



export const demoAvailability: EmployeeAvailability[] = [
  {
    employeeId: "e3",
    windows: [
      { dayOfWeek: 1, startH: 9,  endH: 17 },
      { dayOfWeek: 2, startH: 9,  endH: 17 },
      { dayOfWeek: 3, startH: 9,  endH: 17 },
      { dayOfWeek: 4, startH: 9,  endH: 17 },
      { dayOfWeek: 5, startH: 9,  endH: 17 },
    ],
  },
  {
    employeeId: "e5",
    windows: [
      { dayOfWeek: 1, startH: 12, endH: 20 },
      { dayOfWeek: 2, startH: 12, endH: 20 },
      { dayOfWeek: 3, startH: 12, endH: 20 },
      { dayOfWeek: 4, startH: 12, endH: 20 },
      { dayOfWeek: 5, startH: 12, endH: 20 },
    ],
  },
  {
    employeeId: "e10",
    windows: [
      { dayOfWeek: 3, startH: 6, endH: 14 },
      { dayOfWeek: 4, startH: 6, endH: 14 },
      { dayOfWeek: 5, startH: 6, endH: 14 },
      { dayOfWeek: 6, startH: 8, endH: 16 },
      { dayOfWeek: 0, startH: 8, endH: 16 },
    ],
  },
  {
    employeeId: "e15",
    windows: [
      { dayOfWeek: 1, startH: 14, endH: 22 },
      { dayOfWeek: 2, startH: 14, endH: 22 },
      { dayOfWeek: 5, startH: 14, endH: 22 },
      { dayOfWeek: 6, startH: 14, endH: 22 },
    ],
  },
]

export const demoMarkers: SchedulerMarker[] = [
  {
    id: "marker-deadline",
    date: toDateISO(addDays(today, 2)),
    hour: 9,
    label: "Sprint deadline",
    color: "var(--color-amber-500, #f59e0b)",
    draggable: true,
  },
  {
    id: "marker-review",
    date: toDateISO(addDays(today, 4)),
    hour: 14,
    label: "Review",
    color: "var(--color-blue-500, #3b82f6)",
    draggable: true,
  },
  {
    id: "marker-maintenance",
    date: toDateISO(today),
    hour: 22,
    label: "Sys Maint.",
    color: "var(--color-rose-500, #f43f5e)",
    draggable: true,
  },
]

const conflictScenarioShifts: Block[] = [
  { id: "dep-shift-morning", categoryId: "c1", employeeId: "e4", date: toDateISO(today), startH: 8,  endH: 12, employee: "David D.", status: "published" },
  { id: "dep-shift-afternoon",categoryId: "c2", employeeId: "e4", date: toDateISO(today), startH: 13, endH: 17, employee: "David D.", status: "published" },
]
export const testShifts: Block[] = [
  ...generateShifts({ daysBack: 2, daysAhead: 14 }),
  ...recurringShifts,
  ...conflictScenarioShifts,
  ...handoverShifts,
]

export const smallCategories: Resource[] = [
  { id: "sc1", name: "Service", colorIdx: 0, kind: "category" },
  { id: "sc2", name: "Kitchen", colorIdx: 1, kind: "category" },
]

export const smallEmployees: Resource[] = [
  { id: "se1", name: "Alex",   categoryId: "sc1", avatar: "AX", colorIdx: 0, kind: "employee" },
  { id: "se2", name: "Sam",    categoryId: "sc1", avatar: "SM", colorIdx: 0, kind: "employee" },
  { id: "se3", name: "Jordan", categoryId: "sc2", avatar: "JR", colorIdx: 1, kind: "employee" },
  { id: "se4", name: "Casey",  categoryId: "sc2", avatar: "CS", colorIdx: 1, kind: "employee" },
  { id: "se5", name: "Morgan", categoryId: "sc1", avatar: "MG", colorIdx: 0, kind: "employee" },
]

export const smallShifts: Block[] = (() => {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const out: Block[] = []
  for (let d = -7; d <= 14; d++) {
    const date = new Date(base)
    date.setDate(date.getDate() + d)
    const dayShifts = d % 3 === 0 ? 4 : 2
    for (let i = 0; i < dayShifts; i++) {
      const emp = smallEmployees[i % smallEmployees.length]!
      out.push({
        id: `ss-${d}-${i}`,
        categoryId: emp.categoryId!,
        employeeId: emp.id,
        date: toDateISO(date),
        startH: 8 + (i % 3) * 3,
        endH: 12 + (i % 3) * 3 + 4,
        employee: emp.name,
        status: "published",
      })
    }
  }
  return out
})()

const PERF_CATEGORY_IDS = Array.from({ length: 200 }, (_, i) => `pc${i + 1}`)
export const perfCategories: Resource[] = PERF_CATEGORY_IDS.map((id, i) => ({
  id, name: `Role ${i + 1}`, colorIdx: i % 8, kind: "category" as const,
}))
export const perfEmployees: Resource[] = Array.from({ length: 200 }, (_, i) => ({
  id: `pe${i + 1}`,
  name: `User ${i + 1}`,
  categoryId: PERF_CATEGORY_IDS[i % 200]!,
  avatar: `U${i + 1}`,
  colorIdx: i % 8,
  kind: "employee" as const,
}))
export const perfShifts: Block[] = (() => {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  const out: Block[] = []
  let id = 0
  for (let d = -7; d <= 14; d++) {
    const date = new Date(base)
    date.setDate(date.getDate() + d)
    const n = Math.floor(10000 / 22)
    for (let i = 0; i < n; i++) {
      const emp = perfEmployees[i % perfEmployees.length]!
      const [startH, endH] = SHIFT_HOURS[i % SHIFT_HOURS.length]!
      out.push({
        id: `ps-${id++}`,
        categoryId: emp.categoryId ?? PERF_CATEGORY_IDS[0]!,
        employeeId: emp.id,
        date: toDateISO(date),
        startH,
        endH,
        employee: emp.name,
        status: "published",
      })
    }
  }
  return out
})()
