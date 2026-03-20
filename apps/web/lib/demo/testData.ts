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

export const employees: Resource[] = generateEmployees(20)

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
  shiftsPerDay?: number
}): Block[] {
  const { daysBack = 0, daysAhead = 6, shiftsPerDay = 8 } = options ?? {}
  const shifts: Block[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let shiftId = 1
  for (let d = -daysBack; d <= daysAhead; d++) {
    const date = addDays(today, d)
    const dow = date.getDay()
    const weekendMultiplier = dow === 0 || dow === 6 ? 0.4 : 1
    const count = Math.floor(shiftsPerDay * weekendMultiplier * (0.7 + Math.random() * 0.6))
    for (let s = 0; s < count; s++) {
      const emp = employees[Math.floor(Math.random() * employees.length)]!
      const [startH, endH] = SHIFT_HOURS[Math.floor(Math.random() * SHIFT_HOURS.length)]!
      const cat = categories.find((c) => c.id === emp.categoryId) ?? categories[0]!
      const status = Math.random() > 0.85 ? "draft" : "published"
      shifts.push({
        id: `s${shiftId++}`,
        categoryId: cat.id,
        employeeId: emp.id,
        date: toDateISO(date),
        startH,
        endH,
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

// ── Shift dependencies ────────────────────────────────────────────────────────
// Handover chain — morning → midday → evening across three categories
// These are sequential and on different rows so arrows are clearly visible
export const demoDependencies: ShiftDependency[] = [
  {
    id: "dep-1",
    fromId: "dep-morning",
    toId: "dep-midday",
    type: "finish-to-start",
    label: "handover",
    color: "var(--primary)",
  },
  {
    id: "dep-2",
    fromId: "dep-midday",
    toId: "dep-evening",
    type: "finish-to-start",
    label: "handover",
    color: "var(--primary)",
  },
]

// ── Employee availability ─────────────────────────────────────────────────────
export const demoAvailability: EmployeeAvailability[] = [
  {
    employeeId: "e3",
    windows: [
      { dayOfWeek: 1, startH: 9,  endH: 17 },
      { dayOfWeek: 2, startH: 9,  endH: 17 },
      { dayOfWeek: 3, startH: 9,  endH: 17 },
      { dayOfWeek: 4, startH: 9,  endH: 17 },
      { dayOfWeek: 5, startH: 9,  endH: 17 },
      // Sat+Sun: no windows = unavailable
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
]

// ── Markers ───────────────────────────────────────────────────────────────────
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
]

// Two sequential shifts for the same employee — used as dependency demo targets
// Morning: Front Desk 8–12, then Kitchen 13–17 — arrow connects the end of one to start of next
const conflictScenarioShifts: Block[] = [
  { id: "dep-shift-morning", categoryId: "c1", employeeId: "e4", date: toDateISO(today), startH: 8,  endH: 12, employee: "David D.", status: "published" },
  { id: "dep-shift-afternoon",categoryId: "c2", employeeId: "e4", date: toDateISO(today), startH: 13, endH: 17, employee: "David D.", status: "published" },
]

// Dedicated handover chain — clearly visible on today with sequential times
// across different categories so the arrows cross rows and are obvious
export const handoverShifts: Block[] = [
  { id: "dep-morning",  categoryId: "c1", employeeId: "e1",  date: toDateISO(today), startH: 7,  endH: 12, employee: "Alice A.",  status: "published" },
  { id: "dep-midday",   categoryId: "c2", employeeId: "e6",  date: toDateISO(today), startH: 12, endH: 17, employee: "Frank F.",  status: "published" },
  { id: "dep-evening",  categoryId: "c3", employeeId: "e11", date: toDateISO(today), startH: 17, endH: 22, employee: "Kate K.",   status: "published" },
]

export const testShifts: Block[] = [
  ...generateShifts({ daysBack: 0, daysAhead: 6, shiftsPerDay: 8 }),
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
