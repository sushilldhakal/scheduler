import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const venueSpaces: Resource[] = [
  { id:'grand',    name:'Grand Ballroom',     colorIdx:0, kind:'category' },
  { id:'rooftop',  name:'Rooftop Terrace',    colorIdx:3, kind:'category' },
  { id:'board1',   name:'Boardroom A',        colorIdx:1, kind:'category' },
  { id:'board2',   name:'Boardroom B',        colorIdx:2, kind:'category' },
  { id:'garden',   name:'Secret Garden',      colorIdx:4, kind:'category' },
  { id:'cinema',   name:'Private Cinema',     colorIdx:5, kind:'category' },
]

export const venueClients: Resource[] = [
  { id:'v1', name:'Acme Corp (Annual Gala)',     categoryId:'grand',   colorIdx:0, kind:'employee' },
  { id:'v2', name:'Johnson Wedding',             categoryId:'grand',   colorIdx:0, kind:'employee' },
  { id:'v3', name:'TechConf 2026',               categoryId:'rooftop', colorIdx:3, kind:'employee' },
  { id:'v4', name:'Davies & Co',                 categoryId:'board1',  colorIdx:1, kind:'employee' },
  { id:'v5', name:'Smith Legal',                 categoryId:'board2',  colorIdx:2, kind:'employee' },
  { id:'v6', name:'Green Wedding',               categoryId:'garden',  colorIdx:4, kind:'employee' },
  { id:'v7', name:'Film Preview — Studio A',     categoryId:'cinema',  colorIdx:5, kind:'employee' },
]

function d(offsetDays: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offsetDays)
  return toDateISO(dt)
}

export const bookings: Block[] = [
  // Grand Ballroom
  { id:'b1',  categoryId:'grand',   employeeId:'v1', employee:'Acme Corp Annual Gala',    date:d(0), startH:18, endH:23,  status:'published' },
  { id:'b2',  categoryId:'grand',   employeeId:'v2', employee:'Johnson Wedding Reception', date:d(2), startH:14, endH:23,  status:'published' },
  { id:'b3',  categoryId:'grand',   employeeId:'v2', employee:'Johnson Wedding Setup',     date:d(2), startH:9,  endH:13,  status:'published' },
  { id:'b4',  categoryId:'grand',   employeeId:'v1', employee:'Acme Corp Lunch',          date:d(5), startH:12, endH:15,  status:'draft'     },
  // Rooftop Terrace
  { id:'b5',  categoryId:'rooftop', employeeId:'v3', employee:'TechConf Networking Night', date:d(0), startH:17, endH:22,  status:'published' },
  { id:'b6',  categoryId:'rooftop', employeeId:'v3', employee:'TechConf Day 1 Drinks',     date:d(1), startH:18, endH:21,  status:'published' },
  { id:'b7',  categoryId:'rooftop', employeeId:'v3', employee:'TechConf Day 2 Drinks',     date:d(2), startH:18, endH:21,  status:'draft'     },
  // Boardrooms
  { id:'b8',  categoryId:'board1',  employeeId:'v4', employee:'Davies & Co Board Meeting',  date:d(0), startH:9,  endH:12,  status:'published' },
  { id:'b9',  categoryId:'board1',  employeeId:'v4', employee:'Davies & Co Strategy Day',   date:d(1), startH:9,  endH:17,  status:'published' },
  { id:'b10', categoryId:'board2',  employeeId:'v5', employee:'Smith Legal — Deposition',   date:d(0), startH:10, endH:16,  status:'published' },
  { id:'b11', categoryId:'board2',  employeeId:'v5', employee:'Smith Legal — Settlement',   date:d(3), startH:14, endH:18,  status:'draft'     },
  // Garden
  { id:'b12', categoryId:'garden',  employeeId:'v6', employee:'Green Wedding Ceremony',     date:d(3), startH:14, endH:16,  status:'published' },
  { id:'b13', categoryId:'garden',  employeeId:'v6', employee:'Green Wedding Reception',    date:d(3), startH:16, endH:22,  status:'published' },
  // Cinema
  { id:'b14', categoryId:'cinema',  employeeId:'v7', employee:'Film Preview — Screener A',  date:d(0), startH:19, endH:21.5,status:'published' },
  { id:'b15', categoryId:'cinema',  employeeId:'v7', employee:'Film Preview — Screener B',  date:d(1), startH:19, endH:21.5,status:'draft'     },
]
