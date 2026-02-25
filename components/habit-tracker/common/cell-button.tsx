"use client"

import type { CellState } from "./types"
import { CheckIcon, CrossIcon } from "./icons"

interface CellButtonProps {
    state: CellState
    onClick: () => void
    day: number
    habit: string
    disabled: boolean
}

export function CellButton({ state, onClick, day, habit, disabled }: CellButtonProps) {
    const label =
        state === "yes"
            ? `${habit} day ${day}: Yes${disabled ? "" : ". Click to change to No."}`
            : state === "no"
                ? `${habit} day ${day}: No${disabled ? "" : ". Click to clear."}`
                : `${habit} day ${day}: Blank${disabled ? "" : ". Click to mark Yes."}`

    return (
        <button
            onClick={disabled ? undefined : onClick}
            aria-label={label}
            disabled={disabled}
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 ${disabled ? "cursor-default" : "hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                } ${state === "yes"
                    ? "bg-habit-yes text-habit-yes-text shadow-sm"
                    : state === "no"
                        ? "bg-habit-no text-habit-no-text shadow-sm"
                        : disabled
                            ? "bg-secondary/60 text-transparent"
                            : "bg-secondary text-transparent hover:bg-border"
                }`}
        >
            {state === "yes" ? (
                <CheckIcon />
            ) : state === "no" ? (
                <CrossIcon />
            ) : null}
        </button>
    )
}
