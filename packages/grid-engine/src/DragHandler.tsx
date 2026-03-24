// Drag Handler - Drag and drop interactions

import React, { useState, useCallback } from 'react'
import type { GridDragEvent } from './types'

export interface DragHandlerProps {
  onDragStart?: (event: GridDragEvent) => void
  onDragEnd?: (event: GridDragEvent) => void
  children: React.ReactNode
}

export function DragHandler({ onDragStart, onDragEnd, children }: DragHandlerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    // Placeholder drag event - would be more sophisticated in real implementation
    const _dragEvent: GridDragEvent = {
      blockId: 'placeholder',
      startPosition: { row: 0, column: 0, x: dragStart.x, y: dragStart.y, width: 0, height: 0 },
      currentPosition: { row: 0, column: 0, x: e.clientX, y: e.clientY, width: 0, height: 0 },
      deltaX,
      deltaY
    }

    // onDragMove would be called here in real implementation
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const dragEvent: GridDragEvent = {
      blockId: 'placeholder',
      startPosition: { row: 0, column: 0, x: dragStart.x, y: dragStart.y, width: 0, height: 0 },
      currentPosition: { row: 0, column: 0, x: e.clientX, y: e.clientY, width: 0, height: 0 },
      deltaX,
      deltaY
    }

    onDragEnd?.(dragEvent)
    setIsDragging(false)
    setDragStart(null)
  }, [isDragging, dragStart, onDragEnd])

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {children}
    </div>
  )
}