import { useCallback, useRef } from "react"

/**
 * Returns a stable scrollToNow function that scrolls the grid container so
 * the "now" line is centred in the viewport.
 * The header is now inside the same scroll container so it syncs natively.
 */
export function useScrollToNow(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  nowPositionPx: number,
): () => void {
  const positionRef = useRef(nowPositionPx)
  positionRef.current = nowPositionPx

  const scrollToNow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const viewW  = el.clientWidth
    const target = Math.max(0, Math.min(positionRef.current - viewW / 2, el.scrollWidth - viewW))
    el.scrollTo({ left: target, behavior: "smooth" })
  }, [])

  return scrollToNow
}
