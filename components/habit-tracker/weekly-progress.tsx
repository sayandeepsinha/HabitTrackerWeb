"use client"

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"

interface WeekDayData {
  day: string
  date: string
  percentage: number
  yesCount: number
  isFuture: boolean
}

interface WeeklyProgressProps {
  weekData: WeekDayData[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: WeekDayData }> }) {
  if (active && payload && payload.length) {
    const d = payload[0].payload
    if (d.isFuture) return null
    return (
      <div className="rounded-xl bg-card px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-foreground">
          {d.day} {d.date}: {payload[0].value}%
        </p>
        <p className="text-xs text-muted-foreground">
          {d.yesCount} habits done
        </p>
      </div>
    )
  }
  return null
}

export function WeeklyProgress({ weekData }: WeeklyProgressProps) {
  const maxPercentage = Math.max(...weekData.map(d => d.percentage), 10)

  // Create composite x-axis label
  const data = weekData.map((d) => ({
    ...d,
    label: `${d.day} ${d.date}`,
  }))

  return (
    <div className="flex h-full flex-col rounded-3xl bg-card p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Weekly Progress</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Current calendar week (Mon - Sun)</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1">
          <div className="h-2 w-2 rounded-full bg-chart-1" />
          <span className="text-xs font-medium text-accent-foreground">Completion %</span>
        </div>
      </div>

      <div className="mt-2 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              dy={8}
            />
            <YAxis
              hide
              domain={[0, Math.max(maxPercentage + 10, 100)]}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="percentage" radius={[6, 6, 4, 4]} maxBarSize={36}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isFuture ? "var(--secondary)" : entry.percentage > 0 ? "var(--chart-1)" : "var(--border)"}
                  opacity={entry.isFuture ? 0.3 : entry.percentage > 0 ? 0.6 + (entry.percentage / 100) * 0.4 : 0.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
