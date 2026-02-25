"use client"

import React from "react"
import { format } from "date-fns"
import { Avatar } from "./common/avatar"
import { CheckIcon, CrossIcon, ChevronDownIcon } from "./common/icons"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User } from "firebase/auth"

interface DashboardHeaderProps {
    viewDate: Date
    isCurrentMonth: boolean
    canGoNext: boolean
    goToPrevMonth: () => void
    goToNextMonth: () => void
    user: User
    onOpenSettings: () => void
    signOut: () => void
}

export function DashboardHeader({
    viewDate,
    isCurrentMonth,
    canGoNext,
    goToPrevMonth,
    goToNextMonth,
    user,
    onOpenSettings,
    signOut,
}: DashboardHeaderProps) {
    return (
        <header className="mx-auto mb-8 max-w-[1440px]">
            <div className="flex items-end justify-between">
                {/* Brand */}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Habit Tracker
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Track your daily habits and build streaks
                    </p>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToPrevMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary hover:text-foreground"
                        aria-label="Previous month"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>

                    <div className="min-w-[180px] rounded-xl bg-card px-5 py-2 text-center shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
                        <span className="text-sm font-semibold text-foreground">
                            {format(viewDate, "MMMM yyyy")}
                        </span>
                        {!isCurrentMonth && (
                            <span className="ml-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                View only
                            </span>
                        )}
                    </div>

                    <button
                        onClick={goToNextMonth}
                        disabled={!canGoNext}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Next month"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Legend + User */}
                <div className="flex items-center gap-4">
                    {/* Legend */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5">
                            <CheckIcon size={14} className="text-chart-1" />
                            <span className="text-xs font-medium text-accent-foreground">Yes</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-habit-no px-3 py-1.5">
                            <CrossIcon size={12} className="text-habit-no-text" />
                            <span className="text-xs font-medium text-habit-no-text">No</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                            <div className="h-2.5 w-2.5 rounded-sm bg-border" />
                            <span className="text-xs font-medium text-muted-foreground">Blank</span>
                        </div>
                    </div>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <div role="button" tabIndex={0} className="flex cursor-pointer items-center gap-2 rounded-xl bg-card px-3 py-1.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                <Avatar src={user.photoURL} name={user.displayName} />
                                <span className="max-w-[100px] truncate text-xs font-medium text-foreground">
                                    {user.displayName ?? user.email}
                                </span>
                                <ChevronDownIcon size={12} className="ml-1 text-muted-foreground" />
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={onOpenSettings}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-2 opacity-70">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950 dark:focus:text-red-300">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mr-2">
                                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                Sign out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
