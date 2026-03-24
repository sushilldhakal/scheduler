// Grid View Base - Abstract base class for grid-based views

import React, { Component } from 'react'
import type { CellPosition } from '@shadcn-scheduler/core'
import type { GridViewProps, GridLayout } from './types'
import { GridBase } from './GridBase'

export abstract class GridViewBase extends Component<GridViewProps> {
  abstract renderCell(position: CellPosition): React.ReactNode
  abstract renderHeader(): React.ReactNode
  abstract calculateLayout(): GridLayout

  render() {
    const layout = this.calculateLayout()
    
    return (
      <GridBase
        {...this.props}
        rows={layout.rows}
        columns={layout.columns}
      />
    )
  }
}

// Functional component version for modern React
export interface GridViewBaseProps extends GridViewProps {
  renderCell?: (position: CellPosition) => React.ReactNode
  renderHeader?: () => React.ReactNode
  calculateLayout?: () => GridLayout
}

export function GridViewBaseFC({
  renderCell,
  renderHeader,
  calculateLayout,
  ...props
}: GridViewBaseProps) {
  const layout = calculateLayout?.() || { rows: [], columns: [], totalWidth: 0, totalHeight: 0 }
  
  return (
    <GridBase
      {...props}
      rows={layout.rows}
      columns={layout.columns}
    />
  )
}