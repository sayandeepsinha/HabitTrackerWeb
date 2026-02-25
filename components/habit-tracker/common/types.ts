import type { User } from "firebase/auth"

export type { User as FirebaseUser }

export type CellState = "blank" | "yes" | "no"

export interface MonthData {
  habits: string[]
  grid: Record<string, CellState[]>
}

export type HabitStore = Record<string, MonthData>

/** Habits the owner has marked as hidden from friends (true = hidden) */
export type HiddenHabits = Record<string, boolean>

/** A friend entry stored in Firestore */
export interface Friend {
  uid: string
  displayName: string
  email: string
  photoURL: string
}

/** A friend's public data loaded from Firestore */
export interface FriendData {
  friend: Friend
  store: HabitStore
  hiddenHabits: HiddenHabits
}

/** An incoming friend request stored in Firestore */
export interface FriendRequest {
  uid: string
  displayName: string
  email: string
  photoURL: string
  sentAt: number
}
