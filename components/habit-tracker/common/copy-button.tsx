"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "./icons"

export function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false)
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }
    return (
        <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-border hover:text-foreground">
            {copied ? <><CheckIcon size={12} />Copied!</> : <><CopyIcon />Copy</>}
        </button>
    )
}
