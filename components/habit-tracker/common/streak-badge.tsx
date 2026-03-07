import { FireIcon } from "./icons"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function StreakBadge({ count }: { count: number }) {
    if (count === 0) return null
    const isHot = count >= 7

    return (
        <Badge
            variant="secondary"
            className={cn(
                "h-5 gap-0.5 rounded-full border-none px-2 text-[10px] font-bold transition-all duration-500",
                isHot
                    ? "bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)] animate-pulse"
                    : "bg-peach text-peach-foreground"
            )}
        >
            <FireIcon className={isHot ? "animate-bounce" : ""} />
            {count}
        </Badge>
    )
}
