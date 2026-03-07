"use client"

import { useState } from "react"

interface ConfirmActionProps {
    /** The trigger button that initiates the action */
    trigger: React.ReactNode
    /** Label on the confirm button */
    confirmLabel?: string
    /** Extra classes for the confirm button */
    danger?: boolean
    /** Called when the user confirms */
    onConfirm: () => void
}

/**
 * A two-step confirm pattern: shows a trigger, then when clicked shows
 * "Confirm" + "Cancel" buttons inline. Reusable for delete / remove flows.
 */
export function ConfirmAction({ trigger, confirmLabel = "Confirm", danger = true, onConfirm }: ConfirmActionProps) {
    const [confirming, setConfirming] = useState(false)

    if (confirming) {
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={() => { onConfirm(); setConfirming(false) }}
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors hover:opacity-80 ${danger ? "bg-destructive text-destructive-foreground" : "bg-accent text-accent-foreground"}`}
                >
                    {confirmLabel}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-border"
                >
                    Cancel
                </button>
            </div>
        )
    }

    return <div onClick={() => setConfirming(true)}>{trigger}</div>
}
