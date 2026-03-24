// Grid Header - Time/date headers

import React from 'react'
import type { GridColumn } from './types'

export interface GridHeaderProps {
  columns: GridColumn[]
  className?: string
}

export function GridHeader({ columns, className = '' }: GridHeaderProps) {
  return (
    <div className={`grid-header ${className}`}>
      {columns.map(column => (
        <div
          key={column.id}
          className="grid-header-cell"
          style={{
            width: column.width,
            height: 40,
            display: 'inline-block',
            border: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
            padding: '8px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {column.label}
        </div>
      ))}
    </div>
  )
}