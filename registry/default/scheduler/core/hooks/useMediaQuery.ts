import { useState, useEffect } from "react"

/**
 * Returns true when the media query matches (e.g. (max-width: 767px) for mobile).
 * Updates on window resize.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent): void => setMatches(e.matches)
    setMatches(mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [query])

  return matches
}

/** True when viewport width < 768px (mobile). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)")
}

/** True when viewport width >= 768px and < 1200px (tablet). */
export function useIsTablet(): boolean {
  return useMediaQuery("(min-width: 768px) and (max-width: 1199px)")
}

/** True when viewport width >= 1200px (desktop). */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1200px)")
}
