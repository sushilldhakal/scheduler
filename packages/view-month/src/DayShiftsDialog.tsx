import React from 'react'
import type { Block, Resource } from '@shadcn-scheduler/core'
import { fmt12 } from '@shadcn-scheduler/core'
import { useSchedulerContext } from '@shadcn-scheduler/shell'

interface DayShiftsDialogProps {
  date: Date
  shifts: Block[]
  categoryMap: Record<string, Resource>
  onClose: () => void
  onShiftClick?: (block: Block, resource: Resource) => void
}

export function DayShiftsDialog({
  date,
  shifts,
  categoryMap,
  onClose,
  onShiftClick,
}: DayShiftsDialogProps): React.ReactElement {
  const { getColor } = useSchedulerContext()

  const byCategory = React.useMemo(() => {
    const map: Record<string, Block[]> = {}
    shifts.forEach((s) => {
      if (!map[s.categoryId]) map[s.categoryId] = []
      map[s.categoryId].push(s)
    })
    Object.keys(map).forEach((cid) => map[cid].sort((a, b) => a.startH - b.startH))
    return map
  }, [shifts])

  const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ minWidth: 320, maxWidth: 420, maxHeight: '80vh', overflowY: 'auto', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--background)', padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
      >
        <div style={{ marginBottom: 4, fontSize: 15, fontWeight: 800, color: 'var(--foreground)' }}>{dateStr}</div>
        <div style={{ marginBottom: 16, fontSize: 12, color: 'var(--muted-foreground)' }}>{shifts.length} shift{shifts.length !== 1 ? 's' : ''}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(byCategory).map(([categoryId, catShifts]) => {
            const cat = categoryMap[categoryId]
            if (!cat) return null
            const c = getColor(cat.colorIdx)
            return (
              <div key={categoryId}>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: c.text }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.bg }} />
                  {cat.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {catShifts.map((shift) => {
                    const isDraft = shift.status === 'draft'
                    return (
                      <div
                        key={shift.id}
                        onClick={() => onShiftClick?.(shift, cat)}
                        style={{ borderRadius: 8, padding: '8px 12px', fontSize: 13, fontWeight: 600, background: isDraft ? c.light : c.bg, color: isDraft ? c.text : 'var(--background)', border: isDraft ? `1.5px dashed ${c.border}` : 'none', cursor: onShiftClick ? 'pointer' : 'default' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>{isDraft && '✎ '}{shift.employee}</span>
                          <span style={{ fontSize: 12, opacity: 0.9 }}>{fmt12(shift.startH)} – {fmt12(shift.endH)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <button type="button" onClick={onClose} style={{ marginTop: 20, width: '100%', borderRadius: 8, background: 'var(--muted)', padding: '10px 16px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', border: 'none', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  )
}
