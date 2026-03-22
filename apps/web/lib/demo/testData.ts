import type { Block, Resource, RecurrenceRule, ShiftDependency, EmployeeAvailability, SchedulerMarker } from "@sushill/shadcn-scheduler"
import { toDateISO } from "@sushill/shadcn-scheduler"

// ── Categories ───────────────────────────────────────────────────────────────
export const categories: Resource[] = [
  { id: "c1", name: "Front Desk",  colorIdx: 0, kind: "category" },
  { id: "c2", name: "Kitchen",     colorIdx: 1, kind: "category" },
  { id: "c3", name: "Manager",     colorIdx: 2, kind: "category" },
  { id: "c4", name: "Delivery",    colorIdx: 3, kind: "category" },
  { id: "c5", name: "Security",    colorIdx: 4, kind: "category" },
]

// ── Employees ────────────────────────────────────────────────────────────────
export const employees: Resource[] = [
  // Front Desk (c1)
  { id:"e01", name:"Alice M.",   categoryId:"c1", avatar:"AM", colorIdx:0, kind:"employee" },
  { id:"e02", name:"Ben T.",     categoryId:"c1", avatar:"BT", colorIdx:0, kind:"employee" },
  { id:"e03", name:"Carol S.",   categoryId:"c1", avatar:"CS", colorIdx:0, kind:"employee" },
  { id:"e04", name:"Dan W.",     categoryId:"c1", avatar:"DW", colorIdx:0, kind:"employee" },
  { id:"e05", name:"Eva P.",     categoryId:"c1", avatar:"EP", colorIdx:0, kind:"employee" },
  { id:"e06", name:"Frank L.",   categoryId:"c1", avatar:"FL", colorIdx:0, kind:"employee" },
  // Kitchen (c2)
  { id:"e07", name:"Grace R.",   categoryId:"c2", avatar:"GR", colorIdx:1, kind:"employee" },
  { id:"e08", name:"Henry B.",   categoryId:"c2", avatar:"HB", colorIdx:1, kind:"employee" },
  { id:"e09", name:"Iris K.",    categoryId:"c2", avatar:"IK", colorIdx:1, kind:"employee" },
  { id:"e10", name:"Jack N.",    categoryId:"c2", avatar:"JN", colorIdx:1, kind:"employee" },
  { id:"e11", name:"Kate O.",    categoryId:"c2", avatar:"KO", colorIdx:1, kind:"employee" },
  { id:"e12", name:"Leo F.",     categoryId:"c2", avatar:"LF", colorIdx:1, kind:"employee" },
  // Manager (c3)
  { id:"e13", name:"Mia C.",     categoryId:"c3", avatar:"MC", colorIdx:2, kind:"employee" },
  { id:"e14", name:"Noah D.",    categoryId:"c3", avatar:"ND", colorIdx:2, kind:"employee" },
  { id:"e15", name:"Olivia H.",  categoryId:"c3", avatar:"OH", colorIdx:2, kind:"employee" },
  // Delivery (c4)
  { id:"e16", name:"Paul Z.",    categoryId:"c4", avatar:"PZ", colorIdx:3, kind:"employee" },
  { id:"e17", name:"Quinn A.",   categoryId:"c4", avatar:"QA", colorIdx:3, kind:"employee" },
  { id:"e18", name:"Ryan J.",    categoryId:"c4", avatar:"RJ", colorIdx:3, kind:"employee" },
  { id:"e19", name:"Sara V.",    categoryId:"c4", avatar:"SV", colorIdx:3, kind:"employee" },
  { id:"e20", name:"Tom X.",     categoryId:"c4", avatar:"TX", colorIdx:3, kind:"employee" },
  // Security (c5)
  { id:"e21", name:"Uma G.",     categoryId:"c5", avatar:"UG", colorIdx:4, kind:"employee" },
  { id:"e22", name:"Victor I.",  categoryId:"c5", avatar:"VI", colorIdx:4, kind:"employee" },
  { id:"e23", name:"Wendy Q.",   categoryId:"c5", avatar:"WQ", colorIdx:4, kind:"employee" },
  { id:"e24", name:"Xavier Y.",  categoryId:"c5", avatar:"XY", colorIdx:4, kind:"employee" },
]

function d(offset: number): string {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offset); return toDateISO(dt)
}

// Deterministic shifts — no random, no conflicts
// Pattern: morning (6-14), mid (10-18), afternoon (14-22)
// Each employee gets one shift per day, no overlaps within employee
export const testShifts: Block[] = [
  // ── FRONT DESK ────────────────────────────────────────────────────────────
  // Alice — Mon-Fri mornings, weekends afternoon
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    return { id:`e01_${o}`, categoryId:"c1", employeeId:"e01", employee:"Alice M.", date:d(o), startH:dow===0||dow===6?14:6, endH:dow===0||dow===6?22:14, breakStartH:dow===0||dow===6?18:10, breakEndH:dow===0||dow===6?18.5:10.5, status:"published" as const }
  })),
  // Ben — mid shifts Mon-Sat, off Sun
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (dow===0) return []
    return [{ id:`e02_${o}`, categoryId:"c1", employeeId:"e02", employee:"Ben T.", date:d(o), startH:10, endH:18, breakStartH:13, breakEndH:13.5, status:"published" as const }]
  })),
  // Carol — afternoons 5 days, 2 days off
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (dow===0||dow===3) return []
    return [{ id:`e03_${o}`, categoryId:"c1", employeeId:"e03", employee:"Carol S.", date:d(o), startH:14, endH:22, breakStartH:18, breakEndH:18.5, status:"published" as const }]
  })),
  // Dan — part time: Mon/Wed/Fri mornings
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (![1,3,5].includes(dow)) return []
    return [{ id:`e04_${o}`, categoryId:"c1", employeeId:"e04", employee:"Dan W.", date:d(o), startH:8, endH:14, status:"published" as const }]
  })),
  // Eva — Tue/Thu/Sat afternoons
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (![2,4,6].includes(dow)) return []
    return [{ id:`e05_${o}`, categoryId:"c1", employeeId:"e05", employee:"Eva P.", date:d(o), startH:12, endH:20, breakStartH:16, breakEndH:16.5, status:(o<0?"published":"draft") as const }]
  })),
  // Frank — evenings
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (dow===0) return []
    return [{ id:`e06_${o}`, categoryId:"c1", employeeId:"e06", employee:"Frank L.", date:d(o), startH:16, endH:24, breakStartH:20, breakEndH:20.5, status:(o<0?"published":"draft") as const }]
  })),

  // ── KITCHEN ───────────────────────────────────────────────────────────────
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e07_${o}`, categoryId:"c2", employeeId:"e07", employee:"Grace R.", date:d(o), startH:6, endH:14, breakStartH:10, breakEndH:10.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e08_${o}`, categoryId:"c2", employeeId:"e08", employee:"Henry B.", date:d(o), startH:10, endH:18, breakStartH:13, breakEndH:13.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e09_${o}`, categoryId:"c2", employeeId:"e09", employee:"Iris K.",  date:d(o), startH:14, endH:22, breakStartH:18, breakEndH:18.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (dow===0||dow===6) return []
    return [{ id:`e10_${o}`, categoryId:"c2", employeeId:"e10", employee:"Jack N.", date:d(o), startH:8, endH:16, breakStartH:12, breakEndH:12.5, status:(o>3?"draft":"published") as const }]
  })),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if ([1,3].includes(dow)) return []
    return [{ id:`e11_${o}`, categoryId:"c2", employeeId:"e11", employee:"Kate O.", date:d(o), startH:12, endH:20, breakStartH:16, breakEndH:16.5, status:"published" as const }]
  })),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (![5,6,0].includes(dow)) return []
    return [{ id:`e12_${o}`, categoryId:"c2", employeeId:"e12", employee:"Leo F.", date:d(o), startH:18, endH:24, status:(o<0?"published":"draft") as const }]
  })),

  // ── MANAGER ───────────────────────────────────────────────────────────────
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (dow===0||dow===6) return []
    return [{ id:`e13_${o}`, categoryId:"c3", employeeId:"e13", employee:"Mia C.", date:d(o), startH:8, endH:17, breakStartH:12, breakEndH:13, status:"published" as const }]
  })),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if ([0,3,6].includes(dow)) return []
    return [{ id:`e14_${o}`, categoryId:"c3", employeeId:"e14", employee:"Noah D.", date:d(o), startH:12, endH:21, breakStartH:17, breakEndH:18, status:(o>5?"draft":"published") as const }]
  })),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (![5,6,0].includes(dow)) return []
    return [{ id:`e15_${o}`, categoryId:"c3", employeeId:"e15", employee:"Olivia H.", date:d(o), startH:9, endH:18, breakStartH:13, breakEndH:14, status:"published" as const }]
  })),

  // ── DELIVERY ──────────────────────────────────────────────────────────────
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e16_${o}`, categoryId:"c4", employeeId:"e16", employee:"Paul Z.",  date:d(o), startH:8,  endH:16, breakStartH:12, breakEndH:12.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e17_${o}`, categoryId:"c4", employeeId:"e17", employee:"Quinn A.", date:d(o), startH:10, endH:18, breakStartH:14, breakEndH:14.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e18_${o}`, categoryId:"c4", employeeId:"e18", employee:"Ryan J.",  date:d(o), startH:12, endH:20, breakStartH:16, breakEndH:16.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (dow===0) return []
    return [{ id:`e19_${o}`, categoryId:"c4", employeeId:"e19", employee:"Sara V.", date:d(o), startH:14, endH:22, breakStartH:18, breakEndH:18.5, status:(o>4?"draft":"published") as const }]
  })),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if ([1,2,3].includes(dow)) return []
    return [{ id:`e20_${o}`, categoryId:"c4", employeeId:"e20", employee:"Tom X.", date:d(o), startH:16, endH:24, status:(o<0?"published":"draft") as const }]
  })),

  // ── SECURITY ──────────────────────────────────────────────────────────────
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e21_${o}`, categoryId:"c5", employeeId:"e21", employee:"Uma G.",    date:d(o), startH:6,  endH:14, breakStartH:10, breakEndH:10.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e22_${o}`, categoryId:"c5", employeeId:"e22", employee:"Victor I.", date:d(o), startH:14, endH:22, breakStartH:18, breakEndH:18.5, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].map(o => ({ id:`e23_${o}`, categoryId:"c5", employeeId:"e23", employee:"Wendy Q.", date:d(o), startH:22, endH:30, status:"published" as const }))),
  ...([-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7].flatMap(o => {
    const dow = new Date(new Date().setDate(new Date().getDate()+o)).getDay()
    if (![5,6,0].includes(dow)) return []
    return [{ id:`e24_${o}`, categoryId:"c5", employeeId:"e24", employee:"Xavier Y.", date:d(o), startH:10, endH:18, status:"published" as const }]
  })),
]

// ── Markers ──────────────────────────────────────────────────────────────────
export const demoMarkers: SchedulerMarker[] = [
  { id:"mk1", date:d(0), hour:9,  label:"Morning briefing", color:"#3b82f6" },
  { id:"mk2", date:d(1), hour:14, label:"Shift handover",   color:"#f59e0b" },
  { id:"mk3", date:d(3), hour:8,  label:"Audit inspection", color:"#ef4444" },
]

// ── Availability ─────────────────────────────────────────────────────────────
export const demoAvailability: EmployeeAvailability[] = [
  { employeeId:"e04", windows:[{ day:1,from:8,to:14 },{ day:3,from:8,to:14 },{ day:5,from:8,to:14 }] },
  { employeeId:"e05", windows:[{ day:2,from:12,to:20 },{ day:4,from:12,to:20 },{ day:6,from:12,to:20 }] },
  { employeeId:"e15", windows:[{ day:5,from:9,to:18 },{ day:6,from:9,to:18 },{ day:0,from:9,to:18 }] },
]

export const demoDependencies: ShiftDependency[] = [
  { id:"dep1", type:"precedence", sourceId:"e01", targetId:"e02", status:"published" as const },
  { id:"dep2", type:"precedence", sourceId:"e02", targetId:"e03", status:"published" as const },
  { id:"dep3", type:"precedence", sourceId:"e03", targetId:"e04", status:"published" as const },
  { id:"dep4", type:"precedence", sourceId:"e04", targetId:"e05", status:"published" as const },
  { id:"dep5", type:"precedence", sourceId:"e05", targetId:"e06", status:"published" as const },
]    

// ── Small dataset (used elsewhere) ───────────────────────────────────────────
export const smallCategories: Resource[] = [
  { id:"sc1", name:"Service", colorIdx:0, kind:"category" },
  { id:"sc2", name:"Kitchen", colorIdx:1, kind:"category" },
]

export const smallEmployees: Resource[] = [
  { id:"se1", name:"Alex",   categoryId:"sc1", avatar:"AX", colorIdx:0, kind:"employee" },
  { id:"se2", name:"Sam",    categoryId:"sc1", avatar:"SM", colorIdx:0, kind:"employee" },
  { id:"se3", name:"Jordan", categoryId:"sc2", avatar:"JR", colorIdx:1, kind:"employee" },
  { id:"se4", name:"Casey",  categoryId:"sc2", avatar:"CS", colorIdx:1, kind:"employee" },
]

export const smallShifts: Block[] = [
  ...([-3,-2,-1,0,1,2,3].flatMap(o => [
    { id:`ss_${o}_1`, categoryId:"sc1", employeeId:"se1", employee:"Alex",   date:d(o), startH:8,  endH:16, status:"published" as const },
    { id:`ss_${o}_2`, categoryId:"sc1", employeeId:"se2", employee:"Sam",    date:d(o), startH:14, endH:22, status:"published" as const },
    { id:`ss_${o}_3`, categoryId:"sc2", employeeId:"se3", employee:"Jordan", date:d(o), startH:8,  endH:16, status:"published" as const },
    { id:`ss_${o}_4`, categoryId:"sc2", employeeId:"se4", employee:"Casey",  date:d(o), startH:14, endH:22, status:"published" as const },
  ]))
]
