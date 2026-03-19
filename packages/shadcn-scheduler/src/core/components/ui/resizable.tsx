/**
 * Resizable panels — thin wrapper around react-resizable-panels v4
 * Uses v4 API: Group, Panel, Separator (not PanelGroup/PanelResizeHandle)
 */
import * as React from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import type { GroupProps, PanelProps, SeparatorProps, PanelImperativeHandle } from "react-resizable-panels"
import { cn } from "../../lib/utils"

const ResizablePanelGroup = ({ className, ...props }: GroupProps) => (
  <Group
    className={cn("flex h-full w-full", className)}
    {...props}
  />
)
ResizablePanelGroup.displayName = "ResizablePanelGroup"

/** Pass panelRef={yourRef} to get imperative handle (collapse/expand) */
const ResizablePanel = ({ className, ...props }: PanelProps) => (
  <Panel className={className} {...props} />
)
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = ({
  className,
  children,
  ...props
}: SeparatorProps) => (
  <Separator
    className={cn(
      "relative flex shrink-0 items-center justify-center bg-border",
      "cursor-col-resize transition-colors hover:bg-primary/40 active:bg-primary/60",
      className
    )}
    {...props}
  >
    {children}
  </Separator>
)
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
export type { PanelImperativeHandle }
