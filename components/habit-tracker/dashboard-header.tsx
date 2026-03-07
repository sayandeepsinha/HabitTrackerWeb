"use client"

import React from "react"
import { Avatar } from "./common/avatar"
import { CheckIcon, CrossIcon, ChevronDownIcon, SettingsIcon, SignOutIcon } from "./common/icons"
import { MonthNav } from "./common/month-nav"
import { ResponsiveDialog } from "./common/responsive-dialog"
import { Button } from "@/components/ui/button"
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
    isMobile?: boolean
}

export function DashboardHeader({
    viewDate, isCurrentMonth, canGoNext, goToPrevMonth, goToNextMonth,
    user, onOpenSettings, signOut, isMobile
}: DashboardHeaderProps) {
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false)

    const handleSettings = () => {
        setIsUserMenuOpen(false)
        onOpenSettings()
    }

    const handleSignOut = () => {
        setIsUserMenuOpen(false)
        signOut()
    }
    return (
        <header className="mx-auto mb-8 max-w-[1440px]">
            <div className={`flex ${isMobile ? "flex-col items-center gap-4" : "items-end justify-between"}`}>
                {/* Brand */}
                <div className={isMobile ? "text-center" : ""}>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Habit Tracker</h1>
                    {!isMobile && <p className="mt-1 text-sm text-muted-foreground">Track your daily habits and build streaks</p>}
                </div>

                {/* Month Navigation */}
                <div className="flex items-center gap-3">
                    <MonthNav viewDate={viewDate} canGoNext={canGoNext} onPrev={goToPrevMonth} onNext={goToNextMonth} size={isMobile ? "sm" : "md"} />
                    {!isCurrentMonth && (
                        <span className="ml-1 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            View only
                        </span>
                    )}
                </div>

                {/* Legend + User */}
                <div className="flex items-center gap-4">
                    {!isMobile && (
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
                    )}

                    {isMobile ? (
                        <ResponsiveDialog
                            open={isUserMenuOpen}
                            onOpenChange={setIsUserMenuOpen}
                            trigger={
                                <div role="button" tabIndex={0} className="flex cursor-pointer items-center gap-2 rounded-xl bg-card px-3 py-1.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary focus:outline-none">
                                    <Avatar src={user.photoURL} name={user.displayName} />
                                    <span className="max-w-[100px] truncate text-xs font-medium text-foreground">
                                        {user.displayName ?? user.email}
                                    </span>
                                    <ChevronDownIcon size={12} className="ml-1 text-muted-foreground" />
                                </div>
                            }
                            title="Account Settings"
                            description="Manage your account and session"
                        >
                            <div className="grid gap-4 py-4">
                                <Button
                                    variant="outline"
                                    className="justify-start border-border/50 bg-card/50 px-4 py-6 text-sm hover:bg-secondary"
                                    onClick={handleSettings}
                                >
                                    <SettingsIcon className="mr-3 h-4 w-4 opacity-70" />
                                    Settings
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start border-red-500/20 bg-red-50/50 px-4 py-6 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 dark:border-red-950/50 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                                    onClick={handleSignOut}
                                >
                                    <SignOutIcon className="mr-3 h-4 w-4" />
                                    Sign out
                                </Button>
                            </div>
                        </ResponsiveDialog>
                    ) : (
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
                                    <SettingsIcon className="mr-2 opacity-70" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={signOut} className="text-red-500 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:focus:bg-red-950 dark:focus:text-red-300">
                                    <SignOutIcon className="mr-2" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </header>
    )
}
