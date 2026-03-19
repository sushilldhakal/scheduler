import * as React from "react"
import { Group, Panel, Separator } from "react-resizable-panels"
import type { GroupProps, PanelProps, SeparatorProps, PanelImperativeHandle } from "react-resizable-panels"
import { GripVertical } from "lucide-react"
import { cn } from "../../lib/utils"

const ResizablePanelGroup = ({ className, ...props }: GroupProps) => (
  <Group
    className={cn(
      "flex h-full w-full data-[orientation=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = React.forwardRef<
  PanelImperativeHandle,
  PanelProps
>(({ className, ...props }, ref) => (
  <Panel
    panelRef={ref as React.Ref<PanelImperativeHandle>}
    className={className}
    {...props}
  />
))
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = ({
  withHandle,
  className,
  children,
  ...props
}: SeparatorProps & { withHandle?: boolean }) => (
  <Separator
    className={cn(
      "relative flex w-[6px] shrink-0 items-center justify-center bg-border",
      "cursor-col-resize transition-colors hover:bg-primary/40",
      "data-[orientation=vertical]:h-[6px] data-[orientation=vertical]:w-full data-[orientation=vertical]:cursor-row-resize",
      className
    )}
    {...props}
  >
    {children}
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </Separator>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
export type { PanelImperativeHandle }
