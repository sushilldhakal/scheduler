import React from "react"
import { describe, it, expect, vi, beforeAll } from "vitest"
import { render, screen, within, fireEvent } from "@testing-library/react"
import { TourEPG } from "./TourEPG"
import { SPEC_DEPARTURES, departure } from "./fixtures.test-helper"

beforeAll(() => {
  // jsdom has no matchMedia; report a desktop viewport.
  window.matchMedia = ((q: string) => ({
    matches: false, media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
})

const mount = (props: Partial<React.ComponentProps<typeof TourEPG>> = {}) =>
  render(<TourEPG departures={SPEC_DEPARTURES} today="2026-10-08" initialDate="2026-10-08" {...props} />)

const headers = () => screen.getAllByRole("columnheader").slice(1) // drop "Departure" corner
const rowFor = (id: string) => document.querySelector(`[data-departure-id="${id}"]`) as HTMLElement

describe("<TourEPG /> week view (default)", () => {
  it("global header holds only calendar dates — never 'Day N'", () => {
    mount()
    const text = headers().map((h) => h.textContent)
    expect(text).toHaveLength(7)
    expect(text[0]).toMatch(/Mon.*OCT 5/i)
    expect(text[6]).toMatch(/Sun.*OCT 11/i)
    for (const t of text) expect(t).not.toMatch(/\bday\s*\d/i)
  })

  it("each departure row carries its own D-numbers, different on the same date", () => {
    mount()
    const oct8 = (id: string) => within(rowFor(id)).getByRole("button", { name: /Oct 8/ }).getAttribute("data-day-number")
    expect(oct8("everest")).toBe("4")
    expect(oct8("annapurna")).toBe("2")
    expect(oct8("chitwan")).toBe("2")
    // Annapurna has no cell before its start
    expect(within(rowFor("annapurna")).queryByRole("button", { name: /Oct 6/ })).toBeNull()
  })

  it("marks today in the header and a single column", () => {
    mount()
    const marked = document.querySelectorAll('[role="columnheader"][data-today="true"]')
    expect(marked).toHaveLength(1)
    expect(marked[0].getAttribute("data-date")).toBe("2026-10-08")
    expect(marked[0].textContent).toMatch(/today/i)
  })

  it("no today marker when today is outside the range", () => {
    mount({ today: "2026-12-25" })
    expect(document.querySelectorAll('[data-today="true"]')).toHaveLength(0)
  })

  it("has a sticky left info column and scroll container", () => {
    mount()
    const info = within(rowFor("everest")).getAllByRole("rowheader")[0]
    expect(info.className).toMatch(/sticky/)
    expect(info.className).toMatch(/left-0/)
    expect(screen.getByTestId("tour-epg-scroll").className).toMatch(/overflow-auto/)
  })

  it("renders separate rows for several departures of one tour", () => {
    const deps = [0, 1].map((i) => departure(`ebc${i}`, "Everest Base Camp", `2026-10-0${5 + i}`, 7, { tourId: "ebc" }))
    mount({ departures: deps })
    expect(document.querySelectorAll("[data-departure-id]")).toHaveLength(2)
  })

  it("shows status badges including cancelled", () => {
    mount({ departures: [...SPEC_DEPARTURES, departure("x", "Cancelled Trip", "2026-10-06", 3, { status: "cancelled" })] })
    expect(within(rowFor("everest")).getByText("Running")).toBeTruthy()
    expect(within(rowFor("annapurna")).getByText("Running")).toBeTruthy()
    expect(within(rowFor("x")).getByText("Cancelled")).toBeTruthy()
  })
})

describe("<TourEPG /> day and month views", () => {
  it("day view shows exactly one calendar date", () => {
    mount({ initialView: "day" })
    expect(headers()).toHaveLength(1)
    expect(headers()[0].getAttribute("data-date")).toBe("2026-10-08")
    expect(within(rowFor("everest")).getByRole("button", { name: /day 4/i })).toBeTruthy()
  })

  it("month view draws a bar per departure spanning its range", () => {
    mount({ initialView: "month" })
    expect(headers()).toHaveLength(31)
    const bar = within(rowFor("everest")).getByTestId("tour-epg-bar")
    expect(bar.getAttribute("data-start-col")).toBe("4")
    expect(bar.getAttribute("data-end-col")).toBe("10")
    expect(within(bar).getByText("D1")).toBeTruthy()
    expect(within(bar).getByText("D7")).toBeTruthy()
  })

  it("navigates by day / week / month and via Today", () => {
    mount({ initialView: "week" })
    fireEvent.click(screen.getByRole("button", { name: /next week/i }))
    expect(headers()[0].getAttribute("data-date")).toBe("2026-10-12")
    fireEvent.click(screen.getByRole("button", { name: "Today" }))
    expect(headers()[0].getAttribute("data-date")).toBe("2026-10-05")
    fireEvent.click(screen.getByRole("button", { name: "Month" }))
    fireEvent.click(screen.getByRole("button", { name: /next month/i }))
    expect(headers()[0].getAttribute("data-date")).toBe("2026-11-01")
  })
})

describe("<TourEPG /> callbacks, filters, controlled props", () => {
  it("fires onTourClick/onDepartureClick from the row and onItineraryDayClick with full context", () => {
    const onTour = vi.fn(), onDep = vi.fn(), onDay = vi.fn()
    mount({ onTourClick: onTour, onDepartureClick: onDep, onItineraryDayClick: onDay })
    fireEvent.click(within(rowFor("everest")).getByRole("button", { name: /^Open Everest/ }))
    expect(onTour).toHaveBeenCalledWith("everest", SPEC_DEPARTURES[0])
    expect(onDep).toHaveBeenCalledWith(SPEC_DEPARTURES[0])
    fireEvent.click(within(rowFor("everest")).getByRole("button", { name: /Oct 8/ }))
    expect(onDay).toHaveBeenCalledTimes(1)
    expect(onDay.mock.calls[0][0]).toMatchObject({ dayNumber: 4, date: "2026-10-08", status: "running", departure: { id: "everest" } })
    expect(onDay.mock.calls[0][0].day.destination).toBe("Everest stop 4")
  })

  it("status filter and search narrow the rows", () => {
    mount()
    fireEvent.click(screen.getByRole("button", { name: "Starting today" }))
    expect(document.querySelectorAll("[data-departure-id]")).toHaveLength(0)
    expect(screen.getByText("No departures in this period.")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "All" }))
    fireEvent.change(screen.getByLabelText("Search tours"), { target: { value: "chitwan" } })
    expect(document.querySelectorAll("[data-departure-id]")).toHaveLength(1)
  })

  it("reports view and date changes to a controlling host", () => {
    const onView = vi.fn(), onDate = vi.fn()
    mount({ view: "week", date: "2026-10-08", onViewChange: onView, onDateChange: onDate })
    fireEvent.click(screen.getByRole("button", { name: "Month" }))
    expect(onView).toHaveBeenCalledWith("month")
    expect(headers()).toHaveLength(7) // controlled: host hasn't changed it
    fireEvent.click(screen.getByRole("button", { name: /next week/i }))
    expect(onDate.mock.calls[0][0]).toEqual(new Date(2026, 9, 15, 12))
  })
})

describe("<TourEPG /> keyboard navigation", () => {
  const cell = (id: string, date: string) => within(rowFor(id)).getByRole("button", { name: new RegExp(`Oct ${Number(date.slice(8))}\\b`) })

  it("Left/Right move along a departure; Up/Down keep the date across departures", () => {
    mount()
    const start = cell("everest", "2026-10-08")
    start.focus()
    fireEvent.keyDown(start, { key: "ArrowRight" })
    expect(document.activeElement).toBe(cell("everest", "2026-10-09"))
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowDown" })
    expect(document.activeElement).toBe(cell("annapurna", "2026-10-09"))
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowLeft" })
    expect(document.activeElement).toBe(cell("annapurna", "2026-10-08"))
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowUp" })
    expect(document.activeElement).toBe(cell("everest", "2026-10-08"))
  })

  it("Up/Down land on the nearest date when the neighbour isn't running that day", () => {
    mount()
    const d5 = cell("everest", "2026-10-05")
    d5.focus()
    fireEvent.keyDown(d5, { key: "ArrowDown" }) // Annapurna starts Oct 7
    expect(document.activeElement).toBe(cell("annapurna", "2026-10-07"))
  })

  it("Home/End jump to the row's first and last cell", () => {
    mount()
    const c = cell("annapurna", "2026-10-08")
    c.focus()
    fireEvent.keyDown(c, { key: "End" })
    expect(document.activeElement).toBe(cell("annapurna", "2026-10-11"))
    fireEvent.keyDown(document.activeElement as Element, { key: "Home" })
    expect(document.activeElement).toBe(cell("annapurna", "2026-10-07"))
  })

  it("works on month day markers too", () => {
    mount({ initialView: "month" })
    const markers = within(rowFor("everest")).getAllByRole("button", { name: /day \d/i })
    markers[0].focus()
    fireEvent.keyDown(markers[0], { key: "ArrowRight" })
    expect(document.activeElement).toBe(markers[1])
  })
})
