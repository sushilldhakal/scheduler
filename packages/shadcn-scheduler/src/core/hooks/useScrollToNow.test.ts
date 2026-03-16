import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useScrollToNow } from "./useScrollToNow"

describe("useScrollToNow", () => {
  it("scrollToNow sets scrollLeft so the now position is centered when possible", () => {
    const el = document.createElement("div")
    Object.defineProperty(el, "clientWidth", { value: 400, configurable: true })
    Object.defineProperty(el, "scrollWidth", { value: 2000, configurable: true })
    el.scrollLeft = 0

    const ref = { current: el }
    const { result } = renderHook(() => useScrollToNow(ref, 600))

    result.current()

    // nowPositionPx 600, center = clientWidth/2 = 200, target = 600 - 200 = 400, clamped to [0, 2000-400]
    expect(el.scrollLeft).toBe(400)
  })

  it("scrollToNow clamps to 0 when now is near start", () => {
    const el = document.createElement("div")
    Object.defineProperty(el, "clientWidth", { value: 400, configurable: true })
    Object.defineProperty(el, "scrollWidth", { value: 2000, configurable: true })
    el.scrollLeft = 0

    const ref = { current: el }
    const { result } = renderHook(() => useScrollToNow(ref, 100))

    result.current()

    expect(el.scrollLeft).toBe(0)
  })

  it("scrollToNow does nothing when ref.current is null", () => {
    const ref = { current: null as HTMLDivElement | null }
    const { result } = renderHook(() => useScrollToNow(ref, 600))
    expect(() => result.current()).not.toThrow()
  })
})
