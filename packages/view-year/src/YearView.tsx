import React from 'react'
import type { Block } from '@shadcn-scheduler/core'
import { isToday, getDIM, getFirst, MONTHS } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'

export interface YearViewProps {
  date: Date
  shifts: Block[]
  onMonthClick: (year: number, month: number) => void
}

function YearViewInner({ date, shifts, onMonthClick }: YearViewProps): React.ReactElement {
  const { slots } = useSchedulerContext()
  const year = date.getFullYear()

  if (shifts.length === 0 && slots.emptyState) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {slots.emptyState({ view: 'year' })}
      </div>
    )
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'
    e.currentTarget.style.transform = 'translateY(-2px)'
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>): void => {
    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
    e.currentTarget.style.transform = 'translateY(0)'
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
          gap: 16,
        }}
      >
        {MONTHS.map((mName, m) => {
          const days = getDIM(year, m)
          const first = getFirst(year, m)
          const ms = shifts.filter((s) => {
            const d = new Date(s.date + 'T12:00:00')
            return d.getFullYear() === year && d.getMonth() === m
          })

          const cells: (number | null)[] = []
          for (let i = 0; i < first; i++) cells.push(null)
          for (let d = 1; d <= days; d++) cells.push(d)

          return (
            <div
              key={m}
              onClick={() => onMonthClick(year, m)}
              style={{
                background: 'var(--background)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: '12px',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s,transform 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: 8 }}>{mName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 2 }}>
                {'MTWTFSS'.split('').map((c, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 8, color: 'var(--muted-foreground)', fontWeight: 700 }}>
                    {c}
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 1 }}>
                {cells.map((d, i) => {
                  if (!d) return <div key={`e${i}`} />
                  const has = ms.some((s) => new Date(s.date + 'T12:00:00').getDate() === d)
                  const tod = isToday(new Date(year, m, d))
                  return (
                    <div
                      key={d}
                      style={{
                        textAlign: 'center',
                        fontSize: 9,
                        fontWeight: tod || has ? 700 : 400,
                        color: tod ? 'var(--background)' : has ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        background: tod ? 'var(--primary)' : has ? 'var(--primary)' : 'transparent',
                        borderRadius: 2,
                        lineHeight: '16px',
                      }}
                    >
                      {d}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ height: 6, width: 6, borderRadius: '50%', background: ms.length > 0 ? 'var(--primary)' : 'var(--muted-foreground)', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: ms.length > 0 ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{ms.length} shifts</span>
                </div>
                {ms.filter((s) => s.status === 'draft').length > 0 && (
                  <span style={{ fontSize: 9, color: 'var(--accent-foreground)', fontWeight: 600 }}>
                    {ms.filter((s) => s.status === 'draft').length} draft
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const YearView = React.memo(YearViewInner)
