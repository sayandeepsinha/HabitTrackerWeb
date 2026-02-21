import { HabitDashboard } from "@/components/habit-tracker/dashboard"

// Force runtime rendering – Firebase must not be called during static prerender
export const dynamic = "force-dynamic"

export default function Page() {
  return <HabitDashboard />
}
