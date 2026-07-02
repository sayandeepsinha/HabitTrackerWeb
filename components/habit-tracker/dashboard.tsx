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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMoodTracker } from "@/hooks/use-mood-tracker"
import { Leaderboards } from "./leaderboards"
import { EmotionSpace } from "./emotion-space"
import { FriendsVibeRow } from "./friends-vibe-row"
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
      friends, friendStores, friendRequests, goalInvites, sendFriendRequest, acceptRequest, declineRequest, addFriendError, addFriendLoading, removeFriend, sendGoalInvite, acceptGoalInvite, declineGoalInvite
  } = useFirebaseSocial(user, inviteCode)

  const { moods, logMood, loading: moodsLoading } = useMoodTracker(user)

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false)
  const [isSyncing, setIsSyncing] = React.useState(false)
  const [isPastUnlocked, setIsPastUnlocked] = React.useState(false)
  const [showUnlockPrompt, setShowUnlockPrompt] = React.useState(false)
  const [showWelcomeTutorial, setShowWelcomeTutorial] = React.useState(false)
  const [newVersionAvailable, setNewVersionAvailable] = React.useState(false)
  const { toast } = useToast()

  // Onboarding welcome tutorial check
  useEffect(() => {
    if (!hydrated || !user) return
    const hasSeen = localStorage.getItem("habit-tracker-tutorial-seen")
    if (!hasSeen) {
      setShowWelcomeTutorial(true)
    }
  }, [hydrated, user])

  const handleCloseTutorial = () => {
    localStorage.setItem("habit-tracker-tutorial-seen", "true")
    setShowWelcomeTutorial(false)
  }

  // Version check notifier
  const CLIENT_VERSION = "1.0.1"
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return

    const checkVersion = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.version && data.version !== CLIENT_VERSION) {
            setNewVersionAvailable(true)
          }
        }
      } catch (e) {
        console.error("Failed to check version:", e)
      }
    }

    checkVersion()
    const interval = setInterval(checkVersion, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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
      {newVersionAvailable && (
        <div 
          onClick={() => window.location.reload()}
          className="mx-auto max-w-[1440px] mb-4 bg-gradient-to-r from-chart-1 to-accent text-white text-xs py-2.5 px-4 text-center cursor-pointer hover:opacity-95 transition-all font-semibold flex items-center justify-center gap-2 rounded-2xl select-none shadow-sm"
        >
          <span>🚀 A new update is available! Click here to reload and get the latest version.</span>
        </div>
      )}
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
        onOpenTutorial={() => setShowWelcomeTutorial(true)}
      />

      <main className="mx-auto max-w-[1440px]">
        <Tabs defaultValue="habits" className="space-y-6">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md h-11 rounded-full bg-card border border-border/30 p-1 shadow-sm">
              <TabsTrigger value="habits" className="rounded-full text-xs font-bold transition-all data-[state=active]:bg-secondary data-[state=active]:text-foreground h-full">
                Habits
              </TabsTrigger>
              <TabsTrigger value="leaderboards" className="rounded-full text-xs font-bold transition-all data-[state=active]:bg-secondary data-[state=active]:text-foreground h-full">
                Leaderboards
              </TabsTrigger>
              <TabsTrigger value="emotions" className="rounded-full text-xs font-bold transition-all data-[state=active]:bg-secondary data-[state=active]:text-foreground h-full">
                Emotion Space
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="habits" className="space-y-6 outline-none focus-visible:outline-none">
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

            {/* Friend Vibes Feed */}
            {friends.length > 0 && (
              <div className="mb-6">
                <FriendsVibeRow friends={friends} friendStores={friendStores} />
              </div>
            )}

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
          </TabsContent>

          <TabsContent value="leaderboards" className="outline-none focus-visible:outline-none">
            <Leaderboards
              store={store}
              friends={friends}
              friendStores={friendStores}
              goalInvites={goalInvites}
              user={user}
              onAddHabit={addHabit}
              onRemoveHabit={removeHabit}
              sendGoalInvite={sendGoalInvite}
              acceptGoalInvite={acceptGoalInvite}
              declineGoalInvite={declineGoalInvite}
              today={today}
            />
          </TabsContent>

          <TabsContent value="emotions" className="outline-none focus-visible:outline-none">
            <EmotionSpace
              moods={moods}
              logMood={logMood}
              loading={moodsLoading}
              today={today}
              viewDate={viewDate}
              friends={friends}
              friendStores={friendStores}
            />
          </TabsContent>
        </Tabs>

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

        {/* Welcome Tutorial Dialog */}
        <ResponsiveDialog
          open={showWelcomeTutorial}
          onOpenChange={(open) => {
            if (!open) handleCloseTutorial()
          }}
          title="Welcome to Habit Tracker"
          description="A beautiful, minimalist workspace to build and share habits."
        >
          <div className="space-y-6 pt-2">
            {/* Visual Grid Graphic */}
            <div className="flex justify-center py-4 rounded-2xl bg-secondary/20 border border-border/30">
              <div className="grid grid-cols-7 gap-2 max-w-xs">
                {Array.from({ length: 14 }).map((_, i) => {
                  const states = ["yes", "blank", "no", "yes", "blank", "blank", "yes"]
                  const state = states[i % states.length]
                  return (
                    <div
                      key={i}
                      className={`h-6 w-6 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                        state === "yes" 
                          ? "bg-chart-1/25 border-chart-1/30 text-chart-1" 
                          : state === "no" 
                            ? "bg-destructive/10 border-destructive/20 text-destructive" 
                            : "bg-background border-border/40"
                      }`}
                    >
                      {state === "yes" && "✓"}
                      {state === "no" && "✗"}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chart-1/20 text-chart-1 text-xs font-bold mt-0.5">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Build Your Grid</h4>
                  <p className="text-[11px] text-muted-foreground/95 mt-0.5 leading-relaxed">
                    Click on any cell in your habits grid to cycle between completion states: Completed (✓), Missed (✗), or Blank.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chart-1/20 text-chart-1 text-xs font-bold mt-0.5">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Mood & Mindspace</h4>
                  <p className="text-[11px] text-muted-foreground/95 mt-0.5 leading-relaxed">
                    Log your daily mood under the <strong>Mood</strong> tab. Sharing it with friends syncs a visual emoji directly to their dashboards!
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chart-1/20 text-chart-1 text-xs font-bold mt-0.5">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Shared Goals</h4>
                  <p className="text-[11px] text-muted-foreground/95 mt-0.5 leading-relaxed">
                    Add a friend by their invite code, challenge them to track a goal, or join one of their active public goals under the <strong>Leaderboards</strong> tab.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleCloseTutorial}
                className="w-full sm:w-auto rounded-xl bg-accent text-accent-foreground hover:bg-chart-1/30 px-6 font-bold text-xs h-10"
              >
                Let's Get Tracking!
              </Button>
            </div>
          </div>
        </ResponsiveDialog>
      </main>
    </div>
  )
}
