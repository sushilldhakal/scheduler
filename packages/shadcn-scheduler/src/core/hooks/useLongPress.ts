import { useRef, useCallback } from "react"

const DEFAULT_DELAY = 500
const DEFAULT_MOVE_THRESHOLD = 8

export interface LongPressOptions {
  delayMs?: number
  moveThresholdPx?: number
}

/**
 * Returns handlers for long-press: start timer on pointerdown, cancel on move beyond threshold or pointerup.
 * When timer fires, onLongPress is called with the pointer event's client coordinates (for cell lookup).
 */
export function useLongPress(
  onLongPress: (clientX: number, clientY: number) => void,
  options: LongPressOptions = {}
): {
  onPointerDown: (e: React.PointerEvent) => void
  onPointerMove: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
} {
  const { delayMs = DEFAULT_DELAY, moveThresholdPx = DEFAULT_MOVE_THRESHOLD } = options
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startRef.current = null
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      startRef.current = { x: e.clientX, y: e.clientY }
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const start = startRef.current
        startRef.current = null
        if (start) onLongPress(start.x, start.y)
      }, delayMs)
    },
    [delayMs, onLongPress]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = startRef.current
      if (!start || !timerRef.current) return
      const dx = e.clientX - start.x
      const dy = e.clientY - start.y
      if (Math.sqrt(dx * dx + dy * dy) > moveThresholdPx) clear()
    },
    [moveThresholdPx, clear]
  )

  const onPointerUp = useCallback(() => {
    clear()
  }, [clear])

  return { onPointerDown, onPointerMove, onPointerUp }
}
