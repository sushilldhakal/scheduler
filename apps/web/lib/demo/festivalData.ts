import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const festivalStages: Resource[] = [
  { id:'main',    name:'Main Stage',      colorIdx:5, kind:'category' },
  { id:'second',  name:'Second Stage',    colorIdx:3, kind:'category' },
  { id:'acoustic',name:'Acoustic Garden', colorIdx:2, kind:'category' },
  { id:'electronic',name:'Electronic Dome',colorIdx:7,kind:'category' },
  { id:'comedy',  name:'Comedy Tent',     colorIdx:1, kind:'category' },
]

export const festivalArtists: Resource[] = [
  { id:'a1', name:'The Midnight',       categoryId:'main',      colorIdx:5, kind:'employee' },
  { id:'a2', name:'Arcade Fire',        categoryId:'main',      colorIdx:5, kind:'employee' },
  { id:'a3', name:'Glass Animals',      categoryId:'second',    colorIdx:3, kind:'employee' },
  { id:'a4', name:'Wet Leg',            categoryId:'second',    colorIdx:3, kind:'employee' },
  { id:'a5', name:'Phoebe Bridgers',    categoryId:'acoustic',  colorIdx:2, kind:'employee' },
  { id:'a6', name:'Iron & Wine',        categoryId:'acoustic',  colorIdx:2, kind:'employee' },
  { id:'a7', name:'Four Tet',           categoryId:'electronic',colorIdx:7, kind:'employee' },
  { id:'a8', name:'Floating Points',    categoryId:'electronic',colorIdx:7, kind:'employee' },
]

function d(offsetDays: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offsetDays); return toDateISO(dt)
}

export const festivalSets: Block[] = [
  // Day 1
  { id:'fs1',  categoryId:'main',      employeeId:'a1', employee:'The Midnight',    date:d(0), startH:20,   endH:21.5,  status:'published' },
  { id:'fs2',  categoryId:'main',      employeeId:'a2', employee:'Arcade Fire',     date:d(0), startH:22,   endH:23.75, status:'published' },
  { id:'fs3',  categoryId:'second',    employeeId:'a3', employee:'Glass Animals',   date:d(0), startH:18,   endH:19.5,  status:'published' },
  { id:'fs4',  categoryId:'second',    employeeId:'a4', employee:'Wet Leg',         date:d(0), startH:20.5, endH:22,    status:'published' },
  { id:'fs5',  categoryId:'acoustic',  employeeId:'a5', employee:'Phoebe Bridgers', date:d(0), startH:17,   endH:18.5,  status:'published' },
  { id:'fs6',  categoryId:'acoustic',  employeeId:'a6', employee:'Iron & Wine',     date:d(0), startH:15,   endH:16.5,  status:'published' },
  { id:'fs7',  categoryId:'electronic',employeeId:'a7', employee:'Four Tet',        date:d(0), startH:22,   endH:24,    status:'published' },
  { id:'fs8',  categoryId:'electronic',employeeId:'a8', employee:'Floating Points', date:d(0), startH:19,   endH:21,    status:'published' },
  // Day 2
  { id:'fs9',  categoryId:'main',      employeeId:'a2', employee:'Arcade Fire',     date:d(1), startH:19,   endH:20.5,  status:'published' },
  { id:'fs10', categoryId:'main',      employeeId:'a1', employee:'The Midnight',    date:d(1), startH:21.5, endH:23,    status:'draft'     },
  { id:'fs11', categoryId:'second',    employeeId:'a4', employee:'Wet Leg',         date:d(1), startH:17,   endH:18.5,  status:'published' },
  { id:'fs12', categoryId:'second',    employeeId:'a3', employee:'Glass Animals',   date:d(1), startH:20,   endH:21.5,  status:'published' },
  { id:'fs13', categoryId:'acoustic',  employeeId:'a5', employee:'Phoebe Bridgers', date:d(1), startH:18,   endH:19.5,  status:'published' },
  { id:'fs14', categoryId:'electronic',employeeId:'a7', employee:'Four Tet',        date:d(1), startH:21,   endH:23,    status:'published' },
  // Day 3
  { id:'fs15', categoryId:'main',      employeeId:'a1', employee:'The Midnight',    date:d(2), startH:20,   endH:22,    status:'draft'     },
  { id:'fs16', categoryId:'second',    employeeId:'a3', employee:'Glass Animals',   date:d(2), startH:19,   endH:20.5,  status:'published' },
  { id:'fs17', categoryId:'electronic',employeeId:'a8', employee:'Floating Points', date:d(2), startH:22,   endH:24,    status:'published' },
]
