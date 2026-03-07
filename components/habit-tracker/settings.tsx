"use client"

import { useState, useEffect, useCallback } from "react"
import { useTheme } from "next-themes"
import { useSettings } from "@/hooks/use-settings"
import { SmallCrossIcon } from "./common/icons"
import { ConfirmAction } from "./common/confirm-action"
import { ResponsiveDialog } from "./common/responsive-dialog"
import { useToast } from "@/hooks/use-toast"
import type { User } from "firebase/auth"

interface SettingsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User
    updateDisplayName: (name: string) => Promise<void>
    deleteAccount: () => Promise<void>
}

export function SettingsDialog({ open, onOpenChange, user, updateDisplayName, deleteAccount }: SettingsDialogProps) {
    const { toast } = useToast()
    const { settings, updateSettings } = useSettings()
    const { theme, setTheme } = useTheme()
    const [editName, setEditName] = useState(user.displayName ?? "")
    const [nameSaving, setNameSaving] = useState(false)
    const [newDefaultHabit, setNewDefaultHabit] = useState("")
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => {
        if (user.displayName) setEditName(user.displayName)
    }, [user.displayName])

    const addDefaultHabit = useCallback(() => {
        const trimmed = newDefaultHabit.trim()
        if (!trimmed || settings.defaultHabits.includes(trimmed)) return
        updateSettings({ defaultHabits: [...settings.defaultHabits, trimmed] })
        setNewDefaultHabit("")
    }, [newDefaultHabit, settings.defaultHabits, updateSettings])

    const handleClearCache = async () => {
        try {
            if ('caches' in window) await Promise.all((await caches.keys()).map(n => caches.delete(n)))
            toast({ title: "Cache cleared", description: "Application cache has been cleared." })
        } catch (error) {
            console.error("Failed to clear cache:", error)
            toast({ title: "Error clearing cache", description: "Could not clear application cache.", variant: "destructive" })
        }
    }

    const handleClearSW = async () => {
        if ("serviceWorker" in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations()
            for (const reg of regs) await reg.unregister()
            toast({ title: "Service Workers unregistered", description: "All service workers have been unregistered." })
        } else {
            toast({ title: "Service Workers not found", description: "No service workers to unregister." })
        }
    }

    const section = "space-y-3"
    const sectionTitle = "text-sm font-semibold leading-none"
    const sectionDesc = "text-xs text-muted-foreground"
    const hr = <hr className="border-border/50" />

    return (
        <ResponsiveDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Settings"
            description="Manage your account settings and application preferences."
            preventAutoFocus
        >
            <div className="grid gap-6">
                {/* Profile */}
                <div className={section}>
                    <h4 className={sectionTitle}>Profile</h4>
                    <p className={sectionDesc}>Update your display name visible to friends.</p>
                    <div className="flex items-center gap-2">
                        <input type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Display name"
                            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none" />
                        <button
                            onClick={async () => { setNameSaving(true); try { await updateDisplayName(editName) } finally { setNameSaving(false) } }}
                            disabled={nameSaving || !editName.trim() || editName.trim() === user.displayName}
                            className="h-9 rounded-lg bg-accent px-4 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-40">
                            {nameSaving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>

                {hr}

                {/* Appearance */}
                <div className={section}>
                    <h4 className={sectionTitle}>Appearance</h4>
                    <p className={sectionDesc}>Choose your preferred theme.</p>
                    <div className="flex gap-2">
                        {(["light", "dark", "system"] as const).map(t => (
                            <button key={t} onClick={() => setTheme(t)}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-colors ${theme === t ? "bg-chart-1 text-white shadow-sm" : "bg-secondary text-muted-foreground hover:bg-border"}`}>
                                {t === "system" ? "✨ System" : t === "dark" ? "🌙 Dark" : "☀️ Light"}
                            </button>
                        ))}
                    </div>
                </div>

                {hr}

                {/* Week Start */}
                <div className={section}>
                    <h4 className={sectionTitle}>Week Start Day</h4>
                    <p className={sectionDesc}>Choose which day starts the week in the grid header.</p>
                    <div className="flex gap-2">
                        {([{ label: "Sunday", value: 0 }, { label: "Monday", value: 1 }] as const).map(({ label, value }) => (
                            <button key={value} onClick={() => updateSettings({ weekStartDay: value })}
                                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${settings.weekStartDay === value ? "bg-chart-1 text-white shadow-sm" : "bg-secondary text-muted-foreground hover:bg-border"}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {hr}

                {/* Default Habits */}
                <div className={section}>
                    <h4 className={sectionTitle}>Default Habits</h4>
                    <p className={sectionDesc}>Habits that auto-populate when a new month starts.</p>
                    <div className="flex flex-wrap gap-2">
                        {settings.defaultHabits.map(h => (
                            <span key={h} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                                {h}
                                <button onClick={() => updateSettings({ defaultHabits: settings.defaultHabits.filter(x => x !== h) })}
                                    className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-destructive hover:text-destructive-foreground" aria-label={`Remove ${h}`}>
                                    <SmallCrossIcon size={8} />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="text" value={newDefaultHabit} onChange={e => setNewDefaultHabit(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && addDefaultHabit()}
                            placeholder="Add a default habit…"
                            className="h-8 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none" />
                        <button onClick={addDefaultHabit} disabled={!newDefaultHabit.trim()}
                            className="h-8 rounded-lg bg-accent px-3 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-40">
                            Add
                        </button>
                    </div>
                </div>

                {hr}

                {/* Danger Zone */}
                <div className={section}>
                    <h4 className={`${sectionTitle} text-destructive-foreground`}>Danger Zone</h4>
                    <p className={sectionDesc}>Permanently delete your account and all data.</p>
                    <ConfirmAction
                        confirmLabel={deleteLoading ? "Deleting…" : "Yes, Delete"}
                        onConfirm={async () => {
                            setDeleteLoading(true)
                            try { await deleteAccount() } catch { setDeleteLoading(false) }
                        }}
                        trigger={
                            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm transition-colors hover:opacity-80">
                                Delete Account
                            </button>
                        }
                    />
                </div>
            </div>
        </ResponsiveDialog>
    )
}
