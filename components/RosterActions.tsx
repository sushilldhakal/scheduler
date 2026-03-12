import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ICopy, IMagic, IChevD, ICheck } from "../icons"

interface RosterActionsProps {
  onCopyLastWeek: () => void
  onFillFromSchedules: () => void
  onPublishAll: () => void
  draftCount: number
}

export function RosterActions({ onCopyLastWeek, onFillFromSchedules, onPublishAll, draftCount }: RosterActionsProps): JSX.Element {
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
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <IMagic size={12} />
          <span>Roster</span>
          <IChevD size={10} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-3 pb-2">
          <div className="text-sm font-medium text-muted-foreground">Roster Generation</div>
        </div>

        <div className="p-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-auto p-2"
            onClick={handleCopyLastWeek}
          >
            <ICopy size={14} />
            Copy Last Week
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-auto p-2"
            onClick={handleFillFromSchedules}
          >
            <IMagic size={14} />
            Fill from Schedules
          </Button>

          {draftCount > 0 && (
            <>
              <div className="h-px bg-border my-1" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-auto p-2 text-green-600 hover:text-green-700"
                onClick={handlePublishAll}
              >
                <ICheck size={14} />
                Publish All ({draftCount})
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}