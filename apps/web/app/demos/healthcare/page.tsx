'use client'
import { useState, useEffect } from 'react'
import { Scheduler, createSchedulerConfig, type Block } from '@sushill/shadcn-scheduler'
import { wards, staff, rotas } from '@/lib/demo/healthcareData'
import { DemoShell } from '../_demoShell'

const config = createSchedulerConfig({ preset: 'healthcare', defaultSettings: { visibleFrom: 0, visibleTo: 24 }, snapMinutes: 30 })
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
