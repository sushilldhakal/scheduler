import type { Block, Resource } from '@sushill/shadcn-scheduler'
import { toDateISO } from '@sushill/shadcn-scheduler'

export const festivalStages: Resource[] = [
  { id:'main',       name:'Main Stage',        colorIdx:5, kind:'category' },
  { id:'second',     name:'Second Stage',      colorIdx:3, kind:'category' },
  { id:'acoustic',   name:'Acoustic Garden',   colorIdx:2, kind:'category' },
  { id:'electronic', name:'Electronic Dome',   colorIdx:7, kind:'category' },
  { id:'comedy',     name:'Comedy Tent',        colorIdx:1, kind:'category' },
  { id:'emerging',   name:'Emerging Artists',  colorIdx:4, kind:'category' },
]

export const festivalArtists: Resource[] = [
  { id:'a01', name:'The Midnight',         categoryId:'main',       colorIdx:5, kind:'employee' },
  { id:'a02', name:'Arcade Fire',          categoryId:'main',       colorIdx:5, kind:'employee' },
  { id:'a03', name:'Tame Impala',          categoryId:'main',       colorIdx:5, kind:'employee' },
  { id:'a04', name:'Glass Animals',        categoryId:'second',     colorIdx:3, kind:'employee' },
  { id:'a05', name:'Wet Leg',              categoryId:'second',     colorIdx:3, kind:'employee' },
  { id:'a06', name:'Jungle',               categoryId:'second',     colorIdx:3, kind:'employee' },
  { id:'a07', name:'Phoebe Bridgers',      categoryId:'acoustic',   colorIdx:2, kind:'employee' },
  { id:'a08', name:'Iron & Wine',          categoryId:'acoustic',   colorIdx:2, kind:'employee' },
  { id:'a09', name:'Bon Iver',             categoryId:'acoustic',   colorIdx:2, kind:'employee' },
  { id:'a10', name:'Four Tet',             categoryId:'electronic', colorIdx:7, kind:'employee' },
  { id:'a11', name:'Floating Points',      categoryId:'electronic', colorIdx:7, kind:'employee' },
  { id:'a12', name:'Caribou',              categoryId:'electronic', colorIdx:7, kind:'employee' },
  { id:'a13', name:'Bo Burnham',           categoryId:'comedy',     colorIdx:1, kind:'employee' },
  { id:'a14', name:'Hannah Gadsby',        categoryId:'comedy',     colorIdx:1, kind:'employee' },
  { id:'a15', name:'Nish Kumar',           categoryId:'comedy',     colorIdx:1, kind:'employee' },
  { id:'a16', name:'Wet Leg (New Act)',     categoryId:'emerging',   colorIdx:4, kind:'employee' },
  { id:'a17', name:'Yard Act',             categoryId:'emerging',   colorIdx:4, kind:'employee' },
  { id:'a18', name:'The Lemon Twigs',      categoryId:'emerging',   colorIdx:4, kind:'employee' },
]

function day(o: number) { const dt = new Date(); dt.setHours(0,0,0,0); dt.setDate(dt.getDate()+o); return toDateISO(dt) }
const D0 = day(0), D1 = day(1), D2 = day(2)

const s = (id:string, cat:string, emp:string, name:string, dt:string, sh:number, eh:number, st:'published'|'draft'='published'):Block =>
  ({ id, categoryId:cat, employeeId:emp, employee:name, date:dt, startH:sh, endH:eh, status:st })

export const festivalSets: Block[] = [
  // ── DAY 1 ──────────────────────────────────────────────────────────────────
  // Main Stage
  s('m01','main','a01','The Midnight',                D0, 13,   14.5),
  s('m02','main','a02','Arcade Fire',                 D0, 15,   16.5),
  s('m03','main','a01','The Midnight — Second Set',   D0, 17,   18),
  s('m04','main','a03','Tame Impala — Headline',      D0, 20,   22),
  // Second Stage
  s('sc01','second','a04','Glass Animals',            D0, 12,   13.5),
  s('sc02','second','a05','Wet Leg',                  D0, 14,   15.5),
  s('sc03','second','a06','Jungle',                   D0, 16,   17.5),
  s('sc04','second','a04','Glass Animals — Headline', D0, 20.5, 22),
  // Acoustic Garden
  s('ac01','acoustic','a07','Phoebe Bridgers',        D0, 13,   14.5),
  s('ac02','acoustic','a08','Iron & Wine',            D0, 15,   16.5),
  s('ac03','acoustic','a09','Bon Iver',               D0, 17,   18.5),
  s('ac04','acoustic','a07','Phoebe Bridgers — Headline',D0, 20, 21.5),
  // Electronic Dome
  s('el01','electronic','a11','Floating Points',      D0, 14,   16),
  s('el02','electronic','a10','Four Tet',             D0, 16.5, 18.5),
  s('el03','electronic','a12','Caribou',              D0, 19,   21),
  s('el04','electronic','a10','Four Tet — Late Set',  D0, 21.5, 23.5),
  // Comedy Tent
  s('co01','comedy','a13','Bo Burnham',               D0, 13,   14),
  s('co02','comedy','a14','Hannah Gadsby',            D0, 15,   16),
  s('co03','comedy','a15','Nish Kumar',               D0, 17,   18),
  s('co04','comedy','a13','Bo Burnham — Late Show',   D0, 20,   21.5),
  // Emerging Artists
  s('em01','emerging','a16','Wet Leg (New Act)',       D0, 12,   13),
  s('em02','emerging','a17','Yard Act',               D0, 14,   15),
  s('em03','emerging','a18','The Lemon Twigs',        D0, 16,   17),
  s('em04','emerging','a16','Wet Leg (New Act) — Return',D0, 19, 20),

  // ── DAY 2 ──────────────────────────────────────────────────────────────────
  s('m05','main','a02','Arcade Fire',                 D1, 13,   14.5),
  s('m06','main','a03','Tame Impala — Day Set',       D1, 15.5, 17),
  s('m07','main','a01','The Midnight',                D1, 18,   19.5),
  s('m08','main','a02','Arcade Fire — Headline',      D1, 21,   23),

  s('sc05','second','a05','Wet Leg',                  D1, 12,   13.5),
  s('sc06','second','a06','Jungle',                   D1, 14,   15.5),
  s('sc07','second','a04','Glass Animals',            D1, 16,   17.5),
  s('sc08','second','a06','Jungle — Headline',        D1, 21,   22.5),

  s('ac05','acoustic','a08','Iron & Wine',            D1, 13,   14.5),
  s('ac06','acoustic','a09','Bon Iver',               D1, 15,   16.5),
  s('ac07','acoustic','a07','Phoebe Bridgers',        D1, 17,   18.5),
  s('ac08','acoustic','a09','Bon Iver — Headline',    D1, 20,   22),

  s('el05','electronic','a12','Caribou',              D1, 14,   16),
  s('el06','electronic','a11','Floating Points',      D1, 16.5, 18.5),
  s('el07','electronic','a10','Four Tet',             D1, 20,   22),
  s('el08','electronic','a12','Caribou — B2B',        D1, 22,   24),

  s('co05','comedy','a14','Hannah Gadsby',            D1, 13,   14),
  s('co06','comedy','a15','Nish Kumar',               D1, 15,   16),
  s('co07','comedy','a13','Bo Burnham',               D1, 17,   18),
  s('co08','comedy','a15','Nish Kumar — Late',        D1, 20.5, 22,'draft'),

  s('em05','emerging','a17','Yard Act',               D1, 12,   13),
  s('em06','emerging','a18','The Lemon Twigs',        D1, 14,   15),
  s('em07','emerging','a16','Wet Leg (New Act)',       D1, 16,   17),
  s('em08','emerging','a17','Yard Act — Encore',      D1, 19,   20,'draft'),

  // ── DAY 3 ──────────────────────────────────────────────────────────────────
  s('m09','main','a03','Tame Impala',                 D2, 14,   15.5,'draft'),
  s('m10','main','a01','The Midnight',                D2, 16.5, 18,'draft'),
  s('m11','main','a02','Arcade Fire — Final Headline',D2, 20.5, 23,'draft'),

  s('sc09','second','a04','Glass Animals',            D2, 13,   14.5,'draft'),
  s('sc10','second','a05','Wet Leg',                  D2, 15,   16.5,'draft'),
  s('sc11','second','a06','Jungle',                   D2, 18,   19.5,'draft'),

  s('ac09','acoustic','a09','Bon Iver',               D2, 13,   14.5,'draft'),
  s('ac10','acoustic','a07','Phoebe Bridgers',        D2, 15.5, 17,'draft'),
  s('ac11','acoustic','a08','Iron & Wine — Final',    D2, 19,   21,'draft'),

  s('el09','electronic','a11','Floating Points',      D2, 15,   17,'draft'),
  s('el10','electronic','a10','Four Tet',             D2, 18,   20,'draft'),
  s('el11','electronic','a12','Caribou — Closing',    D2, 21,   23,'draft'),

  s('co09','comedy','a13','Bo Burnham — Final Show',  D2, 14,   15.5,'draft'),
  s('co10','comedy','a14','Hannah Gadsby',            D2, 16,   17,'draft'),
  s('co11','comedy','a15','Nish Kumar — Closing',     D2, 19,   20.5,'draft'),

  s('em09','emerging','a18','The Lemon Twigs',        D2, 12,   13,'draft'),
  s('em10','emerging','a17','Yard Act',               D2, 14.5, 15.5,'draft'),
  s('em11','emerging','a16','Wet Leg (New Act)',       D2, 17,   18,'draft'),
]
