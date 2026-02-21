import { WifiOff } from 'lucide-react'

export const metadata = {
    title: 'Offline - Habit Tracker',
}

export default function OfflinePage() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-[#FDFBF7] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
            <WifiOff className="mb-4 h-16 w-16 text-zinc-400" />
            <h1 className="text-2xl font-semibold tracking-tight">You're offline</h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                Please check your internet connection to access this page.
            </p>
        </div>
    )
}
