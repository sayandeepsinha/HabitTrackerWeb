"use client"

import { useState, useEffect } from "react"
import { getDaysInMonth, format, isToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Smile, MessageSquare, Calendar, BarChart3, AlertCircle, Pencil } from "lucide-react"
import { FriendsVibeRow } from "./friends-vibe-row"
import type { Friend, FriendData, MoodLog, MoodType } from "./common/types"

interface EmotionSpaceProps {
  moods: Record<string, MoodLog>
  logMood: (dateStr: string, mood: MoodType, note?: string, shareWithFriends?: boolean) => Promise<void>
  loading: boolean
  today: Date
  viewDate: Date
  friends?: Friend[]
  friendStores?: Record<string, FriendData>
}

const MOOD_META: Record<
  MoodType,
  { emoji: string; label: string; color: string; calendarColor: string; bgBadge: string }
> = {
  happy: {
    emoji: "😊",
    label: "Happy",
    color: "bg-pink-500/10 text-pink-500 border-pink-500/30 hover:bg-pink-500/25",
    calendarColor: "bg-pink-500/20 border-pink-500/40 text-pink-700 dark:text-pink-300 shadow-[inset_0_0_8px_rgba(236,72,153,0.1)]",
    bgBadge: "bg-pink-500 text-white",
  },
  calm: {
    emoji: "😌",
    label: "Calm",
    color: "bg-teal-500/10 text-teal-500 border-teal-500/30 hover:bg-teal-500/25",
    calendarColor: "bg-teal-500/20 border-teal-500/40 text-teal-700 dark:text-teal-300 shadow-[inset_0_0_8px_rgba(20,184,166,0.1)]",
    bgBadge: "bg-teal-500 text-white",
  },
  neutral: {
    emoji: "😐",
    label: "Neutral",
    color: "bg-slate-500/10 text-slate-500 border-slate-500/30 hover:bg-slate-500/25",
    calendarColor: "bg-slate-500/20 border-slate-500/40 text-slate-700 dark:text-slate-300 shadow-[inset_0_0_8px_rgba(100,116,139,0.1)]",
    bgBadge: "bg-slate-500 text-white",
  },
  stressed: {
    emoji: "😫",
    label: "Stressed",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/30 hover:bg-orange-500/25",
    calendarColor: "bg-orange-500/20 border-orange-500/40 text-orange-700 dark:text-orange-300 shadow-[inset_0_0_8px_rgba(249,115,22,0.1)]",
    bgBadge: "bg-orange-500 text-white",
  },
  sad: {
    emoji: "😢",
    label: "Sad",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/30 hover:bg-blue-500/25",
    calendarColor: "bg-blue-500/20 border-blue-500/40 text-blue-700 dark:text-blue-300 shadow-[inset_0_0_8px_rgba(59,130,246,0.1)]",
    bgBadge: "bg-blue-500 text-white",
  },
}

const MOOD_IMAGE_URLS: Record<MoodType, string> = {
  happy: "/emojis/happy.png",
  calm: "/emojis/calm.png",
  neutral: "/emojis/neutral.png",
  stressed: "/emojis/stressed.png",
  sad: "/emojis/sad.png"
}

export function EmotionSpace({ moods, logMood, loading, today, viewDate, friends = [], friendStores = {} }: EmotionSpaceProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [note, setNote] = useState("")
  const [shareWithFriends, setShareWithFriends] = useState(false)
  const [logging, setLogging] = useState(false)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const [isEditingJournal, setIsEditingJournal] = useState(false)
  const [editedNote, setEditedNote] = useState("")
  const [editedShare, setEditedShare] = useState(false)

  // 1. Format dates for queries
  const todayKey = format(today, "yyyy-MM-dd")
  const currentMonthKey = format(viewDate, "yyyy-MM") // "2026-06"
  const focusedDayKey = selectedDayKey || todayKey
  const focusedMoodLog = moods[focusedDayKey]

  // Reset editing state and hydrate note when selection changes
  useEffect(() => {
    setIsEditingJournal(false)
    if (focusedMoodLog) {
      setEditedNote(focusedMoodLog.note || "")
      setEditedShare(!!focusedMoodLog.shareWithFriends)
    } else {
      setEditedNote("")
      setEditedShare(false)
    }
  }, [focusedDayKey, focusedMoodLog])

  // Check if today's mood has already been logged
  const todayMood = moods[todayKey]

  // 2. Generate Calendar dates
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = getDaysInMonth(viewDate)
  
  // Align start offset to Monday
  const firstDayOfMonth = new Date(year, month, 1)
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sun, 1 = Mon...
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const calendarDays: Array<{ dateKey: string; dayNum: number; isPlaceholder: boolean }> = []

  // Placeholders for previous month alignment
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push({ dateKey: `placeholder-${i}`, dayNum: 0, isPlaceholder: true })
  }

  // Days of this month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    calendarDays.push({ dateKey: dateStr, dayNum: d, isPlaceholder: false })
  }

  // 3. Handle Mood Logging Submission
  const handleSubmitMood = async () => {
    if (!selectedMood) return
    setLogging(true)
    try {
      await logMood(todayKey, selectedMood, note, shareWithFriends)
      setNote("")
      setShareWithFriends(false)
      setSelectedMood(null)
    } catch (e) {
      console.error(e)
    } finally {
      setLogging(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!focusedMoodLog) return
    setLogging(true)
    try {
      await logMood(focusedDayKey, focusedMoodLog.mood, editedNote, editedShare)
      setIsEditingJournal(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLogging(false)
    }
  }

  // 4. Calculate Stats for the active month
  const activeMonthMoods = Object.entries(moods).filter(([key]) => key.startsWith(currentMonthKey))
  const totalLogs = activeMonthMoods.length
  
  const moodCounts: Record<MoodType, number> = {
    happy: 0,
    calm: 0,
    neutral: 0,
    stressed: 0,
    sad: 0,
  }

  activeMonthMoods.forEach(([, value]) => {
    if (value.mood in moodCounts) {
      moodCounts[value.mood]++
    }
  })

  // Find dominant mood
  let dominantMood: MoodType | null = null
  let maxCount = 0
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count
      dominantMood = mood as MoodType
    }
  })

  // Selected Day Details
  const isFocusedToday = focusedDayKey === todayKey

  // Dominant mood messages
  const getDominantMoodMessage = (mood: MoodType) => {
    switch (mood) {
      case "happy":
        return "You've had a vibrant, joyful month! Keep riding this positive wave."
      case "calm":
        return "Your month has been centered and peaceful. You're maintaining a great balance."
      case "neutral":
        return "A stable, steady month. Sometimes flat lines are the best foundation."
      case "stressed":
        return "You've logged high stress levels this month. Take some deep breaths and prioritize self-care."
      case "sad":
        return "It's been a heavier month for you. Remember that emotions are waves—it's okay to feel sad."
    }
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Smile className="h-5 w-5 text-chart-1" /> Emotion Space
          </h2>
          <p className="text-xs text-muted-foreground">
            Log how you feel daily and look back on your emotional landscape.
          </p>
        </div>

        {friends.length > 0 && (
          <FriendsVibeRow friends={friends} friendStores={friendStores} />
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column: Daily Mood Log */}
        <div className="space-y-6">
          <Card className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/30 pb-3">
              <Smile className="h-4 w-4 text-chart-1" /> Today&apos;s Mood
            </h3>

            {todayMood ? (
              <div className="rounded-2xl bg-secondary/30 p-4 border border-border/30 space-y-3">
                <div className="flex items-center gap-3">
                  <img src={MOOD_IMAGE_URLS[todayMood.mood]} alt={todayMood.mood} className="h-11 w-11 object-contain" />
                  <div>
                    <p className="text-sm font-bold text-foreground capitalize">
                      {MOOD_META[todayMood.mood].label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Logged today</p>
                  </div>
                </div>
                {todayMood.note && (
                  <p className="text-xs text-muted-foreground italic bg-background/50 p-2.5 rounded-xl border border-border/20 leading-relaxed">
                    &ldquo;{todayMood.note}&rdquo;
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60 text-right">
                  Changed your mind? Click a mood below to overwrite.
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                How are you feeling today? Tap an emoji to check in.
              </p>
            )}

            {/* Mood selector buttons */}
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(MOOD_META) as MoodType[]).map((mood) => {
                const meta = MOOD_META[mood]
                const isSelected = selectedMood === mood
                return (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`flex flex-col items-center justify-center p-1 sm:p-2.5 aspect-square rounded-2xl border text-center transition-all ${
                      isSelected
                        ? "bg-accent border-chart-1 scale-105 shadow-[0_0_12px_rgba(var(--chart-1),0.2)]"
                        : "bg-secondary/40 border-border/20 hover:bg-secondary/80"
                    }`}
                  >
                    <img
                      src={MOOD_IMAGE_URLS[mood]}
                      alt={meta.label}
                      className="h-6 w-6 sm:h-8 sm:w-8 object-contain mb-1 transition-transform hover:scale-110 active:scale-95 duration-100"
                    />
                    <span className="text-[8px] sm:text-[10px] font-bold text-foreground leading-none truncate w-full">
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedMood && (
              <div className="space-y-3.5 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Micro-journal Note (Optional)
                  </label>
                  <Textarea
                    placeholder="Brief details about your day... what made you feel this way?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="rounded-xl border border-border bg-background focus-visible:ring-1 focus-visible:ring-ring text-xs p-3 focus-visible:ring-offset-0"
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-1 pb-1.5">
                  <Checkbox
                    id="share-mood"
                    checked={shareWithFriends}
                    onCheckedChange={(checked) => setShareWithFriends(!!checked)}
                    className="rounded-md"
                  />
                  <label htmlFor="share-mood" className="text-xs text-foreground font-semibold cursor-pointer select-none">
                    Share journal note with friends
                  </label>
                </div>
                
                <p className="text-[10px] text-muted-foreground bg-secondary/20 p-2 rounded-lg border border-border/25 leading-relaxed">
                  🔒 Your journal notes are private by default. Checking the box above will display today's note next to your status emoji in your friends' list.
                </p>

                <Button
                  onClick={handleSubmitMood}
                  disabled={logging}
                  className="w-full rounded-xl bg-accent text-accent-foreground hover:bg-chart-1/30 font-semibold h-10 text-xs"
                >
                  {logging ? "Saving…" : todayMood ? "Overwrite Check-in" : "Log Check-in"}
                </Button>
              </div>
            )}
          </Card>

          {/* Detailed View Card */}
          <Card className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-foreground border-b border-border/30 pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Day Details
              </span>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {focusedDayKey === todayKey ? "Today" : format(new Date(focusedDayKey), "MMM d, yyyy")}
              </span>
            </h3>

            {focusedMoodLog ? (
              isEditingJournal ? (
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" /> Edit Journal Note
                    </label>
                    <Textarea
                      placeholder="Brief details about your day... what made you feel this way?"
                      value={editedNote}
                      onChange={(e) => setEditedNote(e.target.value)}
                      rows={3}
                      className="rounded-xl border border-border bg-background focus-visible:ring-1 focus-visible:ring-ring text-xs p-3 focus-visible:ring-offset-0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-1 pb-1.5">
                    <Checkbox
                      id="edit-share-mood"
                      checked={editedShare}
                      onCheckedChange={(checked) => setEditedShare(!!checked)}
                      className="rounded-md"
                    />
                    <label htmlFor="edit-share-mood" className="text-xs text-foreground font-semibold cursor-pointer select-none">
                      Share journal note with friends
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingJournal(false)}
                      disabled={logging}
                      className="rounded-xl h-9 px-4 text-xs font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={logging}
                      className="rounded-xl h-9 px-4 text-xs font-semibold bg-accent text-accent-foreground hover:bg-chart-1/30"
                    >
                      {logging ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img src={MOOD_IMAGE_URLS[focusedMoodLog.mood]} alt={focusedMoodLog.mood} className="h-9 w-9 object-contain" />
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${MOOD_META[focusedMoodLog.mood].bgBadge}`}>
                        {MOOD_META[focusedMoodLog.mood].label}
                      </span>
                      {focusedMoodLog.shareWithFriends && (
                        <span className="text-[9px] font-bold text-muted-foreground/80 bg-secondary px-2 py-0.5 rounded-full">
                          Shared with Friends
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {focusedMoodLog.note && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Journal Note</p>
                      <p className="text-xs text-foreground bg-secondary/35 p-3 rounded-xl border border-border/20 leading-relaxed font-medium">
                        {focusedMoodLog.note}
                      </p>
                    </div>
                  )}

                  {!focusedMoodLog.note && (
                    <p className="text-xs text-muted-foreground/60 italic">No journal notes written for this check-in.</p>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedNote(focusedMoodLog.note || "")
                        setEditedShare(!!focusedMoodLog.shareWithFriends)
                        setIsEditingJournal(true)
                      }}
                      className="rounded-xl h-9 px-4 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-secondary/80 border-border"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit Journal
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/70">
                  {isFocusedToday 
                    ? "You haven't logged your mood for today yet."
                    : "No mood check-in was logged for this date."
                  }
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Middle Column: Mood Calendar Grid */}
        <div className="space-y-6">
          <Card className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-border/30 pb-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Mood Calendar
              </h3>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {format(viewDate, "MMMM yyyy")}
              </span>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Day Labels */}
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-muted-foreground/60 py-1 uppercase">
                  {day}
                </div>
              ))}

              {/* Grid Days */}
              {calendarDays.map((cell) => {
                if (cell.isPlaceholder) {
                  return <div key={cell.dateKey} className="aspect-square" />
                }

                const moodLog = moods[cell.dateKey]
                const meta = moodLog ? MOOD_META[moodLog.mood] : null
                const isSelected = selectedDayKey === cell.dateKey
                const isDayToday = cell.dateKey === todayKey

                return (
                  <button
                    key={cell.dateKey}
                    onClick={() => setSelectedDayKey(cell.dateKey)}
                    className={`aspect-square rounded-xl border flex items-center justify-center relative transition-all ${
                      meta
                        ? meta.calendarColor
                        : "bg-secondary/30 border-border/20 text-muted-foreground hover:bg-secondary/60"
                    } ${
                      isSelected
                        ? "ring-2 ring-inset ring-primary shadow-xs"
                        : "hover:border-primary/40"
                    } ${
                      isDayToday && !meta
                        ? "border-chart-1 text-chart-1 font-bold shadow-[0_0_8px_rgba(var(--chart-1),0.15)]"
                        : ""
                    }`}
                  >
                    {moodLog ? (
                      <>
                        <span className="absolute top-1 left-1.5 text-[9px] opacity-60 leading-none select-none font-semibold">
                          {cell.dayNum}
                        </span>
                        <img
                          src={MOOD_IMAGE_URLS[moodLog.mood]}
                          alt={moodLog.mood}
                          className="h-7 w-7 object-contain pt-1.5 select-none leading-none pointer-events-none"
                        />
                      </>
                    ) : (
                      <span className="text-xs font-semibold">{cell.dayNum}</span>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="text-[9px] text-muted-foreground/60 text-center">
              Click on any day in the calendar grid to inspect detailed log notes.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
