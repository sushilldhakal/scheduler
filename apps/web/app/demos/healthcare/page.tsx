'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createHealthcareConfig, type Block } from '@sushill/shadcn-scheduler'
import { wards, staff, rotas } from '@/lib/demo/healthcareData'
import { DemoShell } from '../_demoShell'

const config = createHealthcareConfig({ defaultSettings: { visibleFrom: 0, visibleTo: 24 }, snapMinutes: 30, initialScrollToNow: true })

export default function HealthcareDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [shifts, setShifts] = useState<Block[]>(rotas)

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Healthcare Rota" description="5 wards, 24hr coverage, overnight shifts — drag to resize past midnight" docsHref="/docs/examples/preset-healthcare">
      {mounted && initialDate ? (
        <Scheduler
          categories={wards}
          employees={staff}
          shifts={shifts}
          onShiftsChange={setShifts}
          initialView="week"
          initialDate={initialDate}
          config={config}
        />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
