import type { Block, Resource, ShiftDependency } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const ganttTeams: Resource[] = [
  { id:'design',   name:'Design',        colorIdx:4, kind:'category' },
  { id:'frontend', name:'Frontend',      colorIdx:0, kind:'category' },
  { id:'backend',  name:'Backend',       colorIdx:2, kind:'category' },
  { id:'mobile',   name:'Mobile',        colorIdx:6, kind:'category' },
  { id:'qa',       name:'QA & Testing',  colorIdx:5, kind:'category' },
  { id:'devops',   name:'DevOps',        colorIdx:1, kind:'category' },
]

export const ganttMembers: Resource[] = [
  { id:'m01', name:'Eva Chen (Design Lead)',    categoryId:'design',   colorIdx:4, kind:'employee' },
  { id:'m02', name:'Omar Diallo (UX)',          categoryId:'design',   colorIdx:4, kind:'employee' },
  { id:'m03', name:'Alice Park (FE Lead)',      categoryId:'frontend', colorIdx:0, kind:'employee' },
  { id:'m04', name:'Ben Torres (FE)',           categoryId:'frontend', colorIdx:0, kind:'employee' },
  { id:'m05', name:'Chloe Kim (FE)',            categoryId:'frontend', colorIdx:0, kind:'employee' },
  { id:'m06', name:'Carlos Ruiz (BE Lead)',     categoryId:'backend',  colorIdx:2, kind:'employee' },
  { id:'m07', name:'Diana Osei (BE)',           categoryId:'backend',  colorIdx:2, kind:'employee' },
  { id:'m08', name:'Finn Walsh (BE)',           categoryId:'backend',  colorIdx:2, kind:'employee' },
  { id:'m09', name:'Gita Nair (iOS)',           categoryId:'mobile',   colorIdx:6, kind:'employee' },
  { id:'m10', name:'Hiro Suzuki (Android)',     categoryId:'mobile',   colorIdx:6, kind:'employee' },
  { id:'m11', name:'Iris Johansson (QA Lead)',  categoryId:'qa',       colorIdx:5, kind:'employee' },
  { id:'m12', name:'Jake Mensah (QA)',          categoryId:'qa',       colorIdx:5, kind:'employee' },
  { id:'m13', name:'Kai Larsson (DevOps Lead)', categoryId:'devops',   colorIdx:1, kind:'employee' },
  { id:'m14', name:'Luna Petrov (SRE)',         categoryId:'devops',   colorIdx:1, kind:'employee' },
]

// Build week dates: Mon of current week, then +7 for next week
function weekDay(weekOffset: number, dow: number) {
  const today = new Date(); today.setHours(0,0,0,0)
  const day = today.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  const dt = new Date(today)
  dt.setDate(today.getDate() + mondayOffset + weekOffset * 7 + dow)
  return toDateISO(dt)
}

// Week 1
const W1 = [0,1,2,3,4].map(i => weekDay(0,i))
// Week 2
const W2 = [0,1,2,3,4].map(i => weekDay(1,i))

const pub = 'published' as const
const drf = 'draft' as const

// Helper: task spanning multiple days
function span(idPfx:string, cat:string, emp:string, name:string, days:string[], sh:number, eh:number, st:'published'|'draft'): Block[] {
  return days.map((dt,i) => ({ id:`${idPfx}_${i}`, categoryId:cat, employeeId:emp, employee:name, date:dt, startH:sh, endH:eh, status:st }))
}

export const ganttTasks: Block[] = [
  // ── DESIGN ─────────────────────────────────────────────────────────────────
  // Eva: Discovery & Research (Mon-Tue W1)
  ...span('des01','design','m01','Discovery & Research',        [W1[0],W1[1]], 9, 17, pub),
  // Omar: User Journey Mapping (Mon-Tue W1)
  ...span('des02','design','m02','User Journey Mapping',        [W1[0],W1[1]], 9, 17, pub),
  // Eva: Wireframes — Core Flows (Wed-Thu W1)
  ...span('des03','design','m01','Wireframes — Core Flows',     [W1[2],W1[3]], 9, 17, pub),
  // Omar: Component Library Design (Wed-Thu W1)
  ...span('des04','design','m02','Component Library Design',    [W1[2],W1[3]], 9, 17, pub),
  // Eva: High-fidelity Mockups (Fri W1 - Mon W2)
  ...span('des05','design','m01','High-fidelity Mockups',       [W1[4],W2[0],W2[1]], 9, 17, pub),
  // Omar: Design System Documentation (Fri W1 - Tue W2)
  ...span('des06','design','m02','Design System Documentation', [W1[4],W2[0],W2[1]], 9, 17, pub),
  // Eva: Design Review & Handoff (Wed-Thu W2)
  ...span('des07','design','m01','Design Review & Handoff',     [W2[2],W2[3]], 9, 17, drf),
  // Omar: Accessibility Audit (Wed-Thu W2)
  ...span('des08','design','m02','Accessibility Audit',         [W2[2],W2[3]], 9, 17, drf),

  // ── FRONTEND ───────────────────────────────────────────────────────────────
  // Alice: Project Setup & Architecture (Mon-Tue W1)
  ...span('fe01','frontend','m03','Project Setup & Architecture',[W1[0],W1[1]], 9, 17, pub),
  // Ben: Auth UI — Login/Register (Mon-Wed W1)
  ...span('fe02','frontend','m04','Auth UI — Login & Register',  [W1[0],W1[1],W1[2]], 9, 17, pub),
  // Chloe: Design System Integration (Tue-Thu W1)
  ...span('fe03','frontend','m05','Design System Integration',   [W1[1],W1[2],W1[3]], 9, 17, pub),
  // Alice: Dashboard Layout (Wed-Fri W1)
  ...span('fe04','frontend','m03','Dashboard Layout & Grid',     [W1[2],W1[3],W1[4]], 9, 17, pub),
  // Ben: User Profile & Settings (Thu-Fri W1)
  ...span('fe05','frontend','m04','User Profile & Settings',     [W1[3],W1[4]], 9, 17, pub),
  // Alice: Data Visualisation Components (Mon-Wed W2)
  ...span('fe06','frontend','m03','Data Visualisation Components',[W2[0],W2[1],W2[2]], 9, 17, drf),
  // Ben: Notifications & Alerts (Mon-Tue W2)
  ...span('fe07','frontend','m04','Notifications & Alerts UI',   [W2[0],W2[1]], 9, 17, drf),
  // Chloe: Mobile Responsive Polish (Mon-Wed W2)
  ...span('fe08','frontend','m05','Mobile Responsive Polish',    [W2[0],W2[1],W2[2]], 9, 17, drf),
  // Alice: Integration with API layer (Thu-Fri W2)
  ...span('fe09','frontend','m03','API Integration & State Mgmt',[W2[3],W2[4]], 9, 17, drf),

  // ── BACKEND ────────────────────────────────────────────────────────────────
  // Carlos: API Design & OpenAPI Spec (Mon-Tue W1)
  ...span('be01','backend','m06','API Design & OpenAPI Spec',    [W1[0],W1[1]], 9, 17, pub),
  // Diana: Database Schema & Migrations (Mon-Wed W1)
  ...span('be02','backend','m07','Database Schema & Migrations', [W1[0],W1[1],W1[2]], 9, 17, pub),
  // Finn: Auth Service — JWT & OAuth (Mon-Thu W1)
  ...span('be03','backend','m08','Auth Service — JWT & OAuth',   [W1[0],W1[1],W1[2],W1[3]], 9, 17, pub),
  // Carlos: Core REST Endpoints (Wed-Fri W1)
  ...span('be04','backend','m06','Core REST Endpoints',          [W1[2],W1[3],W1[4]], 9, 17, pub),
  // Diana: Caching Layer (Redis) (Thu-Fri W1)
  ...span('be05','backend','m07','Caching Layer (Redis)',        [W1[3],W1[4]], 9, 17, pub),
  // Carlos: WebSocket Service (Mon-Wed W2)
  ...span('be06','backend','m06','WebSocket Real-time Service',  [W2[0],W2[1],W2[2]], 9, 17, drf),
  // Diana: Performance Tuning & Indexes (Mon-Tue W2)
  ...span('be07','backend','m07','Performance Tuning & Indexes', [W2[0],W2[1]], 9, 17, drf),
  // Finn: Email & Notification Service (Fri W1 - Tue W2)
  ...span('be08','backend','m08','Email & Notification Service', [W1[4],W2[0],W2[1]], 9, 17, drf),
  // Carlos: API Docs & Integration Guide (Thu-Fri W2)
  ...span('be09','backend','m06','API Docs & Integration Guide', [W2[3],W2[4]], 9, 17, drf),

  // ── MOBILE ─────────────────────────────────────────────────────────────────
  // Gita: iOS Architecture Setup (Mon-Tue W1)
  ...span('mob01','mobile','m09','iOS Architecture Setup',        [W1[0],W1[1]], 9, 17, pub),
  // Hiro: Android Architecture Setup (Mon-Tue W1)
  ...span('mob02','mobile','m10','Android Architecture Setup',    [W1[0],W1[1]], 9, 17, pub),
  // Gita: iOS Auth & Onboarding (Wed-Fri W1)
  ...span('mob03','mobile','m09','iOS Auth & Onboarding',         [W1[2],W1[3],W1[4]], 9, 17, pub),
  // Hiro: Android Auth & Onboarding (Wed-Fri W1)
  ...span('mob04','mobile','m10','Android Auth & Onboarding',     [W1[2],W1[3],W1[4]], 9, 17, pub),
  // Gita: iOS Core Screens (Mon-Thu W2)
  ...span('mob05','mobile','m09','iOS Core Screens',              [W2[0],W2[1],W2[2],W2[3]], 9, 17, drf),
  // Hiro: Android Core Screens (Mon-Thu W2)
  ...span('mob06','mobile','m10','Android Core Screens',          [W2[0],W2[1],W2[2],W2[3]], 9, 17, drf),

  // ── QA ─────────────────────────────────────────────────────────────────────
  // Iris: Test Plan & Strategy (Mon-Tue W1)
  ...span('qa01','qa','m11','Test Plan & Test Strategy',          [W1[0],W1[1]], 9, 17, pub),
  // Jake: Test Environment Setup (Mon-Tue W1)
  ...span('qa02','qa','m12','Test Environment Setup',             [W1[0],W1[1]], 9, 17, pub),
  // Iris: Auth Flow Testing (Wed-Thu W1)
  ...span('qa03','qa','m11','Auth & Security Testing',            [W1[2],W1[3]], 9, 17, pub),
  // Jake: API Contract Testing (Wed-Fri W1)
  ...span('qa04','qa','m12','API Contract & Integration Tests',   [W1[2],W1[3],W1[4]], 9, 17, pub),
  // Iris: E2E Test Suite — Web (Mon-Wed W2)
  ...span('qa05','qa','m11','E2E Test Suite — Web',               [W2[0],W2[1],W2[2]], 9, 17, drf),
  // Jake: Performance & Load Testing (Mon-Wed W2)
  ...span('qa06','qa','m12','Performance & Load Testing',         [W2[0],W2[1],W2[2]], 9, 17, drf),
  // Iris: Mobile QA — iOS & Android (Thu-Fri W2)
  ...span('qa07','qa','m11','Mobile QA — iOS & Android',          [W2[3],W2[4]], 9, 17, drf),
  // Jake: Regression & Release Sign-off (Fri W2)
  { id:'qa08_0', categoryId:'qa', employeeId:'m12', employee:'Regression & Release Sign-off', date:W2[4], startH:9, endH:17, status:drf },

  // ── DEVOPS ─────────────────────────────────────────────────────────────────
  // Kai: CI/CD Pipeline Setup (Mon-Wed W1)
  ...span('ops01','devops','m13','CI/CD Pipeline Setup',          [W1[0],W1[1],W1[2]], 9, 17, pub),
  // Luna: Infrastructure as Code (Mon-Wed W1)
  ...span('ops02','devops','m14','Infrastructure as Code (Terraform)',[W1[0],W1[1],W1[2]], 9, 17, pub),
  // Kai: Containerisation & Docker (Thu-Fri W1)
  ...span('ops03','devops','m13','Containerisation & Docker',     [W1[3],W1[4]], 9, 17, pub),
  // Luna: Staging Environment (Thu-Fri W1)
  ...span('ops04','devops','m14','Staging Environment Deploy',    [W1[3],W1[4]], 9, 17, pub),
  // Kai: Monitoring & Alerting Setup (Mon-Wed W2)
  ...span('ops05','devops','m13','Monitoring & Alerting (Grafana)',[W2[0],W2[1],W2[2]], 9, 17, drf),
  // Luna: Log Aggregation & Tracing (Mon-Wed W2)
  ...span('ops06','devops','m14','Log Aggregation & Tracing',     [W2[0],W2[1],W2[2]], 9, 17, drf),
  // Kai: Production Deploy & Rollback Plan (Thu-Fri W2)
  ...span('ops07','devops','m13','Production Deploy & Rollback',  [W2[3],W2[4]], 9, 17, drf),
  // Luna: Security Hardening (Thu-Fri W2)
  ...span('ops08','devops','m14','Security Hardening & Pentest',  [W2[3],W2[4]], 9, 17, drf),
]

// Dependencies: key finish-to-start relationships
export const ganttDependencies: ShiftDependency[] = [
  // Design → Frontend: handoff triggers component work
  { id:'dep01', fromId:'des03_1', toId:'fe03_0', type:'finish-to-start' },
  { id:'dep02', fromId:'des05_2', toId:'fe06_0', type:'finish-to-start' },
  // Design → Mobile: mockups needed for mobile screens
  { id:'dep03', fromId:'des05_2', toId:'mob05_0', type:'finish-to-start' },
  // Backend API → Frontend integration
  { id:'dep04', fromId:'be04_2', toId:'fe09_0', type:'finish-to-start' },
  // Backend Auth → Frontend Auth UI
  { id:'dep05', fromId:'be03_3', toId:'fe02_2', type:'finish-to-start' },
  // Backend Auth → Mobile Auth
  { id:'dep06', fromId:'be03_3', toId:'mob03_0', type:'finish-to-start' },
  // DB Schema → Caching Layer
  { id:'dep07', fromId:'be02_2', toId:'be05_0', type:'finish-to-start' },
  // DB Schema → Performance Tuning
  { id:'dep08', fromId:'be02_2', toId:'be07_0', type:'finish-to-start' },
  // Staging → E2E Tests
  { id:'dep09', fromId:'ops04_1', toId:'qa05_0', type:'finish-to-start' },
  { id:'dep10', fromId:'ops04_1', toId:'qa06_0', type:'finish-to-start' },
  // CI/CD → Staging
  { id:'dep11', fromId:'ops03_1', toId:'ops04_0', type:'finish-to-start' },
  // E2E Tests → Production Deploy
  { id:'dep12', fromId:'qa05_2', toId:'ops07_0', type:'finish-to-start' },
  // Mobile Core → Mobile QA
  { id:'dep13', fromId:'mob05_3', toId:'qa07_0', type:'finish-to-start' },
  { id:'dep14', fromId:'mob06_3', toId:'qa07_0', type:'finish-to-start' },
  // API Docs → Integration sign-off
  { id:'dep15', fromId:'be09_1', toId:'qa08_0', type:'finish-to-start' },
]
