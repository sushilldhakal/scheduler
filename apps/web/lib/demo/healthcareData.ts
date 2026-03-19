import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const wards: Resource[] = [
  { id:'ane',     name:'A&E',             colorIdx:0, kind:'category' },
  { id:'icu',     name:'ICU',             colorIdx:1, kind:'category' },
  { id:'surgery', name:'Surgery',         colorIdx:2, kind:'category' },
  { id:'ward-a',  name:'General Ward A',  colorIdx:3, kind:'category' },
  { id:'ward-b',  name:'General Ward B',  colorIdx:4, kind:'category' },
]

export const staff: Resource[] = [
  { id:'n1',  name:'Dr. Patel',        categoryId:'ane',     colorIdx:0, kind:'employee' },
  { id:'n2',  name:'Nurse Williams',   categoryId:'ane',     colorIdx:0, kind:'employee' },
  { id:'n3',  name:'Dr. Osei',        categoryId:'ane',     colorIdx:0, kind:'employee' },
  { id:'n4',  name:'Nurse Rodriguez', categoryId:'icu',     colorIdx:1, kind:'employee' },
  { id:'n5',  name:'Dr. Kim',         categoryId:'icu',     colorIdx:1, kind:'employee' },
  { id:'n6',  name:'Nurse Patel',     categoryId:'icu',     colorIdx:1, kind:'employee' },
  { id:'n7',  name:'Dr. Thompson',    categoryId:'surgery', colorIdx:2, kind:'employee' },
  { id:'n8',  name:'Dr. Martinez',    categoryId:'surgery', colorIdx:2, kind:'employee' },
  { id:'n9',  name:'Nurse Johnson',   categoryId:'ward-a',  colorIdx:3, kind:'employee' },
  { id:'n10', name:'Nurse Clarke',    categoryId:'ward-b',  colorIdx:4, kind:'employee' },
]

function d(offsetDays: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offsetDays)
  return toDateISO(dt)
}

// Overnight shifts: endH > 24 means the shift carries into the next day
// e.g. startH:19 endH:31 = 7pm today to 7am tomorrow (12hr night shift)
export const rotas: Block[] = [
  // A&E — 24hr coverage with overnight shifts
  { id:'h01', categoryId:'ane',     employeeId:'n1',  employee:'Dr. Patel',        date:d(0), startH:7,  endH:19,  status:'published' },
  { id:'h02', categoryId:'ane',     employeeId:'n2',  employee:'Nurse Williams',   date:d(0), startH:7,  endH:19,  status:'published' },
  { id:'h03', categoryId:'ane',     employeeId:'n3',  employee:'Dr. Osei',         date:d(0), startH:19, endH:31,  status:'published' }, // 7pm→7am overnight
  { id:'h04', categoryId:'ane',     employeeId:'n1',  employee:'Dr. Patel',        date:d(1), startH:7,  endH:19,  status:'draft'     },
  { id:'h05', categoryId:'ane',     employeeId:'n2',  employee:'Nurse Williams',   date:d(1), startH:7,  endH:19,  status:'published' },
  { id:'h06', categoryId:'ane',     employeeId:'n3',  employee:'Dr. Osei',         date:d(1), startH:19, endH:31,  status:'draft'     },
  { id:'h07', categoryId:'ane',     employeeId:'n1',  employee:'Dr. Patel',        date:d(2), startH:7,  endH:19,  status:'published' },
  { id:'h08', categoryId:'ane',     employeeId:'n3',  employee:'Dr. Osei',         date:d(2), startH:19, endH:31,  status:'published' },
  { id:'h09', categoryId:'ane',     employeeId:'n2',  employee:'Nurse Williams',   date:d(3), startH:7,  endH:19,  status:'published' },
  { id:'h10', categoryId:'ane',     employeeId:'n3',  employee:'Dr. Osei',         date:d(3), startH:19, endH:31,  status:'draft'     },
  { id:'h11', categoryId:'ane',     employeeId:'n1',  employee:'Dr. Patel',        date:d(4), startH:7,  endH:19,  status:'published' },
  // ICU — 12hr shifts
  { id:'h12', categoryId:'icu',     employeeId:'n4',  employee:'Nurse Rodriguez',  date:d(0), startH:8,  endH:20,  status:'published' },
  { id:'h13', categoryId:'icu',     employeeId:'n5',  employee:'Dr. Kim',          date:d(0), startH:8,  endH:20,  status:'published' },
  { id:'h14', categoryId:'icu',     employeeId:'n6',  employee:'Nurse Patel',      date:d(0), startH:20, endH:32,  status:'published' }, // overnight
  { id:'h15', categoryId:'icu',     employeeId:'n4',  employee:'Nurse Rodriguez',  date:d(1), startH:8,  endH:20,  status:'published' },
  { id:'h16', categoryId:'icu',     employeeId:'n5',  employee:'Dr. Kim',          date:d(1), startH:8,  endH:20,  status:'draft'     },
  { id:'h17', categoryId:'icu',     employeeId:'n6',  employee:'Nurse Patel',      date:d(1), startH:20, endH:32,  status:'published' },
  { id:'h18', categoryId:'icu',     employeeId:'n4',  employee:'Nurse Rodriguez',  date:d(2), startH:8,  endH:20,  status:'published' },
  { id:'h19', categoryId:'icu',     employeeId:'n6',  employee:'Nurse Patel',      date:d(2), startH:20, endH:32,  status:'draft'     },
  { id:'h20', categoryId:'icu',     employeeId:'n5',  employee:'Dr. Kim',          date:d(3), startH:8,  endH:20,  status:'published' },
  { id:'h21', categoryId:'icu',     employeeId:'n4',  employee:'Nurse Rodriguez',  date:d(4), startH:8,  endH:20,  status:'published' },
  // Surgery — daytime only
  { id:'h22', categoryId:'surgery', employeeId:'n7',  employee:'Dr. Thompson',     date:d(0), startH:7,  endH:15,  status:'published' },
  { id:'h23', categoryId:'surgery', employeeId:'n8',  employee:'Dr. Martinez',     date:d(0), startH:12, endH:20,  status:'published' },
  { id:'h24', categoryId:'surgery', employeeId:'n7',  employee:'Dr. Thompson',     date:d(1), startH:7,  endH:15,  status:'published' },
  { id:'h25', categoryId:'surgery', employeeId:'n8',  employee:'Dr. Martinez',     date:d(1), startH:12, endH:20,  status:'draft'     },
  { id:'h26', categoryId:'surgery', employeeId:'n7',  employee:'Dr. Thompson',     date:d(2), startH:7,  endH:15,  status:'published' },
  { id:'h27', categoryId:'surgery', employeeId:'n8',  employee:'Dr. Martinez',     date:d(2), startH:12, endH:20,  status:'published' },
  { id:'h28', categoryId:'surgery', employeeId:'n7',  employee:'Dr. Thompson',     date:d(3), startH:7,  endH:15,  status:'published' },
  { id:'h29', categoryId:'surgery', employeeId:'n8',  employee:'Dr. Martinez',     date:d(4), startH:7,  endH:15,  status:'draft'     },
  // General Wards
  { id:'h30', categoryId:'ward-a',  employeeId:'n9',  employee:'Nurse Johnson',    date:d(0), startH:7,  endH:19,  status:'published' },
  { id:'h31', categoryId:'ward-a',  employeeId:'n9',  employee:'Nurse Johnson',    date:d(1), startH:7,  endH:19,  status:'published' },
  { id:'h32', categoryId:'ward-a',  employeeId:'n9',  employee:'Nurse Johnson',    date:d(2), startH:7,  endH:19,  status:'draft'     },
  { id:'h33', categoryId:'ward-a',  employeeId:'n9',  employee:'Nurse Johnson',    date:d(3), startH:7,  endH:19,  status:'published' },
  { id:'h34', categoryId:'ward-a',  employeeId:'n9',  employee:'Nurse Johnson',    date:d(4), startH:7,  endH:19,  status:'published' },
  { id:'h35', categoryId:'ward-b',  employeeId:'n10', employee:'Nurse Clarke',     date:d(0), startH:7,  endH:19,  status:'published' },
  { id:'h36', categoryId:'ward-b',  employeeId:'n10', employee:'Nurse Clarke',     date:d(1), startH:7,  endH:19,  status:'published' },
  { id:'h37', categoryId:'ward-b',  employeeId:'n10', employee:'Nurse Clarke',     date:d(2), startH:7,  endH:19,  status:'published' },
  { id:'h38', categoryId:'ward-b',  employeeId:'n10', employee:'Nurse Clarke',     date:d(3), startH:7,  endH:19,  status:'draft'     },
  { id:'h39', categoryId:'ward-b',  employeeId:'n10', employee:'Nurse Clarke',     date:d(4), startH:7,  endH:19,  status:'published' },
]
