"use client"

import React, { useEffect } from "react"

import { useFirebaseAuth } from "@/hooks/use-firebase-auth"
import { useFirebaseSync } from "@/hooks/use-firebase-sync"
import { useFirebaseSocial } from "@/hooks/use-firebase-social"
import { useSettings } from "@/hooks/use-settings"
import { useHabitStore, getCalendarWeekData } from "@/hooks/use-habit-store"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { AuthScreen } from "./auth-screen"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { DashboardWidgets } from "./dashboard-widgets"
import { HabitGrid } from "./habit-grid"
import { FriendsSection } from "./friends-section"
import { SettingsDialog } from "./settings"
import { DashboardHeader } from "./dashboard-header"
import { ResponsiveDialog } from "./common/responsive-dialog"
import { Button } from "@/components/ui/button"
// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function HabitDashboard() {
  // Settings (theme, week start day, default habits)
  const { settings } = useSettings()
  const isMobile = useIsMobile()

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
    renameHabit,
    reorderHabit,
    goToPrevMonth,
    goToNextMonth,
    canGoNext,
    setStoreDirectly,
    userChangePending,
  } = useHabitStore(settings.defaultHabits)

  // Firebase Modules
  const { user, authLoading, updateDisplayName, deleteAccount, signOut } = useFirebaseAuth()
  const {
      firestoreReady, inviteCode, hiddenHabits, toggleHidden, syncStoreToFirestore, forceSyncStore
  } = useFirebaseSync(user, setStoreDirectly)
  const {
      friends, friendStores, friendRequests, sendFriendRequest, acceptRequest, declineRequest, addFriendError, addFriendLoading, removeFriend
  } = useFirebaseSocial(user, inviteCode)

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [isPastUnlocked, setIsPastUnlocked] = React.useState(false)
  const [showUnlockPrompt, setShowUnlockPrompt] = React.useState(false)
  const { toast } = useToast()

  const handleSync = async () => {
    if (!hydrated || !firestoreReady) return
    setIsSyncing(true)
    try {
      await forceSyncStore(store)
      toast({
        title: "Synced",
        description: "Your habits have been successfully synced.",
      })
    } catch (e) {
      toast({
        title: "Sync Failed",
        description: "Could not sync with the cloud. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Ensure current month exists locally
  useEffect(() => {
    if (hydrated) {
      toast({
        title: "Welcome back!",
        description: "Your habits are synced and ready.",
      })
    }
  }, [hydrated, toast])

  // Sync store → Firestore ONLY when the user made a deliberate change.
  // The userChangePending flag is set by mutation functions (updateCell,
  // addHabit, etc.) and is NOT set when Firestore pushes data via
  // setStoreDirectly. This prevents cloud data from being overwritten.
  useEffect(() => {
    if (!hydrated || !firestoreReady) return
    if (!userChangePending.current) return
    const changedMonthKey = userChangePending.current
    userChangePending.current = null
    syncStoreToFirestore(store, changedMonthKey)
  }, [store, hydrated, firestoreReady, syncStoreToFirestore, userChangePending])

  // Lock past editing state when changing months.
  useEffect(() => {
    setIsPastUnlocked(false)
  }, [viewDate])

  // -----------------------------------------------------------------------
  // Loading + auth gating
  // -----------------------------------------------------------------------

  // Wait for Firebase Auth to resolve
  if (authLoading) return <DashboardSkeleton />

  // No user — show login
  if (!user) {
    return <AuthScreen />
  }

  if (!hydrated) return <DashboardSkeleton />

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
        isMobile={isMobile}
        onSyncClick={handleSync}
        isSyncing={isSyncing}
        isPastUnlocked={isPastUnlocked}
        onUnlockClick={() => setShowUnlockPrompt(true)}
      />

      <main className="mx-auto max-w-[1440px]">
        {/* Top Widgets Row */}
        <DashboardWidgets
            isMobile={isMobile}
            weekData={weekData}
            grid={grid}
            habits={habits}
            daysInViewMonth={daysInViewMonth}
            today={today}
            viewDate={viewDate}
            isCurrentMonth={isCurrentMonth}
        />

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
          onRenameHabit={renameHabit}
          onReorderHabit={reorderHabit}
          hiddenHabits={hiddenHabits}
          onToggleHidden={toggleHidden}
          today={today}
          isPastUnlocked={isPastUnlocked}
          onUnlockClick={() => setShowUnlockPrompt(true)}
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

        {/* Unlock Past Edits Prompt */}
        <ResponsiveDialog
          open={showUnlockPrompt}
          onOpenChange={setShowUnlockPrompt}
          title="Unlock Historical Editing"
          description="Are you sure you want to edit past data? Modifying historical records will permanently alter your streaks and statistical overview."
          footer={
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setShowUnlockPrompt(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={() => { setIsPastUnlocked(true); setShowUnlockPrompt(false) }}>
                Unlock Editor
              </Button>
            </div>
          }
        >
          <div className="text-sm text-muted-foreground/80 my-2">
            Once unlocked, you can toggle cells in this past month freely. Your progress will automatically re-lock when you navigate to another month.
          </div>
        </ResponsiveDialog>
      </main>
    </div>
  )
}
