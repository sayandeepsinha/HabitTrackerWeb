import { useState, useMemo, useCallback } from "react"
import { getDaysInMonth, format, getDate } from "date-fns"
import type { HabitStore, MonthData, CellState } from "@/components/habit-tracker/common/types"

export function getMonthKey(date: Date): string {
    return format(date, "yyyy-MM")
}

/** Compute current streak for a habit looking backward from today across all months */
export function computeCurrentStreak(
    store: HabitStore,
    habit: string,
    today: Date
): number {
    let streak = 0
    const current = new Date(today)

    while (true) {
        const key = getMonthKey(current)
        const monthData = store[key]
        if (!monthData || !monthData.grid[habit]) break

        const dayIdx = getDate(current) - 1
        if (monthData.grid[habit][dayIdx] === "yes") {
            streak++
            current.setDate(current.getDate() - 1)
        } else {
            break
        }
    }

    return streak
}

/** Compute best streak within a single month */
export function computeBestStreak(cells: CellState[]): number {
    let best = 0
    let current = 0
    for (const cell of cells) {
        if (cell === "yes") {
            current++
            best = Math.max(best, current)
        } else {
            current = 0
        }
    }
    return best
}

/**
 * Custom hook to encapsulate habit view logic, such as month navigation 
 * and derived streaks. This can be shared across the main dashboard 
 * and friend views.
 */
export function useHabitView(store: HabitStore, today: Date, initialViewDate?: Date) {
    const [viewDate, setViewDate] = useState<Date>(() =>
        initialViewDate || new Date(today.getFullYear(), today.getMonth(), 1)
    )

    const viewMonthKey = useMemo(() => getMonthKey(viewDate), [viewDate])
    const daysInViewMonth = useMemo(() => getDaysInMonth(viewDate), [viewDate])
    const isCurrentMonth = useMemo(() =>
        viewDate.getFullYear() === today.getFullYear() &&
        viewDate.getMonth() === today.getMonth(),
        [viewDate, today]
    )

    const viewMonthData: MonthData | null = useMemo(() => {
        return store[viewMonthKey] ?? null
    }, [store, viewMonthKey])

    const habits = viewMonthData?.habits ?? []
    const grid = viewMonthData?.grid ?? {}

    const canGoNext = useMemo(() => {
        const nextMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1)
        return nextMonth <= new Date(today.getFullYear(), today.getMonth(), 1)
    }, [viewDate, today])

    const goToPrevMonth = useCallback(() => {
        setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }, [])

    const goToNextMonth = useCallback(() => {
        setViewDate((prev) => {
            const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
            if (next > new Date(today.getFullYear(), today.getMonth(), 1)) return prev
            return next
        })
    }, [today])

    const currentStreaks = useMemo(() => {
        const streaks: Record<string, number> = {}
        for (const habit of habits) {
            streaks[habit] = computeCurrentStreak(store, habit, today)
        }
        return streaks
    }, [store, habits, today])

    const bestStreaks = useMemo(() => {
        const streaks: Record<string, number> = {}
        for (const habit of habits) {
            streaks[habit] = computeBestStreak(grid[habit] || [])
        }
        return streaks
    }, [grid, habits])

    return {
        viewDate,
        setViewDate,
        viewMonthKey,
        viewMonthData,
        daysInViewMonth,
        isCurrentMonth,
        habits,
        grid,
        canGoNext,
        goToPrevMonth,
        goToNextMonth,
        currentStreaks,
        bestStreaks
    }
}
