import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const ganttTeams: Resource[] = [
  { id:'frontend', name:'Frontend',      colorIdx:0, kind:'category' },
  { id:'backend',  name:'Backend',       colorIdx:2, kind:'category' },
  { id:'design',   name:'Design',        colorIdx:4, kind:'category' },
  { id:'qa',       name:'QA',            colorIdx:6, kind:'category' },
  { id:'devops',   name:'DevOps',        colorIdx:1, kind:'category' },
]

export const ganttMembers: Resource[] = [
  { id:'m1', name:'Alice (FE Lead)',   categoryId:'frontend', colorIdx:0, kind:'employee' },
  { id:'m2', name:'Bob (FE Dev)',      categoryId:'frontend', colorIdx:0, kind:'employee' },
  { id:'m3', name:'Carlos (BE Lead)',  categoryId:'backend',  colorIdx:2, kind:'employee' },
  { id:'m4', name:'Diana (BE Dev)',    categoryId:'backend',  colorIdx:2, kind:'employee' },
  { id:'m5', name:'Eva (Designer)',    categoryId:'design',   colorIdx:4, kind:'employee' },
  { id:'m6', name:'Frank (QA Lead)',   categoryId:'qa',       colorIdx:6, kind:'employee' },
  { id:'m7', name:'Grace (DevOps)',    categoryId:'devops',   colorIdx:1, kind:'employee' },
]

function d(offsetDays: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offsetDays)
  return toDateISO(dt)
}

// Gantt uses full-day tasks: startH=8 endH=17 represents a workday
export const ganttTasks: Block[] = [
  // Frontend sprint
  { id:'g1',  categoryId:'frontend', employeeId:'m1', employee:'Alice — Component Library',  date:d(-2), startH:8, endH:17, status:'published' },
  { id:'g2',  categoryId:'frontend', employeeId:'m1', employee:'Alice — Component Library',  date:d(-1), startH:8, endH:17, status:'published' },
  { id:'g3',  categoryId:'frontend', employeeId:'m1', employee:'Alice — Dashboard UI',       date:d(0),  startH:8, endH:17, status:'published' },
  { id:'g4',  categoryId:'frontend', employeeId:'m2', employee:'Bob — Auth Flow',            date:d(-1), startH:8, endH:17, status:'published' },
  { id:'g5',  categoryId:'frontend', employeeId:'m2', employee:'Bob — Auth Flow',            date:d(0),  startH:8, endH:17, status:'published' },
  { id:'g6',  categoryId:'frontend', employeeId:'m2', employee:'Bob — Testing',              date:d(1),  startH:8, endH:17, status:'draft'     },
  // Backend
  { id:'g7',  categoryId:'backend',  employeeId:'m3', employee:'Carlos — API Design',        date:d(-3), startH:8, endH:17, status:'published' },
  { id:'g8',  categoryId:'backend',  employeeId:'m3', employee:'Carlos — API Implementation',date:d(-2), startH:8, endH:17, status:'published' },
  { id:'g9',  categoryId:'backend',  employeeId:'m3', employee:'Carlos — API Implementation',date:d(-1), startH:8, endH:17, status:'published' },
  { id:'g10', categoryId:'backend',  employeeId:'m4', employee:'Diana — Database Schema',    date:d(-2), startH:8, endH:17, status:'published' },
  { id:'g11', categoryId:'backend',  employeeId:'m4', employee:'Diana — Migrations',         date:d(0),  startH:8, endH:17, status:'published' },
  { id:'g12', categoryId:'backend',  employeeId:'m4', employee:'Diana — Performance',        date:d(2),  startH:8, endH:17, status:'draft'     },
  // Design
  { id:'g13', categoryId:'design',   employeeId:'m5', employee:'Eva — Wireframes',           date:d(-4), startH:8, endH:17, status:'published' },
  { id:'g14', categoryId:'design',   employeeId:'m5', employee:'Eva — Design System',        date:d(-2), startH:8, endH:17, status:'published' },
  { id:'g15', categoryId:'design',   employeeId:'m5', employee:'Eva — Handoff',              date:d(1),  startH:8, endH:17, status:'draft'     },
  // QA
  { id:'g16', categoryId:'qa',       employeeId:'m6', employee:'Frank — Test Planning',      date:d(-1), startH:8, endH:17, status:'published' },
  { id:'g17', categoryId:'qa',       employeeId:'m6', employee:'Frank — E2E Tests',          date:d(2),  startH:8, endH:17, status:'draft'     },
  { id:'g18', categoryId:'qa',       employeeId:'m6', employee:'Frank — Release Check',      date:d(4),  startH:8, endH:17, status:'draft'     },
  // DevOps
  { id:'g19', categoryId:'devops',   employeeId:'m7', employee:'Grace — CI/CD Pipeline',     date:d(-3), startH:8, endH:17, status:'published' },
  { id:'g20', categoryId:'devops',   employeeId:'m7', employee:'Grace — Staging Deploy',     date:d(1),  startH:8, endH:17, status:'draft'     },
  { id:'g21', categoryId:'devops',   employeeId:'m7', employee:'Grace — Production Deploy',  date:d(5),  startH:8, endH:17, status:'draft'     },
]
