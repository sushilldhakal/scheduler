import { describe, it, expect } from "vitest"
import { buildRows, cellOn, deriveStatus, normalizeDeparture, normalizeDepartures } from "./engine"
import { departure, itinerary, SPEC_DEPARTURES } from "./fixtures.test-helper"

const norm = (d: Parameters<typeof normalizeDeparture>[0]) => normalizeDeparture(d) as NonNullable<ReturnType<typeof normalizeDeparture>>
const all = normalizeDepartures(SPEC_DEPARTURES)
const range = (s: string, e: string, today = "2026-10-08", extra = {}) => buildRows(all, { rangeStart: s, rangeEnd: e, today, ...extra })

describe("date → itinerary day mapping", () => {
  it("departure starting on the selected date is D1", () => {
    expect(cellOn(norm(SPEC_DEPARTURES[1]), "2026-10-07")?.dayNumber).toBe(1)
  })
  it("departure that started two days earlier is D3", () => {
    expect(cellOn(norm(SPEC_DEPARTURES[0]), "2026-10-07")?.dayNumber).toBe(3)
  })
  it("a future departure only has cells from its start date", () => {
    const row = range("2026-10-05", "2026-10-11").find((r) => r.key === "annapurna")!
    expect(row.cells.map((c) => c?.dayNumber ?? null)).toEqual([null, null, 1, 2, 3, 4, 5])
  })
  it("returns null outside the departure range", () => {
    const n = norm(SPEC_DEPARTURES[0])
    expect(cellOn(n, "2026-10-04")).toBeNull()
    expect(cellOn(n, "2026-10-12")).toBeNull()
  })
  it("two tours on the same date have different day numbers (Oct 8: Everest D4, Annapurna D2, Chitwan D2)", () => {
    const rows = range("2026-10-08", "2026-10-08")
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.cells[0]?.dayNumber]))
    expect(byKey).toEqual({ everest: 4, annapurna: 2, chitwan: 2 })
  })
  it("a week range gives one cell per real calendar date", () => {
    const row = range("2026-10-05", "2026-10-11").find((r) => r.key === "everest")!
    expect(row.cells.map((c) => c?.date)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"])
    expect(row.cells.map((c) => c?.dayNumber)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it("prefers explicit itinerary dates over offsets (a rest-day gap keeps host numbering)", () => {
    const d = departure("gap", "Gap Trek", "2026-10-05", 0, {
      endDate: "2026-10-08",
      itinerary: [
        { id: "a", dayNumber: 1, date: "2026-10-05", destination: "A" },
        { id: "b", dayNumber: 2, date: "2026-10-07", destination: "B" },
      ],
    })
    const n = norm(d)
    expect(cellOn(n, "2026-10-07")?.day?.destination).toBe("B")
    expect(cellOn(n, "2026-10-06")?.day).toBeNull() // rest day inside range, still a cell
  })
  it("same tour with several departures yields separate rows", () => {
    const deps = ["2026-10-05", "2026-10-12", "2026-10-20"].map((s, i) =>
      departure(`ebc-${i}`, "Everest Base Camp", s, 12, { tourId: "ebc" })
    )
    const rows = buildRows(normalizeDepartures(deps), { rangeStart: "2026-10-01", rangeEnd: "2026-10-31", today: "2026-10-08" })
    expect(rows.map((r) => r.key)).toEqual(["ebc-0", "ebc-1", "ebc-2"])
    expect(new Set(rows.map((r) => r.departure.tourId)).size).toBe(1)
  })
  it("multi-week tour maps day numbers across week boundaries", () => {
    const n = norm(departure("long", "Long Trek", "2026-10-05", 16))
    expect(cellOn(n, "2026-10-12")?.dayNumber).toBe(8)
    expect(cellOn(n, "2026-10-20")?.dayNumber).toBe(16)
    expect(cellOn(n, "2026-10-21")).toBeNull()
  })
  it("works across a DST change and year boundary", () => {
    const sydney = norm(departure("syd", "Sydney", "2026-04-03", 5))
    expect(cellOn(sydney, "2026-04-06")?.dayNumber).toBe(4) // after AU DST ends Apr 5
    const ny = norm(departure("ny", "New Year", "2026-12-30", 5))
    expect(cellOn(ny, "2027-01-03")?.dayNumber).toBe(5)
  })
})

describe("edge cases", () => {
  it("empty itinerary: still a one-day row from startDate", () => {
    const n = norm(departure("e", "Empty", "2026-10-05", 0, { itinerary: [] }))
    expect(n.durationDays).toBe(1)
    expect(cellOn(n, "2026-10-05")).toMatchObject({ dayNumber: 1, day: null })
  })
  it("empty itinerary with endDate: D-numbers still run with no details", () => {
    const n = norm(departure("e", "Empty", "2026-10-05", 0, { itinerary: [], endDate: "2026-10-07" }))
    expect(cellOn(n, "2026-10-07")).toMatchObject({ dayNumber: 3, day: null })
  })
  it("single-day tour is both start and end", () => {
    const n = norm(departure("one", "Day Trip", "2026-10-05", 1))
    const c = cellOn(n, "2026-10-05")!
    expect(c.isStart && c.isEnd).toBe(true)
    expect(deriveStatus(n, "2026-10-05")).toBe("starting-today")
  })
  it("skips departures with unusable start dates and clamps end < start", () => {
    expect(normalizeDeparture(departure("bad", "Bad", "garbage", 2))).toBeNull()
    expect(norm(departure("rev", "Rev", "2026-10-05", 2, { endDate: "2026-10-01" })).end).toBe("2026-10-05")
  })
  it("does not mutate host data", () => {
    const frozen = Object.freeze(departure("f", "Frozen", "2026-10-05", 2, { itinerary: Object.freeze(itinerary("F", 2)) as never }))
    expect(() => buildRows([norm(frozen)], { rangeStart: "2026-10-05", rangeEnd: "2026-10-06", today: "2026-10-05" })).not.toThrow()
  })
})

describe("status", () => {
  const n = norm(SPEC_DEPARTURES[0]) // Oct 5–11
  it.each([
    ["2026-10-04", "upcoming"],
    ["2026-10-05", "starting-today"],
    ["2026-10-08", "running"],
    ["2026-10-11", "ending-today"],
    ["2026-10-12", "completed"],
  ])("on %s → %s", (today, expected) => expect(deriveStatus(n, today)).toBe(expected))

  it("cancelled wins over dates and is kept as a row", () => {
    const c = norm(departure("c", "Cancelled", "2026-10-05", 3, { status: "cancelled" }))
    expect(deriveStatus(c, "2026-10-06")).toBe("cancelled")
    const rows = buildRows([c], { rangeStart: "2026-10-05", rangeEnd: "2026-10-07", today: "2026-10-06" })
    expect(rows[0].status).toBe("cancelled")
  })
  it("completed departure is excluded from the running filter", () => {
    const rows = range("2026-10-01", "2026-10-31", "2026-10-20", { statusFilter: "running" })
    expect(rows).toHaveLength(0)
    expect(range("2026-10-01", "2026-10-31", "2026-10-20", { statusFilter: "completed" })).toHaveLength(3)
  })
})

describe("filters and search", () => {
  const deps = [
    departure("a", "Everest Base Camp", "2026-10-05", 3, { guide: { id: "g1", name: "Ram" }, departureCode: "EV1" }),
    departure("b", "Chitwan Safari", "2026-10-05", 3, {
      guide: { id: "g2", name: "Hari" },
      itinerary: itinerary("Chitwan", 3, () => ({ transportation: { name: "Jeep" }, destination: "Sauraha" })),
    }),
  ]
  const nd = normalizeDepartures(deps)
  const run = (extra: object) => buildRows(nd, { rangeStart: "2026-10-05", rangeEnd: "2026-10-07", today: "2026-10-05", ...extra }).map((r) => r.key)
  it("filters by guide name or id, vehicle, destination, tour and departure", () => {
    expect(run({ filters: { guides: ["ram"] } })).toEqual(["a"])
    expect(run({ filters: { guides: ["g2"] } })).toEqual(["b"])
    expect(run({ filters: { vehicles: ["JEEP"] } })).toEqual(["b"])
    expect(run({ filters: { destinations: ["sauraha"] } })).toEqual(["b"])
    expect(run({ filters: { tourIds: ["a"] } })).toEqual(["a"])
    expect(run({ filters: { departureIds: ["b"] } })).toEqual(["b"])
  })
  it("searches tour, code, destination, guide and vehicle", () => {
    expect(run({ search: "everest" })).toEqual(["a"])
    expect(run({ search: "ev1" })).toEqual(["a"])
    expect(run({ search: "sauraha" })).toEqual(["b"])
    expect(run({ search: "hari" })).toEqual(["b"])
    expect(run({ search: "jeep safari" })).toEqual(["b"])
    expect(run({ search: "zzz" })).toEqual([])
  })
  it("applies the host predicate", () => {
    expect(run({ filterDeparture: (d: { id: string }) => d.id === "a" })).toEqual(["a"])
  })
  it("starting-today / ending-today derive from each departure's own dates", () => {
    const rows = (f: "starting-today" | "ending-today") => range("2026-10-01", "2026-10-31", f === "starting-today" ? "2026-10-07" : "2026-10-11", { statusFilter: f }).map((r) => r.key)
    expect(rows("starting-today")).toEqual(["annapurna", "chitwan"])
    expect(rows("ending-today")).toEqual(["everest", "annapurna"]) // both end Oct 11
  })
})

describe("month bars", () => {
  const month = (s: string, e: string) => buildRows(all, { rangeStart: s, rangeEnd: e, today: "2026-10-08" })
  it("places a bar from start to end column within the month", () => {
    const bar = month("2026-10-01", "2026-10-31").find((r) => r.key === "everest")!.bar!
    expect(bar).toEqual({ startCol: 4, endCol: 10, continuesBefore: false, continuesAfter: false })
  })
  it("clips bars that run past the month edge", () => {
    const sept = month("2026-09-01", "2026-09-30")
    expect(sept).toHaveLength(0)
    const long = normalizeDepartures([departure("x", "Spans", "2026-09-28", 8)])
    const oct = buildRows(long, { rangeStart: "2026-10-01", rangeEnd: "2026-10-31", today: "2026-10-01" })[0].bar!
    expect(oct).toMatchObject({ startCol: 0, endCol: 4, continuesBefore: true, continuesAfter: false })
    const sep = buildRows(long, { rangeStart: "2026-09-01", rangeEnd: "2026-09-30", today: "2026-10-01" })[0].bar!
    expect(sep).toMatchObject({ startCol: 27, endCol: 29, continuesBefore: false, continuesAfter: true })
  })
})
