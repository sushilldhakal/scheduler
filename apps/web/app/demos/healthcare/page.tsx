'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createHealthcareConfig, type Block } from '@sushill/shadcn-scheduler'
import { wards, staff, rotas } from '@/lib/demo/healthcareData'
import { DemoShell } from '../_demoShell'

const config = createHealthcareConfig({ visibleFrom: 0, visibleTo: 24, snapMinutes: 30 })

export default function HealthcareDemo() {
  const [mounted, setMounted] = useState(false)
  const [shifts, setShifts] = useState<Block[]>(rotas)
  useEffect(() => setMounted(true), [])
  return (
    <DemoShell title="Healthcare Rota" description="Ward rota with 24hr coverage and overnight shifts" docsHref="/docs/examples/preset-healthcare">
      {mounted ? (
        <Scheduler categories={wards} employees={staff} shifts={shifts}
          onShiftsChange={setShifts} initialView="week" config={config} />
      ) : <div className="w-full h-full animate-pulse bg-muted" />}
    </DemoShell>
  )
}
