"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getDaysInMonth, format, startOfWeek, addDays, getDate } from "date-fns"
import type { CellState, MonthData, HabitStore } from "./types"

const STORAGE_KEY = "habit-tracker-data"
const DEFAULT_HABITS = ["Leetcode", "Workout", "No Sugar", "Meditate"]

function loadStore(): HabitStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HabitStore) : {}
  } catch {
    return {}
  }
}

function saveStore(store: HabitStore) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // storage full or unavailable
  }
}

function createMonthData(year: number, month: number, habits: string[]): MonthData {
  const days = getDaysInMonth(new Date(year, month))
  const grid: Record<string, CellState[]> = {}
  for (const habit of habits) {
    grid[habit] = Array(days).fill("blank") as CellState[]
  }
  return { habits: [...habits], grid }
}

function getMonthKey(date: Date): string {
  return format(date, "yyyy-MM")
}

export function cycleState(state: CellState): CellState {
  if (state === "blank") return "yes"
  if (state === "yes") return "no"
  return "blank"
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

/** Get weekly data for the current real calendar week (Mon-Sun) */
export function getCalendarWeekData(
  store: HabitStore,
  habits: string[],
  today: Date
) {
  const monday = startOfWeek(today, { weekStartsOn: 1 })
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  return dayLabels.map((label, i) => {
    const date = addDays(monday, i)
    const key = getMonthKey(date)
    const monthData = store[key]
    const dayIdx = getDate(date) - 1
    const isFuture = date > today

    if (isFuture || !monthData) {
      return { day: label, date: format(date, "d"), percentage: 0, yesCount: 0, isFuture }
    }

    let yesCount = 0
    for (const habit of habits) {
      if (monthData.grid[habit]?.[dayIdx] === "yes") yesCount++
    }
    const percentage = habits.length > 0 ? Math.round((yesCount / habits.length) * 100) : 0
    return { day: label, date: format(date, "d"), percentage, yesCount, isFuture }
  })
}

/**
 * Core habit store hook.
 *
 * Always uses localStorage for instant load. Accepts an optional `onStoreChange`
 * callback that fires on every store mutation — useFirebase hooks into this to
 * sync changes to Firestore in the background.
 */
export function useHabitStore() {
  const [store, setStoreState] = useState<HabitStore>({})
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [hydrated, setHydrated] = useState(false)

  const today = useMemo(() => new Date(), [])
  const currentMonthKey = useMemo(() => getMonthKey(today), [today])
  const viewMonthKey = useMemo(() => getMonthKey(viewDate), [viewDate])
  const isCurrentMonth = viewMonthKey === currentMonthKey
  const daysInViewMonth = getDaysInMonth(viewDate)


  // Hydrate from localStorage on mount
  useEffect(() => {
    const loaded = loadStore()

    const key = getMonthKey(today)
    if (!loaded[key]) {
      const sortedKeys = Object.keys(loaded).sort().reverse()
      const lastHabits =
        sortedKeys.length > 0 ? loaded[sortedKeys[0]].habits : DEFAULT_HABITS
      loaded[key] = createMonthData(today.getFullYear(), today.getMonth(), lastHabits)
    }

    setStoreState(loaded)
    setHydrated(true)
  }, [today])

  // Persist to localStorage on every change
  useEffect(() => {
    if (!hydrated) return
    saveStore(store)
  }, [store, hydrated])

  const setStore = useCallback(
    (updater: HabitStore | ((prev: HabitStore) => HabitStore)) => {
      setStoreState(updater)
    },
    []
  )

  // Ensure current month exists
  useEffect(() => {
    if (!hydrated) return
    const key = getMonthKey(today)
    if (!store[key]) {
      const sortedKeys = Object.keys(store).sort().reverse()
      const lastHabits =
        sortedKeys.length > 0 ? store[sortedKeys[0]].habits : DEFAULT_HABITS
      const newMonth = createMonthData(today.getFullYear(), today.getMonth(), lastHabits)
      setStore((prev) => ({ ...prev, [key]: newMonth }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, today])

  const viewMonthData: MonthData | null = useMemo(() => {
    return store[viewMonthKey] ?? null
  }, [store, viewMonthKey])

  const updateCell = useCallback(
    (habit: string, dayIdx: number) => {
      if (!isCurrentMonth) return
      setStore((prev) => {
        const key = currentMonthKey
        const month = prev[key]
        if (!month || !month.grid[habit]) return prev
        const newCells = [...month.grid[habit]]
        newCells[dayIdx] = cycleState(newCells[dayIdx])
        return {
          ...prev,
          [key]: { ...month, grid: { ...month.grid, [habit]: newCells } },
        }
      })
    },
    [isCurrentMonth, currentMonthKey, setStore]
  )

  const addHabit = useCallback(
    (name: string) => {
      if (!isCurrentMonth) return
      const trimmed = name.trim()
      if (!trimmed) return
      setStore((prev) => {
        const key = currentMonthKey
        const month = prev[key]
        if (!month) return prev
        if (month.habits.includes(trimmed)) return prev
        const days = getDaysInMonth(
          new Date(parseInt(key.split("-")[0]), parseInt(key.split("-")[1]) - 1)
        )
        return {
          ...prev,
          [key]: {
            ...month,
            habits: [...month.habits, trimmed],
            grid: {
              ...month.grid,
              [trimmed]: Array(days).fill("blank") as CellState[],
            },
          },
        }
      })
    },
    [isCurrentMonth, currentMonthKey, setStore]
  )

  const removeHabit = useCallback(
    (name: string) => {
      if (!isCurrentMonth) return
      setStore((prev) => {
        const key = currentMonthKey
        const month = prev[key]
        if (!month) return prev
        const newGrid = { ...month.grid }
        delete newGrid[name]
        return {
          ...prev,
          [key]: {
            ...month,
            habits: month.habits.filter((h) => h !== name),
            grid: newGrid,
          },
        }
      })
    },
    [isCurrentMonth, currentMonthKey, setStore]
  )

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

  const canGoNext = useMemo(() => {
    const nextMonth = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth() + 1,
      1
    )
    return nextMonth <= new Date(today.getFullYear(), today.getMonth(), 1)
  }, [viewDate, today])

  const currentStreaks = useMemo(() => {
    if (!viewMonthData) return {}
    const streaks: Record<string, number> = {}
    for (const habit of viewMonthData.habits) {
      streaks[habit] = computeCurrentStreak(store, habit, today)
    }
    return streaks
  }, [store, viewMonthData, today])

  const bestStreaks = useMemo(() => {
    if (!viewMonthData) return {}
    const streaks: Record<string, number> = {}
    for (const habit of viewMonthData.habits) {
      streaks[habit] = computeBestStreak(viewMonthData.grid[habit] || [])
    }
    return streaks
  }, [viewMonthData])

  // Allow external code (e.g. Firestore sync) to push data into the store
  const setStoreDirectly = useCallback((newStore: HabitStore) => {
    setStoreState(newStore)
  }, [])

  return {
    store,
    hydrated,
    viewDate,
    viewMonthKey,
    viewMonthData,
    isCurrentMonth,
    daysInViewMonth,
    today,
    currentStreaks,
    bestStreaks,
    updateCell,
    addHabit,
    removeHabit,
    goToPrevMonth,
    goToNextMonth,
    canGoNext,
    setStoreDirectly,
  }
}

