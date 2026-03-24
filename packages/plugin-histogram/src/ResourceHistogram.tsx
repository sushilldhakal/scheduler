import React from 'react'
import type { HistogramBar } from './useHistogram'

const STATUS_COLOR: Record<HistogramBar['status'], string> = {
  ok: '#10b981',
  warning: '#f59e0b',
  over: '#ef4444',
}

export interface ResourceHistogramProps {
  bars: HistogramBar[]
  height?: number
  showLabels?: boolean
  className?: string
  style?: React.CSSProperties
}

export function ResourceHistogram({
  bars,
  height = 80,
  showLabels = true,
  className,
  style,
}: ResourceHistogramProps): React.ReactElement | null {
  if (!bars.length) return null

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        padding: '8px 12px',
        borderTop: '1px solid var(--border)',
        overflowX: 'auto',
        ...style,
      }}
    >
      {bars.map(({ resource, scheduledHours, capacityHours, utilizationPct, status }) => {
        const barH = Math.min((utilizationPct / 100) * height, height + 8)
        const color = STATUS_COLOR[status]
        return (
          <div
            key={resource.id}
            title={`${resource.name}: ${scheduledHours.toFixed(1)}h / ${capacityHours}h (${Math.round(utilizationPct)}%)`}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 28 }}
          >
            <div
              style={{
                width: 20,
                height,
                background: 'var(--border)',
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: barH,
                  background: color,
                  borderRadius: 3,
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
            {showLabels && (
              <span style={{ fontSize: 9, color: 'var(--muted-foreground)', textAlign: 'center', maxWidth: 36, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resource.name.split(' ')[0]}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
