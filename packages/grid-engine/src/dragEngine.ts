import { clamp, snapToInterval, sameDay, toDateISO, fmt12 } from '@shadcn-scheduler/core'
import type { Block, Resource } from '@shadcn-scheduler/core'
import { wouldConflictAt } from '@shadcn-scheduler/core'
import { ghostRect, xToHour, xToDateIndex, type GridConfig } from './geometry'

export interface DragCommit {
  id:         string
  type:       'move' | 'resize-left' | 'resize-right'
  startH:     number
  endH:       number
  date:       string
  categoryId: string
}

export interface DragEngineOptions {
  cfg:             GridConfig
  dates:           Date[]
  /** categoryTops built from virtualizer vr.start — accurate even with variable-height rows */
  categoryTops:    Record<string, number>
  categoryHeights: Record<string, number>
  categories:      Resource[]
  snapHours:       number
  scrollEl:        HTMLDivElement | null
  hasDayScrollNav: boolean
  /** Snapped drop-zone ghost — stays on grid, shows where block will land */
  ghostEl:         HTMLDivElement | null
  /** Floating card that follows the raw cursor — feels like lifting a physical card */
  cursorGhostEl:   HTMLDivElement | null
  sourceEl:        HTMLDivElement | null
  onDragStart:     (id: string) => void
  onDragEnd:       () => void
  onCommit:        (patch: DragCommit) => void
  onConflict:      (id: string) => void
  /** React state setter — lets engine highlight the hovered row without a re-render loop */
  onHoverCategory: (id: string | null) => void
}

interface ActiveDrag {
  type:        'move' | 'resize-left' | 'resize-right'
  id:          string
  sx:          number
  sy:          number
  startH:      number
  endH:        number
  dur:         number
  categoryId:  string
  origLeft:    number
  origTop:     number
  /** Where in the block the pointer landed — so cursor ghost tracks the grab point */
  grabOffsetX: number
  grabOffsetY: number
  /** Dimensions of the source block — cursor ghost matches exactly */
  blockW:      number
  blockH:      number
  blockColor:  string
  blockLabel:  string
}

export class DragEngine {
  private active:   ActiveDrag | null = null
  private rafId:    number | null = null
  private opts:     DragEngineOptions
  private gridRect: DOMRect | null = null

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
      x: this.opts.hasDayScrollNav ? rawX - 400 : rawX,
      y: st + (clientY - rect.top),
    }
  }

  /** Uses categoryTops — supports both flat row keys (cat:ID, emp:ID) and legacy cat.id keys */
  private getCategoryAtY(y: number): Resource {
    const { categories, categoryTops, categoryHeights } = this.opts
    const entries = Object.entries(categoryTops).sort((a, b) => a[1] - b[1])
    for (let i = 0; i < entries.length; i++) {
      const [key, top] = entries[i]!
      const h = categoryHeights[key] ?? 0
      if (y >= top && y < top + h) {
        if (key.startsWith('emp:')) {
          for (let j = i - 1; j >= 0; j--) {
            const k = entries[j]![0]
            if (k.startsWith('cat:')) {
              const catId = k.slice(4)
              return categories.find(c => c.id === catId) ?? categories[categories.length - 1]!
            }
          }
        } else if (key.startsWith('cat:')) {
          const catId = key.slice(4)
          return categories.find(c => c.id === catId) ?? categories[categories.length - 1]!
        } else {
          return categories.find(c => c.id === key) ?? categories[categories.length - 1]!
        }
      }
    }
    return categories[categories.length - 1]!
  }

  // ── Pointer handlers ───────────────────────────────────────

  startMove(e: PointerEvent, block: Block, blockEl: HTMLElement | null): void {
    if (block.draggable === false) return
    this.gridRect = this.opts.scrollEl?.getBoundingClientRect() ?? null
    const { x, y } = this.getXY(e.clientX, e.clientY)

    let grabOffsetX = 0, grabOffsetY = 0, blockW = 120, blockH = 36
    if (blockEl) {
      const br = blockEl.getBoundingClientRect()
      grabOffsetX = e.clientX - br.left
      grabOffsetY = e.clientY - br.top
      blockW = br.width
      blockH = br.height
    }

    this.active = {
      type: 'move',
      id: block.id, sx: x, sy: y,
      startH: block.startH, endH: block.endH,
      dur: block.endH - block.startH,
      categoryId: block.categoryId,
      origLeft: 0, origTop: 0,
      grabOffsetX, grabOffsetY,
      blockW, blockH,
      blockColor: '',
      blockLabel: `${fmt12(block.startH)}–${fmt12(block.endH)}`,
    }
    this.opts.onDragStart(block.id)
    this._showGhost()
  }

  startResizeRight(e: PointerEvent, block: Block): void {
    if (block.resizable === false) return
    this.gridRect = this.opts.scrollEl?.getBoundingClientRect() ?? null
    const { x } = this.getXY(e.clientX, e.clientY)
    this.active = {
      type: 'resize-right',
      id: block.id, sx: x, sy: 0,
      startH: block.startH, endH: block.endH, dur: 0,
      categoryId: block.categoryId,
      origLeft: 0, origTop: 0,
      grabOffsetX: 0, grabOffsetY: 0,
      blockW: 0, blockH: 0,
      blockColor: '', blockLabel: '',
    }
    this.opts.onDragStart(block.id)
  }

  startResizeLeft(e: PointerEvent, block: Block): void {
    if (block.resizable === false) return
    this.gridRect = this.opts.scrollEl?.getBoundingClientRect() ?? null
    const { x } = this.getXY(e.clientX, e.clientY)
    this.active = {
      type: 'resize-left',
      id: block.id, sx: x, sy: 0,
      startH: block.startH, endH: block.endH, dur: 0,
      categoryId: block.categoryId,
      origLeft: 0, origTop: 0,
      grabOffsetX: 0, grabOffsetY: 0,
      blockW: 0, blockH: 0,
      blockColor: '', blockLabel: '',
    }
    this.opts.onDragStart(block.id)
  }

  setBlockMeta(color: string, label: string): void {
    if (this.active) { this.active.blockColor = color; this.active.blockLabel = label }
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.active) return
    if (this.rafId) cancelAnimationFrame(this.rafId)
    const clientX = e.clientX, clientY = e.clientY
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

    if (d.type === 'move') {
      const di0    = xToDateIndex(d.sx, cfg, dates.length)
      const di1    = xToDateIndex(x, cfg, dates.length)
      const delta  = di1 - di0
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      const ns     = delta !== 0
        ? snap(clamp(xToHour(x, di1, cfg), 0, 24 - d.dur))
        : snap(clamp(d.startH + snap((x - d.sx) / pxPerH), 0, 24 - d.dur))
      const orig    = shifts.find(s => s.id === d.id)
      const origIdx = orig ? dates.findIndex(dt => sameDay(dt, orig.date)) : 0
      const newIdx  = clamp(origIdx + delta, 0, dates.length - 1)
      const newDate = cfg.isWeekView || cfg.isDayMultiDay
        ? toDateISO(dates[newIdx]!)
        : orig?.date ?? ''
      if (orig && wouldConflictAt(shifts, d.id, {
        date: newDate, categoryId: newCat.id, startH: ns, endH: ns + d.dur
      })) {
        this.opts.onConflict(d.id)
      } else {
        patch = { id: d.id, type: 'move', startH: ns, endH: ns + d.dur, date: newDate, categoryId: newCat.id }
      }
    } else if (d.type === 'resize-right') {
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      const ne = snap(clamp(d.endH + (x - d.sx) / pxPerH, d.startH + snapHours, 24))
      patch = { id: d.id, type: 'resize-right', startH: d.startH, endH: ne, date: '', categoryId: d.categoryId }
    } else {
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      const ns = snap(clamp(d.startH + (x - d.sx) / pxPerH, 0, d.endH - snapHours))
      patch = { id: d.id, type: 'resize-left', startH: ns, endH: d.endH, date: '', categoryId: d.categoryId }
    }

    this._hideGhost()
    this._hideCursorGhost()
    this.opts.onHoverCategory(null)
    this.active = null
    this.gridRect = null
    this.opts.onDragEnd()
    if (patch) this.opts.onCommit(patch)
  }

  cancel(): void {
    if (!this.active) return
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this._hideGhost()
    this._hideCursorGhost()
    this.opts.onHoverCategory(null)
    this.active = null
    this.gridRect = null
    this.opts.onDragEnd()
  }

  // ── Private DOM mutations — zero React ──────────────────────

  private _updateGhost(clientX: number, clientY: number): void {
    const d = this.active
    if (!d) return
    const { x, y } = this.getXY(clientX, clientY)
    const { cfg, dates, categoryTops, categoryHeights, snapHours } = this.opts
    const snap   = (v: number) => snapToInterval(v, snapHours)
    const newCat = this.getCategoryAtY(y)
    const catTop = categoryTops[newCat.id] ?? 0
    const rowH   = categoryHeights[newCat.id] ?? 40

    this.opts.onHoverCategory(newCat.id)

    const cg = this.opts.cursorGhostEl
    if (cg && d.type === 'move') {
      const rect = this.gridRect
      if (rect) {
        const rawLeft = clientX - rect.left - d.grabOffsetX
        const rawTop  = (this.opts.scrollEl?.scrollTop ?? 0) + (clientY - rect.top) - d.grabOffsetY
        cg.style.display    = 'flex'
        cg.style.left       = '0'
        cg.style.top        = '0'
        cg.style.transform  = `translate(${rawLeft}px, ${rawTop}px)`
        cg.style.width      = `${d.blockW}px`
        cg.style.height     = `${d.blockH}px`
        cg.style.background = d.blockColor || 'hsl(var(--primary))'
        cg.style.opacity    = '0.85'
        const lbl = cg.querySelector<HTMLSpanElement>('[data-cursor-label]')
        if (lbl) lbl.textContent = d.blockLabel
      }
    }

    let ns: number, ne: number, dateIdx: number
    if (d.type === 'move') {
      const di0    = xToDateIndex(d.sx, cfg, dates.length)
      const di1    = xToDateIndex(x, cfg, dates.length)
      const delta  = di1 - di0
      const pxPerH = cfg.isWeekView ? cfg.pxWeek : cfg.hourW
      ns      = delta !== 0
        ? snap(clamp(xToHour(x, di1, cfg), 0, 24 - d.dur))
        : snap(clamp(d.startH + snap((x - d.sx) / pxPerH), 0, 24 - d.dur))
      ne      = ns + d.dur
      dateIdx = di1
    } else if (d.type === 'resize-right') {
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

    const el = this.opts.ghostEl
    if (!el) return
    const rect = ghostRect(ns, ne, dateIdx, catTop, rowH, cfg)
    if (!rect) { el.style.display = 'none'; return }
    el.style.display   = 'flex'
    el.style.left      = '0'
    el.style.top       = '0'
    el.style.width     = `${rect.width}px`
    el.style.height    = `${rect.height}px`
    el.style.transform = `translate(${rect.left}px, ${rect.top}px)`
    const label = el.querySelector<HTMLSpanElement>('[data-ghost-label]')
    if (label) label.textContent = `${fmt12(ns)}–${fmt12(ne)}`
  }

  private _showGhost():       void { if (this.opts.ghostEl)       this.opts.ghostEl.style.display = 'flex' }
  private _hideGhost():       void { if (this.opts.ghostEl)       this.opts.ghostEl.style.display = 'none' }
  private _hideCursorGhost(): void { if (this.opts.cursorGhostEl) this.opts.cursorGhostEl.style.display = 'none' }
}
