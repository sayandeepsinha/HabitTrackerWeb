"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 p-4 md:p-8">
            {/* Header Skeleton */}
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
                <div className="space-y-2 text-center md:text-left">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="mx-auto h-4 w-64 md:mx-0" />
                </div>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-32 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                {/* Main Content Skeleton */}
                <div className="space-y-8 lg:col-span-8">
                    {/* Motivational Widget Skeleton */}
                    <Skeleton className="h-32 w-full rounded-3xl" />

                    {/* Grid Skeleton */}
                    <div className="overflow-hidden rounded-3xl bg-card shadow-sm">
                        <div className="border-b border-border/50 p-5">
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="p-5 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex flex-1 gap-1">
                                        {[1, 2, 3, 4, 5, 6, 7].map(j => (
                                            <Skeleton key={j} className="h-8 flex-1 rounded-md" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Friends Section Skeleton */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>
                        <div className="grid gap-4">
                            <Skeleton className="h-24 w-full rounded-2xl" />
                            <Skeleton className="h-24 w-full rounded-2xl" />
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats Skeleton */}
                <div className="space-y-8 lg:col-span-4">
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-48 w-full rounded-3xl" />
                </div>
            </div>
        </div>
    )
}
