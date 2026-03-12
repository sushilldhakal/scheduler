// ─── Core Data Types ─────────────────────────────────────────────────────────

export interface Shift {
  id: string
  categoryId: string
  employeeId: string
  date: Date
  startH: number
  endH: number
  employee: string
  status: "draft" | "published"
}

/** A category/role/team—user can rename via config.labels.category */
export interface Category {
  id: string
  name: string
  colorIdx: number
}

/** Employee/staff member—user can rename via config.labels.employee */
export interface Employee {
  id: string
  name: string
  categoryId: string
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

export interface CategoryColor {
  bg: string
  light: string
  text: string
  border: string
}

// ─── Config Types (passed via props) ──────────────────────────────────────────

export interface SchedulerLabels {
  category?: string
  employee?: string
  shift?: string
  staff?: string
  roster?: string
  addShift?: string
  publish?: string
  draft?: string
  published?: string
  selectStaff?: string
  copyLastWeek?: string
  fillFromSchedules?: string
  publishAll?: string
  roles?: string
}

export interface SchedulerConfig {
  labels?: Partial<SchedulerLabels>
  categoryColors?: CategoryColor[]
  defaultSettings?: Partial<Settings>
}
