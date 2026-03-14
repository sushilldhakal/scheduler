import React, { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { useSchedulerContext } from "../../context"
import { ChangeBadgeVariantInput } from "./ChangeBadgeVariantInput"
import { ChangeVisibleHoursInput } from "./ChangeVisibleHoursInput"
import { ChangeWorkingHoursInput } from "./ChangeWorkingHoursInput"
import type { BadgeVariant } from "../../types"

export interface SchedulerSettingsProps {
  onSettingsChange: (partial: Record<string, unknown>) => void
}

export function SchedulerSettings({ onSettingsChange }: SchedulerSettingsProps): JSX.Element {
  const { settings } = useSchedulerContext()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Calendar settings"
        >
          <Settings size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold">Calendar settings</h4>
            <p className="text-xs text-muted-foreground">
              Customize view and shift display
            </p>
          </div>

          <ChangeBadgeVariantInput
            value={(settings.badgeVariant ?? "both") as BadgeVariant}
            onChange={(v) => onSettingsChange({ badgeVariant: v })}
          />

          <ChangeVisibleHoursInput
            visibleFrom={settings.visibleFrom}
            visibleTo={settings.visibleTo}
            onChange={(from, to) =>
              onSettingsChange({ visibleFrom: from, visibleTo: to })
            }
          />

          <ChangeWorkingHoursInput
            workingHours={settings.workingHours}
            onChange={(wh) => onSettingsChange({ workingHours: wh })}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
