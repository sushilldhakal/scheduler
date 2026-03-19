import { useCallback, useRef } from "react"

/**
 * Returns a stable scrollToNow function that scrolls the container so the given
 * content X position (e.g. the "now" line) is visible, ideally centered.
 */
export function useScrollToNow(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  nowPositionPx: number
): () => void {
  const positionRef = useRef(nowPositionPx)
  positionRef.current = nowPositionPx

  const scrollToNow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const center = el.clientWidth / 2
    const target = Math.max(
      0,
      Math.min(positionRef.current - center, el.scrollWidth - el.clientWidth)
    )
    el.scrollLeft = target
  }, [])

  return scrollToNow
}
