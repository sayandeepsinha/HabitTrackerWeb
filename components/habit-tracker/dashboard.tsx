"use client"

import { useEffect, useRef, useCallback } from "react"
import { format } from "date-fns"
import { useFirebase } from "@/hooks/use-firebase"
import { useHabitStore, getCalendarWeekData } from "./use-habit-store"
import type { HabitStore } from "./types"
import { AuthScreen } from "./auth-screen"
import { MotivationWidget } from "./motivation-widget"
import { WeeklyProgress } from "./weekly-progress"
import { DailyStats } from "./daily-stats"
import { HabitGrid } from "./habit-grid"
import { FriendsSection } from "./friends-section"

// ---------------------------------------------------------------------------
// Avatar shown in header when signed in
// ---------------------------------------------------------------------------
function UserAvatar({
  photoURL,
  displayName,
}: {
  photoURL?: string | null
  displayName?: string | null
}) {
  if (photoURL) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoURL}
        alt={displayName ?? "User"}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    )
  }
  const initials = (displayName ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3 text-xs font-bold text-foreground">
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function HabitDashboard() {
  // Habit store — always loads from localStorage instantly.
  // We get setStoreDirectly so Firebase can push Firestore data into React state.
  const {
    store,
    hydrated,
    viewDate,
    viewMonthData,
    isCurrentMonth,
    daysInViewMonth,
    today,
    currentStreaks,
    bestStreaks,
    updateCell,
    addHabit,
    removeHabit,
    goToPrevMonth,
    goToNextMonth,
    canGoNext,
    setStoreDirectly,
  } = useHabitStore()

  // Track Firestore-sourced updates to avoid infinite sync loops.
  // When Firestore pushes data, we record the object reference. If the store
  // matches that reference, it came from Firestore and we DON'T write back.
  const lastFirestoreStore = useRef<HabitStore | null>(null)

  // Wrap setStoreDirectly: track that the update came from Firestore
  const handleFirestoreUpdate = useCallback(
    (newStore: HabitStore) => {
      lastFirestoreStore.current = newStore
      setStoreDirectly(newStore)
    },
    [setStoreDirectly]
  )

  // Firebase auth + social features.
  // handleFirestoreUpdate lets onSnapshot push Firestore data → React state.
  const {
    user,
    authLoading,
    firestoreReady,
    inviteCode,
    hiddenHabits,
    toggleHidden,
    friends,
    friendStores,
    friendRequests,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    addFriendError,
    addFriendLoading,
    removeFriend,
    signOut,
    syncStoreToFirestore,
  } = useFirebase(handleFirestoreUpdate)

  // Sync store → Firestore whenever the store changes.
  // CRITICAL: Wait for firestoreReady before writing — otherwise on a new
  // domain, empty localStorage defaults would overwrite real Firestore data.
  useEffect(() => {
    if (!hydrated || !firestoreReady) return
    if (store === lastFirestoreStore.current) return
    syncStoreToFirestore(store)
  }, [store, hydrated, firestoreReady, syncStoreToFirestore])

  // -----------------------------------------------------------------------
  // Loading + auth gating
  // -----------------------------------------------------------------------

  // Wait for Firebase Auth to resolve
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-chart-1" />
      </div>
    )
  }

  // No user — show login
  if (!user) {
    return <AuthScreen />
  }

  // Wait for localStorage to hydrate (should be instant)
  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-chart-1" />
      </div>
    )
  }

  // -----------------------------------------------------------------------
  // Derived display data
  // -----------------------------------------------------------------------
  const habits = viewMonthData?.habits ?? []
  const grid = viewMonthData?.grid ?? {}
  const weekData = getCalendarWeekData(store, habits, today)

  return (
    <div className="min-h-screen bg-background px-6 py-8 lg:px-12 lg:py-10">
      <header className="mx-auto mb-8 max-w-[1440px]">
        <div className="flex items-end justify-between">
          {/* Brand */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Habit Tracker
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your daily habits and build streaks
            </p>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={goToPrevMonth}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Previous month"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 4L6 8L10 12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="min-w-[180px] rounded-xl bg-card px-5 py-2 text-center shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              <span className="text-sm font-semibold text-foreground">
                {format(viewDate, "MMMM yyyy")}
              </span>
              {!isCurrentMonth && (
                <span className="ml-2 inline-block rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  View only
                </span>
              )}
            </div>

            <button
              onClick={goToNextMonth}
              disabled={!canGoNext}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next month"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Legend + User */}
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  className="text-chart-1"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 7.5L5.5 10.5L11.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-medium text-accent-foreground">
                  Yes
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-habit-no px-3 py-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="text-habit-no-text"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="text-xs font-medium text-habit-no-text">
                  No
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-border" />
                <span className="text-xs font-medium text-muted-foreground">
                  Blank
                </span>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-2 rounded-xl bg-card px-3 py-1.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
              <UserAvatar
                photoURL={user.photoURL}
                displayName={user.displayName}
              />
              <span className="max-w-[100px] truncate text-xs font-medium text-foreground">
                {user.displayName ?? user.email}
              </span>
              <button
                onClick={signOut}
                title="Sign out"
                className="ml-1 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-secondary hover:text-foreground"
                aria-label="Sign out"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="16 17 21 12 16 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <line
                    x1="21"
                    y1="12"
                    x2="9"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px]">
        {/* Top Widgets Row */}
        <div
          className="mb-6 grid gap-5"
          style={{ gridTemplateColumns: "1fr 2fr 1fr" }}
        >
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

        {/* Habit Grid */}
        <HabitGrid
          habits={habits}
          grid={grid}
          daysInMonth={daysInViewMonth}
          viewDate={viewDate}
          isCurrentMonth={isCurrentMonth}
          currentStreaks={currentStreaks}
          bestStreaks={bestStreaks}
          onToggle={updateCell}
          onAddHabit={addHabit}
          onRemoveHabit={removeHabit}
          hiddenHabits={hiddenHabits}
          onToggleHidden={toggleHidden}
        />

        {/* Friends Section */}
        <FriendsSection
          inviteCode={inviteCode}
          friends={friends}
          friendStores={friendStores}
          friendRequests={friendRequests}
          onSendRequest={sendFriendRequest}
          onAcceptRequest={acceptRequest}
          onDeclineRequest={declineRequest}
          addFriendError={addFriendError}
          addFriendLoading={addFriendLoading}
          onRemoveFriend={removeFriend}
          today={today}
        />
      </main>
    </div>
  )
}
