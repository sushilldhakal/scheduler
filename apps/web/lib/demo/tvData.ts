import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const channels: Resource[] = [
  { id:'bbc1',  name:'BBC One',       colorIdx:0, kind:'category' },
  { id:'bbc2',  name:'BBC Two',       colorIdx:1, kind:'category' },
  { id:'itv',   name:'ITV',           colorIdx:2, kind:'category' },
  { id:'ch4',   name:'Channel 4',     colorIdx:3, kind:'category' },
  { id:'sky1',  name:'Sky One',       colorIdx:4, kind:'category' },
  { id:'netflix',name:'Netflix Live', colorIdx:5, kind:'category' },
]

// In TV mode, each channel "employs" itself as the programme block anchor
export const channelEmployees: Resource[] = channels.map(c => ({
  ...c, kind: 'employee' as const, categoryId: c.id
}))

function d(offsetDays: number) {
  const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate() + offsetDays)
  return toDateISO(dt)
}

export const programmes: Block[] = [
  // BBC One
  { id:'tv1',  categoryId:'bbc1', employeeId:'bbc1', employee:'Morning News',        date:d(0), startH:6.5, endH:7,   status:'published' },
  { id:'tv2',  categoryId:'bbc1', employeeId:'bbc1', employee:'Breakfast',           date:d(0), startH:7,   endH:9.25,status:'published' },
  { id:'tv3',  categoryId:'bbc1', employeeId:'bbc1', employee:'The One Show',        date:d(0), startH:19,  endH:19.5,status:'published' },
  { id:'tv4',  categoryId:'bbc1', employeeId:'bbc1', employee:'EastEnders',          date:d(0), startH:19.5,endH:20,  status:'published' },
  { id:'tv5',  categoryId:'bbc1', employeeId:'bbc1', employee:'News at Ten',         date:d(0), startH:22,  endH:22.5,status:'published' },
  { id:'tv6',  categoryId:'bbc1', employeeId:'bbc1', employee:'Late Night',          date:d(0), startH:22.5,endH:24,  status:'published' },
  // BBC Two
  { id:'tv7',  categoryId:'bbc2', employeeId:'bbc2', employee:'Newsnight',           date:d(0), startH:22.5,endH:23.5,status:'published' },
  { id:'tv8',  categoryId:'bbc2', employeeId:'bbc2', employee:'Horizon',             date:d(0), startH:21,  endH:22,  status:'published' },
  { id:'tv9',  categoryId:'bbc2', employeeId:'bbc2', employee:'University Challenge', date:d(0), startH:19, endH:19.5,status:'published' },
  // ITV
  { id:'tv10', categoryId:'itv',  employeeId:'itv',  employee:'Good Morning Britain',date:d(0), startH:6,   endH:8.5, status:'published' },
  { id:'tv11', categoryId:'itv',  employeeId:'itv',  employee:'Emmerdale',           date:d(0), startH:19,  endH:19.5,status:'published' },
  { id:'tv12', categoryId:'itv',  employeeId:'itv',  employee:'Coronation Street',   date:d(0), startH:20,  endH:21,  status:'published' },
  { id:'tv13', categoryId:'itv',  employeeId:'itv',  employee:'ITV News',            date:d(0), startH:22,  endH:22.5,status:'published' },
  // Channel 4
  { id:'tv14', categoryId:'ch4',  employeeId:'ch4',  employee:'Channel 4 News',      date:d(0), startH:19,  endH:19.75,status:'published'},
  { id:'tv15', categoryId:'ch4',  employeeId:'ch4',  employee:'Gogglebox',           date:d(0), startH:21,  endH:22,  status:'published' },
  { id:'tv16', categoryId:'ch4',  employeeId:'ch4',  employee:'The Big Narstie Show',date:d(0), startH:22,  endH:23,  status:'draft'     },
  // Sky One
  { id:'tv17', categoryId:'sky1', employeeId:'sky1', employee:'The Simpsons',        date:d(0), startH:18,  endH:18.5,status:'published' },
  { id:'tv18', categoryId:'sky1', employeeId:'sky1', employee:'Brassic',             date:d(0), startH:21,  endH:22,  status:'published' },
  { id:'tv19', categoryId:'sky1', employeeId:'sky1', employee:'Sky News Tonight',    date:d(0), startH:22,  endH:23,  status:'published' },
  // Next day highlights
  { id:'tv20', categoryId:'bbc1', employeeId:'bbc1', employee:'Panorama',            date:d(1), startH:20.5,endH:21.25,status:'draft'   },
  { id:'tv21', categoryId:'ch4',  employeeId:'ch4',  employee:'Dispatches',          date:d(1), startH:20,  endH:21,  status:'draft'     },
]
