import { FireIcon } from "./icons"

export function StreakBadge({ count }: { count: number }) {
    if (count === 0) return null
    return (
        <span className="flex items-center gap-0.5 rounded-full bg-peach px-1.5 py-0.5 text-[10px] font-semibold leading-none text-peach-foreground">
            <FireIcon />
            {count}
        </span>
    )
}
