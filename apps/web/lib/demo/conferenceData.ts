import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const conferenceRooms: Resource[] = [
  { id: 'main',     name: 'Main Auditorium', colorIdx: 0, kind: 'category' },
  { id: 'ballroom', name: 'Grand Ballroom',  colorIdx: 1, kind: 'category' },
  { id: 'workshop1',name: 'Workshop A',       colorIdx: 2, kind: 'category' },
  { id: 'workshop2',name: 'Workshop B',       colorIdx: 3, kind: 'category' },
  { id: 'breakout1',name: 'Breakout Room 1',  colorIdx: 4, kind: 'category' },
  { id: 'breakout2',name: 'Breakout Room 2',  colorIdx: 5, kind: 'category' },
]

export const conferenceSpeakers: Resource[] = [
  { id: 'sp1', name: 'Dr. Sarah Chen',       categoryId: 'main',      colorIdx: 0, kind: 'employee' },
  { id: 'sp2', name: 'Mark Thompson',        categoryId: 'main',      colorIdx: 0, kind: 'employee' },
  { id: 'sp3', name: 'Prof. James Okafor',   categoryId: 'ballroom',  colorIdx: 1, kind: 'employee' },
  { id: 'sp4', name: 'Lena Müller',          categoryId: 'ballroom',  colorIdx: 1, kind: 'employee' },
  { id: 'sp5', name: 'Raj Patel',            categoryId: 'workshop1', colorIdx: 2, kind: 'employee' },
  { id: 'sp6', name: 'Yuki Tanaka',          categoryId: 'workshop1', colorIdx: 2, kind: 'employee' },
  { id: 'sp7', name: 'Carlos Rivera',        categoryId: 'workshop2', colorIdx: 3, kind: 'employee' },
  { id: 'sp8', name: 'Amira Hassan',         categoryId: 'workshop2', colorIdx: 3, kind: 'employee' },
]

function d(offsetDays: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offsetDays); return toDateISO(dt)
}

export const conferenceSessions: Block[] = [
  // Day 1 — Main Auditorium
  { id:'cs1',  categoryId:'main',      employeeId:'sp1', employee:'Dr. Sarah Chen',     date:d(0), startH:9,    endH:9.75,  status:'published' },
  { id:'cs2',  categoryId:'main',      employeeId:'sp2', employee:'Mark Thompson',      date:d(0), startH:10,   endH:11,    status:'published' },
  { id:'cs3',  categoryId:'main',      employeeId:'sp1', employee:'Dr. Sarah Chen',     date:d(0), startH:14,   endH:15,    status:'published' },
  { id:'cs4',  categoryId:'main',      employeeId:'sp2', employee:'Mark Thompson',      date:d(0), startH:15.5, endH:16.5,  status:'draft'     },
  // Day 1 — Ballroom
  { id:'cs5',  categoryId:'ballroom',  employeeId:'sp3', employee:'Prof. James Okafor', date:d(0), startH:9.5,  endH:10.5,  status:'published' },
  { id:'cs6',  categoryId:'ballroom',  employeeId:'sp4', employee:'Lena Müller',        date:d(0), startH:11,   endH:12,    status:'published' },
  { id:'cs7',  categoryId:'ballroom',  employeeId:'sp3', employee:'Prof. James Okafor', date:d(0), startH:13,   endH:14.5,  status:'published' },
  // Day 1 — Workshops
  { id:'cs8',  categoryId:'workshop1', employeeId:'sp5', employee:'Raj Patel',          date:d(0), startH:10,   endH:12,    status:'published' },
  { id:'cs9',  categoryId:'workshop1', employeeId:'sp6', employee:'Yuki Tanaka',        date:d(0), startH:14,   endH:16,    status:'published' },
  { id:'cs10', categoryId:'workshop2', employeeId:'sp7', employee:'Carlos Rivera',      date:d(0), startH:10,   endH:11.5,  status:'published' },
  { id:'cs11', categoryId:'workshop2', employeeId:'sp8', employee:'Amira Hassan',       date:d(0), startH:13,   endH:15,    status:'draft'     },
  // Day 2
  { id:'cs12', categoryId:'main',      employeeId:'sp2', employee:'Mark Thompson',      date:d(1), startH:9,    endH:10,    status:'published' },
  { id:'cs13', categoryId:'main',      employeeId:'sp1', employee:'Dr. Sarah Chen',     date:d(1), startH:10.5, endH:12,    status:'published' },
  { id:'cs14', categoryId:'ballroom',  employeeId:'sp4', employee:'Lena Müller',        date:d(1), startH:9,    endH:10.5,  status:'published' },
  { id:'cs15', categoryId:'workshop1', employeeId:'sp5', employee:'Raj Patel',          date:d(1), startH:11,   endH:13,    status:'published' },
  { id:'cs16', categoryId:'workshop2', employeeId:'sp7', employee:'Carlos Rivera',      date:d(1), startH:14,   endH:16,    status:'published' },
  { id:'cs17', categoryId:'breakout1', employeeId:'sp6', employee:'Yuki Tanaka',        date:d(1), startH:9,    endH:11,    status:'published' },
  { id:'cs18', categoryId:'breakout2', employeeId:'sp8', employee:'Amira Hassan',       date:d(1), startH:13,   endH:15,    status:'draft'     },
]
