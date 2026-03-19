import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const channels: Resource[] = [
  { id:'bbc1',    name:'BBC One',       colorIdx:0, kind:'category' },
  { id:'bbc2',    name:'BBC Two',       colorIdx:1, kind:'category' },
  { id:'itv',     name:'ITV',           colorIdx:2, kind:'category' },
  { id:'ch4',     name:'Channel 4',     colorIdx:3, kind:'category' },
  { id:'sky1',    name:'Sky One',       colorIdx:4, kind:'category' },
  { id:'netflix', name:'Netflix Live',  colorIdx:5, kind:'category' },
]

export const channelEmployees: Resource[] = channels.map(c => ({
  ...c, kind: 'employee' as const, categoryId: c.id
}))

function today() {
  const dt = new Date(); dt.setHours(0,0,0,0); return toDateISO(dt)
}
const T = today()

export const programmes: Block[] = [
  // BBC One — packed 6–24
  { id:'bbc1_01', categoryId:'bbc1', employeeId:'bbc1', employee:'Morning News',          date:T, startH:6,    endH:7,    status:'published' },
  { id:'bbc1_02', categoryId:'bbc1', employeeId:'bbc1', employee:'Breakfast',             date:T, startH:7,    endH:9.25, status:'published' },
  { id:'bbc1_03', categoryId:'bbc1', employeeId:'bbc1', employee:'Morning Live',          date:T, startH:9.25, endH:10,   status:'published' },
  { id:'bbc1_04', categoryId:'bbc1', employeeId:'bbc1', employee:'Homes Under the Hammer',date:T, startH:10,   endH:11,   status:'published' },
  { id:'bbc1_05', categoryId:'bbc1', employeeId:'bbc1', employee:'Bargain Hunt',          date:T, startH:11,   endH:12,   status:'published' },
  { id:'bbc1_06', categoryId:'bbc1', employeeId:'bbc1', employee:'BBC News at One',       date:T, startH:12,   endH:12.5, status:'published' },
  { id:'bbc1_07', categoryId:'bbc1', employeeId:'bbc1', employee:'Doctors',               date:T, startH:12.5, endH:13.25,status:'published' },
  { id:'bbc1_08', categoryId:'bbc1', employeeId:'bbc1', employee:'Escape to the Country', date:T, startH:13.25,endH:14,   status:'published' },
  { id:'bbc1_09', categoryId:'bbc1', employeeId:'bbc1', employee:'Pointless',             date:T, startH:14,   endH:15,   status:'published' },
  { id:'bbc1_10', categoryId:'bbc1', employeeId:'bbc1', employee:'BBC News at Five',      date:T, startH:17,   endH:18,   status:'published' },
  { id:'bbc1_11', categoryId:'bbc1', employeeId:'bbc1', employee:'The One Show',          date:T, startH:19,   endH:19.5, status:'published' },
  { id:'bbc1_12', categoryId:'bbc1', employeeId:'bbc1', employee:'EastEnders',            date:T, startH:19.5, endH:20,   status:'published' },
  { id:'bbc1_13', categoryId:'bbc1', employeeId:'bbc1', employee:'Panorama',              date:T, startH:20,   endH:20.75,status:'published' },
  { id:'bbc1_14', categoryId:'bbc1', employeeId:'bbc1', employee:'BBC News at Ten',       date:T, startH:22,   endH:22.5, status:'published' },
  { id:'bbc1_15', categoryId:'bbc1', employeeId:'bbc1', employee:'Late Night Live',       date:T, startH:22.5, endH:24,   status:'published' },
  // BBC Two — packed 6–24
  { id:'bbc2_01', categoryId:'bbc2', employeeId:'bbc2', employee:'Politics Live',         date:T, startH:6,    endH:7,    status:'published' },
  { id:'bbc2_02', categoryId:'bbc2', employeeId:'bbc2', employee:'The Great British Menu',date:T, startH:7,    endH:8,    status:'published' },
  { id:'bbc2_03', categoryId:'bbc2', employeeId:'bbc2', employee:'Antiques Roadshow',     date:T, startH:8,    endH:9,    status:'published' },
  { id:'bbc2_04', categoryId:'bbc2', employeeId:'bbc2', employee:'Flog It!',              date:T, startH:9,    endH:10,   status:'published' },
  { id:'bbc2_05', categoryId:'bbc2', employeeId:'bbc2', employee:'The Repair Shop',       date:T, startH:10,   endH:11,   status:'published' },
  { id:'bbc2_06', categoryId:'bbc2', employeeId:'bbc2', employee:'Money for Nothing',     date:T, startH:11,   endH:12,   status:'published' },
  { id:'bbc2_07', categoryId:'bbc2', employeeId:'bbc2', employee:'BBC News',              date:T, startH:12,   endH:12.5, status:'published' },
  { id:'bbc2_08', categoryId:'bbc2', employeeId:'bbc2', employee:'Gardeners World',       date:T, startH:12.5, endH:13.5, status:'published' },
  { id:'bbc2_09', categoryId:'bbc2', employeeId:'bbc2', employee:'Coast',                 date:T, startH:13.5, endH:14.5, status:'published' },
  { id:'bbc2_10', categoryId:'bbc2', employeeId:'bbc2', employee:'Rick Stein: Seafood',   date:T, startH:14.5, endH:15.5, status:'published' },
  { id:'bbc2_11', categoryId:'bbc2', employeeId:'bbc2', employee:'Springwatch',           date:T, startH:18,   endH:19,   status:'published' },
  { id:'bbc2_12', categoryId:'bbc2', employeeId:'bbc2', employee:'University Challenge',  date:T, startH:19,   endH:19.5, status:'published' },
  { id:'bbc2_13', categoryId:'bbc2', employeeId:'bbc2', employee:'Horizon: The AI Age',   date:T, startH:19.5, endH:20.5, status:'published' },
  { id:'bbc2_14', categoryId:'bbc2', employeeId:'bbc2', employee:'Inside No. 9',          date:T, startH:20.5, endH:21,   status:'published' },
  { id:'bbc2_15', categoryId:'bbc2', employeeId:'bbc2', employee:'Newsnight',             date:T, startH:22.5, endH:23.5, status:'published' },
  { id:'bbc2_16', categoryId:'bbc2', employeeId:'bbc2', employee:'This Week',             date:T, startH:23.5, endH:24,   status:'published' },
  // ITV — packed 6–24
  { id:'itv_01',  categoryId:'itv',  employeeId:'itv',  employee:'Good Morning Britain',  date:T, startH:6,    endH:8.5,  status:'published' },
  { id:'itv_02',  categoryId:'itv',  employeeId:'itv',  employee:'Lorraine',              date:T, startH:8.5,  endH:9.5,  status:'published' },
  { id:'itv_03',  categoryId:'itv',  employeeId:'itv',  employee:'This Morning',          date:T, startH:9.5,  endH:11.5, status:'published' },
  { id:'itv_04',  categoryId:'itv',  employeeId:'itv',  employee:'Loose Women',           date:T, startH:11.5, endH:12.5, status:'published' },
  { id:'itv_05',  categoryId:'itv',  employeeId:'itv',  employee:'ITV Lunchtime News',    date:T, startH:12.5, endH:13,   status:'published' },
  { id:'itv_06',  categoryId:'itv',  employeeId:'itv',  employee:'Judge Rinder',          date:T, startH:13,   endH:14,   status:'published' },
  { id:'itv_07',  categoryId:'itv',  employeeId:'itv',  employee:'The Chase',             date:T, startH:17,   endH:18,   status:'published' },
  { id:'itv_08',  categoryId:'itv',  employeeId:'itv',  employee:'ITV Evening News',      date:T, startH:18,   endH:18.5, status:'published' },
  { id:'itv_09',  categoryId:'itv',  employeeId:'itv',  employee:'Emmerdale',             date:T, startH:19,   endH:19.5, status:'published' },
  { id:'itv_10',  categoryId:'itv',  employeeId:'itv',  employee:'Coronation Street',     date:T, startH:20,   endH:21,   status:'published' },
  { id:'itv_11',  categoryId:'itv',  employeeId:'itv',  employee:'ITV News at Ten',       date:T, startH:22,   endH:22.5, status:'published' },
  { id:'itv_12',  categoryId:'itv',  employeeId:'itv',  employee:'Tonight',               date:T, startH:22.5, endH:23.5, status:'published' },
  { id:'itv_13',  categoryId:'itv',  employeeId:'itv',  employee:'Late Night ITV',        date:T, startH:23.5, endH:24,   status:'published' },
  // Channel 4 — packed 6–24
  { id:'ch4_01',  categoryId:'ch4',  employeeId:'ch4',  employee:'Channel 4 News AM',     date:T, startH:6,    endH:9,    status:'published' },
  { id:'ch4_02',  categoryId:'ch4',  employeeId:'ch4',  employee:'Steph\'s Packed Lunch', date:T, startH:9.5,  endH:11.5, status:'published' },
  { id:'ch4_03',  categoryId:'ch4',  employeeId:'ch4',  employee:'Come Dine With Me',     date:T, startH:11.5, endH:12.5, status:'published' },
  { id:'ch4_04',  categoryId:'ch4',  employeeId:'ch4',  employee:'Four in a Bed',         date:T, startH:12.5, endH:13.5, status:'published' },
  { id:'ch4_05',  categoryId:'ch4',  employeeId:'ch4',  employee:'A Place in the Sun',    date:T, startH:13.5, endH:15,   status:'published' },
  { id:'ch4_06',  categoryId:'ch4',  employeeId:'ch4',  employee:'The Great Pottery Throw',date:T,startH:16,   endH:17,   status:'published' },
  { id:'ch4_07',  categoryId:'ch4',  employeeId:'ch4',  employee:'Channel 4 News',        date:T, startH:19,   endH:19.75,status:'published' },
  { id:'ch4_08',  categoryId:'ch4',  employeeId:'ch4',  employee:'Gogglebox',             date:T, startH:21,   endH:22,   status:'published' },
  { id:'ch4_09',  categoryId:'ch4',  employeeId:'ch4',  employee:'The Big Narstie Show',  date:T, startH:22,   endH:23,   status:'draft'     },
  { id:'ch4_10',  categoryId:'ch4',  employeeId:'ch4',  employee:'Random Acts',           date:T, startH:23,   endH:24,   status:'published' },
  // Sky One — packed 6–24
  { id:'sky_01',  categoryId:'sky1', employeeId:'sky1', employee:'Sky News Sunrise',       date:T, startH:6,    endH:9,    status:'published' },
  { id:'sky_02',  categoryId:'sky1', employeeId:'sky1', employee:'Sky News Today',         date:T, startH:9,    endH:12,   status:'published' },
  { id:'sky_03',  categoryId:'sky1', employeeId:'sky1', employee:'Sky Sports News',        date:T, startH:12,   endH:18,   status:'published' },
  { id:'sky_04',  categoryId:'sky1', employeeId:'sky1', employee:'The Simpsons',           date:T, startH:18,   endH:18.5, status:'published' },
  { id:'sky_05',  categoryId:'sky1', employeeId:'sky1', employee:'Family Guy',             date:T, startH:18.5, endH:19,   status:'published' },
  { id:'sky_06',  categoryId:'sky1', employeeId:'sky1', employee:'American Dad',           date:T, startH:19,   endH:19.5, status:'published' },
  { id:'sky_07',  categoryId:'sky1', employeeId:'sky1', employee:'Brassic',               date:T, startH:21,   endH:22,   status:'published' },
  { id:'sky_08',  categoryId:'sky1', employeeId:'sky1', employee:'Sky News Tonight',       date:T, startH:22,   endH:23,   status:'published' },
  { id:'sky_09',  categoryId:'sky1', employeeId:'sky1', employee:'Late Night Sky',         date:T, startH:23,   endH:24,   status:'published' },
  // Netflix Live — packed 6–24
  { id:'nflx_01', categoryId:'netflix', employeeId:'netflix', employee:'Morning Stand-Up',          date:T, startH:6,    endH:7.5,  status:'published' },
  { id:'nflx_02', categoryId:'netflix', employeeId:'netflix', employee:'Chef\'s Table',             date:T, startH:7.5,  endH:8.5,  status:'published' },
  { id:'nflx_03', categoryId:'netflix', employeeId:'netflix', employee:'Our Planet',                date:T, startH:8.5,  endH:9.5,  status:'published' },
  { id:'nflx_04', categoryId:'netflix', employeeId:'netflix', employee:'Making a Murderer',         date:T, startH:9.5,  endH:11,   status:'published' },
  { id:'nflx_05', categoryId:'netflix', employeeId:'netflix', employee:'Ozark Marathon',            date:T, startH:11,   endH:13,   status:'published' },
  { id:'nflx_06', categoryId:'netflix', employeeId:'netflix', employee:'Stranger Things Marathon',  date:T, startH:13,   endH:15,   status:'published' },
  { id:'nflx_07', categoryId:'netflix', employeeId:'netflix', employee:'The Crown',                 date:T, startH:15,   endH:16,   status:'published' },
  { id:'nflx_08', categoryId:'netflix', employeeId:'netflix', employee:'Squid Game',                date:T, startH:16,   endH:17.5, status:'published' },
  { id:'nflx_09', categoryId:'netflix', employeeId:'netflix', employee:'Wednesday',                 date:T, startH:17.5, endH:19,   status:'published' },
  { id:'nflx_10', categoryId:'netflix', employeeId:'netflix', employee:'Bridgerton',                date:T, startH:19,   endH:20.5, status:'published' },
  { id:'nflx_11', categoryId:'netflix', employeeId:'netflix', employee:'Dahmer',                    date:T, startH:20.5, endH:22,   status:'published' },
  { id:'nflx_12', categoryId:'netflix', employeeId:'netflix', employee:'Late Night Comedy Special',  date:T, startH:22,   endH:23.5, status:'draft'     },
  { id:'nflx_13', categoryId:'netflix', employeeId:'netflix', employee:'Overnight Docs',            date:T, startH:23.5, endH:24,   status:'published' },
]
