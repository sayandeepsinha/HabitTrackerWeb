"use client"

import { format } from "date-fns"
import { ChevronLeftIcon, ChevronRightIcon } from "./icons"

interface MonthNavProps {
    viewDate: Date
    canGoNext: boolean
    onPrev: () => void
    onNext: () => void
    /** "sm" = compact style for friend cards, "md" = full style for dashboard header */
    size?: "sm" | "md"
}

export function MonthNav({ viewDate, canGoNext, onPrev, onNext, size = "md" }: MonthNavProps) {
    const isSm = size === "sm"

    const btnCls = isSm
        ? "flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-border hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        : "flex h-9 w-9 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"

    const iconSize = isSm ? 12 : 16

    return (
        <div className="flex items-center gap-2">
            <button onClick={onPrev} className={btnCls} aria-label="Previous month">
                <ChevronLeftIcon size={iconSize} />
            </button>

            {isSm ? (
                <span className="min-w-[100px] text-center text-xs font-medium text-foreground">
                    {format(viewDate, "MMM yyyy")}
                </span>
            ) : (
                <div className="min-w-[180px] rounded-xl bg-card px-5 py-2 text-center shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                    <span className="text-sm font-semibold text-foreground">{format(viewDate, "MMMM yyyy")}</span>
                </div>
            )}

            <button onClick={onNext} disabled={!canGoNext} className={btnCls} aria-label="Next month">
                <ChevronRightIcon size={iconSize} />
            </button>
        </div>
    )
}
