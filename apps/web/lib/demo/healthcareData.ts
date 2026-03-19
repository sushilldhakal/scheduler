import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const wards: Resource[] = [
  { id:'ane',    name:'A&E',           colorIdx:0, kind:'category' },
  { id:'icu',    name:'ICU',           colorIdx:1, kind:'category' },
  { id:'surgery',name:'Surgery',       colorIdx:2, kind:'category' },
  { id:'ward-a', name:'General Ward A',colorIdx:3, kind:'category' },
  { id:'ward-b', name:'General Ward B',colorIdx:4, kind:'category' },
]

export const staff: Resource[] = [
  { id:'n1', name:'Dr. Patel',         categoryId:'ane',     colorIdx:0, kind:'employee' },
  { id:'n2', name:'Nurse Williams',    categoryId:'ane',     colorIdx:0, kind:'employee' },
  { id:'n3', name:'Dr. Osei',         categoryId:'icu',     colorIdx:1, kind:'employee' },
  { id:'n4', name:'Nurse Rodriguez',  categoryId:'icu',     colorIdx:1, kind:'employee' },
  { id:'n5', name:'Dr. Kim',          categoryId:'surgery', colorIdx:2, kind:'employee' },
  { id:'n6', name:'Dr. Thompson',     categoryId:'surgery', colorIdx:2, kind:'employee' },
  { id:'n7', name:'Nurse Johnson',    categoryId:'ward-a',  colorIdx:3, kind:'employee' },
  { id:'n8', name:'Nurse Clarke',     categoryId:'ward-b',  colorIdx:4, kind:'employee' },
]

function d(offsetDays: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offsetDays)
  return toDateISO(dt)
}

export const rotas: Block[] = [
  // A&E — 24hr coverage, 12hr shifts
  { id:'h1',  categoryId:'ane',     employeeId:'n1', employee:'Dr. Patel',        date:d(0), startH:7,  endH:19, status:'published' },
  { id:'h2',  categoryId:'ane',     employeeId:'n2', employee:'Nurse Williams',   date:d(0), startH:7,  endH:19, status:'published' },
  { id:'h3',  categoryId:'ane',     employeeId:'n1', employee:'Dr. Patel',        date:d(0), startH:19, endH:24, status:'published' },
  { id:'h4',  categoryId:'ane',     employeeId:'n2', employee:'Nurse Williams',   date:d(1), startH:0,  endH:7,  status:'published' },
  { id:'h5',  categoryId:'ane',     employeeId:'n1', employee:'Dr. Patel',        date:d(1), startH:7,  endH:19, status:'draft'     },
  // ICU
  { id:'h6',  categoryId:'icu',     employeeId:'n3', employee:'Dr. Osei',         date:d(0), startH:8,  endH:20, status:'published' },
  { id:'h7',  categoryId:'icu',     employeeId:'n4', employee:'Nurse Rodriguez',  date:d(0), startH:8,  endH:20, status:'published' },
  { id:'h8',  categoryId:'icu',     employeeId:'n3', employee:'Dr. Osei',         date:d(1), startH:8,  endH:20, status:'published' },
  { id:'h9',  categoryId:'icu',     employeeId:'n4', employee:'Nurse Rodriguez',  date:d(1), startH:8,  endH:20, status:'draft'     },
  // Surgery — daytime only
  { id:'h10', categoryId:'surgery', employeeId:'n5', employee:'Dr. Kim',          date:d(0), startH:7,  endH:15, status:'published' },
  { id:'h11', categoryId:'surgery', employeeId:'n6', employee:'Dr. Thompson',     date:d(0), startH:12, endH:20, status:'published' },
  { id:'h12', categoryId:'surgery', employeeId:'n5', employee:'Dr. Kim',          date:d(1), startH:7,  endH:15, status:'published' },
  { id:'h13', categoryId:'surgery', employeeId:'n6', employee:'Dr. Thompson',     date:d(1), startH:12, endH:20, status:'draft'     },
  // General wards
  { id:'h14', categoryId:'ward-a',  employeeId:'n7', employee:'Nurse Johnson',    date:d(0), startH:7,  endH:19, status:'published' },
  { id:'h15', categoryId:'ward-a',  employeeId:'n7', employee:'Nurse Johnson',    date:d(1), startH:7,  endH:19, status:'published' },
  { id:'h16', categoryId:'ward-b',  employeeId:'n8', employee:'Nurse Clarke',     date:d(0), startH:7,  endH:19, status:'published' },
  { id:'h17', categoryId:'ward-b',  employeeId:'n8', employee:'Nurse Clarke',     date:d(1), startH:7,  endH:19, status:'draft'     },
  { id:'h18', categoryId:'ward-b',  employeeId:'n8', employee:'Nurse Clarke',     date:d(2), startH:7,  endH:19, status:'published' },
]
