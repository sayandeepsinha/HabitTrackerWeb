"use client"

import { useState } from "react"
import { HabitGrid } from "./habit-grid"
import { useHabitView } from "@/hooks/use-habit-view"
import { Avatar } from "./common/avatar"
import { SmallCrossIcon, ChevronDownIcon } from "./common/icons"
import { MonthNav } from "./common/month-nav"
import { ConfirmAction } from "./common/confirm-action"
import type { FriendData, MoodType } from "./common/types"

const EMOJI_TO_MOOD: Record<string, MoodType> = {
  "😊": "happy",
  "😌": "calm",
  "😐": "neutral",
  "😫": "stressed",
  "😢": "sad"
}

const MOOD_IMAGE_URLS: Record<MoodType, string> = {
  happy: "/emojis/happy.png",
  calm: "/emojis/calm.png",
  neutral: "/emojis/neutral.png",
  stressed: "/emojis/stressed.png",
  sad: "/emojis/sad.png"
}

interface FriendCardProps {
    data: FriendData
    today: Date
    onRemove: () => void
}

export function FriendCard({ data, today, onRemove }: FriendCardProps) {
    const { viewDate, isCurrentMonth, daysInViewMonth, habits, grid, canGoNext, goToPrevMonth, goToNextMonth, currentStreaks, bestStreaks } = useHabitView(data.store, today)
    const [expanded, setExpanded] = useState(true)

    return (
        <div className="overflow-hidden rounded-3xl bg-card shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-4 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:gap-3">
                <div className="flex flex-1 items-center gap-3 min-w-0">
                    <Avatar src={data.friend.photoURL} name={data.friend.displayName} size={36} />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-semibold text-foreground flex items-center gap-1.5">
                            {data.friend.displayName || data.friend.email}
                            {data.todayMoodEmoji && (
                                <img
                                    src={MOOD_IMAGE_URLS[EMOJI_TO_MOOD[data.todayMoodEmoji]]}
                                    alt={data.todayMoodEmoji}
                                    className="h-4.5 w-4.5 object-contain"
                                    title="Today's Vibe"
                                />
                            )}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">{data.friend.email}</span>
                        {data.todayMoodNote && (
                            <span className="text-[10px] text-foreground font-medium bg-secondary/50 border border-border/20 px-2 py-0.5 rounded-lg w-fit mt-1 max-w-[200px] truncate leading-tight italic" title={data.todayMoodNote}>
                                &ldquo;{data.todayMoodNote}&rdquo;
                            </span>
                        )}
                    </div>

                    {/* Actions on mobile (right side of first row) */}
                    <div className="flex items-center gap-1 sm:hidden">
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label={expanded ? "Collapse" : "Expand"}
                        >
                            <ChevronDownIcon size={16} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                        </button>
                        <ConfirmAction
                            confirmLabel="Remove"
                            onConfirm={onRemove}
                            trigger={
                                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive hover:text-destructive-foreground" aria-label="Remove friend">
                                    <SmallCrossIcon size={14} />
                                </button>
                            }
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="flex-1 sm:flex-none">
                        <MonthNav viewDate={viewDate} canGoNext={canGoNext} onPrev={goToPrevMonth} onNext={goToNextMonth} size="sm" />
                    </div>

                    {/* Actions on desktop */}
                    <div className="hidden items-center gap-1 sm:flex">
                        <button
                            onClick={() => setExpanded(v => !v)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label={expanded ? "Collapse" : "Expand"}
                        >
                            <ChevronDownIcon size={14} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                        </button>
                        <ConfirmAction
                            confirmLabel="Remove"
                            onConfirm={onRemove}
                            trigger={
                                <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive hover:text-destructive-foreground" aria-label="Remove friend">
                                    <SmallCrossIcon size={12} />
                                </button>
                            }
                        />
                    </div>
                </div>
            </div>

            {expanded && (
                <HabitGrid
                    habits={habits} grid={grid} daysInMonth={daysInViewMonth}
                    viewDate={viewDate} isCurrentMonth={isCurrentMonth}
                    currentStreaks={currentStreaks} bestStreaks={bestStreaks}
                    onToggle={() => { }} onAddHabit={() => { }} onRemoveHabit={() => { }}
                    hiddenHabits={data.hiddenHabits} friendView today={today}
                />
            )}
        </div>
    )
}
