'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type WidthContextType = {
  fullWidth: boolean
  toggleFullWidth: () => void
}

const WidthContext = createContext<WidthContextType>({
  fullWidth: false,
  toggleFullWidth: () => {},
})

export function WidthProvider({ children }: { children: React.ReactNode }) {
  const [fullWidth, setFullWidth] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    const stored = localStorage.getItem('docs-full-width')
    if (stored === 'true') setFullWidth(true)
  }, [])

  const toggleFullWidth = () => {
    setFullWidth((prev) => {
      const newValue = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('docs-full-width', String(newValue))
      }
      return newValue
    })
  }

  // During SSR and before hydration, always return false to match server
  const contextValue = {
    fullWidth: isHydrated ? fullWidth : false,
    toggleFullWidth,
  }

  return (
    <WidthContext.Provider value={contextValue}>
      {children}
    </WidthContext.Provider>
  )
}

export function useWidth() {
  return useContext(WidthContext)
}
