// Plugin Manager - Plugin registration and lifecycle management

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react'
import type { Plugin, SchedulerContextValue, SlotType } from './types'

interface PluginManagerProps {
  plugins: Plugin[]
  context: SchedulerContextValue
  children: ReactNode
}

interface PluginManagerContext {
  plugins: Plugin[]
  registerPlugin: (plugin: Plugin) => void
  unregisterPlugin: (pluginId: string) => void
  getPluginsForSlot: (slotType: SlotType) => Plugin[]
}

const PluginManagerContext = createContext<PluginManagerContext | null>(null)

export function PluginManager({ plugins: initialPlugins, context, children }: PluginManagerProps) {
  const [plugins, setPlugins] = useState<Plugin[]>(initialPlugins)

  useEffect(() => {
    // Initialize plugins
    plugins.forEach(plugin => {
      plugin.lifecycle?.onMount?.(context)
    })

    return () => {
      // Cleanup plugins
      plugins.forEach(plugin => {
        plugin.lifecycle?.onUnmount?.(context)
      })
    }
  }, [plugins, context])

  const registerPlugin = (plugin: Plugin) => {
    setPlugins(prev => [...prev, plugin])
  }

  const unregisterPlugin = (pluginId: string) => {
    setPlugins(prev => prev.filter(p => p.id !== pluginId))
  }

  const getPluginsForSlot = (slotType: SlotType): Plugin[] => {
    return plugins.filter(plugin => plugin.slots[slotType])
  }

  const value: PluginManagerContext = {
    plugins,
    registerPlugin,
    unregisterPlugin,
    getPluginsForSlot
  }

  return (
    <PluginManagerContext.Provider value={value}>
      {children}
    </PluginManagerContext.Provider>
  )
}

export function usePluginManager(): PluginManagerContext {
  const context = useContext(PluginManagerContext)
  if (!context) {
    throw new Error('usePluginManager must be used within a PluginManager')
  }
  return context
}