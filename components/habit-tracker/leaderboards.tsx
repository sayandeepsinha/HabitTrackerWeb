"use client"

import { useState } from "react"
import { Avatar } from "./common/avatar"
import { ResponsiveDialog } from "./common/responsive-dialog"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trophy, Users, Plus, Check, X, Calendar, Trash2 } from "lucide-react"
import type { Friend, FriendData, GoalInvite, HabitStore, CellState } from "./common/types"

interface LeaderboardsProps {
  store: HabitStore
  friends: Friend[]
  friendStores: Record<string, FriendData>
  goalInvites: GoalInvite[]
  user: any
  onAddHabit: (name: string) => void
  onRemoveHabit?: (name: string) => void
  sendGoalInvite: (friendUid: string, goalName: string) => Promise<void>
  acceptGoalInvite: (inviteId: string) => Promise<void>
  declineGoalInvite: (inviteId: string) => Promise<void>
  today: Date
}

interface LeaderboardMember {
  uid: string
  name: string
  photoURL: string
  score: number // total yes completions
  percentage: number
  isSelf: boolean
}

interface Leaderboard {
  goalName: string
  members: LeaderboardMember[]
}

export function Leaderboards({
  store,
  friends,
  friendStores,
  goalInvites,
  user,
  onAddHabit,
  onRemoveHabit,
  sendGoalInvite,
  acceptGoalInvite,
  declineGoalInvite,
  today,
}: LeaderboardsProps) {
  const { toast } = useToast()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newGoalName, setNewGoalName] = useState("")
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [submittingInvite, setSubmittingInvite] = useState(false)
  const [selectedFriendToJoin, setSelectedFriendToJoin] = useState<string>("")
  const [confirmLeaveName, setConfirmLeaveName] = useState<string | null>(null)

  // 1. Calculate active month key (e.g. "2026-06")
  const currentMonthKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0")
  const userMonthData = store[currentMonthKey]
  const userHabits = userMonthData?.habits ?? []

  // 2. Identify shared goals (habits shared with friends for the current month)
  const leaderboards: Leaderboard[] = []

  userHabits.forEach((habit) => {
    const matchingMembers: LeaderboardMember[] = []

    // Calculate user's score for this habit
    const userGrid = userMonthData?.grid[habit] ?? []
    const userYesCount = userGrid.filter((s) => s === "yes").length
    const totalDays = userGrid.length || 1
    
    matchingMembers.push({
      uid: user.uid,
      name: "You",
      photoURL: user.photoURL ?? "",
      score: userYesCount,
      percentage: Math.round((userYesCount / totalDays) * 100),
      isSelf: true,
    })

    // Check each friend's habits for this month
    friends.forEach((friend) => {
      const friendData = friendStores[friend.uid]
      const friendMonthData = friendData?.store[currentMonthKey]
      
      if (friendMonthData) {
        // Look for matching habit name (case-insensitive)
        const matchKey = friendMonthData.habits.find(
          (h) => h.toLowerCase() === habit.toLowerCase()
        )
        if (matchKey) {
          const friendGrid = friendMonthData.grid[matchKey] ?? []
          const friendYesCount = friendGrid.filter((s) => s === "yes").length
          matchingMembers.push({
            uid: friend.uid,
            name: friend.displayName || friend.email.split("@")[0],
            photoURL: friend.photoURL ?? "",
            score: friendYesCount,
            percentage: Math.round((friendYesCount / totalDays) * 100),
            isSelf: false,
          })
        }
      }
    })

    // Always make a leaderboard (even if only the user is tracking it)
    if (matchingMembers.length > 0) {
      // Sort members by score descending, then by name ascending
      matchingMembers.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      leaderboards.push({
        goalName: habit,
        members: matchingMembers,
      })
    }
  })

  // 3. Actions
  const handleCreateGoal = async () => {
    const trimmedGoal = newGoalName.trim()
    if (!trimmedGoal) return
    if (selectedFriends.length === 0) {
      toast({
        title: "Select Friends",
        description: "Choose at least one friend to share this goal with.",
        variant: "destructive",
      })
      return
    }

    setSubmittingInvite(true)
    try {
      // Add habit locally if the user does not have it yet
      if (!userHabits.some((h) => h.toLowerCase() === trimmedGoal.toLowerCase())) {
        onAddHabit(trimmedGoal)
      }

      // Send invites to each friend
      await Promise.all(
        selectedFriends.map((fUid) => sendGoalInvite(fUid, trimmedGoal))
      )

      toast({
        title: "Invitations Sent",
        description: `Invited ${selectedFriends.length} friends to track "${trimmedGoal}"!`,
      })

      // Clean up
      setNewGoalName("")
      setSelectedFriends([])
      setShowCreateDialog(false)
    } catch (e) {
      console.error(e)
      toast({
        title: "Error sending invites",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmittingInvite(false)
    }
  }

  const handleJoinFriendGoal = (goalName: string) => {
    try {
      if (!userHabits.some((h) => h.toLowerCase() === goalName.toLowerCase())) {
        onAddHabit(goalName)
      }
      toast({
        title: "Goal Shared!",
        description: `Successfully joined the goal "${goalName}"!`,
      })
      setShowCreateDialog(false)
      setSelectedFriendToJoin("")
    } catch (e) {
      console.error(e)
      toast({
        title: "Error joining goal",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptInvite = async (invite: GoalInvite) => {
    try {
      // Add habit to local store if not present
      if (!userHabits.some((h) => h.toLowerCase() === invite.goalName.toLowerCase())) {
        onAddHabit(invite.goalName)
      }
      await acceptGoalInvite(invite.id)
      toast({
        title: "Challenge Accepted!",
        description: `You are now tracking "${invite.goalName}" with ${invite.fromName}.`,
      })
    } catch (e) {
      console.error(e)
    }
  }

  const toggleFriendSelect = (fUid: string) => {
    setSelectedFriends((prev) =>
      prev.includes(fUid) ? prev.filter((id) => id !== fUid) : [...prev, fUid]
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-chart-1" /> Shared Goals & Leaderboards
          </h2>
          <p className="text-xs text-muted-foreground">
            Track goals together and compete in monthly consistency leaderboards.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 rounded-xl bg-card hover:bg-secondary border border-border text-foreground px-4 py-2 font-semibold shadow-sm transition-all"
        >
          <Plus className="h-4 w-4" /> Add Goal with Friends
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Leaderboards List (Main Column) */}
        <div className="lg:col-span-2 space-y-6">
          {leaderboards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-card px-6 py-16 text-center border border-border/45 shadow-[0_2px_20px_rgba(0,0,0,0.02)] max-w-xl mx-auto space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-accent-foreground shadow-xs">
                <Trophy className="text-chart-1 h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Track Goals with Friends</h3>
                <p className="max-w-md text-xs text-muted-foreground/90 leading-relaxed">
                  Building habits is easier together. Since goals match dynamically by name, you can start sharing goals in two ways:
                </p>
              </div>

              <div className="grid gap-4 w-full text-left sm:grid-cols-2 pt-2">
                <div className="p-4 rounded-2xl bg-secondary/10 border border-border/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-chart-1 text-white text-[10px] font-bold">1</span>
                    <h4 className="text-xs font-bold text-foreground">Challenge Friends</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground/85 leading-relaxed">
                    Click <strong>Add Goal with Friends</strong> above, enter a habit name, and invite your friends.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/10 border border-border/20 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-chart-1 text-white text-[10px] font-bold">2</span>
                    <h4 className="text-xs font-bold text-foreground">Join a Friend's Goal</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground/85 leading-relaxed">
                    Click the button above, go to the <strong>Join Friend's Goal</strong> tab, and import their active public habits.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowCreateDialog(true)}
                className="mt-2 rounded-xl bg-accent text-accent-foreground hover:bg-chart-1/30 px-5 font-bold text-xs h-10 shadow-sm"
              >
                Get Started
              </Button>
            </div>
          ) : (
            leaderboards.map((lb) => (
              <div
                key={lb.goalName}
                className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm space-y-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/40 text-accent-foreground">
                      <Trophy className="h-5 w-5 text-chart-1" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground capitalize">{lb.goalName}</h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Monthly Standings
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary/80 px-2.5 py-1 text-[10px] font-bold text-foreground">
                      {lb.members.length} Competitors
                    </span>
                    {onRemoveHabit && (
                      confirmLeaveName === lb.goalName ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                          <span className="text-[10px] font-bold text-destructive">Are you sure?</span>
                          <button
                            onClick={() => {
                              onRemoveHabit(lb.goalName)
                              setConfirmLeaveName(null)
                              toast({
                                title: "Goal Removed",
                                description: `You stopped tracking "${lb.goalName}".`,
                              })
                            }}
                            className="p-1 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer text-[10px] font-bold"
                            title="Confirm Leave"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setConfirmLeaveName(null)}
                            className="p-1 rounded-md bg-secondary text-muted-foreground hover:bg-border transition-all cursor-pointer text-[10px] font-bold"
                            title="Cancel"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmLeaveName(lb.goalName)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/20 transition-all cursor-pointer"
                          title="Leave / Remove goal"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Podium Chart (Mockup Style: Staircase Descending) */}
                <div className="pt-8 pb-4">
                  <div className="flex items-end justify-start gap-3 min-h-[160px] max-w-lg overflow-x-auto pb-2 scrollbar-none">
                    {lb.members.slice(0, 5).map((member, index) => {
                      const rank = index + 1
                      // Set height percentages based on rank (1st = 100%, 2nd = 80%, etc.)
                      const heights = ["h-36", "h-28", "h-22", "h-16", "h-12"]
                      const heightClass = heights[index] || "h-12"

                      return (
                        <div
                          key={member.uid}
                          className="flex flex-col items-center flex-1 min-w-[70px] group"
                        >
                          {/* Floating Name & Avatar */}
                          <div className="mb-1 flex flex-col items-center text-center">
                            <span className={`text-[10px] font-medium truncate max-w-[70px] ${
                              member.isSelf ? "font-bold text-chart-1" : "text-muted-foreground"
                            }`}>
                              {member.name}
                            </span>
                            <div className={`mt-1 p-0.5 rounded-full ${
                              member.isSelf 
                                ? "ring-2 ring-chart-1 ring-offset-2 ring-offset-card shadow-[0_0_8px_rgba(var(--chart-1),0.4)]" 
                                : "ring-1 ring-border"
                            }`}>
                              <Avatar src={member.photoURL} name={member.name} size={32} />
                            </div>
                          </div>

                          {/* Score Display (Days / Completion rate) in normal flow to prevent overlapping */}
                          <span className="text-[10px] text-foreground font-semibold mb-1">
                            {member.score}d
                          </span>

                          {/* Stepped Bar Chart Column */}
                          <div
                            className={`w-full ${heightClass} rounded-t-xl transition-all duration-300 relative flex flex-col items-center justify-end pb-3 text-white font-bold shadow-sm ${
                              member.isSelf
                                ? "bg-gradient-to-t from-chart-1 to-chart-1/80 group-hover:shadow-[0_4px_16px_rgba(var(--chart-1),0.3)]"
                                : "bg-gradient-to-t from-muted-foreground/60 to-muted-foreground/45 group-hover:from-muted-foreground/75"
                            }`}
                          >
                            {/* Rank text centered at bottom of bar */}
                            <span className="text-sm tracking-tight opacity-90">{rank}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Scoreboard List Details */}
                <div className="space-y-2 border-t border-border/30 pt-4">
                  {lb.members.map((member, index) => (
                    <div
                      key={member.uid}
                      className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-colors ${
                        member.isSelf ? "bg-secondary/40 border border-border/30" : "hover:bg-secondary/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 text-center text-xs font-bold text-muted-foreground/80">
                          #{index + 1}
                        </span>
                        <Avatar src={member.photoURL} name={member.name} size={24} />
                        <span className={`font-semibold ${member.isSelf ? "text-foreground" : "text-muted-foreground"}`}>
                          {member.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">{member.score} Days</span>
                        <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-chart-1 h-full rounded-full"
                            style={{ width: `${member.percentage}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold text-foreground">
                          {member.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Goal Invitations Sidebar */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" /> Challenges Pending
            </h3>
            <p className="text-xs text-muted-foreground">
              Friends inviting you to track habits together.
            </p>

            {goalInvites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-secondary/20 rounded-2xl border border-dashed border-border/40">
                <Users className="text-muted-foreground/40 h-8 w-8 mb-2" />
                <span className="text-xs text-muted-foreground/60 font-medium">No pending challenges</span>
              </div>
            ) : (
              <div className="space-y-3">
                {goalInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-col justify-between rounded-2xl bg-secondary/40 p-4 border border-border/30 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground shrink-0 mt-0.5">
                        <Trophy className="h-4 w-4 text-chart-1" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-foreground font-semibold truncate leading-tight">
                          {invite.goalName}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
                          Invited by <strong className="text-foreground">{invite.fromName}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptInvite(invite)}
                        className="flex-1 h-8 rounded-lg bg-accent hover:bg-chart-1/30 text-accent-foreground font-bold text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => declineGoalInvite(invite.id)}
                        className="flex-1 h-8 rounded-lg border border-border hover:bg-secondary/80 text-muted-foreground text-xs"
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Start Goal Dialog */}
      <ResponsiveDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Start Goal with Friends"
        description="Invite friends to track a new goal, or easily join one of their active public goals."
      >
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl mb-4 bg-secondary/30 p-1">
            <TabsTrigger value="create" className="rounded-lg font-semibold py-1.5 text-xs">
              Challenge Friends
            </TabsTrigger>
            <TabsTrigger value="join" className="rounded-lg font-semibold py-1.5 text-xs">
              Join Friend's Goal
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 pt-2">
            {/* Goal Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Goal / Habit Name</label>
              <Input
                type="text"
                placeholder="Enter a new goal name..."
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                className="rounded-xl border border-border bg-background focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0"
              />
            </div>

            {/* Select Friends Checkbox List */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                Select Friends <span>({selectedFriends.length} selected)</span>
              </label>
              {friends.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border/50 rounded-xl bg-secondary/10">
                  <p className="text-xs text-muted-foreground">You don&apos;t have any friends added yet.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Connect with friends under the &apos;Habits&apos; tab first.</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px] border border-border rounded-xl p-3 bg-secondary/20">
                  <div className="space-y-2.5">
                    {friends.map((friend) => (
                      <div
                        key={friend.uid}
                        onClick={() => toggleFriendSelect(friend.uid)}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar src={friend.photoURL} name={friend.displayName} size={28} />
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-foreground leading-tight">
                              {friend.displayName}
                            </span>
                            <span className="text-[10px] text-muted-foreground max-w-[150px] truncate leading-tight">
                              {friend.email}
                            </span>
                          </div>
                        </div>
                        <Checkbox
                          id={`check-${friend.uid}`}
                          checked={selectedFriends.includes(friend.uid)}
                          onCheckedChange={() => {}} // Handle click on container instead
                          className="rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={submittingInvite}
                className="rounded-xl h-10 px-4 text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGoal}
                disabled={submittingInvite || !newGoalName.trim() || selectedFriends.length === 0}
                className="rounded-xl h-10 px-5 text-xs font-bold bg-accent text-accent-foreground hover:bg-chart-1/30"
              >
                {submittingInvite ? "Sending Invites…" : "Send Invites"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="join" className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Choose a Friend</label>
              {friends.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-border/50 rounded-xl bg-secondary/10">
                  <p className="text-xs text-muted-foreground">You don&apos;t have any friends added yet.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Connect with friends under the &apos;Habits&apos; tab first.</p>
                </div>
              ) : (
                <Select
                  value={selectedFriendToJoin}
                  onValueChange={setSelectedFriendToJoin}
                >
                  <SelectTrigger className="w-full rounded-xl bg-background border border-border h-10 px-3 flex justify-between items-center text-sm">
                    <SelectValue placeholder="Select a friend..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border bg-card shadow-md p-1">
                    {friends.map((friend) => (
                      <SelectItem key={friend.uid} value={friend.uid} className="rounded-lg py-2 cursor-pointer hover:bg-secondary/40 text-sm">
                        <div className="flex items-center gap-2">
                          <Avatar src={friend.photoURL} name={friend.displayName} size={20} />
                          <span>{friend.displayName || friend.email}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {selectedFriendToJoin && (() => {
              const friend = friends.find(f => f.uid === selectedFriendToJoin)
              const friendData = friendStores[selectedFriendToJoin]
              const friendMonthData = friendData?.store[currentMonthKey]
              const friendHabits = friendMonthData?.habits ?? []
              // Filter to exclude hidden habits
              const visibleHabits = friendHabits.filter(h => !friendData?.hiddenHabits?.[h])
              // Filter to exclude habits user is already tracking (case-insensitive)
              const userHabitsLower = userHabits.map(uh => uh.toLowerCase())
              const joinableHabits = visibleHabits.filter(h => !userHabitsLower.includes(h.toLowerCase()))

              return (
                <div className="space-y-2.5">
                  <label className="text-xs font-semibold text-foreground">
                    {friend?.displayName}&apos;s Active Goals
                  </label>
                  {joinableHabits.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-8 text-center border border-dashed border-border/50 rounded-xl bg-secondary/5">
                      No new public goals to join from this friend this month.
                    </p>
                  ) : (
                    <ScrollArea className="h-[200px] border border-border rounded-xl p-2 bg-secondary/10">
                      <div className="space-y-1.5">
                        {joinableHabits.map((habit) => (
                          <div
                            key={habit}
                            onClick={() => handleJoinFriendGoal(habit)}
                            className="w-full text-left flex items-center justify-between p-2.5 rounded-lg hover:bg-card border border-transparent hover:border-border/30 shadow-xs hover:shadow-sm transition-all cursor-pointer group"
                          >
                            <span className="text-xs font-semibold text-foreground capitalize group-hover:text-chart-1 transition-colors">
                              {habit}
                            </span>
                            <span className="text-[10px] bg-chart-1/10 text-chart-1 group-hover:bg-chart-1 group-hover:text-white px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1">
                              <Plus className="h-3 w-3" /> Join Goal
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )
            })()}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false)
                  setSelectedFriendToJoin("")
                }}
                className="rounded-xl h-10 px-4 text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </ResponsiveDialog>
    </div>
  )
}
