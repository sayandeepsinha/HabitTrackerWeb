"use client"

import { useState } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import type { Friend, FriendData, MoodType } from "./common/types"
import { Smile } from "lucide-react"

interface FriendsVibeRowProps {
  friends: Friend[]
  friendStores: Record<string, FriendData>
}

const EMOJI_TO_MOOD: Record<string, MoodType> = {
  "😊": "happy",
  "😌": "calm",
  "😐": "neutral",
  "😫": "stressed",
  "😢": "sad"
}

const MOOD_IMAGE_URLS: Record<MoodType, string> = {
  happy: "/emojis/happy.png",
  calm: "/emojis/calm.png",
  neutral: "/emojis/neutral.png",
  stressed: "/emojis/stressed.png",
  sad: "/emojis/sad.png"
}

export function FriendsVibeRow({ friends, friendStores }: FriendsVibeRowProps) {
  if (friends.length === 0) return null

  // Sort friends: those who logged mood today first
  const sortedFriends = [...friends].sort((a, b) => {
    const aMood = friendStores[a.uid]?.todayMoodEmoji ? 1 : 0
    const bMood = friendStores[b.uid]?.todayMoodEmoji ? 1 : 0
    return bMood - aMood
  })

  return (
    <div className="rounded-3xl border border-border/40 bg-card p-4 sm:p-5 shadow-xs space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-1">
        <Smile className="h-3.5 w-3.5 text-chart-1" /> Friend Vibes Today
      </h3>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-2 px-1">
          {sortedFriends.map((friend) => {
            const data = friendStores[friend.uid]
            const hasMood = !!data?.todayMoodEmoji
            const emoji = data?.todayMoodEmoji || ""
            const note = data?.todayMoodNote || ""
            const nameParts = friend.displayName.split(" ")
            const firstName = nameParts[0] || "Friend"
            const initials = friend.displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "FR"
            const moodType = EMOJI_TO_MOOD[emoji]
            const moodImg = moodType ? MOOD_IMAGE_URLS[moodType] : ""

            return (
              <Popover key={friend.uid}>
                <PopoverTrigger asChild>
                  <button className="flex flex-col items-center gap-1.5 focus:outline-none group cursor-pointer">
                    <div className="relative">
                      {/* Avatar with dynamic ring */}
                      <div className={`rounded-full p-[2px] transition-transform group-hover:scale-105 active:scale-95 ${
                        hasMood 
                          ? "bg-gradient-to-tr from-chart-1 via-accent to-pink-500 shadow-[0_0_12px_rgba(var(--chart-1),0.15)]" 
                          : "bg-border/60"
                      }`}>
                        <div className="rounded-full p-[2px] bg-card">
                          <Avatar className={`h-11 w-11 transition-opacity ${hasMood ? "opacity-100" : "opacity-60"}`}>
                            <AvatarImage src={friend.photoURL} alt={friend.displayName} />
                            <AvatarFallback className="text-[11px] font-bold bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      {/* Emoji Badge floating bottom-right */}
                      {hasMood && moodImg && (
                        <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border/50 p-[2px] shadow-sm select-none animate-in zoom-in-50 duration-200">
                          <img src={moodImg} alt={emoji} className="h-full w-full object-contain" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors max-w-[64px] truncate">
                      {firstName}
                    </span>
                  </button>
                </PopoverTrigger>

                <PopoverContent className="w-64 rounded-2xl p-4 border border-border/40 bg-card shadow-lg animate-in fade-in slide-in-from-top-1 duration-150" align="start">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9 border border-border/30">
                        <AvatarImage src={friend.photoURL} alt={friend.displayName} />
                        <AvatarFallback className="text-[10px] font-bold bg-secondary text-secondary-foreground">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate">{friend.displayName}</h4>
                        <p className="text-[9px] text-muted-foreground truncate">{friend.email}</p>
                      </div>
                    </div>

                    {/* Vibe Status */}
                    {hasMood && moodImg ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 bg-secondary/30 rounded-xl px-3 py-2 border border-border/20">
                          <img src={moodImg} alt={emoji} className="h-9 w-9 object-contain" />
                          <span className="text-[11px] font-bold text-foreground capitalize">
                            Feeling {moodType} today
                          </span>
                        </div>
                        {note ? (
                          <div className="space-y-1">
                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Shared Note</p>
                            <p className="text-xs text-foreground bg-accent/10 border border-accent/20 p-2.5 rounded-xl leading-relaxed italic font-medium">
                              &ldquo;{note}&rdquo;
                            </p>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground/60 italic">No notes shared today.</p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-secondary/15 border border-dashed border-border/40 rounded-xl space-y-1">
                        <span className="text-xl select-none opacity-40">🤫</span>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          No check-in yet today.
                        </p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
