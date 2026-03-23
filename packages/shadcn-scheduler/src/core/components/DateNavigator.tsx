import React, { useState, useMemo } from "react"
import type { Block } from "../types"
import { useSchedulerContext } from "../context"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import { ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import { MONTHS, MONTHS_SHORT, sameDay, getWeekDates } from "../constants"

interface TodayButtonProps {
  onToday: () => void
}

export function TodayButton({ onToday }: TodayButtonProps): React.ReactElement {
  const today = new Date()
  return (
    <button
      className="flex h-full min-h-[56px] w-12 shrink-0 cursor-pointer flex-col items-center overflow-hidden rounded-md border border-border bg-background shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      onClick={onToday}
      title="Go to today"
    >
      <span className="flex h-5 w-full items-center justify-center bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider">
        {MONTHS_SHORT[today.getMonth()]}
      </span>
      <span className="flex w-full flex-1 items-center justify-center text-lg font-bold tabular-nums text-foreground">
        {today.getDate()}
      </span>
    </button>
  )
}

interface DateNavigatorProps {
  view: string
  currentDate: Date
  onDateChange: (date: Date) => void
  onNavigate: (direction: number) => void
  shifts: Block[]
  /** P12-04: "prev" | "next" for date label translate-x animation */
  navDirection?: "prev" | "next" | null
  /** Renders above the prev/calendar/next controls (e.g. Today button) */
  slotAbove?: React.ReactNode
}

export function DateNavigator({
  view,
  currentDate,
  onDateChange,
  onNavigate,
  shifts,
  navDirection = null,
  slotAbove,
}: DateNavigatorProps): React.ReactElement {
  const { getDateLabel } = useSchedulerContext()
  const [open, setOpen] = useState<boolean>(false)
  const base = view.replace("list", "") || "day"

  const eventCount = useMemo((): number => {
    if (base === "day") return shifts.filter((s) => sameDay(s.date, currentDate)).length
    if (base === "week") {
      const weekDates = getWeekDates(currentDate)
      return shifts.filter((s) => weekDates.some((d) => sameDay(d, s.date))).length
    }
    if (base === "month") {
      const y = currentDate.getFullYear(),
        m = currentDate.getMonth()
      return shifts.filter((s) => {
        const d = new Date(s.date + "T12:00:00")
        return d.getFullYear() === y && d.getMonth() === m
      }).length
    }
    return shifts.filter((s) => new Date(s.date + "T12:00:00").getFullYear() === currentDate.getFullYear()).length
  }, [base, currentDate, shifts])

  const rangeText = useMemo((): string => {
    const y = currentDate.getFullYear()
    if (base === "day") {
      return getDateLabel(currentDate, { month: "short", day: "numeric", year: "numeric" })
    }
    if (base === "week") {
      const wd = getWeekDates(currentDate)
      const start = `${getDateLabel(wd[0], { month: "short" })} ${wd[0].getDate()}, ${y}`
      const end = `${getDateLabel(wd[6], { month: "short" })} ${wd[6].getDate()}, ${y}`
      return wd[0].getMonth() === wd[6].getMonth()
        ? `${getDateLabel(wd[0], { month: "short" })} ${wd[0].getDate()} - ${wd[6].getDate()}, ${y}`
        : `${start} - ${end}`
    }
    if (base === "month") {
      const m = currentDate.getMonth()
      const lastDay = new Date(y, m + 1, 0).getDate()
      return `${getDateLabel(currentDate, { month: "short" })} 1 - ${getDateLabel(currentDate, { month: "short" })} ${lastDay}, ${y}`
    }
    if (base === "timeline") {
      return getDateLabel(currentDate, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    }
    return `${getDateLabel(new Date(y, 0, 1), { month: "short" })} 1, ${y} - ${getDateLabel(new Date(y, 11, 31), { month: "short" })} 31, ${y}`
  }, [base, currentDate, getDateLabel])

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      onDateChange(date)
      setOpen(false)
    }
  }

  const dateControls = (
    <div className="flex items-center gap-1.5">
      <Button
        onClick={() => onNavigate(-1)}
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0 rounded"
        title="Previous"
      >
        <ChevronLeft size={14} />
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 min-w-0 border-transparent bg-transparent px-2 text-sm font-normal shadow-none hover:bg-muted/50 hover:text-foreground data-[direction=prev]:animate-[slideInFromLeft_150ms_ease-out] data-[direction=next]:animate-[slideInFromRight_150ms_ease-out]"
            data-direction={navDirection ?? undefined}
            title="Pick a date"
          >
            {rangeText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        onClick={() => onNavigate(1)}
        variant="outline"
        size="icon"
        className="h-7 w-7 shrink-0 rounded"
        title="Next"
      >
        <ChevronRight size={14} />
      </Button>
    </div>
  )

  return (
    <div className="grid grid-cols-[auto_1fr] grid-rows-2 items-center gap-x-2 gap-y-1">
      <div className="row-span-2 self-stretch">
        {slotAbove}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-semibold text-foreground">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
          <BadgeCheck size={11} className="shrink-0" />
          {eventCount} {eventCount === 1 ? "event" : "events"}
        </div>
      </div>
      <div className="flex items-center">
        {dateControls}
      </div>
    </div>
  )
}
