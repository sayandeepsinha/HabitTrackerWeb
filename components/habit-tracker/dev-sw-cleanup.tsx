"use client"

import { useEffect } from "react"

/**
 * In development, automatically unregister any stale service workers
 * and clear caches so the dev server always serves fresh files.
 * This component renders nothing — it only runs a side-effect.
 */
export function DevSwCleanup() {
    useEffect(() => {
        if (process.env.NODE_ENV !== "development") return

        async function cleanup() {
            // Unregister all service workers
            if ("serviceWorker" in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations()
                for (const registration of registrations) {
                    await registration.unregister()
                }
                if (registrations.length > 0) {
                    console.log("[DevSwCleanup] Unregistered", registrations.length, "stale service worker(s)")
                }
            }

            // Clear all caches
            if ("caches" in window) {
                const cacheNames = await caches.keys()
                if (cacheNames.length > 0) {
                    await Promise.all(cacheNames.map((name) => caches.delete(name)))
                    console.log("[DevSwCleanup] Cleared", cacheNames.length, "cache(s):", cacheNames.join(", "))
                }
            }
        }

        cleanup()
    }, [])

    return null
}
