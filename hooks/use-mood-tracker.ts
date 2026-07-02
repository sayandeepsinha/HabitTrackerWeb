"use client"

import { useState, useEffect, useCallback } from "react"
import { doc, collection, onSnapshot, setDoc } from "firebase/firestore"
import type { User } from "firebase/auth"
import { db } from "@/lib/firebase"
import type { MoodLog, MoodType } from "@/components/habit-tracker/common/types"

const moodsCol = (uid: string) => collection(db, "users", uid, "moods")
const moodDocRef = (uid: string, dateStr: string) => doc(db, "users", uid, "moods", dateStr)

export function useMoodTracker(user: User | null) {
  const [moods, setMoods] = useState<Record<string, MoodLog>>({})
  const [loading, setLoading] = useState(true)

  // Sync moods from Firestore
  useEffect(() => {
    if (!user) {
      setMoods({})
      setLoading(false)
      return
    }

    setLoading(true)
    const unsub = onSnapshot(
      moodsCol(user.uid),
      (snap) => {
        const loadedMoods: Record<string, MoodLog> = {}
        snap.forEach((d) => {
          loadedMoods[d.id] = d.data() as MoodLog
        })
        setMoods(loadedMoods)
        setLoading(false)
      },
      (err) => {
        console.error("Error loading moods from Firestore:", err)
        setLoading(false)
      }
    )

    return unsub
  }, [user])

  // Log or update a mood
  const logMood = useCallback(
    async (dateStr: string, mood: MoodType, note?: string, shareWithFriends?: boolean) => {
      if (!user) return
      
      const payload: MoodLog = {
        mood,
        note: note || "",
        shareWithFriends: !!shareWithFriends,
        updatedAt: Date.now(),
      }

      // Optimistic UI update
      setMoods((prev) => ({
        ...prev,
        [dateStr]: payload,
      }))

      try {
        await setDoc(moodDocRef(user.uid, dateStr), payload)
        
        // Sync emoji and optional shared note to public profile ONLY if it is logged for today
        const todayKey = new Date().getFullYear() + "-" + 
          String(new Date().getMonth() + 1).padStart(2, "0") + "-" + 
          String(new Date().getDate()).padStart(2, "0")

        if (dateStr === todayKey) {
          const emojis: Record<MoodType, string> = {
            happy: "😊",
            calm: "😌",
            neutral: "😐",
            stressed: "😫",
            sad: "😢"
          }
          await setDoc(doc(db, "users", user.uid), {
            profile: { 
              todayMoodEmoji: emojis[mood],
              todayMoodNote: shareWithFriends ? (note || "") : ""
            }
          }, { merge: true })
        }
      } catch (err) {
        console.error("Failed to write mood to Firestore:", err)
      }
    },
    [user]
  )

  return {
    moods,
    loading,
    logMood,
  }
}
