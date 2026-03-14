import React, { useState, useMemo } from "react"
import type { Shift } from "../types"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import { ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react"
import { MONTHS, MONTHS_SHORT, sameDay, getWeekDates } from "../constants"

interface TodayButtonProps {
  onToday: () => void
}

export function TodayButton({ onToday }: TodayButtonProps): JSX.Element {
  const today = new Date()
  return (
    <button
      className="flex h-full min-h-[56px] w-12 shrink-0 cursor-pointer flex-col items-center overflow-hidden rounded-md border border-border bg-white shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      onClick={onToday}
      title="Go to today"
    >
      <span className="flex h-5 w-full items-center justify-center bg-zinc-800 text-[10px] font-semibold uppercase tracking-wider text-white">
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
  shifts: Shift[]
  /** Renders above the prev/calendar/next controls (e.g. Today button) */
  slotAbove?: React.ReactNode
}

export function DateNavigator({
  view,
  currentDate,
  onDateChange,
  onNavigate,
  shifts,
  slotAbove,
}: DateNavigatorProps): JSX.Element {
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
      return shifts.filter((s) => s.date.getFullYear() === y && s.date.getMonth() === m).length
    }
    return shifts.filter((s) => s.date.getFullYear() === currentDate.getFullYear()).length
  }, [base, currentDate, shifts])

  const rangeText = useMemo((): string => {
    const y = currentDate.getFullYear()
    if (base === "day") {
      return currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
    if (base === "week") {
      const wd = getWeekDates(currentDate)
      const start = `${MONTHS_SHORT[wd[0].getMonth()]} ${wd[0].getDate()}, ${y}`
      const end = `${MONTHS_SHORT[wd[6].getMonth()]} ${wd[6].getDate()}, ${y}`
      return wd[0].getMonth() === wd[6].getMonth()
        ? `${MONTHS_SHORT[wd[0].getMonth()]} ${wd[0].getDate()} - ${wd[6].getDate()}, ${y}`
        : `${start} - ${end}`
    }
    if (base === "month") {
      const m = currentDate.getMonth()
      const lastDay = new Date(y, m + 1, 0).getDate()
      return `${MONTHS_SHORT[m]} 1 - ${MONTHS_SHORT[m]} ${lastDay}, ${y}`
    }
    return `Jan 1, ${y} - Dec 31, ${y}`
  }, [base, currentDate])

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
            className="h-7 min-w-0 border-transparent bg-transparent px-2 text-sm font-normal shadow-none hover:bg-muted/50 hover:text-foreground"
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
