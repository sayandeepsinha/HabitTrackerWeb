"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { getDay } from "date-fns"
import type { CellState, HiddenHabits } from "./common/types"
import { CellButton } from "./common/cell-button"
import { StreakBadge } from "./common/streak-badge"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ChevronUpIcon, ChevronDownIcon, SmallCrossIcon, EyeIcon, EyeOffIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon, InfoIcon, PeopleIcon } from "./common/icons"
import { GridBanners } from "./grid-banners"
import { GridHeader } from "./grid-header"

type ManageMode = "edit" | "reorder" | "delete" | null

interface HabitGridProps {
  habits: string[]
  grid: Record<string, CellState[]>
  daysInMonth: number
  viewDate: Date
  isCurrentMonth: boolean
  currentStreaks: Record<string, number>
  bestStreaks: Record<string, number>
  onToggle: (habit: string, dayIdx: number) => void
  onAddHabit: (name: string) => void
  onRemoveHabit: (name: string) => void
  onRenameHabit?: (oldName: string, newName: string) => void
  onReorderHabit?: (name: string, direction: "up" | "down") => void
  hiddenHabits?: HiddenHabits
  onToggleHidden?: (habit: string) => void
  friendView?: boolean
  today: Date
  isPastUnlocked?: boolean
  onUnlockClick?: () => void
}

const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function HabitGrid({
  habits, grid, daysInMonth, viewDate, isCurrentMonth, currentStreaks, bestStreaks,
  onToggle, onAddHabit, onRemoveHabit, onRenameHabit, onReorderHabit,
  hiddenHabits = {}, onToggleHidden, friendView = false, today,
  isPastUnlocked, onUnlockClick
}: HabitGridProps) {
  const { toast } = useToast()
  const [isAdding, setIsAdding] = useState(false)
  const [newHabitName, setNewHabitName] = useState("")
  const [activeMode, setActiveMode] = useState<ManageMode>(null)
  const [editingHabit, setEditingHabit] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null) // Renamed to avoid conflict with function
  const editInputRef = useRef<HTMLInputElement>(null)

  const resetManage = useCallback(() => {
    setEditingHabit(null); setEditValue(""); setConfirmDeleteName(null)
  }, [])

  const toggleMode = useCallback((mode: ManageMode) => {
    setActiveMode(prev => prev === mode ? null : mode)
    resetManage()
  }, [resetManage])

  // Escape exits manage mode
  useEffect(() => {
    if (!activeMode) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setActiveMode(null); resetManage() } }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [activeMode, resetManage])

  const handleAdd = () => {
    if (newHabitName.trim()) {
      onAddHabit(newHabitName.trim())
      toast({ title: "Habit added", description: `Started tracking "${newHabitName.trim()}"` })
      setNewHabitName("")
      setIsAdding(false)
    }
  }

  const confirmRename = (oldName: string) => {
    if (editValue.trim() && editValue.trim() !== oldName && onRenameHabit) {
      onRenameHabit(oldName, editValue.trim())
      toast({ title: "Habit renamed", description: `"${oldName}" is now "${editValue.trim()}"` })
    }
    setEditingHabit(null)
    setEditValue("")
  }

  const confirmDelete = (name: string) => {
    onRemoveHabit(name)
    setConfirmDeleteName(null)
    toast({ title: "Habit removed", description: `"${name}" has been deleted.` })
  }

  useEffect(() => {
    if (editingHabit && editInputRef.current) { editInputRef.current.focus(); editInputRef.current.select() }
  }, [editingHabit])

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const visibleHabits = friendView ? habits.filter(h => !hiddenHabits[h]) : habits
  const dayOfWeekLabels = days.map(day => DAY_ABBREVS[getDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))])
  const canManage = isCurrentMonth && !friendView
  const cellsReadOnly = friendView
  const hasEyeCol = !friendView && !!onToggleHidden
  const isMobile = useIsMobile()

  return (
    <TooltipProvider delayDuration={300}>
      <div className="overflow-hidden rounded-3xl bg-card shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
        <GridBanners
            isCurrentMonth={isCurrentMonth}
            isPastUnlocked={isPastUnlocked}
            onUnlockClick={onUnlockClick}
            friendView={friendView}
        />
        <div className="overflow-auto max-h-[70vh]">
          <table className="min-w-full w-max border-separate border-spacing-0" role="grid" aria-label={`Habit tracking grid for ${daysInMonth} days`}>
            <GridHeader
                days={days}
                dayOfWeekLabels={dayOfWeekLabels}
                hasEyeCol={hasEyeCol}
                canManage={canManage}
                isCurrentMonth={isCurrentMonth}
                today={today}
                activeMode={activeMode}
                toggleMode={toggleMode}
                onRenameHabit={onRenameHabit}
                onReorderHabit={onReorderHabit}
            />
            <tbody>
              {visibleHabits.map(habit => {
                const isHidden = !!hiddenHabits[habit]
                return (
                  <tr key={habit} className={`transition-colors hover:bg-secondary/20 ${isHidden && !friendView ? "opacity-60" : ""}`}>
                    <td className="sticky left-0 z-30 w-[155px] min-w-[155px] max-w-[155px] sm:w-[210px] sm:min-w-[210px] sm:max-w-[210px] border-b border-border/50 bg-card px-4 sm:px-5 py-2.5">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex w-full items-center justify-between gap-1 overflow-hidden">
                          {activeMode === "edit" && editingHabit === habit ? (
                            <input ref={editInputRef} type="text" value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") confirmRename(habit); if (e.key === "Escape") { setEditingHabit(null); setEditValue("") } }}
                              onBlur={() => confirmRename(habit)}
                              className="h-7 w-full min-w-0 rounded-md border border-ring bg-background px-2 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          ) : (
                            <span
                              className={`line-clamp-2 min-w-0 flex-1 text-xs font-medium text-foreground sm:text-[13px] break-words leading-tight ${activeMode === "edit" ? "cursor-pointer rounded px-1 -mx-1 hover:bg-accent/60 transition-colors" : ""}`}
                              onClick={() => { if (activeMode === "edit") { setEditingHabit(habit); setEditValue(habit) } }}
                              title={activeMode === "edit" ? "Click to rename" : undefined}
                            >
                              {habit}
                            </span>
                          )}
                          {!activeMode && (
                            <div className="flex w-[38px] sm:w-[44px] flex-shrink-0 justify-end">
                              <StreakBadge count={isCurrentMonth ? (currentStreaks[habit] ?? 0) : (bestStreaks[habit] ?? 0)} />
                            </div>
                          )}
                        </div>

                        {/* Reorder controls */}
                        {activeMode === "reorder" && onReorderHabit && (
                          <div className="flex flex-col gap-0">
                            <button onClick={() => onReorderHabit(habit, "up")} className="flex h-3.5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground" aria-label={`Move ${habit} up`}><ChevronUpIcon /></button>
                            <button onClick={() => onReorderHabit(habit, "down")} className="flex h-3.5 w-5 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground" aria-label={`Move ${habit} down`}><ChevronDownIcon /></button>
                          </div>
                        )}

                        {/* Delete controls */}
                        {activeMode === "delete" && (
                          confirmDeleteName === habit ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => confirmDelete(habit)} className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground hover:opacity-80" aria-label={`Confirm delete ${habit}`}>Delete</button>
                              <button onClick={() => setConfirmDeleteName(null)} className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-border" aria-label="Cancel">Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteName(habit)} className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground/40 transition-colors hover:bg-destructive/15 hover:text-destructive" aria-label={`Delete ${habit}`}>
                              <SmallCrossIcon size={12} />
                            </button>
                          )
                        )}
                      </div>
                    </td>

                    {days.map((day, dayIdx) => {
                      const handleToggle = () => {
                        if (!isCurrentMonth && !friendView && !isPastUnlocked) {
                          onUnlockClick?.()
                          return
                        }
                        onToggle(habit, dayIdx)
                      }
                      
                      return (
                        <td key={dayIdx} className="px-0.5 py-2.5 text-center">
                          {!isMobile ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="inline-block">
                                  <CellButton state={grid[habit]?.[dayIdx] ?? "blank"} onClick={handleToggle} day={day} habit={habit} disabled={cellsReadOnly} />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="font-medium">{grid[habit]?.[dayIdx] === "yes" ? "Completed" : grid[habit]?.[dayIdx] === "no" ? "Missed" : "Not recorded"}</p>
                                <p className="text-[10px] opacity-70">{isCurrentMonth && day === (today?.getDate() ?? new Date().getDate()) ? "Today" : `Day ${day}`}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <CellButton state={grid[habit]?.[dayIdx] ?? "blank"} onClick={handleToggle} day={day} habit={habit} disabled={cellsReadOnly} />
                          )}
                        </td>
                      )
                    })}

                    {hasEyeCol && (
                      <td className="px-2 py-2.5 text-center">
                        <button onClick={() => onToggleHidden!(habit)} title={isHidden ? "Hidden from friends – click to show" : "Visible to friends – click to hide"} aria-label={isHidden ? `Show ${habit} to friends` : `Hide ${habit} from friends`}
                          className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all hover:scale-110 ${isHidden ? "text-muted-foreground/40 hover:text-muted-foreground" : "text-chart-1 hover:text-chart-1/70"}`}>
                          {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}

              {/* Add habit row */}
              {isCurrentMonth && !friendView && (
                <tr className="transition-colors hover:bg-secondary/20">
                  <td className="sticky left-0 z-30 w-[155px] min-w-[155px] max-w-[155px] sm:w-[210px] sm:min-w-[210px] sm:max-w-[210px] border-b border-border/50 bg-card px-4 sm:px-5 py-3">
                    {isAdding ? (
                      <div className="flex flex-col gap-2">
                        <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setIsAdding(false); setNewHabitName("") } }}
                          placeholder="Enter habit..." autoFocus
                          className="h-8 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none"
                        />
                        <div className="flex gap-2">
                            <button onClick={handleAdd} disabled={!newHabitName.trim()} className="h-8 flex-1 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-40">Add</button>
                            <button onClick={() => { setIsAdding(false); setNewHabitName("") }} className="h-8 flex-1 rounded-lg bg-secondary px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-border">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                        Add habit
                      </button>
                    )}
                  </td>
                  <td colSpan={daysInMonth + (hasEyeCol ? 1 : 0)} className="border-b border-border/50" />
                </tr>
              )}

              {/* Empty state */}
              {!visibleHabits.length && (
                <tr>
                  <td colSpan={daysInMonth + (hasEyeCol ? 2 : 1)} className="px-5 py-12 text-center">
                    <p className="text-sm text-muted-foreground">{friendView ? "No visible habits this month" : "No data recorded for this month"}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  )
}
