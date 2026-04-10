"use client"

import React from "react"
import { InfoIcon, PeopleIcon } from "./common/icons"

interface GridBannersProps {
    isCurrentMonth: boolean
    isPastUnlocked?: boolean
    onUnlockClick?: () => void
    friendView?: boolean
}

export function GridBanners({
    isCurrentMonth,
    isPastUnlocked,
    onUnlockClick,
    friendView
}: GridBannersProps) {
    return (
        <>
            {!isCurrentMonth && (
                <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/50 px-5 py-2.5">
                    <InfoIcon className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                        {isPastUnlocked ? "You are currently editing a historical record." : "Viewing past month."}
                    </span>
                    {!isPastUnlocked && onUnlockClick && !friendView && (
                        <button 
                            onClick={onUnlockClick} 
                            className="ml-auto rounded bg-background shadow-sm border border-border/50 px-2 py-1 flex items-center transition-colors hover:bg-accent text-[10px] font-medium text-muted-foreground"
                        >
                            Unlock to Edit
                        </button>
                    )}
                </div>
            )}
            {friendView && (
                <div className="flex items-center gap-2 border-b border-border/50 bg-accent/40 px-5 py-2.5">
                    <PeopleIcon size={14} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Friend&apos;s habits (view-only — hidden habits not shown)</span>
                </div>
            )}
        </>
    )
}
