"use client"

import React from "react"
import { MotivationWidget } from "./motivation-widget"
import { WeeklyProgress } from "./weekly-progress"
import { DailyStats } from "./daily-stats"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import type { CellState } from "./common/types"

interface DashboardWidgetsProps {
    isMobile: boolean
    weekData: any[]
    grid: Record<string, CellState[]>
    habits: string[]
    daysInViewMonth: number
    today: Date
    viewDate: Date
    isCurrentMonth: boolean
}

export function DashboardWidgets({
    isMobile, weekData, grid, habits, daysInViewMonth, today, viewDate, isCurrentMonth
}: DashboardWidgetsProps) {
    if (isMobile) {
        return (
            <div className="mb-6 px-1">
                <Carousel className="w-full" opts={{ align: "start", loop: false }}>
                    <CarouselContent className="-ml-2">
                        <CarouselItem className="pl-2 basis-[90%] sm:basis-[80%]">
                            <MotivationWidget />
                        </CarouselItem>
                        <CarouselItem className="pl-2 basis-[90%] sm:basis-[80%]">
                            <WeeklyProgress weekData={weekData} />
                        </CarouselItem>
                        <CarouselItem className="pl-2 basis-[90%] sm:basis-[80%]">
                            <DailyStats
                                grid={grid}
                                habits={habits}
                                daysInMonth={daysInViewMonth}
                                today={today}
                                viewDate={viewDate}
                                isCurrentMonth={isCurrentMonth}
                            />
                        </CarouselItem>
                    </CarouselContent>
                </Carousel>
            </div>
        )
    }

    return (
        <div className="mb-6 grid gap-5" style={{ gridTemplateColumns: "1fr 2fr 1fr" }}>
            <MotivationWidget />
            <WeeklyProgress weekData={weekData} />
            <DailyStats
                grid={grid}
                habits={habits}
                daysInMonth={daysInViewMonth}
                today={today}
                viewDate={viewDate}
                isCurrentMonth={isCurrentMonth}
            />
        </div>
    )
}
