import React, { useMemo } from 'react'
import type { Block, Resource } from '@shadcn-scheduler/core'
import { toDateISO } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'

export interface KanbanViewProps {
  date: Date
  shifts: Block[]
  setShifts: React.Dispatch<React.SetStateAction<Block[]>>
  onShiftClick: (block: Block, resource: Resource) => void
  onAddShift: (date: Date, categoryId?: string, empId?: string) => void
  readOnly?: boolean
}

export function KanbanView({
  date,
  shifts,
  onShiftClick,
  onAddShift,
  readOnly,
}: KanbanViewProps): React.ReactElement {
  const { categories, getColor } = useSchedulerContext()
  const iso = toDateISO(date)
  const dayShifts = useMemo(() => shifts.filter((s) => s.date === iso), [shifts, iso])

  return (
    <div style={{ flex: 1, display: 'flex', gap: 16, padding: 16, overflowX: 'auto', overflowY: 'hidden' }}>
      {categories.map((cat) => {
        const c = getColor(cat.colorIdx)
        const catShifts = dayShifts.filter((s) => s.categoryId === cat.id)
        return (
          <div key={cat.id} style={{ minWidth: 220, width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: c.light, border: `1px solid ${c.border}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.bg }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{cat.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: c.text, opacity: 0.7 }}>{catShifts.length}</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catShifts.map((shift) => {
                const isDraft = shift.status === 'draft'
                return (
                  <div
                    key={shift.id}
                    onClick={() => onShiftClick(shift, cat)}
                    style={{ background: isDraft ? c.light : 'var(--background)', border: `1px solid ${isDraft ? c.border : 'var(--border)'}`, borderRadius: 8, padding: '10px 12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)' }}>{shift.employee}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
                      {shift.startH}:00 – {shift.endH}:00
                      {isDraft && <span style={{ marginLeft: 6, color: c.bg, fontWeight: 600 }}>Draft</span>}
                    </div>
                  </div>
                )
              })}
              {!readOnly && (
                <button onClick={() => onAddShift(date, cat.id)} style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px dashed var(--border)`, background: 'transparent', cursor: 'pointer', fontSize: 12, color: 'var(--muted-foreground)', textAlign: 'left' }}>
                  + Add shift
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
