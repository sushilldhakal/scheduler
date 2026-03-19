import React, { useState } from "react"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Copy, Sparkles, ChevronDown, Check } from "lucide-react"
import { useSchedulerContext } from "../context"

interface RosterActionsProps {
  onCopyLastWeek: () => void
  onFillFromSchedules: () => void
  onPublishAll: () => void
  draftCount: number
}

export function RosterActions({
  onCopyLastWeek,
  onFillFromSchedules,
  onPublishAll,
  draftCount,
}: RosterActionsProps): React.ReactElement {
  const { labels } = useSchedulerContext()
  const [open, setOpen] = useState<boolean>(false)

  const handleCopyLastWeek = (): void => {
    onCopyLastWeek()
    setOpen(false)
  }

  const handleFillFromSchedules = (): void => {
    onFillFromSchedules()
    setOpen(false)
  }

  const handlePublishAll = (): void => {
    onPublishAll()
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Sparkles size={12} />
          <span>{labels.roster}</span>
          <ChevronDown size={10} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-3 pb-2">
          <div className="text-sm font-medium text-muted-foreground">
            {labels.roster} Generation
          </div>
        </div>

        <div className="p-1">
          <Button variant="ghost" className="h-auto w-full justify-start gap-2 p-2" onClick={handleCopyLastWeek}>
            <Copy size={14} />
            {labels.copyLastWeek}
          </Button>

          <Button variant="ghost" className="h-auto w-full justify-start gap-2 p-2" onClick={handleFillFromSchedules}>
            <Sparkles size={14} />
            {labels.fillFromSchedules}
          </Button>

          {draftCount > 0 && (
            <>
              <div className="my-1 h-px bg-border" />
              <Button
                variant="ghost"
                className="h-auto w-full justify-start gap-2 p-2 text-primary hover:text-primary/90"
                onClick={handlePublishAll}
              >
                <Check size={14} />
                {labels.publishAll} ({draftCount})
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
