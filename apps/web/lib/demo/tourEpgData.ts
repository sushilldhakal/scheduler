import type { TourDeparture, TourItineraryDay } from '@sushill/shadcn-scheduler'

type Stop = [destination: string, hotel?: string, transport?: string, extra?: Partial<TourItineraryDay>]

function itinerary(prefix: string, stops: Stop[], guide?: string): TourItineraryDay[] {
  return stops.map(([destination, hotel, transport, extra], i) => ({
    id: `${prefix}-d${i + 1}`,
    dayNumber: i + 1,
    destination,
    accommodation: hotel ? { name: hotel } : undefined,
    transportation: transport ? { name: transport } : undefined,
    guide: guide ? { name: guide } : undefined,
    ...extra,
  }))
}

const addDays = (iso: string, n: number): string => {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + n))
  return d.toISOString().slice(0, 10)
}

/**
 * Demo departures laid out relative to `monday` (YYYY-MM-DD) so the Today marker is
 * visible whenever the demo is opened. With monday = Oct 5 this is the classic scenario:
 * on Oct 8 Everest is D4 while Annapurna and Chitwan are both D2.
 */
export function buildTourEpgDemo(monday: string): TourDeparture[] {
  const ebcStops: Stop[] = [
    ['Kathmandu', 'Hotel Yak & Yeti', 'Jeep'],
    ['Lukla → Phakding', 'Phakding Lodge', 'Flight'],
    ['Namche Bazaar', 'Hotel Sherpa', undefined, { activities: ['Acclimatisation walk'] }],
    ['Namche → Tengboche', 'Tengboche Lodge'],
    ['Tengboche → Dingboche', 'Dingboche Inn', undefined, { restaurant: { name: 'Bakery Cafe' } }],
    ['Dingboche → Lobuche', 'Lobuche Lodge'],
    ['Everest Base Camp → Kathmandu', 'Hotel Yak & Yeti', 'Helicopter'],
  ]
  return [
    {
      id: 'ebc-oct5', tourId: 'ebc', tourName: 'Everest Base Camp', departureCode: '#EV102',
      startDate: monday, guestCount: 12, guide: { name: 'Ram' },
      itinerary: itinerary('ebc1', ebcStops, 'Ram'),
    },
    {
      id: 'ebc-oct12', tourId: 'ebc', tourName: 'Everest Base Camp', departureCode: '#EV103',
      startDate: addDays(monday, 7), guestCount: 8, guide: { name: 'Pasang' },
      itinerary: itinerary('ebc2', ebcStops, 'Pasang'),
    },
    {
      id: 'acs', tourId: 'acs', tourName: 'Annapurna Circuit', departureCode: '#AN210',
      startDate: addDays(monday, 2), guestCount: 6, guide: { name: 'Hari' },
      itinerary: itinerary('acs', [
        ['Pokhara', 'Hotel Lake View', 'Jeep'],
        ['Pokhara → Ghorepani', 'Ghorepani Lodge', 'Jeep'],
        ['Poon Hill → Tadapani', 'Tadapani Lodge'],
        ['Tadapani → Chhomrong', 'Chhomrong Guesthouse'],
        ['Chhomrong → Pokhara', 'Hotel Lake View', 'Jeep'],
      ], 'Hari'),
    },
    {
      id: 'chitwan', tourId: 'chitwan', tourName: 'Chitwan Safari', departureCode: '#CH044',
      startDate: addDays(monday, 2), guestCount: 4, guide: { name: 'Sita' },
      itinerary: itinerary('ch', [
        ['Kathmandu → Chitwan', 'Jungle Resort', 'Tourist bus'],
        ['Chitwan', 'Jungle Resort', undefined, { activities: ['Jeep safari', 'Canoe ride'] }],
        ['Chitwan → Kathmandu', undefined, 'Tourist bus'],
      ], 'Sita'),
    },
    {
      id: 'ktm', tourId: 'ktm', tourName: 'Kathmandu Valley', departureCode: '#KV018',
      startDate: addDays(monday, 5), guestCount: 10, guide: { name: 'Maya' },
      itinerary: itinerary('kv', [
        ['Pashupatinath & Boudhanath', 'Hotel Annapurna', 'Van'],
        ['Patan & Bhaktapur', 'Hotel Annapurna', 'Van'],
        ['Swayambhunath', 'Hotel Annapurna', 'Van'],
        ['Nagarkot sunrise → Kathmandu', undefined, 'Van'],
      ], 'Maya'),
    },
    {
      id: 'manaslu', tourId: 'manaslu', tourName: 'Manaslu Circuit', departureCode: '#MN007',
      startDate: addDays(monday, 7), guestCount: 5, guide: { name: 'Dawa' },
      itinerary: itinerary('mn', [
        ['Kathmandu → Soti Khola', 'Soti Lodge', 'Jeep'],
        ['Soti Khola → Machha Khola', 'Machha Lodge'],
        ['Machha Khola → Jagat', 'Jagat Lodge'],
        ['Jagat → Deng', 'Deng Lodge'],
        ['Deng → Namrung', 'Namrung Lodge'],
        ['Namrung → Samagaon', 'Samagaon Lodge'],
        ['Samagaon (rest day)', 'Samagaon Lodge'],
        ['Samagaon → Samdo → Kathmandu', undefined, 'Jeep'],
      ], 'Dawa'),
    },
    {
      id: 'cancelled', tourId: 'langtang', tourName: 'Langtang Valley', departureCode: '#LG003',
      startDate: addDays(monday, 3), guestCount: 0, status: 'cancelled', guide: { name: 'Nima' },
      itinerary: itinerary('lg', [['Syabrubesi', 'Lodge', 'Jeep'], ['Lama Hotel', 'Lodge'], ['Langtang', 'Lodge']], 'Nima'),
    },
  ]
}
