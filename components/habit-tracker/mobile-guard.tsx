"use client"

import { useEffect, useState } from "react"

export function MobileGuard({ children }: { children: React.ReactNode }) {
    const [isMobilePortrait, setIsMobilePortrait] = useState(false)
    const [bypassed, setBypassed] = useState(false)

    useEffect(() => {
        const checkOrientation = () => {
            const isPortrait = window.innerHeight > window.innerWidth
            const isSmallScreen = window.innerWidth < 1024 // Standard desktop/tablet threshold
            setIsMobilePortrait(isPortrait && isSmallScreen)
        }

        // Check on load
        checkOrientation()

        // Check on resize or rotate
        window.addEventListener("resize", checkOrientation)
        return () => window.removeEventListener("resize", checkOrientation)
    }, [])

    if (isMobilePortrait && !bypassed) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background p-8 text-center font-sans tracking-tight">
                <div className="mb-6 text-6xl"><img src="./responsive.png" alt="" /></div>
                <h2 className="mb-4 text-2xl font-semibold text-foreground">
                    Best Viewed in Landscape
                </h2>
                <p className="mb-8 max-w-xs leading-relaxed text-muted-foreground">
                    Your habit dashboard needs a bit more room. Please rotate your phone to{" "}
                    <strong className="font-semibold text-foreground">Landscape Mode</strong> or open it on a{" "}
                    <strong className="font-semibold text-foreground">Desktop</strong> for the full
                    experience.
                </p>

                <button
                    onClick={() => setBypassed(true)}
                    className="rounded-full bg-secondary px-6 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
                >
                    Continue anyway
                </button>

                <div className="mt-12 animate-pulse text-xs font-medium text-muted-foreground/60">
                    Waiting for rotation...
                </div>
            </div>
        )
    }

    return <>{children}</>
}
