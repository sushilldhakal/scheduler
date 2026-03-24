// Grid Base - Foundation grid component with virtualization

import React from 'react'
import type { GridViewProps, CellProps } from './types'

export interface GridBaseProps extends GridViewProps {
  className?: string
}

export function GridBase({
  rows,
  columns,
  blocks,
  onBlocksChange,
  onCellClick,
  onDragStart,
  onDragEnd,
  cellRenderer: CellRenderer,
  headerRenderer: HeaderRenderer,
  sidebarRenderer: SidebarRenderer,
  className = ''
}: GridBaseProps) {
  const defaultCellRenderer = ({ position, row, column, blocks }: CellProps) => (
    <div 
      className="grid-cell"
      style={{
        width: position.width,
        height: position.height,
        position: 'absolute',
        left: position.x,
        top: position.y
      }}
      onClick={() => onCellClick?.(position)}
    >
      {blocks.map(block => (
        <div key={block.id} className="block">
          {block.employee}
        </div>
      ))}
    </div>
  )

  const CellComponent = CellRenderer || defaultCellRenderer

  return (
    <div className={`grid-base ${className}`}>
      <div className="grid-header">
        {HeaderRenderer && columns.map(column => (
          <HeaderRenderer key={column.id} column={column} />
        ))}
      </div>
      
      <div className="grid-content">
        <div className="grid-sidebar">
          {SidebarRenderer && rows.map(row => (
            <SidebarRenderer key={row.id} row={row} />
          ))}
        </div>
        
        <div className="grid-cells">
          {rows.map((row, rowIndex) =>
            columns.map((column, columnIndex) => {
              const position = {
                row: rowIndex,
                column: columnIndex,
                x: columnIndex * column.width,
                y: rowIndex * row.height,
                width: column.width,
                height: row.height
              }
              
              const cellBlocks = blocks.filter(block =>
                block.categoryId === row.resource.id
              )
              
              return (
                <CellComponent
                  key={`${row.id}-${column.id}`}
                  position={position}
                  row={row}
                  column={column}
                  blocks={cellBlocks}
                  onCellClick={onCellClick}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}