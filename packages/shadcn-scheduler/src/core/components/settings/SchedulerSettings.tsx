import React, { useState } from "react"
import { Settings, FileDown, Image, FileSpreadsheet } from "lucide-react"
import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { useSchedulerContext } from "../../context"
import { ChangeBadgeVariantInput } from "./ChangeBadgeVariantInput"
import { ChangeVisibleHoursInput } from "./ChangeVisibleHoursInput"
import { ChangeWorkingHoursInput } from "./ChangeWorkingHoursInput"
import { exportToCSV, exportToImage, exportToPDF } from "../../utils/export"
import type { BadgeVariant } from "../../types"
import type { SchedulerSettingsContext } from "../../types"

export interface SchedulerSettingsProps extends SchedulerSettingsContext {}

export function SchedulerSettings({
  onSettingsChange,
  containerRef,
  shifts = [],
}: SchedulerSettingsProps): React.ReactElement {
  const { settings } = useSchedulerContext()
  const [open, setOpen] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportCSV = (): void => {
    setExportError(null)
    try {
      exportToCSV(shifts, "scheduler-export.csv")
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "CSV export failed")
    }
  }

  const handleExportImage = async (): Promise<void> => {
    setExportError(null)
    if (!containerRef?.current) {
      setExportError("Container not ready for export")
      return
    }
    try {
      await exportToImage(containerRef.current, "scheduler.png")
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Image export failed")
    }
  }

  const handleExportPDF = async (): Promise<void> => {
    setExportError(null)
    if (!containerRef?.current) {
      setExportError("Container not ready for export")
      return
    }
    try {
      await exportToPDF(containerRef.current, "scheduler.pdf")
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "PDF export failed")
    }
  }

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

          {(containerRef || shifts.length > 0) && (
            <div className="space-y-2 border-t border-border pt-4">
              <h4 className="text-xs font-semibold text-muted-foreground">Export</h4>
              <div className="flex flex-wrap gap-2">
                {shifts.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleExportCSV}
                  >
                    <FileSpreadsheet size={14} />
                    CSV
                  </Button>
                )}
                {containerRef && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleExportImage}
                    >
                      <Image size={14} />
                      Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleExportPDF}
                    >
                      <FileDown size={14} />
                      PDF
                    </Button>
                  </>
                )}
              </div>
              {exportError && (
                <p className="text-xs text-destructive">{exportError}</p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
