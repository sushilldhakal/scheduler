'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createHealthcareConfig, type Block } from '@sushill/shadcn-scheduler'
import { wards, staff, rotas } from '@/lib/demo/healthcareData'
import { DemoShell } from '../_demoShell'
import { useWidth } from '@/components/docs/width-context'

const config = createHealthcareConfig({ defaultSettings: { visibleFrom: 0, visibleTo: 24 }, snapMinutes: 30 })

export default function HealthcareDemo() {
  const [mounted, setMounted] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | null>(null)
  const [shifts, setShifts] = useState<Block[]>(rotas)
  const { fullWidth } = useWidth()

  useEffect(() => {
    setMounted(true)
    setInitialDate(new Date())
  }, [])

  return (
    <DemoShell title="Healthcare Rota" description="5 wards, 24hr coverage, overnight shifts — drag to resize past midnight" docsHref="/docs/examples/preset-healthcare">
      <div className={`flex flex-col h-full ${fullWidth ? '' : 'max-w-7xl mx-auto px-4 sm:px-6'}`}>
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
      </div>
    </DemoShell>
  )
}
