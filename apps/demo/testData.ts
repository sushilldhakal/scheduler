import type { Category, Employee, Shift } from "@sushill/shadcn-scheduler"

const FIRST_NAMES = [
  "Alice", "Bob", "Carol", "David", "Eva", "Frank", "Grace", "Henry",
  "Iris", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul",
  "Quinn", "Ryan", "Sara", "Tom", "Uma", "Victor", "Wendy", "Xavier",
  "Yara", "Zane", "Amy", "Ben", "Cora", "Dan", "Ella", "Finn",
]

const LAST_INITIALS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export const categories: Category[] = [
  { id: "c1", name: "Front Desk", colorIdx: 0 },
  { id: "c2", name: "Kitchen", colorIdx: 1 },
  { id: "c3", name: "Manager", colorIdx: 2 },
  { id: "c4", name: "Delivery", colorIdx: 3 },
  { id: "c5", name: "Security", colorIdx: 4 },
  { id: "c6", name: "Housekeeping", colorIdx: 5 },
  { id: "c7", name: "Bar", colorIdx: 6 },
  { id: "c8", name: "Maintenance", colorIdx: 7 },
]

const CATEGORY_IDS = categories.map((c) => c.id)

function generateEmployees(count: number): Employee[] {
  const list: Employee[] = []
  let idx = 0
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
    })
  }
  return list
}

export const employees: Employee[] = generateEmployees(80)

const SHIFT_HOURS = [
  [8, 16],
  [9, 17],
  [10, 18],
  [11, 19],
  [12, 20],
  [14, 22],
  [7, 15],
  [6, 14],
  [16, 24],
  [8, 12],
  [12, 16],
  [16, 20],
]

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function generateShifts(options?: {
  /** Number of days in the past to generate shifts for */
  daysBack?: number
  /** Number of days in the future to generate shifts for */
  daysAhead?: number
  /** Shifts per day (approx) */
  shiftsPerDay?: number
}): Shift[] {
  const {
    daysBack = 60,
    daysAhead = 90,
    shiftsPerDay = 12,
  } = options ?? {}

  const shifts: Shift[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let shiftId = 1

  for (let d = -daysBack; d <= daysAhead; d++) {
    const date = addDays(today, d)
    const dow = date.getDay()
    // Fewer shifts on weekends (0=Sun, 6=Sat)
    const weekendMultiplier = dow === 0 || dow === 6 ? 0.4 : 1
    const count = Math.floor(shiftsPerDay * weekendMultiplier * (0.7 + Math.random() * 0.6))

    for (let s = 0; s < count; s++) {
      const emp = employees[Math.floor(Math.random() * employees.length)]
      const [startH, endH] = SHIFT_HOURS[Math.floor(Math.random() * SHIFT_HOURS.length)]
      const cat = categories.find((c) => c.id === emp.categoryId) ?? categories[0]
      const status = Math.random() > 0.85 ? "draft" : "published"

      shifts.push({
        id: `s${shiftId++}`,
        categoryId: cat.id,
        employeeId: emp.id,
        date: new Date(date),
        startH,
        endH,
        employee: emp.name,
        status,
      })
    }
  }

  return shifts
}

// Pre-generated big dataset: ~150 days, ~12 shifts/day avg = ~1800 shifts
export const testShifts: Shift[] = generateShifts({
  daysBack: 60,
  daysAhead: 90,
  shiftsPerDay: 14,
})
