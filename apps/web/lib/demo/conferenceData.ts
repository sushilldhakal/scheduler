import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const conferenceRooms: Resource[] = [
  { id:'keynote',   name:'Keynote Hall',      colorIdx:0, kind:'category' },
  { id:'ballroom',  name:'Grand Ballroom',    colorIdx:1, kind:'category' },
  { id:'workshopA', name:'Workshop A',        colorIdx:2, kind:'category' },
  { id:'workshopB', name:'Workshop B',        colorIdx:3, kind:'category' },
  { id:'startup',   name:'Startup Stage',     colorIdx:4, kind:'category' },
  { id:'lounge',    name:'Networking Lounge', colorIdx:5, kind:'category' },
]

export const conferenceSpeakers: Resource[] = [
  { id:'sp01', name:'Dr. Sarah Chen',        categoryId:'keynote',   colorIdx:0, kind:'employee' },
  { id:'sp02', name:'Mark Thompson',         categoryId:'keynote',   colorIdx:0, kind:'employee' },
  { id:'sp03', name:'Prof. Aisha Okafor',    categoryId:'ballroom',  colorIdx:1, kind:'employee' },
  { id:'sp04', name:'Lena Müller',           categoryId:'ballroom',  colorIdx:1, kind:'employee' },
  { id:'sp05', name:'Raj Patel',             categoryId:'workshopA', colorIdx:2, kind:'employee' },
  { id:'sp06', name:'Yuki Tanaka',           categoryId:'workshopA', colorIdx:2, kind:'employee' },
  { id:'sp07', name:'Carlos Rivera',         categoryId:'workshopB', colorIdx:3, kind:'employee' },
  { id:'sp08', name:'Amira Hassan',          categoryId:'workshopB', colorIdx:3, kind:'employee' },
  { id:'sp09', name:'Dr. Priya Singh',       categoryId:'startup',   colorIdx:4, kind:'employee' },
  { id:'sp10', name:'Tom Nakamura',          categoryId:'startup',   colorIdx:4, kind:'employee' },
  { id:'sp11', name:'Grace Liu',             categoryId:'lounge',    colorIdx:5, kind:'employee' },
  { id:'sp12', name:'David Osei',            categoryId:'lounge',    colorIdx:5, kind:'employee' },
]

function day(offset: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offset); return toDateISO(dt)
}
const D0 = day(0)
const D1 = day(1)
const D2 = day(2)

export const conferenceSessions: Block[] = [
  // ── DAY 1 ─────────────────────────────────────────────────────────────────
  // Keynote Hall
  { id:'k01', categoryId:'keynote',   employeeId:'sp01', employee:'Opening Keynote: The Age of AI',            date:D0, startH:9,    endH:10,   status:'published' },
  { id:'k02', categoryId:'keynote',   employeeId:'sp02', employee:'Enterprise AI Adoption at Scale',           date:D0, startH:10.5, endH:11.5, status:'published' },
  { id:'k03', categoryId:'keynote',   employeeId:'sp01', employee:'Lunch Panel: AI Ethics & Governance',       date:D0, startH:12,   endH:13,   status:'published' },
  { id:'k04', categoryId:'keynote',   employeeId:'sp02', employee:'Platform Engineering in 2025',              date:D0, startH:14,   endH:15,   status:'published' },
  { id:'k05', categoryId:'keynote',   employeeId:'sp01', employee:'Day 1 Closing: What\'s Next in Cloud',      date:D0, startH:17,   endH:18,   status:'published' },
  // Grand Ballroom
  { id:'b01', categoryId:'ballroom',  employeeId:'sp03', employee:'ML in Healthcare: Real-world Impact',       date:D0, startH:9,    endH:10.5, status:'published' },
  { id:'b02', categoryId:'ballroom',  employeeId:'sp04', employee:'Responsible AI: A Practitioner\'s Guide',   date:D0, startH:11,   endH:12,   status:'published' },
  { id:'b03', categoryId:'ballroom',  employeeId:'sp03', employee:'Data Privacy in the Post-GPT Era',          date:D0, startH:13.5, endH:14.5, status:'published' },
  { id:'b04', categoryId:'ballroom',  employeeId:'sp04', employee:'Quantum Computing: Hype vs. Reality',       date:D0, startH:15,   endH:16,   status:'published' },
  { id:'b05', categoryId:'ballroom',  employeeId:'sp03', employee:'Fireside Chat: Building the Next Unicorn',  date:D0, startH:16.5, endH:17.5, status:'published' },
  // Workshop A
  { id:'w01', categoryId:'workshopA', employeeId:'sp05', employee:'Hands-on: Kubernetes Deep Dive (Part 1)',   date:D0, startH:9,    endH:11,   status:'published' },
  { id:'w02', categoryId:'workshopA', employeeId:'sp06', employee:'Hands-on: Kubernetes Deep Dive (Part 2)',   date:D0, startH:11.5, endH:13.5, status:'published' },
  { id:'w03', categoryId:'workshopA', employeeId:'sp05', employee:'Workshop: React Server Components',         date:D0, startH:14.5, endH:16.5, status:'published' },
  // Workshop B
  { id:'w04', categoryId:'workshopB', employeeId:'sp07', employee:'Hands-on: Terraform & Infrastructure as Code',date:D0,startH:9,  endH:11,   status:'published' },
  { id:'w05', categoryId:'workshopB', employeeId:'sp08', employee:'Workshop: GraphQL API Design Patterns',     date:D0, startH:11.5, endH:13.5, status:'published' },
  { id:'w06', categoryId:'workshopB', employeeId:'sp07', employee:'Workshop: Observability with OpenTelemetry',date:D0, startH:14.5, endH:16.5, status:'published' },
  // Startup Stage
  { id:'s01', categoryId:'startup',   employeeId:'sp09', employee:'Pitch Slam: Seed Stage (6 startups)',       date:D0, startH:10,   endH:12,   status:'published' },
  { id:'s02', categoryId:'startup',   employeeId:'sp10', employee:'VC Office Hours — Open Session',             date:D0, startH:13,   endH:15,   status:'published' },
  { id:'s03', categoryId:'startup',   employeeId:'sp09', employee:'Founder Roundtable: PMF Stories',           date:D0, startH:15.5, endH:17,   status:'published' },
  // Lounge
  { id:'l01', categoryId:'lounge',    employeeId:'sp11', employee:'Speed Networking: Developers & Founders',   date:D0, startH:10,   endH:11,   status:'published' },
  { id:'l02', categoryId:'lounge',    employeeId:'sp12', employee:'Women in Tech Breakfast',                   date:D0, startH:8,    endH:9,    status:'published' },
  { id:'l03', categoryId:'lounge',    employeeId:'sp11', employee:'Sponsor Showcase & Demos',                  date:D0, startH:13,   endH:14,   status:'published' },
  { id:'l04', categoryId:'lounge',    employeeId:'sp12', employee:'Evening Drinks & Awards Ceremony',          date:D0, startH:18,   endH:20,   status:'published' },

  // ── DAY 2 ─────────────────────────────────────────────────────────────────
  { id:'k06', categoryId:'keynote',   employeeId:'sp02', employee:'Day 2 Keynote: Developer Experience in 2025',date:D1,startH:9,   endH:10,   status:'published' },
  { id:'k07', categoryId:'keynote',   employeeId:'sp01', employee:'The Open Source AI Movement',               date:D1, startH:10.5, endH:11.5, status:'published' },
  { id:'k08', categoryId:'keynote',   employeeId:'sp02', employee:'Panel: Engineering Leadership at Scale',     date:D1, startH:13,   endH:14,   status:'published' },
  { id:'k09', categoryId:'keynote',   employeeId:'sp01', employee:'Security First: Zero-Trust Architecture',   date:D1, startH:14.5, endH:15.5, status:'published' },
  { id:'k10', categoryId:'keynote',   employeeId:'sp02', employee:'Day 2 Closing Keynote + Q&A',               date:D1, startH:17,   endH:18,   status:'published' },

  { id:'b06', categoryId:'ballroom',  employeeId:'sp04', employee:'LLM Fine-tuning: From Zero to Production',  date:D1, startH:9,    endH:10.5, status:'published' },
  { id:'b07', categoryId:'ballroom',  employeeId:'sp03', employee:'Edge Computing Meets AI Inference',         date:D1, startH:11,   endH:12,   status:'published' },
  { id:'b08', categoryId:'ballroom',  employeeId:'sp04', employee:'Multi-cloud Strategy: Lessons Learned',     date:D1, startH:13.5, endH:14.5, status:'published' },
  { id:'b09', categoryId:'ballroom',  employeeId:'sp03', employee:'Microservices vs Monolith: 2025 Verdict',   date:D1, startH:15,   endH:16,   status:'published' },
  { id:'b10', categoryId:'ballroom',  employeeId:'sp04', employee:'Data Mesh in the Enterprise',               date:D1, startH:16.5, endH:17.5, status:'draft'     },

  { id:'w07', categoryId:'workshopA', employeeId:'sp06', employee:'Workshop: LLM Fine-tuning (Part 1)',        date:D1, startH:9,    endH:11,   status:'published' },
  { id:'w08', categoryId:'workshopA', employeeId:'sp06', employee:'Workshop: LLM Fine-tuning (Part 2)',        date:D1, startH:11.5, endH:13.5, status:'published' },
  { id:'w09', categoryId:'workshopA', employeeId:'sp05', employee:'Workshop: CI/CD with GitHub Actions',       date:D1, startH:14.5, endH:16.5, status:'published' },

  { id:'w10', categoryId:'workshopB', employeeId:'sp08', employee:'Workshop: Microservices Patterns',          date:D1, startH:9,    endH:11,   status:'published' },
  { id:'w11', categoryId:'workshopB', employeeId:'sp07', employee:'Workshop: Event-Driven Architecture',       date:D1, startH:11.5, endH:13.5, status:'published' },
  { id:'w12', categoryId:'workshopB', employeeId:'sp08', employee:'Workshop: Load Testing at Scale',           date:D1, startH:14.5, endH:16.5, status:'draft'     },

  { id:'s04', categoryId:'startup',   employeeId:'sp10', employee:'Demo Day: Series A Companies',              date:D1, startH:10,   endH:12,   status:'published' },
  { id:'s05', categoryId:'startup',   employeeId:'sp09', employee:'GTM Strategy Masterclass',                  date:D1, startH:13,   endH:14.5, status:'published' },
  { id:'s06', categoryId:'startup',   employeeId:'sp10', employee:'Product-Market Fit: 5 Real Case Studies',   date:D1, startH:15,   endH:17,   status:'published' },

  { id:'l05', categoryId:'lounge',    employeeId:'sp12', employee:'Morning Coffee & Networking',               date:D1, startH:8,    endH:9,    status:'published' },
  { id:'l06', categoryId:'lounge',    employeeId:'sp11', employee:'Career Fair: 30 Top Tech Companies',        date:D1, startH:11,   endH:13,   status:'published' },
  { id:'l07', categoryId:'lounge',    employeeId:'sp12', employee:'Diversity & Inclusion Forum',               date:D1, startH:15,   endH:16.5, status:'published' },
  { id:'l08', categoryId:'lounge',    employeeId:'sp11', employee:'Hackathon Kick-off & Team Formation',       date:D1, startH:18,   endH:20,   status:'published' },

  // ── DAY 3 ─────────────────────────────────────────────────────────────────
  { id:'k11', categoryId:'keynote',   employeeId:'sp01', employee:'Day 3 Keynote: The Future We\'re Building', date:D2, startH:9,    endH:10,   status:'draft'     },
  { id:'k12', categoryId:'keynote',   employeeId:'sp02', employee:'WebAssembly: The Next Chapter',              date:D2, startH:10.5, endH:11.5, status:'draft'     },
  { id:'k13', categoryId:'keynote',   employeeId:'sp01', employee:'Closing Ceremony & Hackathon Awards',        date:D2, startH:15,   endH:17,   status:'draft'     },

  { id:'b11', categoryId:'ballroom',  employeeId:'sp03', employee:'Sustainability in Tech: Net-Zero Engineering',date:D2,startH:9,   endH:10,   status:'draft'     },
  { id:'b12', categoryId:'ballroom',  employeeId:'sp04', employee:'The Future of Programming Languages',        date:D2, startH:10.5, endH:11.5, status:'draft'     },
  { id:'b13', categoryId:'ballroom',  employeeId:'sp03', employee:'AR/VR in the Enterprise: 2025 Use Cases',   date:D2, startH:13,   endH:14.5, status:'draft'     },

  { id:'w13', categoryId:'workshopA', employeeId:'sp05', employee:'Capstone Workshop: Build & Deploy a RAG App',date:D2,startH:9,   endH:13,   status:'draft'     },
  { id:'w14', categoryId:'workshopA', employeeId:'sp06', employee:'Workshop: Advanced Kubernetes Operators',   date:D2, startH:14,   endH:16,   status:'draft'     },

  { id:'w15', categoryId:'workshopB', employeeId:'sp07', employee:'Capstone: Production-Ready Microservices',  date:D2, startH:9,    endH:13,   status:'draft'     },
  { id:'w16', categoryId:'workshopB', employeeId:'sp08', employee:'Workshop: Chaos Engineering Fundamentals',  date:D2, startH:14,   endH:16,   status:'draft'     },

  { id:'s07', categoryId:'startup',   employeeId:'sp09', employee:'Hackathon Final Presentations (8 teams)',   date:D2, startH:10,   endH:13,   status:'draft'     },
  { id:'s08', categoryId:'startup',   employeeId:'sp10', employee:'Investor Speed Dating: 20 VCs',             date:D2, startH:14,   endH:16,   status:'draft'     },

  { id:'l09', categoryId:'lounge',    employeeId:'sp11', employee:'Final Networking Breakfast',                date:D2, startH:8,    endH:9,    status:'draft'     },
  { id:'l10', categoryId:'lounge',    employeeId:'sp12', employee:'Job Board Open Hours',                      date:D2, startH:11,   endH:13,   status:'draft'     },
  { id:'l11', categoryId:'lounge',    employeeId:'sp11', employee:'Farewell Reception & Last Demos',           date:D2, startH:17,   endH:19,   status:'draft'     },
]
