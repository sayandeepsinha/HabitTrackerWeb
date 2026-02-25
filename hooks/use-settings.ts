"use client"

import { useState, useEffect, useCallback } from "react"
import { loadFromStorage, saveToStorage } from "@/components/habit-tracker/common/storage"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserSettings {
    /** 0 = Sunday, 1 = Monday */
    weekStartDay: 0 | 1
    /** Default habits for new months */
    defaultHabits: string[]
}

const SETTINGS_KEY = "habit-tracker-settings"

const DEFAULT_SETTINGS: UserSettings = {
    weekStartDay: 0,
    defaultHabits: ["Leetcode", "Workout", "No Sugar", "Meditate"],
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSettings() {
    const [settings, setSettingsState] = useState<UserSettings>(DEFAULT_SETTINGS)
    const [hydrated, setHydrated] = useState(false)

    // Hydrate from localStorage
    useEffect(() => {
        const stored = loadFromStorage<Partial<UserSettings>>(SETTINGS_KEY, {})
        const merged = { ...DEFAULT_SETTINGS, ...stored }
        setSettingsState(merged)
        setHydrated(true)
    }, [])

    const updateSettings = useCallback(
        (patch: Partial<UserSettings>) => {
            setSettingsState((prev) => {
                const next = { ...prev, ...patch }
                saveToStorage(SETTINGS_KEY, next)
                return next
            })
        },
        []
    )

    return { settings, hydrated, updateSettings }
}
