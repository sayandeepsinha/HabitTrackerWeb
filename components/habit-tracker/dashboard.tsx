"use client"

import React, { useEffect, useRef, useCallback } from "react"
import { useFirebase } from "@/hooks/use-firebase"
import { useSettings } from "@/hooks/use-settings"
import { useHabitStore, getCalendarWeekData } from "@/hooks/use-habit-store"
import type { HabitStore } from "./common/types"
import { AuthScreen } from "./auth-screen"
import { MotivationWidget } from "./motivation-widget"
import { WeeklyProgress } from "./weekly-progress"
import { DailyStats } from "./daily-stats"
import { HabitGrid } from "./habit-grid"
import { FriendsSection } from "./friends-section"
import { SettingsDialog } from "./settings"
import { DashboardHeader } from "./dashboard-header"
// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function HabitDashboard() {
  // Settings (theme, week start day, default habits)
  const { settings } = useSettings()

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
    reorderHabit,
    goToPrevMonth,
    goToNextMonth,
    canGoNext,
    setStoreDirectly,
  } = useHabitStore(settings.defaultHabits)

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
    updateDisplayName,
    deleteAccount,
  } = useFirebase(handleFirestoreUpdate)

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)

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
      <DashboardHeader
        viewDate={viewDate}
        isCurrentMonth={isCurrentMonth}
        canGoNext={canGoNext}
        goToPrevMonth={goToPrevMonth}
        goToNextMonth={goToNextMonth}
        user={user}
        onOpenSettings={() => setIsSettingsOpen(true)}
        signOut={signOut}
      />

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
          onReorderHabit={reorderHabit}
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

        {/* Settings Dialog */}
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          user={user}
          updateDisplayName={updateDisplayName}
          deleteAccount={deleteAccount}
        />
      </main>
    </div>
  )
}
