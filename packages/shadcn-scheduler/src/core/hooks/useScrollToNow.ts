import { useCallback, useRef } from "react"

/**
 * Returns a stable scrollToNow function that scrolls the grid container so
 * the "now" line is centred in the viewport. Syncs the header inner div via
 * translateX (compositor-only, zero layout lag) and updates --sx for sticky
 * date labels.
 */
export function useScrollToNow(
  scrollRef:      React.RefObject<HTMLDivElement | null>,
  nowPositionPx:  number,
  headerRef?:     React.RefObject<HTMLDivElement | null>,
  headerInnerRef?: React.RefObject<HTMLDivElement | null>,
): () => void {
  const positionRef = useRef(nowPositionPx)
  positionRef.current = nowPositionPx

  const scrollToNow = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const viewW  = el.clientWidth
    const target = Math.max(0, Math.min(positionRef.current - viewW / 2, el.scrollWidth - viewW))

    el.scrollTo({ left: target, behavior: "smooth" })

    // Sync header: translateX on inner div (compositor, no layout recalc)
    if (headerInnerRef?.current) {
      headerInnerRef.current.style.transform = `translateX(-${target}px)`
    }
    if (headerRef?.current) {
      headerRef.current.style.setProperty("--sx", target + "px")
    }
  }, [])

  return scrollToNow
}
