// Slot Renderer - Plugin slot rendering system

import React from 'react'
import type { SlotType, SlotProps } from './types'
import { usePluginManager } from './PluginManager'

interface SlotRendererProps extends SlotProps {
  slotType: SlotType
}

export function SlotRenderer({ slotType, ...props }: SlotRendererProps) {
  const { getPluginsForSlot } = usePluginManager()
  const plugins = getPluginsForSlot(slotType)

  if (plugins.length === 0) {
    return null
  }

  return (
    <div className={`slot-${slotType}`}>
      {plugins.map(plugin => {
        const SlotComponent = plugin.slots[slotType]
        return (
          <SlotComponent
            key={plugin.id}
            {...props}
          />
        )
      })}
    </div>
  )
}

export function renderSlot(slotType: SlotType, props: SlotProps): React.ReactNode {
  return <SlotRenderer slotType={slotType} {...props} />
}