import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const venueSpaces: Resource[] = [
  { id:'grand',   name:'Grand Ballroom',    colorIdx:0, kind:'category' },
  { id:'rooftop', name:'Rooftop Terrace',   colorIdx:3, kind:'category' },
  { id:'board1',  name:'Boardroom A',       colorIdx:1, kind:'category' },
  { id:'board2',  name:'Boardroom B',       colorIdx:2, kind:'category' },
  { id:'garden',  name:'Secret Garden',     colorIdx:4, kind:'category' },
  { id:'cinema',  name:'Private Cinema',    colorIdx:5, kind:'category' },
]

export const venueClients: Resource[] = [
  { id:'v1',  name:'Acme Corp',           categoryId:'grand',   colorIdx:0, kind:'employee' },
  { id:'v2',  name:'Johnson Wedding',     categoryId:'grand',   colorIdx:0, kind:'employee' },
  { id:'v3',  name:'TechConf',            categoryId:'rooftop', colorIdx:3, kind:'employee' },
  { id:'v4',  name:'Davies & Co',         categoryId:'board1',  colorIdx:1, kind:'employee' },
  { id:'v5',  name:'Smith Legal',         categoryId:'board1',  colorIdx:1, kind:'employee' },
  { id:'v6',  name:'Reed Consulting',     categoryId:'board2',  colorIdx:2, kind:'employee' },
  { id:'v7',  name:'Apex Finance',        categoryId:'board2',  colorIdx:2, kind:'employee' },
  { id:'v8',  name:'Green Wedding',       categoryId:'garden',  colorIdx:4, kind:'employee' },
  { id:'v9',  name:'Pop-up Dining',       categoryId:'garden',  colorIdx:4, kind:'employee' },
  { id:'v10', name:'Film Preview',        categoryId:'cinema',  colorIdx:5, kind:'employee' },
]

function today() {
  const dt = new Date(); dt.setHours(0,0,0,0); return toDateISO(dt)
}
const T = today()

export const bookings: Block[] = [
  // Grand Ballroom — packed today 8–23
  { id:'b01', categoryId:'grand',   employeeId:'v1',  employee:'Acme Corp — Team Breakfast',         date:T, startH:8,  endH:10,  status:'published' },
  { id:'b02', categoryId:'grand',   employeeId:'v1',  employee:'Acme Corp — All-hands',              date:T, startH:10.5,endH:13, status:'published' },
  { id:'b03', categoryId:'grand',   employeeId:'v2',  employee:'Johnson Wedding — Setup',            date:T, startH:14,  endH:16, status:'published' },
  { id:'b04', categoryId:'grand',   employeeId:'v2',  employee:'Johnson Wedding — Ceremony',         date:T, startH:16,  endH:17, status:'published' },
  { id:'b05', categoryId:'grand',   employeeId:'v2',  employee:'Johnson Wedding — Reception',        date:T, startH:17.5,endH:23, status:'published' },
  // Rooftop Terrace — packed today 8–22
  { id:'b06', categoryId:'rooftop', employeeId:'v3',  employee:'TechConf — Morning Arrivals',        date:T, startH:8,   endH:9.5, status:'published' },
  { id:'b07', categoryId:'rooftop', employeeId:'v3',  employee:'TechConf — Keynote Breakfast',       date:T, startH:9.5, endH:11,  status:'published' },
  { id:'b08', categoryId:'rooftop', employeeId:'v3',  employee:'TechConf — Networking Lunch',        date:T, startH:12,  endH:14,  status:'published' },
  { id:'b09', categoryId:'rooftop', employeeId:'v3',  employee:'TechConf — Afternoon Sessions',      date:T, startH:14.5,endH:17,  status:'published' },
  { id:'b10', categoryId:'rooftop', employeeId:'v3',  employee:'TechConf — Drinks & Networking',     date:T, startH:18,  endH:22,  status:'published' },
  // Boardroom A — packed today 8–20
  { id:'b11', categoryId:'board1',  employeeId:'v4',  employee:'Davies & Co — Board Meeting',        date:T, startH:8,   endH:11,  status:'published' },
  { id:'b12', categoryId:'board1',  employeeId:'v4',  employee:'Davies & Co — Strategy Workshop',    date:T, startH:11.5,endH:14,  status:'published' },
  { id:'b13', categoryId:'board1',  employeeId:'v5',  employee:'Smith Legal — Deposition',           date:T, startH:14.5,endH:17,  status:'published' },
  { id:'b14', categoryId:'board1',  employeeId:'v5',  employee:'Smith Legal — Settlement Review',    date:T, startH:17.5,endH:20,  status:'draft'     },
  // Boardroom B — packed today 8–20
  { id:'b15', categoryId:'board2',  employeeId:'v6',  employee:'Reed Consulting — Client Pitch',     date:T, startH:8,   endH:10,  status:'published' },
  { id:'b16', categoryId:'board2',  employeeId:'v6',  employee:'Reed Consulting — Workshop',         date:T, startH:10.5,endH:13,  status:'published' },
  { id:'b17', categoryId:'board2',  employeeId:'v7',  employee:'Apex Finance — Due Diligence',       date:T, startH:14,  endH:17,  status:'published' },
  { id:'b18', categoryId:'board2',  employeeId:'v7',  employee:'Apex Finance — Partner Review',      date:T, startH:17.5,endH:20,  status:'draft'     },
  // Secret Garden — packed today 10–22
  { id:'b19', categoryId:'garden',  employeeId:'v8',  employee:'Green Wedding — Setup',              date:T, startH:10,  endH:13,  status:'published' },
  { id:'b20', categoryId:'garden',  employeeId:'v8',  employee:'Green Wedding — Ceremony',           date:T, startH:14,  endH:15.5,status:'published' },
  { id:'b21', categoryId:'garden',  employeeId:'v8',  employee:'Green Wedding — Garden Party',       date:T, startH:16,  endH:22,  status:'published' },
  // Private Cinema — packed today 10–23
  { id:'b22', categoryId:'cinema',  employeeId:'v10', employee:'Film Preview — Morning Screener',    date:T, startH:10,  endH:12,  status:'published' },
  { id:'b23', categoryId:'cinema',  employeeId:'v10', employee:'Film Preview — Press Junket',        date:T, startH:12.5,endH:14.5,status:'published' },
  { id:'b24', categoryId:'cinema',  employeeId:'v10', employee:'Film Preview — Afternoon Screener',  date:T, startH:15,  endH:17,  status:'published' },
  { id:'b25', categoryId:'cinema',  employeeId:'v10', employee:'Film Preview — Evening Gala',        date:T, startH:19,  endH:23,  status:'draft'     },
]
