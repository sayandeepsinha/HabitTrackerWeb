"use client"

import { useState } from "react"
import { CheckIcon } from "./icons"

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }
    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-border hover:text-foreground"
        >
            {copied ? (
                <>
                    <CheckIcon size={12} />
                    Copied!
                </>
            ) : (
                <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Copy
                </>
            )}
        </button>
    )
}
