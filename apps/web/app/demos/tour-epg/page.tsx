'use client'
import { useEffect, useMemo, useState } from 'react'
import { TourEPG, type TourItineraryDayClickContext } from '@sushill/shadcn-scheduler'
import { buildTourEpgDemo } from '@/lib/demo/tourEpgData'
import { DemoShell } from '../_demoShell'

function mondayOfThisWeek(): string {
  const d = new Date()
  const offset = d.getDay() === 0 ? -6 : 1 - d.getDay()
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${m.getFullYear()}-${p(m.getMonth() + 1)}-${p(m.getDate())}`
}

export default function TourEpgDemo() {
  const [monday, setMonday] = useState<string | null>(null)
  const [last, setLast] = useState<string>('Click a tour or an itinerary day to see the callback payload here.')
  useEffect(() => setMonday(mondayOfThisWeek()), [])
  const departures = useMemo(() => (monday ? buildTourEpgDemo(monday) : []), [monday])

  return (
    <DemoShell title="Tour Operations EPG" description="Rows are departures, columns are dates, each cell is that tour's own itinerary day" docsHref="/docs/examples">
      {monday ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 py-3">
          <TourEPG
            departures={departures}
            initialView="week"
            initialDate={monday}
            maxHeight="calc(100vh - 220px)"
            onDepartureClick={(d) => setLast(`onDepartureClick → ${d.tourName} ${d.departureCode ?? ''}`)}
            onItineraryDayClick={(c: TourItineraryDayClickContext) =>
              setLast(`onItineraryDayClick → ${c.departure.tourName} · D${c.dayNumber} · ${c.date} · ${c.day?.destination ?? 'no entry'}`)
            }
          />
          <p className="text-xs text-muted-foreground" aria-live="polite">{last}</p>
        </div>
      ) : (
        <div className="h-full w-full animate-pulse bg-muted" />
      )}
    </DemoShell>
  )
}
