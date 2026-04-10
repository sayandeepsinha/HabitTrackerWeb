"use client"

import React from "react"
import { PencilIcon, ArrowsUpDownIcon, TrashIcon, SmallCrossIcon } from "./common/icons"

type ManageMode = "edit" | "reorder" | "delete" | null

interface GridHeaderProps {
    days: number[]
    dayOfWeekLabels: string[]
    hasEyeCol: boolean
    canManage: boolean
    isCurrentMonth: boolean
    today: Date | undefined
    activeMode: ManageMode
    toggleMode: (mode: ManageMode) => void
    onRenameHabit?: (oldName: string, newName: string) => void
    onReorderHabit?: (name: string, direction: "up" | "down") => void
}

export function GridHeader({
    days,
    dayOfWeekLabels,
    hasEyeCol,
    canManage,
    isCurrentMonth,
    today,
    activeMode,
    toggleMode,
    onRenameHabit,
    onReorderHabit
}: GridHeaderProps) {
    const hBtn = (active: boolean, danger = false) =>
        `flex h-6 w-6 items-center justify-center rounded-md transition-all ${active
          ? danger ? "bg-destructive/15 text-destructive" : "bg-accent text-foreground shadow-sm"
          : "text-muted-foreground/50 hover:bg-accent/60 hover:text-foreground"}`

    return (
        <thead>
            {/* Day-of-week row */}
            <tr>
                <th className="sticky top-0 left-0 z-40 w-[155px] min-w-[155px] max-w-[155px] sm:w-[210px] sm:min-w-[210px] sm:max-w-[210px] border-b border-border/50 bg-card px-4 sm:px-5 pt-4 pb-0 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">&nbsp;</th>
                {dayOfWeekLabels.map((dow, i) => (
                    <th key={`dow-${i}`} className={`sticky top-0 z-20 border-b border-border/50 bg-card px-0.5 pt-4 pb-0 text-center text-[10px] font-medium tracking-wide ${dow === "Sat" || dow === "Sun" ? "text-chart-2" : "text-muted-foreground/60"}`}>{dow}</th>
                ))}
                {hasEyeCol && <th className="sticky top-0 z-20 border-b border-border/50 bg-card px-2 pt-4 pb-0 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vis.</th>}
            </tr>

            {/* Day-number row + HABIT header with manage buttons */}
            <tr>
                <th className="sticky top-[30px] left-0 z-40 w-[155px] min-w-[155px] max-w-[155px] sm:w-[210px] sm:min-w-[210px] sm:max-w-[210px] border-b border-border/50 bg-card px-4 sm:px-5 pt-1 pb-3 text-left">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">Habit</span>
                        {canManage && (
                            <div className="flex items-center gap-0.5">
                                {onRenameHabit && (
                                    <button onClick={() => toggleMode("edit")} className={hBtn(activeMode === "edit")} title="Edit habit names" aria-pressed={activeMode === "edit"} aria-label="Edit habit names">
                                        <PencilIcon size={11} />
                                    </button>
                                )}
                                {onReorderHabit && (
                                    <button onClick={() => toggleMode("reorder")} className={hBtn(activeMode === "reorder")} title="Reorder habits" aria-pressed={activeMode === "reorder"} aria-label="Reorder habits">
                                        <ArrowsUpDownIcon size={12} />
                                    </button>
                                )}
                                <button onClick={() => toggleMode("delete")} className={hBtn(activeMode === "delete", true)} title="Delete habits" aria-pressed={activeMode === "delete"} aria-label="Delete habits">
                                    <TrashIcon size={11} />
                                </button>
                                {activeMode && (
                                    <button onClick={() => toggleMode(null)} className="ml-0.5 flex h-5 items-center gap-0.5 rounded-full bg-secondary px-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-border" title="Exit (Esc)" aria-label="Exit management mode">
                                        <SmallCrossIcon size={7} /><span className="capitalize">{activeMode}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </th>
                {days.map((day, i) => {
                    const isToday = isCurrentMonth && day === (today?.getDate() ?? new Date().getDate())
                    return (
                        <th key={day} className={`sticky top-[30px] z-20 border-b border-border/50 bg-card px-0.5 pt-1 pb-3 text-center text-xs font-medium ${dayOfWeekLabels[i] === "Sat" || dayOfWeekLabels[i] === "Sun" ? "text-chart-2" : "text-muted-foreground"}`}>
                            {isToday
                                ? <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-chart-1 text-white font-semibold">{day}</span>
                                : day}
                        </th>
                    )
                })}
                {hasEyeCol && <th className="sticky top-[30px] z-20 border-b border-border/50 bg-card px-2 pt-1 pb-3" />}
            </tr>
        </thead>
    )
}
