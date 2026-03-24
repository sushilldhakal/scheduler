// Scroll Manager - Scroll synchronization

import React, { useRef, useEffect, useCallback } from 'react'

export interface ScrollManagerProps {
  onScroll?: (scrollLeft: number, scrollTop: number) => void
  syncHorizontal?: boolean
  syncVertical?: boolean
  children: React.ReactNode
  className?: string
}

export function ScrollManager({ 
  onScroll, 
  syncHorizontal = true, 
  syncVertical = true, 
  children, 
  className = '' 
}: ScrollManagerProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollTop } = scrollRef.current
    onScroll?.(scrollLeft, scrollTop)
  }, [onScroll])

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return (
    <div
      ref={scrollRef}
      className={`scroll-manager ${className}`}
      style={{
        overflow: 'auto',
        width: '100%',
        height: '100%'
      }}
    >
      {children}
    </div>
  )
}