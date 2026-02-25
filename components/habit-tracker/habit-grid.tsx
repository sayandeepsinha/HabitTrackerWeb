"use client"

import { useState, useCallback } from "react"
import { getDay } from "date-fns"
import type { CellState, HiddenHabits } from "./common/types"
import { CellButton } from "./common/cell-button"
import { StreakBadge } from "./common/streak-badge"
import { ChevronUpIcon, ChevronDownIcon, SmallCrossIcon, EyeIcon, EyeOffIcon } from "./common/icons"

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
  onReorderHabit?: (name: string, direction: "up" | "down") => void
  /** Map of habitName → hidden (true = hidden from friends) */
  hiddenHabits?: HiddenHabits
  /** Called when eye icon is clicked to toggle a habit's visibility */
  onToggleHidden?: (habit: string) => void
  /**
   * When true the grid is read-only, hides habits marked as hidden,
   * and removes add/delete controls (used for viewing a friend's grid).
   */
  friendView?: boolean
}

const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function HabitGrid({
  habits,
  grid,
  daysInMonth,
  viewDate,
  isCurrentMonth,
  currentStreaks,
  bestStreaks,
  onToggle,
  onAddHabit,
  onRemoveHabit,
  onReorderHabit,
  hiddenHabits = {},
  onToggleHidden,
  friendView = false,
}: HabitGridProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newHabitName, setNewHabitName] = useState("")
  const [hoveredHabit, setHoveredHabit] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleAdd = useCallback(() => {
    if (newHabitName.trim()) {
      onAddHabit(newHabitName.trim())
      setNewHabitName("")
      setIsAdding(false)
    }
  }, [newHabitName, onAddHabit])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd()
    if (e.key === "Escape") { setIsAdding(false); setNewHabitName("") }
  }, [handleAdd])

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  // Determine which habits to display
  const visibleHabits = friendView
    ? habits.filter((h) => !hiddenHabits[h])
    : habits

  const dayOfWeekLabels = days.map((day) => {
    const dow = getDay(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))
    return DAY_ABBREVS[dow]
  })


  const noData = !visibleHabits.length

  // Cells are read-only in past months OR when viewing a friend's grid
  const cellsReadOnly = !isCurrentMonth || friendView

  return (
    <div className="overflow-hidden rounded-3xl bg-card shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      {/* Past month info banner */}
      {!isCurrentMonth && (
        <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/50 px-5 py-2.5">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-muted-foreground" aria-hidden="true">
            <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8 4.5V8.5L11 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium text-muted-foreground">
            Viewing past month (read-only)
          </span>
        </div>
      )}

      {/* Friend view banner */}
      {friendView && (
        <div className="flex items-center gap-2 border-b border-border/50 bg-accent/40 px-5 py-2.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-xs font-medium text-muted-foreground">
            Friend&apos;s habits (view-only — hidden habits not shown)
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" role="grid" aria-label={`Habit tracking grid for ${daysInMonth} days`}>
          <thead>
            {/* Day of week row */}
            <tr>
              <th className="sticky left-0 z-10 min-w-[160px] bg-card px-5 pt-4 pb-0 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                &nbsp;
              </th>
              {dayOfWeekLabels.map((dow, i) => (
                <th
                  key={`dow-${i}`}
                  className={`px-0.5 pt-4 pb-0 text-center text-[10px] font-medium tracking-wide ${dow === "Sat" || dow === "Sun" ? "text-chart-2" : "text-muted-foreground/60"
                    }`}
                >
                  {dow}
                </th>
              ))}
              {/* Extra header column for eye toggle */}
              {!friendView && onToggleHidden && (
                <th className="px-2 pt-4 pb-0 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Vis.
                </th>
              )}
            </tr>
            {/* Day number row */}
            <tr>
              <th className="sticky left-0 z-10 min-w-[160px] bg-card px-5 pt-1 pb-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Habit
              </th>
              {days.map((day, i) => {
                const isToday =
                  isCurrentMonth &&
                  day === new Date().getDate()
                return (
                  <th
                    key={day}
                    className={`px-0.5 pt-1 pb-3 text-center text-xs font-medium ${dayOfWeekLabels[i] === "Sat" || dayOfWeekLabels[i] === "Sun"
                      ? "text-chart-2"
                      : "text-muted-foreground"
                      }`}
                  >
                    {isToday ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-chart-1 text-white font-semibold">
                        {day}
                      </span>
                    ) : (
                      day
                    )}
                  </th>
                )
              })}
              {!friendView && onToggleHidden && <th className="px-2 pt-1 pb-3" />}
            </tr>
          </thead>
          <tbody>
            {visibleHabits.map((habit) => {
              const isHidden = !!hiddenHabits[habit]
              return (
                <tr
                  key={habit}
                  className={`border-t border-border/50 transition-colors hover:bg-secondary/20 ${isHidden && !friendView ? "opacity-60" : ""}`}
                  onMouseEnter={() => setHoveredHabit(habit)}
                  onMouseLeave={() => { setHoveredHabit(null); setConfirmDelete(null) }}
                >
                  <td className="sticky left-0 z-10 bg-card px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{habit}</span>
                        <StreakBadge count={isCurrentMonth ? (currentStreaks[habit] ?? 0) : (bestStreaks[habit] ?? 0)} />
                      </div>
                      {/* Reorder buttons — only for owner in current month */}
                      {isCurrentMonth && !friendView && onReorderHabit && hoveredHabit === habit && !confirmDelete && (
                        <div className="flex flex-col gap-0">
                          <button
                            onClick={() => onReorderHabit(habit, "up")}
                            className="flex h-3.5 w-5 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-foreground"
                            aria-label={`Move ${habit} up`}
                          >
                            <ChevronUpIcon />
                          </button>
                          <button
                            onClick={() => onReorderHabit(habit, "down")}
                            className="flex h-3.5 w-5 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:text-foreground"
                            aria-label={`Move ${habit} down`}
                          >
                            <ChevronDownIcon />
                          </button>
                        </div>
                      )}
                      {/* Delete button — only for owner in current month */}
                      {isCurrentMonth && !friendView && hoveredHabit === habit && (
                        confirmDelete === habit ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { onRemoveHabit(habit); setConfirmDelete(null) }}
                              className="rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground transition-colors hover:opacity-80"
                              aria-label={`Confirm delete ${habit}`}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-border"
                              aria-label="Cancel"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(habit)}
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground/50 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                            aria-label={`Remove ${habit}`}
                          >
                            <SmallCrossIcon size={12} />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                  {days.map((day, dayIdx) => (
                    <td key={dayIdx} className="px-0.5 py-2.5 text-center">
                      <CellButton
                        state={grid[habit]?.[dayIdx] ?? "blank"}
                        onClick={() => onToggle(habit, dayIdx)}
                        day={day}
                        habit={habit}
                        disabled={cellsReadOnly}
                      />
                    </td>
                  ))}
                  {/* Eye toggle button — only for owner */}
                  {!friendView && onToggleHidden && (
                    <td className="px-2 py-2.5 text-center">
                      <button
                        onClick={() => onToggleHidden(habit)}
                        title={isHidden ? "Hidden from friends – click to show" : "Visible to friends – click to hide"}
                        aria-label={isHidden ? `Show ${habit} to friends` : `Hide ${habit} from friends`}
                        className={`flex h-6 w-6 items-center justify-center rounded-lg transition-all hover:scale-110 ${isHidden
                          ? "text-muted-foreground/40 hover:text-muted-foreground"
                          : "text-chart-1 hover:text-chart-1/70"
                          }`}
                      >
                        {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}

            {/* Add habit row */}
            {isCurrentMonth && !friendView && (
              <tr className="border-t border-border/50">
                <td className="sticky left-0 z-10 bg-card px-5 py-3" colSpan={daysInMonth + (onToggleHidden ? 2 : 1)}>
                  {isAdding ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter habit name..."
                        autoFocus
                        className="h-8 w-48 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none"
                      />
                      <button
                        onClick={handleAdd}
                        disabled={!newHabitName.trim()}
                        className="h-8 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setIsAdding(false); setNewHabitName("") }}
                        className="h-8 rounded-lg bg-secondary px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-border"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAdding(true)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      Add habit
                    </button>
                  )}
                </td>
              </tr>
            )}

            {/* Empty state */}
            {noData && (
              <tr>
                <td colSpan={daysInMonth + (onToggleHidden && !friendView ? 2 : 1)} className="px-5 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    {friendView ? "No visible habits this month" : "No data recorded for this month"}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
