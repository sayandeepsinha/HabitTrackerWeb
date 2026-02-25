"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell } from "recharts"
import { getDate } from "date-fns"
import type { CellState } from "./common/types"

interface DailyStatsProps {
  grid: Record<string, CellState[]>
  habits: string[]
  daysInMonth: number
  today: Date
  viewDate: Date
  isCurrentMonth: boolean
}

function getStats(
  grid: Record<string, CellState[]>,
  habits: string[],
  daysInMonth: number,
  today: Date,
  viewDate: Date,
  isCurrentMonth: boolean
) {
  let yesCount = 0
  let noCount = 0

  // Only count up to today for current month, or all days for past months
  const maxDay = isCurrentMonth ? getDate(today) : daysInMonth

  for (const habit of habits) {
    const cells = grid[habit]
    if (!cells) continue
    for (let day = 0; day < maxDay; day++) {
      const state = cells[day]
      if (state === "yes") yesCount++
      else if (state === "no") noCount++
    }
  }

  const total = yesCount + noCount
  const percentage = total > 0 ? Math.round((yesCount / total) * 100) : 0

  return { yesCount, noCount, percentage, total }
}

export function DailyStats({ grid, habits, daysInMonth, today, viewDate, isCurrentMonth }: DailyStatsProps) {
  const { yesCount, noCount, percentage, total } = useMemo(
    () => getStats(grid, habits, daysInMonth, today, viewDate, isCurrentMonth),
    [grid, habits, daysInMonth, today, viewDate, isCurrentMonth]
  )

  const chartData = total > 0
    ? [
      { name: "Yes", value: yesCount },
      { name: "No", value: noCount },
    ]
    : [{ name: "Empty", value: 1 }]

  const COLORS = total > 0 ? ["var(--chart-1)", "var(--chart-2)"] : ["var(--secondary)"]

  return (
    <div className="flex h-full flex-col items-center rounded-3xl bg-card p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <h3 className="text-sm font-semibold text-foreground">Daily Stats</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {isCurrentMonth ? "Yes vs No (up to today)" : "Monthly summary"}
      </p>

      <div className="relative mt-2 flex flex-1 items-center justify-center">
        <PieChart width={160} height={160}>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={72}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
            paddingAngle={total > 0 ? 3 : 0}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">
            {total > 0 ? `${percentage}%` : "0%"}
          </span>
          <span className="text-xs text-muted-foreground">completed</span>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-chart-1" />
          <span className="text-xs text-muted-foreground">Yes ({yesCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-chart-2" />
          <span className="text-xs text-muted-foreground">No ({noCount})</span>
        </div>
      </div>
    </div>
  )
}
