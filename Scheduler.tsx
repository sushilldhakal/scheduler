"use client"
import React, { useState, useCallback } from "react"
import type { Shift, Role, Settings } from "./types"
import { Button } from "@/components/ui/button"

// ── Data & constants ──────────────────────────────────────────────────────────
import { ALL_EMPLOYEES, generateShifts, nextUid } from "./data"
import { DEFAULT_SETTINGS, getWeekDates, sameDay } from "./constants"

// ── Icons ─────────────────────────────────────────────────────────────────────
import { IPlus } from "./icons"

// ── Header controls ───────────────────────────────────────────────────────────
import { TodayButton, DateNavigator } from "./components/DateNavigator"
import { ViewTabs }     from "./components/ViewTabs"
import { UserSelect }   from "./components/UserSelect"
import { RosterActions } from "./components/RosterActions"

// ── Modals ────────────────────────────────────────────────────────────────────
import { AddShiftModal } from "./components/modals/AddShiftModal"
import { ShiftModal }    from "./components/modals/ShiftModal"

// ── Views ─────────────────────────────────────────────────────────────────────
import { DayView, WeekView }  from "./components/views/DayWeekViews"
import { MonthView }           from "./components/views/MonthView"
import { YearView }            from "./components/views/YearView"
import { ListView }            from "./components/views/ListView"

interface AddContext {
  date: Date
  roleId?: string | null
  empId?: string | null
}

export default function Scheduler(): JSX.Element {
  const [view,        setView]        = useState<string>("week")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [shifts,      setShifts]      = useState<Shift[]>(generateShifts)
  const [settings]                    = useState<Settings>(DEFAULT_SETTINGS)

  // Shift detail modal
  const [selShift, setSelShift] = useState<Shift | null>(null)
  const [selRole,  setSelRole]  = useState<Role | null>(null)

  // Add shift modal
  const [addCtx,   setAddCtx]   = useState<AddContext | null>(null)

  // Employee filter
  const [selEmps,  setSelEmps]  = useState<Set<string>>(() => new Set(ALL_EMPLOYEES.map(e => e.id)))

  // ── Callbacks ───────────────────────────────────────────────────────────────
  const onShiftClick = (s: Shift, r: Role): void => { setSelShift(s); setSelRole(r) }
  const onAddShift   = (date: Date, roleId?: string | null, empId?: string | null): void => setAddCtx({ date, roleId, empId })
  const handleAdd    = (shift: Shift): void => setShifts(prev => [...prev, shift])

  const publishShifts  = useCallback((...ids: string[]): void =>
    setShifts(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: "published" } : s)), [])

  const unpublishShift = useCallback((id: string): void =>
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status: "draft" } : s)), [])

  const toggleEmp = (id: string): void =>
    setSelEmps(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = (dir: number): void => {
    const d = new Date(currentDate)
    const b = view.replace("list", "") || "day"
    if (b === "day")   d.setDate(d.getDate() + dir)
    if (b === "week")  d.setDate(d.getDate() + dir * 7)
    if (b === "month") d.setMonth(d.getMonth() + dir)
    if (b === "year")  d.setFullYear(d.getFullYear() + dir)
    setCurrentDate(d)
  }
  // ── Roster actions ──────────────────────────────────────────────────────────
  const copyLastWeek = (): void => {
    const wd  = getWeekDates(currentDate)
    const lw  = wd.map(d => { const nd = new Date(d); nd.setDate(nd.getDate() - 7); return nd })
    const lws = shifts.filter(s => lw.some(d => sameDay(d, s.date)))
    setShifts(prev => [
      ...prev,
      ...lws.map(s => {
        const di = lw.findIndex(d => sameDay(d, s.date))
        return { ...s, id: nextUid(), date: new Date(wd[di]), status: "draft" }
      }),
    ])
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const isListView = view.startsWith("list")
  const baseView   = view.replace("list", "") || "day"
  const draftCount = shifts.filter(s => s.status === "draft").length

  // ── Shared view props ───────────────────────────────────────────────────────
  const sharedGridProps = { shifts, setShifts, selEmps, onShiftClick, onAddShift, settings }

  const handleTodayClick = (): void => {
    setCurrentDate(new Date())
  }

  const handleAllEmployees = (): void => {
    setSelEmps(new Set(ALL_EMPLOYEES.map(e => e.id)))
  }

  const handleNoEmployees = (): void => {
    setSelEmps(new Set())
  }

  const handleFillFromSchedules = (): void => {
    alert("Connect your scheduling engine")
  }

  const handlePublishAllDrafts = (): void => {
    publishShifts(...shifts.filter(s => s.status === "draft").map(s => s.id))
  }

  const handlePublishAllFromBanner = (): void => {
    setShifts(prev => prev.map(s => ({ ...s, status: "published" })))
  }

  const handleAddShiftButton = (): void => {
    onAddShift(new Date(), null, null)
  }

  const handleMonthClick = (y: number, m: number): void => {
    setCurrentDate(new Date(y, m, 1))
    setView("month")
  }

  const handleShiftModalPublish = (id: string): void => {
    publishShifts(id)
    setSelShift(s => s ? { ...s, status: "published" } : null)
  }

  const handleShiftModalUnpublish = (id: string): void => {
    unpublishShift(id)
    setSelShift(s => s ? { ...s, status: "draft" } : null)
  }

  const handleCloseShiftModal = (): void => {
    setSelShift(null)
    setSelRole(null)
  }

  const handleCloseAddModal = (): void => {
    setAddCtx(null)
  }
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", background: "#f8fafc", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Draft banner */}
      {draftCount > 0 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 20px", background: "#fffbeb", borderBottom: "1px solid #fde68a", flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#92400e" }}>
            ✎ {draftCount} shift{draftCount !== 1 ? "s" : ""} in draft — not visible to staff
          </span>
          <button
            onClick={handlePublishAllFromBanner}
            style={{ fontSize: 11, fontWeight: 700, background: "#f59e0b", color: "#fff", border: "none", borderRadius: 7, padding: "4px 12px", cursor: "pointer" }}
          >
            Publish all
          </button>
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: today button + date navigator */}
        <div className="flex items-center gap-3">
          <TodayButton onToday={handleTodayClick} />
          <DateNavigator
            view={view}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            onNavigate={navigate}
            shifts={shifts}
          />
        </div>

        {/* Right: view tabs + user filter + roster actions + add button */}
        <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
          <div className="flex w-full items-center gap-2">
            <ViewTabs view={view} setView={setView} />
            <UserSelect
              selEmps={selEmps}
              onToggle={toggleEmp}
              onAll={handleAllEmployees}
              onNone={handleNoEmployees}
            />
          </div>

          <div className="flex w-full sm:w-auto gap-2">
            <RosterActions
              onCopyLastWeek={copyLastWeek}
              onFillFromSchedules={handleFillFromSchedules}
              onPublishAll={handlePublishAllDrafts}
              draftCount={draftCount}
            />
            <Button onClick={handleAddShiftButton} className="w-full sm:w-auto">
              <IPlus size={16} />
              Add Shift
            </Button>
          </div>
        </div>
      </div>

      {/* ── View area ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {!isListView && baseView === "day"   && <DayView   date={currentDate} {...sharedGridProps} />}
        {!isListView && baseView === "week"  && <WeekView  date={currentDate} setDate={setCurrentDate} {...sharedGridProps} />}
        {!isListView && baseView === "month" && <MonthView date={currentDate} shifts={shifts} setShifts={setShifts} onShiftClick={onShiftClick} onAddShift={onAddShift} settings={settings} />}
        {!isListView && baseView === "year"  && <YearView  date={currentDate} shifts={shifts} onMonthClick={handleMonthClick} />}
        {isListView && (
          <ListView
            shifts={shifts}
            setShifts={setShifts}
            onShiftClick={onShiftClick}
            onPublish={publishShifts}
            onUnpublish={unpublishShift}
            currentDate={currentDate}
            view={view}
          />
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {addCtx && (
        <AddShiftModal
          date={addCtx.date}
          roleId={addCtx.roleId}
          employeeId={addCtx.empId}
          onAdd={handleAdd}
          onClose={handleCloseAddModal}
        />
      )}

      <ShiftModal
        shift={selShift}
        role={selRole}
        onClose={handleCloseShiftModal}
        onPublish={handleShiftModalPublish}
        onUnpublish={handleShiftModalUnpublish}
      />
    </div>
  )
}