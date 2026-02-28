"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { getDaysInMonth, format, startOfWeek, addDays, getDate } from "date-fns"
import type { CellState, MonthData, HabitStore } from "@/components/habit-tracker/common/types"
import { loadFromStorage, saveToStorage } from "@/components/habit-tracker/common/storage"
import { getMonthKey, useHabitView } from "./use-habit-view"

const STORAGE_KEY = "habit-tracker-data"
const FALLBACK_HABITS = ["Leetcode", "Workout", "No Sugar", "Meditate"]

export function loadStore(): HabitStore {
  return loadFromStorage(STORAGE_KEY, {})
}

function saveStore(store: HabitStore) {
  saveToStorage(STORAGE_KEY, store)
}

export function ensureMonthExists(data: HabitStore, today: Date, defaultHabits?: string[]): HabitStore {
  const key = getMonthKey(today)
  if (data[key]) return data

  const sortedKeys = Object.keys(data).sort().reverse()
  const lastHabits =
    sortedKeys.length > 0 ? data[sortedKeys[0]].habits : (defaultHabits ?? FALLBACK_HABITS)
  const newMonth = createMonthData(today.getFullYear(), today.getMonth(), lastHabits)

  return { ...data, [key]: newMonth }
}

function createMonthData(year: number, month: number, habits: string[]): MonthData {
  const days = getDaysInMonth(new Date(year, month))
  const grid: Record<string, CellState[]> = {}
  for (const habit of habits) {
    grid[habit] = Array(days).fill("blank") as CellState[]
  }
  return { habits: [...habits], grid }
}

export function cycleState(state: CellState): CellState {
  if (state === "blank") return "yes"
  if (state === "yes") return "no"
  return "blank"
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
export function useHabitStore(defaultHabits?: string[]) {
  const [store, setStoreState] = useState<HabitStore>({})
  const [hydrated, setHydrated] = useState(false)

  const today = useMemo(() => new Date(), [])
  const currentMonthKey = useMemo(() => getMonthKey(today), [today])

  // Hydrate from localStorage on mount
  useEffect(() => {
    const loaded = loadStore()
    setStoreState(ensureMonthExists(loaded, today, defaultHabits))
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

  // Ensure current month exists — runs whenever the store changes
  // (e.g. after Firestore pushes data that lacks the current month)
  useEffect(() => {
    if (!hydrated) return
    const key = currentMonthKey
    if (!store[key]) {
      setStore((prev) => ensureMonthExists(prev, today, defaultHabits))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, today, store])

  const {
    viewDate,
    viewMonthKey,
    viewMonthData,
    isCurrentMonth,
    daysInViewMonth,
    canGoNext,
    goToPrevMonth,
    goToNextMonth,
    currentStreaks,
    bestStreaks
  } = useHabitView(store, today)

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

  const reorderHabit = useCallback(
    (name: string, direction: "up" | "down") => {
      if (!isCurrentMonth) return
      setStore((prev) => {
        const key = currentMonthKey
        const month = prev[key]
        if (!month) return prev
        const idx = month.habits.indexOf(name)
        if (idx === -1) return prev
        const swapIdx = direction === "up" ? idx - 1 : idx + 1
        if (swapIdx < 0 || swapIdx >= month.habits.length) return prev
        const newHabits = [...month.habits]
          ;[newHabits[idx], newHabits[swapIdx]] = [newHabits[swapIdx], newHabits[idx]]
        return {
          ...prev,
          [key]: { ...month, habits: newHabits },
        }
      })
    },
    [isCurrentMonth, currentMonthKey, setStore]
  )

  // Allow external code (e.g. Firestore sync) to push data into the store.
  // Always ensure the current month exists in the incoming data so that a
  // Firestore snapshot from a previous month doesn't leave the grid empty.
  const setStoreDirectly = useCallback((newStore: HabitStore) => {
    setStoreState(ensureMonthExists(newStore, today, defaultHabits))
  }, [today, defaultHabits])

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
    reorderHabit,
    goToPrevMonth,
    goToNextMonth,
    canGoNext,
    setStoreDirectly,
  }
}

