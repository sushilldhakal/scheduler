import { useCallback, useRef } from "react"

/**
 * Returns a stable scrollToNow function that scrolls the grid container so
 * the "now" line is centred in the viewport. Also syncs headerRef.scrollLeft
 * and the --sx CSS variable so the sticky date labels update immediately.
 */
export function useScrollToNow(
  scrollRef:  React.RefObject<HTMLDivElement | null>,
  nowPositionPx: number,
  headerRef?: React.RefObject<HTMLDivElement | null>,
): () => void {
  const positionRef = useRef(nowPositionPx)
  positionRef.current = nowPositionPx

  const scrollToNow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const viewW  = el.clientWidth
    const target = Math.max(
      0,
      Math.min(positionRef.current - viewW / 2, el.scrollWidth - viewW)
    )

    // Smooth scroll so it feels intentional, not jarring
    el.scrollTo({ left: target, behavior: "smooth" })

    // Sync header immediately (smooth scroll fires onScroll events but
    // we also update directly so sticky --sx label moves in one frame)
    if (headerRef?.current) {
      headerRef.current.scrollLeft = target
      headerRef.current.style.setProperty("--sx", target + "px")
    }
  }, [])   // refs are stable — no deps needed

  return scrollToNow
}
