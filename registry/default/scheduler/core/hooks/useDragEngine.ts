import { useRef, useState, useEffect, useCallback } from "react"
import { DragEngine, type DragEngineOptions, type DragCommit } from "../layout/dragEngine"
import { makeGridConfig } from "../layout/geometry"
import type { Block, Resource, Settings } from "../types"

export function useDragEngine(
  scrollRef:       React.RefObject<HTMLDivElement | null>,
  ghostRef:        React.RefObject<HTMLDivElement | null>,
  cursorGhostRef:  React.RefObject<HTMLDivElement | null>,
  categories:      Resource[],
  categoryTops:    Record<string, number>,
  categoryHeights: Record<string, number>,
  dates:           Date[],
  settings:        Settings,
  zoom:            number,
  isWeekView:      boolean,
  isDayMultiDay:   boolean,
  snapHours:       number,
  hasDayScrollNav: boolean,
  onCommit:        (patch: DragCommit, shifts: Block[]) => void,
  onHoverCategory: (id: string | null) => void,
  shifts:          Block[],
) {
  const [dragId, setDragId] = useState<string | null>(null)
  const engineRef = useRef<DragEngine | null>(null)
  const shiftsRef = useRef(shifts)
  shiftsRef.current = shifts

  const getOpts = useCallback((): DragEngineOptions => ({
    cfg: makeGridConfig(zoom, settings.visibleFrom, settings.visibleTo, isWeekView, isDayMultiDay, snapHours),
    dates,
    categoryTops,
    categoryHeights,
    categories,
    snapHours,
    scrollEl:        scrollRef.current,
    hasDayScrollNav,
    ghostEl:         ghostRef.current,
    cursorGhostEl:   cursorGhostRef.current,
    sourceEl:        null,
    onDragStart:     (id) => setDragId(id),
    onDragEnd:       ()   => setDragId(null),
    onCommit:        (patch) => onCommit(patch, shiftsRef.current),
    onConflict:      (_id) => { /* flash handled in GridView */ },
    onHoverCategory,
  }), [zoom, settings, isWeekView, isDayMultiDay, snapHours, dates,
       categoryTops, categoryHeights, categories, hasDayScrollNav, onCommit, onHoverCategory])

  if (!engineRef.current) {
    engineRef.current = new DragEngine(getOpts())
  } else {
    engineRef.current.update(getOpts())
  }

  useEffect(() => {
    if (!dragId) return
    const engine = engineRef.current!
    const pm = (e: PointerEvent) => engine.onPointerMove(e)
    const pu = (e: PointerEvent) => engine.onPointerUp(e, shiftsRef.current)
    const pc = ()                 => engine.cancel()
    document.addEventListener("pointermove",   pm, { capture: true })
    document.addEventListener("pointerup",     pu, { capture: true })
    document.addEventListener("pointercancel", pc, { capture: true })
    return () => {
      document.removeEventListener("pointermove",   pm, { capture: true })
      document.removeEventListener("pointerup",     pu, { capture: true })
      document.removeEventListener("pointercancel", pc, { capture: true })
    }
  }, [dragId])

  return {
    dragId,
    engine: engineRef,
    startMove:        (e: React.PointerEvent, block: Block, blockEl: HTMLElement | null) =>
                        engineRef.current!.startMove(e.nativeEvent, block, blockEl),
    startResizeRight: (e: React.PointerEvent, block: Block) =>
                        engineRef.current!.startResizeRight(e.nativeEvent, block),
    startResizeLeft:  (e: React.PointerEvent, block: Block) =>
                        engineRef.current!.startResizeLeft(e.nativeEvent, block),
  }
}
