"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useSettings } from "@/hooks/use-settings"
import type { User } from "firebase/auth"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface SettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User
    updateDisplayName: (name: string) => Promise<void>
    deleteAccount: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Settings Dialog
// ---------------------------------------------------------------------------

export function SettingsDialog({
    open,
    onOpenChange,
    user,
    updateDisplayName,
    deleteAccount,
}: SettingsDialogProps) {
    const { settings, updateSettings } = useSettings()
    const { theme, setTheme } = useTheme()

    const [editName, setEditName] = useState(user.displayName ?? "")
    const [nameSaving, setNameSaving] = useState(false)
    const [newDefaultHabit, setNewDefaultHabit] = useState("")
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Sync editName when user changes
    useEffect(() => {
        if (user.displayName) setEditName(user.displayName)
    }, [user.displayName])

    const handleClearCache = async () => {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys()
                await Promise.all(cacheNames.map(name => caches.delete(name)))
            }
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations()
                for (const registration of registrations) {
                    await registration.unregister()
                }
            }
            window.location.reload()
        } catch (error) {
            console.error("Failed to clear cache:", error)
            window.location.reload()
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                onOpenChange(o)
                if (!o) setDeleteConfirm(false)
            }}
        >
            <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Manage your account settings and application preferences.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">

                    {/* ── Profile ── */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold leading-none">Profile</h4>
                        <p className="text-xs text-muted-foreground">Update your display name visible to friends.</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Display name"
                                className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none"
                            />
                            <button
                                onClick={async () => {
                                    setNameSaving(true)
                                    try {
                                        await updateDisplayName(editName)
                                    } finally {
                                        setNameSaving(false)
                                    }
                                }}
                                disabled={nameSaving || !editName.trim() || editName.trim() === user.displayName}
                                className="h-9 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-40"
                            >
                                {nameSaving ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* ── Appearance ── */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold leading-none">Appearance</h4>
                        <p className="text-xs text-muted-foreground">Choose your preferred theme.</p>
                        <div className="flex gap-2">
                            {(["light", "dark", "system"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTheme(t)}
                                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${theme === t
                                        ? "bg-chart-1 text-white shadow-sm"
                                        : "bg-secondary text-muted-foreground hover:bg-border"
                                        }`}
                                >
                                    {t === "system" ? "✨ System" : t === "dark" ? "🌙 Dark" : "☀️ Light"}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* ── Week Start Day ── */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold leading-none">Week Start Day</h4>
                        <p className="text-xs text-muted-foreground">Choose which day starts the week in the grid header.</p>
                        <div className="flex gap-2">
                            {([{ label: "Sunday", value: 0 }, { label: "Monday", value: 1 }] as const).map(({ label, value }) => (
                                <button
                                    key={value}
                                    onClick={() => updateSettings({ weekStartDay: value })}
                                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${settings.weekStartDay === value
                                        ? "bg-chart-1 text-white shadow-sm"
                                        : "bg-secondary text-muted-foreground hover:bg-border"
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* ── Default Habits ── */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold leading-none">Default Habits</h4>
                        <p className="text-xs text-muted-foreground">Habits that auto-populate when a new month starts (only if no previous month exists).</p>
                        <div className="flex flex-wrap gap-2">
                            {settings.defaultHabits.map((h) => (
                                <span key={h} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                                    {h}
                                    <button
                                        onClick={() => updateSettings({ defaultHabits: settings.defaultHabits.filter((x) => x !== h) })}
                                        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive hover:text-destructive-foreground"
                                        aria-label={`Remove ${h}`}
                                    >
                                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                                            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={newDefaultHabit}
                                onChange={(e) => setNewDefaultHabit(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && newDefaultHabit.trim()) {
                                        if (!settings.defaultHabits.includes(newDefaultHabit.trim())) {
                                            updateSettings({ defaultHabits: [...settings.defaultHabits, newDefaultHabit.trim()] })
                                        }
                                        setNewDefaultHabit("")
                                    }
                                }}
                                placeholder="Add a default habit…"
                                className="h-8 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none"
                            />
                            <button
                                onClick={() => {
                                    if (newDefaultHabit.trim() && !settings.defaultHabits.includes(newDefaultHabit.trim())) {
                                        updateSettings({ defaultHabits: [...settings.defaultHabits, newDefaultHabit.trim()] })
                                        setNewDefaultHabit("")
                                    }
                                }}
                                disabled={!newDefaultHabit.trim()}
                                className="h-8 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-40"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    <hr className="border-border/50" />

                    {/* ── System ── */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold leading-none">System</h4>
                        <p className="text-xs text-muted-foreground">
                            If you are experiencing issues with the app or want to clear local data.
                        </p>
                        <button
                            onClick={handleClearCache}
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/80"
                        >
                            Clear Cache & Reload
                        </button>
                    </div>

                    <hr className="border-border/50" />

                    {/* ── Danger Zone ── */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold leading-none text-destructive-foreground">Danger Zone</h4>
                        <p className="text-xs text-muted-foreground">
                            Permanently delete your account and all data. This action cannot be undone.
                        </p>
                        {!deleteConfirm ? (
                            <button
                                onClick={() => setDeleteConfirm(true)}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:opacity-80"
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                                <span className="text-xs font-medium text-destructive-foreground">Are you sure? This is permanent.</span>
                                <button
                                    onClick={async () => {
                                        setDeleteLoading(true)
                                        try {
                                            await deleteAccount()
                                        } catch {
                                            setDeleteLoading(false)
                                            setDeleteConfirm(false)
                                        }
                                    }}
                                    disabled={deleteLoading}
                                    className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition-colors hover:opacity-80 disabled:opacity-40"
                                >
                                    {deleteLoading ? "Deleting…" : "Yes, Delete"}
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(false)}
                                    className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}
