import React, { useState, useMemo } from "react"
import type { Shift } from "../types"
import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar } from "./ui/calendar"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { MONTHS, MONTHS_SHORT, sameDay, getWeekDates } from "../constants"

interface TodayButtonProps {
  onToday: () => void
}

export function TodayButton({ onToday }: TodayButtonProps): JSX.Element {
  const today = new Date()
  return (
    <button
      className="flex size-14 cursor-pointer flex-col items-start overflow-hidden rounded-lg border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      onClick={onToday}
    >
      <p className="flex h-6 w-full items-center justify-center bg-primary text-center text-xs font-semibold text-primary-foreground">
        {MONTHS_SHORT[today.getMonth()].toUpperCase()}
      </p>
      <p className="flex w-full items-center justify-center text-lg font-bold">{today.getDate()}</p>
    </button>
  )
}

interface DateNavigatorProps {
  view: string
  currentDate: Date
  onDateChange: (date: Date) => void
  onNavigate: (direction: number) => void
  shifts: Shift[]
}

export function DateNavigator({ view, currentDate, onDateChange, onNavigate, shifts }: DateNavigatorProps): JSX.Element {
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
    if (base === "day") return currentDate.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
    if (base === "week") {
      const wd = getWeekDates(currentDate)
      return `${wd[0].getDate()}-${wd[6].getDate()} ${MONTHS_SHORT[wd[0].getMonth()]}`
    }
    if (base === "month") return MONTHS_SHORT[currentDate.getMonth()]
    return currentDate.getFullYear().toString()
  }, [base, currentDate])

  const handleDateSelect = (date: Date | undefined): void => {
    if (date) {
      onDateChange(date)
      setOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-foreground">
          {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <div className="inline-flex items-center rounded-full border border-border bg-transparent px-2 py-1 text-xs font-medium text-muted-foreground">
          {eventCount} events
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={() => onNavigate(-1)} variant="outline" size="icon" className="h-7 w-7">
          <ChevronLeft size={16} />
        </Button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
              <CalendarIcon size={14} />
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

        <Button onClick={() => onNavigate(1)} variant="outline" size="icon" className="h-7 w-7">
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  )
}
