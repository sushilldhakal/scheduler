// Grid Cell - Individual cell rendering

import React from 'react'
import type { CellProps } from './types'

export function GridCell({ position, row, column, blocks, onCellClick }: CellProps) {
  return (
    <div 
      className="grid-cell"
      style={{
        width: position.width,
        height: position.height,
        position: 'absolute',
        left: position.x,
        top: position.y,
        border: '1px solid #e0e0e0',
        backgroundColor: '#fff'
      }}
      onClick={() => onCellClick?.(position)}
    >
      {blocks.map(block => (
        <div 
          key={block.id} 
          className="block"
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            margin: '2px',
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {block.employee}
        </div>
      ))}
    </div>
  )
}