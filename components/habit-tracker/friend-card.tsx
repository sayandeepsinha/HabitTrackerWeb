"use client"

import { useState } from "react"
import { format } from "date-fns"
import { HabitGrid } from "./habit-grid"
import { useHabitView } from "@/hooks/use-habit-view"
import { Avatar } from "./common/avatar"
import { SmallCrossIcon } from "./common/icons"
import type { FriendData } from "./common/types"

interface FriendCardProps {
    data: FriendData
    today: Date
    onRemove: () => void
}

export function FriendCard({ data, today, onRemove }: FriendCardProps) {
    const {
        viewDate,
        isCurrentMonth,
        daysInViewMonth,
        habits,
        grid,
        canGoNext,
        goToPrevMonth,
        goToNextMonth,
        currentStreaks,
        bestStreaks
    } = useHabitView(data.store, today)

    const [expanded, setExpanded] = useState(true)
    const [confirmRemove, setConfirmRemove] = useState(false)

    return (
        <div className="overflow-hidden rounded-3xl bg-card shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
                <Avatar src={data.friend.photoURL} name={data.friend.displayName} size={36} />
                <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                        {data.friend.displayName || data.friend.email}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{data.friend.email}</span>
                </div>

                {/* Month navigation */}
                <div className="mr-2 flex items-center gap-2">
                    <button
                        onClick={goToPrevMonth}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                        aria-label="Previous month"
                    >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <span className="min-w-[100px] text-center text-xs font-medium text-foreground">
                        {format(viewDate, "MMM yyyy")}
                    </span>
                    <button
                        onClick={goToNextMonth}
                        disabled={!canGoNext}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Next month"
                    >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Expand toggle */}
                <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    aria-label={expanded ? "Collapse" : "Expand"}
                >
                    <svg
                        width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"
                        className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    >
                        <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Remove friend */}
                {confirmRemove ? (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={onRemove}
                            className="rounded-md bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground transition-colors hover:opacity-80"
                        >
                            Remove
                        </button>
                        <button
                            onClick={() => setConfirmRemove(false)}
                            className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-border"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setConfirmRemove(true)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Remove friend"
                    >
                        <SmallCrossIcon size={12} />
                    </button>
                )}
            </div>

            {/* Grid */}
            {expanded && (
                <HabitGrid
                    habits={habits}
                    grid={grid}
                    daysInMonth={daysInViewMonth}
                    viewDate={viewDate}
                    isCurrentMonth={isCurrentMonth}
                    currentStreaks={currentStreaks}
                    bestStreaks={bestStreaks}
                    onToggle={() => { }}
                    onAddHabit={() => { }}
                    onRemoveHabit={() => { }}
                    hiddenHabits={data.hiddenHabits}
                    friendView
                />
            )}
        </div>
    )
}
