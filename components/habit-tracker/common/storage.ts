export function loadFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : defaultValue
    } catch {
        return defaultValue
    }
}

export function saveToStorage<T>(key: string, value: T): void {
    if (typeof window === "undefined") return
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // storage full or unavailable
    }
}
