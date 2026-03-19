import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const conferenceRooms: Resource[] = [
  { id:'main',      name:'Main Auditorium',   colorIdx:0, kind:'category' },
  { id:'ballroom',  name:'Grand Ballroom',    colorIdx:1, kind:'category' },
  { id:'workshop1', name:'Workshop A',        colorIdx:2, kind:'category' },
  { id:'workshop2', name:'Workshop B',        colorIdx:3, kind:'category' },
  { id:'breakout1', name:'Breakout Room 1',   colorIdx:4, kind:'category' },
  { id:'breakout2', name:'Breakout Room 2',   colorIdx:5, kind:'category' },
]

export const conferenceSpeakers: Resource[] = [
  { id:'sp1', name:'Dr. Sarah Chen',       categoryId:'main',      colorIdx:0, kind:'employee' },
  { id:'sp2', name:'Mark Thompson',        categoryId:'main',      colorIdx:0, kind:'employee' },
  { id:'sp3', name:'Prof. James Okafor',   categoryId:'ballroom',  colorIdx:1, kind:'employee' },
  { id:'sp4', name:'Lena Müller',          categoryId:'ballroom',  colorIdx:1, kind:'employee' },
  { id:'sp5', name:'Raj Patel',            categoryId:'workshop1', colorIdx:2, kind:'employee' },
  { id:'sp6', name:'Yuki Tanaka',          categoryId:'workshop1', colorIdx:2, kind:'employee' },
  { id:'sp7', name:'Carlos Rivera',        categoryId:'workshop2', colorIdx:3, kind:'employee' },
  { id:'sp8', name:'Amira Hassan',         categoryId:'workshop2', colorIdx:3, kind:'employee' },
  { id:'sp9', name:'Dr. Priya Singh',      categoryId:'breakout1', colorIdx:4, kind:'employee' },
  { id:'sp10',name:'Tom Nakamura',         categoryId:'breakout2', colorIdx:5, kind:'employee' },
]

function today() {
  const dt = new Date(); dt.setHours(0,0,0,0); return toDateISO(dt)
}
const T = today()

export const conferenceSessions: Block[] = [
  // Main Auditorium — back to back 8–20
  { id:'cs01', categoryId:'main',      employeeId:'sp1',  employee:'Opening Keynote — Dr. Sarah Chen',       date:T, startH:8,    endH:9,    status:'published' },
  { id:'cs02', categoryId:'main',      employeeId:'sp2',  employee:'The Future of AI in Enterprise',         date:T, startH:9,    endH:10,   status:'published' },
  { id:'cs03', categoryId:'main',      employeeId:'sp1',  employee:'Panel: Ethics in Tech',                  date:T, startH:10.25,endH:11.25,status:'published' },
  { id:'cs04', categoryId:'main',      employeeId:'sp2',  employee:'Scaling Distributed Systems',            date:T, startH:11.5, endH:12.5, status:'published' },
  { id:'cs05', categoryId:'main',      employeeId:'sp1',  employee:'Afternoon Keynote — Cloud Native',       date:T, startH:13.5, endH:14.5, status:'published' },
  { id:'cs06', categoryId:'main',      employeeId:'sp2',  employee:'DevSecOps at Scale',                     date:T, startH:14.75,endH:15.75,status:'published' },
  { id:'cs07', categoryId:'main',      employeeId:'sp1',  employee:'Closing Panel — Next Decade in Tech',    date:T, startH:16,   endH:17,   status:'published' },
  { id:'cs08', categoryId:'main',      employeeId:'sp2',  employee:'Networking Reception Kickoff',           date:T, startH:18,   endH:20,   status:'published' },
  // Grand Ballroom — back to back 8–20
  { id:'cs09', categoryId:'ballroom',  employeeId:'sp3',  employee:'Machine Learning in Healthcare',         date:T, startH:8,    endH:9.25, status:'published' },
  { id:'cs10', categoryId:'ballroom',  employeeId:'sp4',  employee:'Responsible AI: A Framework',            date:T, startH:9.5,  endH:10.5, status:'published' },
  { id:'cs11', categoryId:'ballroom',  employeeId:'sp3',  employee:'Blockchain Beyond Crypto',               date:T, startH:10.75,endH:11.75,status:'published' },
  { id:'cs12', categoryId:'ballroom',  employeeId:'sp4',  employee:'Lunch & Learn: Quantum Computing',       date:T, startH:12,   endH:13,   status:'published' },
  { id:'cs13', categoryId:'ballroom',  employeeId:'sp3',  employee:'Data Privacy in the Age of AI',          date:T, startH:13.5, endH:14.5, status:'published' },
  { id:'cs14', categoryId:'ballroom',  employeeId:'sp4',  employee:'Edge Computing and IoT',                 date:T, startH:14.75,endH:15.75,status:'published' },
  { id:'cs15', categoryId:'ballroom',  employeeId:'sp3',  employee:'Fireside Chat: Building Unicorns',       date:T, startH:16,   endH:17,   status:'published' },
  { id:'cs16', categoryId:'ballroom',  employeeId:'sp4',  employee:'Awards Ceremony',                        date:T, startH:18,   endH:20,   status:'published' },
  // Workshop A — back to back 8–18
  { id:'cs17', categoryId:'workshop1', employeeId:'sp5',  employee:'Hands-on: Kubernetes Mastery',           date:T, startH:8,    endH:10,   status:'published' },
  { id:'cs18', categoryId:'workshop1', employeeId:'sp6',  employee:'Workshop: React Server Components',      date:T, startH:10.25,endH:12.25,status:'published' },
  { id:'cs19', categoryId:'workshop1', employeeId:'sp5',  employee:'Workshop: LLM Fine-tuning',              date:T, startH:13,   endH:15,   status:'published' },
  { id:'cs20', categoryId:'workshop1', employeeId:'sp6',  employee:'Workshop: CI/CD Pipelines',              date:T, startH:15.25,endH:17.25,status:'draft'     },
  // Workshop B — back to back 8–18
  { id:'cs21', categoryId:'workshop2', employeeId:'sp7',  employee:'Hands-on: Terraform & IaC',              date:T, startH:8,    endH:10,   status:'published' },
  { id:'cs22', categoryId:'workshop2', employeeId:'sp8',  employee:'Workshop: GraphQL APIs',                 date:T, startH:10.25,endH:12.25,status:'published' },
  { id:'cs23', categoryId:'workshop2', employeeId:'sp7',  employee:'Workshop: Microservices Patterns',       date:T, startH:13,   endH:15,   status:'published' },
  { id:'cs24', categoryId:'workshop2', employeeId:'sp8',  employee:'Workshop: Observability & Monitoring',   date:T, startH:15.25,endH:17.25,status:'draft'     },
  // Breakout 1 — packed 8–18
  { id:'cs25', categoryId:'breakout1', employeeId:'sp9',  employee:'Startup Pitch: Seed Stage',              date:T, startH:8,    endH:9,    status:'published' },
  { id:'cs26', categoryId:'breakout1', employeeId:'sp9',  employee:'VC Office Hours',                        date:T, startH:9.25, endH:11.25,status:'published' },
  { id:'cs27', categoryId:'breakout1', employeeId:'sp9',  employee:'Founder Roundtable',                     date:T, startH:11.5, endH:13,   status:'published' },
  { id:'cs28', categoryId:'breakout1', employeeId:'sp9',  employee:'Product-Market Fit Deep Dive',           date:T, startH:14,   endH:15.5, status:'published' },
  { id:'cs29', categoryId:'breakout1', employeeId:'sp9',  employee:'Go-to-Market Strategies',                date:T, startH:16,   endH:18,   status:'draft'     },
  // Breakout 2 — packed 8–18
  { id:'cs30', categoryId:'breakout2', employeeId:'sp10', employee:'Career Paths in Tech',                   date:T, startH:8,    endH:9,    status:'published' },
  { id:'cs31', categoryId:'breakout2', employeeId:'sp10', employee:'Hiring & Diversity Panel',               date:T, startH:9.25, endH:10.25,status:'published' },
  { id:'cs32', categoryId:'breakout2', employeeId:'sp10', employee:'Remote Work Culture',                    date:T, startH:10.5, endH:11.5, status:'published' },
  { id:'cs33', categoryId:'breakout2', employeeId:'sp10', employee:'Mental Health in Tech',                  date:T, startH:12,   endH:13,   status:'published' },
  { id:'cs34', categoryId:'breakout2', employeeId:'sp10', employee:'Leadership & Engineering Management',    date:T, startH:14,   endH:15.5, status:'published' },
  { id:'cs35', categoryId:'breakout2', employeeId:'sp10', employee:'Open Source Contributions',              date:T, startH:16,   endH:18,   status:'draft'     },
]
