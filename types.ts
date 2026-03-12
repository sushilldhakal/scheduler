export interface Shift {
  id: string
  roleId: string
  employeeId: string
  date: Date
  startH: number
  endH: number
  employee: string
  status: 'draft' | 'published'
}

export interface Role {
  id: string
  name: string
  colorIdx: number
}

export interface Employee {
  id: string
  name: string
  role: string
  avatar: string
  colorIdx: number
}

export interface WorkingHours {
  from: number
  to: number
}

export interface Settings {
  visibleFrom: number
  visibleTo: number
  workingHours: Record<number, WorkingHours | null>
}

export interface RoleColor {
  bg: string
  light: string
  text: string
  border: string
}