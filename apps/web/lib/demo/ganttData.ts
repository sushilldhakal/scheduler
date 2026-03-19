import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const ganttTeams: Resource[] = [
  { id:'frontend', name:'Frontend',  colorIdx:0, kind:'category' },
  { id:'backend',  name:'Backend',   colorIdx:2, kind:'category' },
  { id:'design',   name:'Design',    colorIdx:4, kind:'category' },
  { id:'qa',       name:'QA',        colorIdx:6, kind:'category' },
  { id:'devops',   name:'DevOps',    colorIdx:1, kind:'category' },
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

// Get Mon–Fri of current week
function getWeekDay(dow: number) {
  // dow: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri
  const today = new Date()
  today.setHours(0,0,0,0)
  const day = today.getDay() // 0=Sun, 1=Mon...
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + mondayOffset + dow)
  return toDateISO(monday)
}

const MON = getWeekDay(0)
const TUE = getWeekDay(1)
const WED = getWeekDay(2)
const THU = getWeekDay(3)
const FRI = getWeekDay(4)

export const ganttTasks: Block[] = [
  // Frontend — full week
  { id:'g01', categoryId:'frontend', employeeId:'m1', employee:'Alice — Component Library',   date:MON, startH:8, endH:17, status:'published' },
  { id:'g02', categoryId:'frontend', employeeId:'m1', employee:'Alice — Component Library',   date:TUE, startH:8, endH:17, status:'published' },
  { id:'g03', categoryId:'frontend', employeeId:'m1', employee:'Alice — Dashboard UI',        date:WED, startH:8, endH:17, status:'published' },
  { id:'g04', categoryId:'frontend', employeeId:'m1', employee:'Alice — Dashboard UI',        date:THU, startH:8, endH:17, status:'draft'     },
  { id:'g05', categoryId:'frontend', employeeId:'m1', employee:'Alice — Code Review',         date:FRI, startH:8, endH:17, status:'draft'     },
  { id:'g06', categoryId:'frontend', employeeId:'m2', employee:'Bob — Auth Flow',             date:MON, startH:8, endH:17, status:'published' },
  { id:'g07', categoryId:'frontend', employeeId:'m2', employee:'Bob — Auth Flow',             date:TUE, startH:8, endH:17, status:'published' },
  { id:'g08', categoryId:'frontend', employeeId:'m2', employee:'Bob — Testing',               date:WED, startH:8, endH:17, status:'published' },
  { id:'g09', categoryId:'frontend', employeeId:'m2', employee:'Bob — Bug Fixes',             date:THU, startH:8, endH:17, status:'draft'     },
  { id:'g10', categoryId:'frontend', employeeId:'m2', employee:'Bob — PR Review',             date:FRI, startH:8, endH:17, status:'draft'     },
  // Backend — full week
  { id:'g11', categoryId:'backend',  employeeId:'m3', employee:'Carlos — API Design',         date:MON, startH:8, endH:17, status:'published' },
  { id:'g12', categoryId:'backend',  employeeId:'m3', employee:'Carlos — API Implementation', date:TUE, startH:8, endH:17, status:'published' },
  { id:'g13', categoryId:'backend',  employeeId:'m3', employee:'Carlos — API Implementation', date:WED, startH:8, endH:17, status:'published' },
  { id:'g14', categoryId:'backend',  employeeId:'m3', employee:'Carlos — Integration Tests',  date:THU, startH:8, endH:17, status:'draft'     },
  { id:'g15', categoryId:'backend',  employeeId:'m3', employee:'Carlos — Documentation',      date:FRI, startH:8, endH:17, status:'draft'     },
  { id:'g16', categoryId:'backend',  employeeId:'m4', employee:'Diana — Database Schema',     date:MON, startH:8, endH:17, status:'published' },
  { id:'g17', categoryId:'backend',  employeeId:'m4', employee:'Diana — Migrations',          date:TUE, startH:8, endH:17, status:'published' },
  { id:'g18', categoryId:'backend',  employeeId:'m4', employee:'Diana — Performance Tuning',  date:WED, startH:8, endH:17, status:'published' },
  { id:'g19', categoryId:'backend',  employeeId:'m4', employee:'Diana — Caching Layer',       date:THU, startH:8, endH:17, status:'draft'     },
  { id:'g20', categoryId:'backend',  employeeId:'m4', employee:'Diana — Load Testing',        date:FRI, startH:8, endH:17, status:'draft'     },
  // Design — full week
  { id:'g21', categoryId:'design',   employeeId:'m5', employee:'Eva — Wireframes',            date:MON, startH:8, endH:17, status:'published' },
  { id:'g22', categoryId:'design',   employeeId:'m5', employee:'Eva — Design System',         date:TUE, startH:8, endH:17, status:'published' },
  { id:'g23', categoryId:'design',   employeeId:'m5', employee:'Eva — Prototypes',            date:WED, startH:8, endH:17, status:'published' },
  { id:'g24', categoryId:'design',   employeeId:'m5', employee:'Eva — Handoff',               date:THU, startH:8, endH:17, status:'draft'     },
  { id:'g25', categoryId:'design',   employeeId:'m5', employee:'Eva — Revisions',             date:FRI, startH:8, endH:17, status:'draft'     },
  // QA — full week
  { id:'g26', categoryId:'qa',       employeeId:'m6', employee:'Frank — Test Planning',       date:MON, startH:8, endH:17, status:'published' },
  { id:'g27', categoryId:'qa',       employeeId:'m6', employee:'Frank — Unit Tests',          date:TUE, startH:8, endH:17, status:'published' },
  { id:'g28', categoryId:'qa',       employeeId:'m6', employee:'Frank — E2E Tests',           date:WED, startH:8, endH:17, status:'draft'     },
  { id:'g29', categoryId:'qa',       employeeId:'m6', employee:'Frank — Regression Suite',    date:THU, startH:8, endH:17, status:'draft'     },
  { id:'g30', categoryId:'qa',       employeeId:'m6', employee:'Frank — Release Check',       date:FRI, startH:8, endH:17, status:'draft'     },
  // DevOps — full week
  { id:'g31', categoryId:'devops',   employeeId:'m7', employee:'Grace — CI/CD Pipeline',      date:MON, startH:8, endH:17, status:'published' },
  { id:'g32', categoryId:'devops',   employeeId:'m7', employee:'Grace — Container Setup',     date:TUE, startH:8, endH:17, status:'published' },
  { id:'g33', categoryId:'devops',   employeeId:'m7', employee:'Grace — Staging Deploy',      date:WED, startH:8, endH:17, status:'published' },
  { id:'g34', categoryId:'devops',   employeeId:'m7', employee:'Grace — Monitoring Setup',    date:THU, startH:8, endH:17, status:'draft'     },
  { id:'g35', categoryId:'devops',   employeeId:'m7', employee:'Grace — Production Deploy',   date:FRI, startH:8, endH:17, status:'draft'     },
]
