import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const festivalStages: Resource[] = [
  { id:'main',       name:'Main Stage',       colorIdx:5, kind:'category' },
  { id:'second',     name:'Second Stage',     colorIdx:3, kind:'category' },
  { id:'acoustic',   name:'Acoustic Garden',  colorIdx:2, kind:'category' },
  { id:'electronic', name:'Electronic Dome',  colorIdx:7, kind:'category' },
  { id:'comedy',     name:'Comedy Tent',      colorIdx:1, kind:'category' },
]

export const festivalArtists: Resource[] = [
  { id:'a1',  name:'The Midnight',       categoryId:'main',       colorIdx:5, kind:'employee' },
  { id:'a2',  name:'Arcade Fire',        categoryId:'main',       colorIdx:5, kind:'employee' },
  { id:'a3',  name:'Glass Animals',      categoryId:'second',     colorIdx:3, kind:'employee' },
  { id:'a4',  name:'Wet Leg',            categoryId:'second',     colorIdx:3, kind:'employee' },
  { id:'a5',  name:'Phoebe Bridgers',    categoryId:'acoustic',   colorIdx:2, kind:'employee' },
  { id:'a6',  name:'Iron & Wine',        categoryId:'acoustic',   colorIdx:2, kind:'employee' },
  { id:'a7',  name:'Four Tet',           categoryId:'electronic', colorIdx:7, kind:'employee' },
  { id:'a8',  name:'Floating Points',    categoryId:'electronic', colorIdx:7, kind:'employee' },
  { id:'a9',  name:'Bo Burnham',         categoryId:'comedy',     colorIdx:1, kind:'employee' },
  { id:'a10', name:'Hannah Gadsby',      categoryId:'comedy',     colorIdx:1, kind:'employee' },
]

function today() {
  const dt = new Date(); dt.setHours(0,0,0,0); return toDateISO(dt)
}
const T = today()

export const festivalSets: Block[] = [
  // Main Stage — packed 12–24
  { id:'fs01', categoryId:'main',       employeeId:'a1',  employee:'The Midnight',       date:T, startH:12,   endH:13,   status:'published' },
  { id:'fs02', categoryId:'main',       employeeId:'a2',  employee:'Arcade Fire',        date:T, startH:13.5, endH:15,   status:'published' },
  { id:'fs03', categoryId:'main',       employeeId:'a1',  employee:'The Midnight',       date:T, startH:15.5, endH:17,   status:'published' },
  { id:'fs04', categoryId:'main',       employeeId:'a2',  employee:'Arcade Fire',        date:T, startH:17.5, endH:19,   status:'published' },
  { id:'fs05', categoryId:'main',       employeeId:'a1',  employee:'The Midnight — Headline', date:T, startH:20, endH:21.5, status:'published' },
  { id:'fs06', categoryId:'main',       employeeId:'a2',  employee:'Arcade Fire — Headline',  date:T, startH:22, endH:23.75,status:'published' },
  // Second Stage — packed 12–24
  { id:'fs07', categoryId:'second',     employeeId:'a3',  employee:'Glass Animals',      date:T, startH:12,   endH:13.5, status:'published' },
  { id:'fs08', categoryId:'second',     employeeId:'a4',  employee:'Wet Leg',            date:T, startH:14,   endH:15.5, status:'published' },
  { id:'fs09', categoryId:'second',     employeeId:'a3',  employee:'Glass Animals',      date:T, startH:16,   endH:17.5, status:'published' },
  { id:'fs10', categoryId:'second',     employeeId:'a4',  employee:'Wet Leg',            date:T, startH:18,   endH:19.5, status:'published' },
  { id:'fs11', categoryId:'second',     employeeId:'a3',  employee:'Glass Animals — Headline',date:T,startH:20.5,endH:22, status:'published' },
  { id:'fs12', categoryId:'second',     employeeId:'a4',  employee:'Wet Leg — Headline', date:T, startH:22.5, endH:24,   status:'published' },
  // Acoustic Garden — packed 12–22
  { id:'fs13', categoryId:'acoustic',   employeeId:'a5',  employee:'Phoebe Bridgers',    date:T, startH:12,   endH:13.5, status:'published' },
  { id:'fs14', categoryId:'acoustic',   employeeId:'a6',  employee:'Iron & Wine',        date:T, startH:14,   endH:15.5, status:'published' },
  { id:'fs15', categoryId:'acoustic',   employeeId:'a5',  employee:'Phoebe Bridgers',    date:T, startH:16,   endH:17.5, status:'published' },
  { id:'fs16', categoryId:'acoustic',   employeeId:'a6',  employee:'Iron & Wine',        date:T, startH:18,   endH:19.5, status:'published' },
  { id:'fs17', categoryId:'acoustic',   employeeId:'a5',  employee:'Phoebe Bridgers — Headline',date:T,startH:20,endH:22, status:'published' },
  // Electronic Dome — packed 12–24
  { id:'fs18', categoryId:'electronic', employeeId:'a8',  employee:'Floating Points',    date:T, startH:12,   endH:14,   status:'published' },
  { id:'fs19', categoryId:'electronic', employeeId:'a7',  employee:'Four Tet',           date:T, startH:14.5, endH:16.5, status:'published' },
  { id:'fs20', categoryId:'electronic', employeeId:'a8',  employee:'Floating Points',    date:T, startH:17,   endH:19,   status:'published' },
  { id:'fs21', categoryId:'electronic', employeeId:'a7',  employee:'Four Tet',           date:T, startH:19.5, endH:21.5, status:'published' },
  { id:'fs22', categoryId:'electronic', employeeId:'a8',  employee:'Floating Points — B2B',date:T,startH:22,  endH:24,   status:'published' },
  // Comedy Tent — packed 12–22
  { id:'fs23', categoryId:'comedy',     employeeId:'a9',  employee:'Bo Burnham',         date:T, startH:12,   endH:13,   status:'published' },
  { id:'fs24', categoryId:'comedy',     employeeId:'a10', employee:'Hannah Gadsby',      date:T, startH:13.5, endH:14.5, status:'published' },
  { id:'fs25', categoryId:'comedy',     employeeId:'a9',  employee:'Bo Burnham',         date:T, startH:15,   endH:16,   status:'published' },
  { id:'fs26', categoryId:'comedy',     employeeId:'a10', employee:'Hannah Gadsby',      date:T, startH:16.5, endH:17.5, status:'published' },
  { id:'fs27', categoryId:'comedy',     employeeId:'a9',  employee:'Bo Burnham — Late Show',date:T,startH:18, endH:19.5, status:'published' },
  { id:'fs28', categoryId:'comedy',     employeeId:'a10', employee:'Hannah Gadsby — Headline',date:T,startH:20,endH:22, status:'draft'     },
]
