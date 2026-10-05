import type { TourDeparture, TourItineraryDay } from "./types"

export function itinerary(prefix: string, days: number, extra?: (i: number) => Partial<TourItineraryDay>): TourItineraryDay[] {
  return Array.from({ length: days }, (_, i) => ({
    id: `${prefix}-d${i + 1}`,
    dayNumber: i + 1,
    destination: `${prefix} stop ${i + 1}`,
    ...(extra?.(i) ?? {}),
  }))
}

export function departure(id: string, tourName: string, start: string, days: number, extra: Partial<TourDeparture> = {}): TourDeparture {
  return {
    id,
    tourId: extra.tourId ?? id,
    tourName,
    startDate: start,
    itinerary: itinerary(tourName.split(" ")[0], days),
    ...extra,
  }
}

/** Spec scenario: Everest 7d from Oct 5, Annapurna 5d + Chitwan 3d from Oct 7. */
export const SPEC_DEPARTURES: TourDeparture[] = [
  departure("everest", "Everest Base Camp", "2026-10-05", 7, { departureCode: "#EV102", guestCount: 12, guide: { name: "Ram" } }),
  departure("annapurna", "Annapurna Circuit", "2026-10-07", 5),
  departure("chitwan", "Chitwan Safari", "2026-10-07", 3),
]
