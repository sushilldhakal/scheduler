import { clamp, snapToInterval, sameDay, toDateISO } from "../constants"
import type { Block, Resource } from "../types"
import { wouldConflictAt } from "../utils/packing"
import { ghostRect, xToHour, xToDateIndex, type GridConfig } from "./geometry"

export interface DragCommit {
  id:         string
  type:       "move" | "resize-left" | "resize-right"
  startH:     number
  endH:       number
  date:       string
  categoryId: string
}

export interface DragEngineOptions {
  cfg:            GridConfig
  dates:          Date[]
  categoryTops:   Record<string, number>
  categoryHeights: Record<string, number>
  categories:     Resource[]
  snapHours:      number
  scrollEl:       HTMLDivElement | null
  hasDayScrollNav: boolean
  // The ghost div — always in the DOM, hidden when not dragging
  ghostEl:        HTMLDivElement | null
  // The source block div — opacity change only, no layout recalc  
  sourceEl:       HTMLDivElement | null
  onDragStart:    (id: string) => void   // React: grey the source block (1 render)
  onDragEnd:      () => void             // React: restore source block (1 render)
  onCommit:       (patch: DragCommit) => void  // React: update shifts (1 render)
  onConflict:     (id: string) => void   // React: flash conflict (1 render)
}

interface ActiveDrag {
  type:       "move" | "resize-left" | "resize-right"
  id:         string
  sx:         number
  sy:         number
  startH:     number
  endH:       number
  dur:        number
  categoryId: string
  origLeft:   number  // for transform approach
  origTop:    number
}

export class DragEngine {
  private active:  ActiveDrag | null = null
  private rafId:   number | null = null
  private opts:    DragEngineOptions
  private gridRect: DOMRect | null = null  // cached at drag start

  constructor(opts: DragEngineOptions) {
    this.opts = opts
  }

  update(opts: DragEngineOptions) {
    this.opts = opts
  }

  // ── Coordinate helpers ──────────────────────────────────────

  private getXY(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.gridRect
    if (!rect) return { x: 0, y: 0 }
    const sl = this.opts.scrollEl?.scrollLeft ?? 0
    const st = this.opts.scrollEl?.scrollTop  ?? 0
    const rawX = sl + (clientX - rect.left)
    return {
      x: this.opts.hasDayScrollNav ? rawX - 400 : rawX,  // DAY_SCROLL_BUFFER = 400
      y: st + (clientY - rect.top),
    }
  }

  private getCategoryAtY(y: number): Resource {
    const { categories, categoryTops, categoryHeights } = this.opts
    let acc = 0
    for (const cat of categories) {
      const h = categoryHeights[cat.id]
      if (y >= acc && y < acc + h) return cat
      acc += h
    }
    return categories[categories.length - 1]
  }

  // ── Pointer handlers (attach to document during drag) ───────

  startMove(e: PointerEvent, block: Block): void {
    const { x, y } = this.getXY(e.clientX, e.clientY)
    this.gridRect = this.opts.scrollEl?.getBoundingClientRect() ?? null  // cache once
    this.active = {
      type: "move",
      id: block.id, sx: x, sy: y,
      startH: block.startH, endH: block.endH,
      dur: block.endH - block.startH,
      categoryId: block.categoryId,
      origLeft: 0, origTop: 0,
    }
    this.opts.onDragStart(block.id)
    this._showGhost()
  }

  startResizeRight(e: PointerEvent, block: Block): void {
    const { x } = this.getXY(e.clientX, e.clientY)
    this.gridRect = this.opts.scrollEl?.getBoundingClientRect() ?? null
    this.active = {
      type: "resize-right",
      id: block.id, sx: x, sy: 0,
      startH: block.startH, endH: block.endH, dur: 0,
      categoryId: block.categoryId,
      origLeft: 0, origTop: 0,
    }
    this.opts.onDragStart(block.id)
  }

  startResizeLeft(e: PointerEvent, block: Block): void {
    const { x } = this.getXY(e.clientX, e.clientY)
    this.gridRect = this.opts.scrollEl?.getBoundingClientRect() ?? null
    this.active = {
      type: "resize-left",
      id: block.id, sx: x, sy: 0,
      startH: block.startH, endH: block.endH, dur: 0,
      categoryId: block.categoryId,
      origLeft: 0, origTop: 0,
    }
    this.opts.onDragStart(block.id)
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.active) return
    if (this.rafId) cancelAnimationFrame(this.rafId)
    // Capture values from event synchronously (event object is reused by browser)
    const clientX = e.clientX
    const clientY = e.clientY
    this.rafId = requestAnimationFrame(() => this._updateGhost(clientX, clientY))
  }

  onPointerUp(e: PointerEvent, shifts: Block[]): void {
    if (!this.active) return
    const d = this.active
    const { x, y } = this.getXY(e.clientX, e.clientY)
    const { cfg, dates, snapHours } = this.opts
    const snap = (v: number) => snapToInterval(v, snapHours)
    const newCat = this.getCategoryAtY(y)

    let patch: DragCommit | null = null

    if (d.type === "move") {
      const di0     = xToDateIndex(d.sx, cfg, dates.length)
      const di1     = xToDateIndex(x, cfg, dates.length)
      const delta   = di1 - di0
      const pxPerH  = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      const offset  = delta !== 0 ? 0 : snap((x - d.sx) / pxPerH)
      const ns      = snap(clamp(d.startH + offset, 0, 24 - d.dur))
      const orig    = shifts.find(s => s.id === d.id)
      const origIdx = orig ? dates.findIndex(dt => sameDay(dt, orig.date)) : 0
      const newIdx  = clamp(origIdx + delta, 0, dates.length - 1)
      const newDate = cfg.isWeekView || cfg.isDayMultiDay
        ? toDateISO(dates[newIdx])
        : orig?.date ?? ""
      if (orig && wouldConflictAt(shifts, d.id, {
        date: newDate, categoryId: newCat.id, startH: ns, endH: ns + d.dur
      })) {
        this.opts.onConflict(d.id)
      } else {
        patch = { id: d.id, type: "move", startH: ns, endH: ns + d.dur, date: newDate, categoryId: newCat.id }
      }
    } else if (d.type === "resize-right") {
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      const ne = snap(clamp(d.endH + (x - d.sx) / pxPerH, d.startH + snapHours, 24))
      patch = { id: d.id, type: "resize-right", startH: d.startH, endH: ne, date: "", categoryId: d.categoryId }
    } else {
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      const ns = snap(clamp(d.startH + (x - d.sx) / pxPerH, 0, d.endH - snapHours))
      patch = { id: d.id, type: "resize-left", startH: ns, endH: d.endH, date: "", categoryId: d.categoryId }
    }

    this._hideGhost()
    this.active = null
    this.gridRect = null
    this.opts.onDragEnd()        // 1 React render: restore source block opacity
    if (patch) this.opts.onCommit(patch)  // 1 React render: update shifts data
  }

  cancel(): void {
    if (!this.active) return
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this._hideGhost()
    this.active = null
    this.gridRect = null
    this.opts.onDragEnd()
  }

  // ── Private DOM mutations — zero React ──────────────────────

  private _updateGhost(clientX: number, clientY: number): void {
    const d = this.active
    if (!d || !this.opts.ghostEl) return
    const { x, y } = this.getXY(clientX, clientY)
    const { cfg, dates, categoryTops, categoryHeights, snapHours } = this.opts
    const snap   = (v: number) => snapToInterval(v, snapHours)
    const newCat = this.getCategoryAtY(y)
    const catTop = categoryTops[newCat.id] ?? 0
    const rowH   = categoryHeights[newCat.id] ?? 40

    let ns: number, ne: number, dateIdx: number

    if (d.type === "move") {
      const di0    = xToDateIndex(d.sx, cfg, dates.length)
      const di1    = xToDateIndex(x, cfg, dates.length)
      const delta  = di1 - di0
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      const offset = delta !== 0 ? 0 : snap((x - d.sx) / pxPerH)
      ns      = snap(clamp(d.startH + offset, 0, 24 - d.dur))
      ne      = ns + d.dur
      dateIdx = di1
    } else if (d.type === "resize-right") {
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      ns      = d.startH
      ne      = snap(clamp(d.endH + (x - d.sx) / pxPerH, d.startH + snapHours, 24))
      dateIdx = xToDateIndex(d.sx, cfg, dates.length)
    } else {
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      ns      = snap(clamp(d.startH + (x - d.sx) / pxPerH, 0, d.endH - snapHours))
      ne      = d.endH
      dateIdx = xToDateIndex(d.sx, cfg, dates.length)
    }

    const rect = ghostRect(ns, ne, dateIdx, catTop, rowH, cfg)
    if (!rect) return

    // ─── Direct DOM mutation — no React, no re-render ───────
    const el = this.opts.ghostEl
    el.style.display  = "flex"
    el.style.left     = `${rect.left}px`
    el.style.top      = `${rect.top}px`
    el.style.width    = `${rect.width}px`
    el.style.height   = `${rect.height}px`

    // Update time label inside ghost
    const label = el.querySelector<HTMLSpanElement>("[data-ghost-label]")
    if (label) label.textContent = `${fmt12(ns)}–${fmt12(ne)}`
  }

  private _showGhost(): void {
    if (this.opts.ghostEl) this.opts.ghostEl.style.display = "flex"
  }

  private _hideGhost(): void {
    if (this.opts.ghostEl) this.opts.ghostEl.style.display = "none"
  }
}