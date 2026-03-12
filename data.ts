import type { Shift, Role, Employee } from './types'
import { getDIM } from './constants'

// ─── Static Data ──────────────────────────────────────────────────────────────
export const ROLES: readonly Role[] = [
  { id: "r1", name: "Front Desk", colorIdx: 0 },
  { id: "r2", name: "Kitchen",    colorIdx: 1 },
  { id: "r3", name: "Manager",    colorIdx: 2 },
  { id: "r4", name: "Security",   colorIdx: 3 },
  { id: "r5", name: "Delivery",   colorIdx: 4 },
]

export const ALL_EMPLOYEES: readonly Employee[] = [
  { id: "e1",  name: "Alice B.",    role: "r1", avatar: "AB", colorIdx: 0 },
  { id: "e2",  name: "Tom H.",      role: "r1", avatar: "TH", colorIdx: 0 },
  { id: "e3",  name: "Sara K.",     role: "r1", avatar: "SK", colorIdx: 0 },
  { id: "e4",  name: "Chef Marco",  role: "r2", avatar: "CM", colorIdx: 1 },
  { id: "e5",  name: "Lin W.",      role: "r2", avatar: "LW", colorIdx: 1 },
  { id: "e6",  name: "Dave P.",     role: "r2", avatar: "DP", colorIdx: 1 },
  { id: "e7",  name: "Manager Jo",  role: "r3", avatar: "MJ", colorIdx: 2 },
  { id: "e8",  name: "Rex T.",      role: "r4", avatar: "RT", colorIdx: 3 },
  { id: "e9",  name: "Sam F.",      role: "r4", avatar: "SF", colorIdx: 3 },
  { id: "e10", name: "Mia D.",      role: "r5", avatar: "MD", colorIdx: 4 },
  { id: "e11", name: "Phil R.",     role: "r5", avatar: "PR", colorIdx: 4 },
  { id: "e12", name: "Anna S.",     role: "r5", avatar: "AS", colorIdx: 4 },
]

// ─── UID Counter ──────────────────────────────────────────────────────────────
let _uid: number = 100
export const nextUid = (): string => `s${_uid++}`

// ─── Shift Generation ─────────────────────────────────────────────────────────
export function generateShifts(): Shift[] {
  const now = new Date()
  const y   = now.getFullYear()
  const m   = now.getMonth()
  const out: Shift[] = []

  for (let mo = m - 1; mo <= m + 1; mo++) {
    for (let day = 1; day <= getDIM(y, mo); day++) {
      ALL_EMPLOYEES.forEach(emp => {
        if (Math.random() > 0.48) {
          const startH = 6 + Math.floor(Math.random() * 10)
          const endH   = Math.min(startH + 3 + Math.floor(Math.random() * 5), 23)
          out.push({
            id:         nextUid(),
            roleId:     emp.role,
            employeeId: emp.id,
            date:       new Date(y, mo, day),
            startH,
            endH,
            employee:   emp.name,
            status:     Math.random() < 0.3 ? "draft" : "published",
          })
        }
      })
    }
  }
  return out
}