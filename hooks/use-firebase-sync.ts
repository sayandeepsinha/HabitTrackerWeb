"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { doc, onSnapshot, setDoc } from "firebase/firestore"
import type { User } from "firebase/auth"
import { db } from "@/lib/firebase"
import type { HabitStore, HiddenHabits } from "@/components/habit-tracker/common/types"
import { loadStore } from "./use-habit-store"
import { loadFromStorage, saveToStorage } from "@/components/habit-tracker/common/storage"

const HIDDEN_KEY = "habit-tracker-hidden"
function loadLocalHidden(): HiddenHabits {
    return loadFromStorage(HIDDEN_KEY, {})
}

function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

const userRef = (uid: string) => doc(db, "users", uid)
const codeRef = (code: string) => doc(db, "inviteCodes", code)

export function useFirebaseSync(
    user: User | null,
    setStoreFromFirestore?: (store: HabitStore) => void
) {
    const [hiddenHabits, setHiddenHabits] = useState<HiddenHabits>({})
    const [inviteCode, setInviteCode] = useState("")
    const [firestoreReady, setFirestoreReady] = useState(false)
    const firestoreConnected = useRef(false)
    const storeCallbackRef = useRef(setStoreFromFirestore)
    storeCallbackRef.current = setStoreFromFirestore

    // 1. Initial hydration for hidden habits
    useEffect(() => {
        setHiddenHabits(loadLocalHidden())
    }, [])

    // Clean up when user logs out
    useEffect(() => {
        if (!user) {
            firestoreConnected.current = false
            setFirestoreReady(false)
            setHiddenHabits(loadLocalHidden())
            setInviteCode("")
        }
    }, [user])

    // 2. Primary synchronization layer
    useEffect(() => {
        if (!user) return

        const ref = userRef(user.uid)
        const unsub = onSnapshot(ref, (snap) => {
            if (!snap.exists() && snap.metadata.fromCache) return

            if (snap.exists()) {
                const data = snap.data()

                if (data.habits && Object.keys(data.habits as object).length > 0) {
                    storeCallbackRef.current?.(data.habits as HabitStore)
                }

                if (data.hiddenHabits) {
                    setHiddenHabits(data.hiddenHabits as HiddenHabits)
                }

                if (data.profile?.inviteCode) {
                    setInviteCode(data.profile.inviteCode as string)
                } else if (!firestoreConnected.current) {
                    // Backwards compatibility for missing invite code
                    const code = generateCode()
                    setInviteCode(code)
                    setDoc(ref, { profile: { ...((data.profile as object) ?? {}), inviteCode: code } }, { merge: true })
                        .then(() => setDoc(codeRef(code), { uid: user.uid }))
                        .catch(console.error)
                }

                firestoreConnected.current = true
                setFirestoreReady(true)
            } else {
                // Initialize brand new user
                const code = generateCode()
                setInviteCode(code)

                const localStore = loadStore()
                const profile = {
                    displayName: user.displayName ?? "",
                    email: user.email ?? "",
                    photoURL: user.photoURL ?? "",
                    inviteCode: code,
                }

                const currentMonthKey = new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0")
                const storeToSeed = localStore[currentMonthKey] ? { [currentMonthKey]: localStore[currentMonthKey] } : {}

                setDoc(ref, { habits: storeToSeed, hiddenHabits: {}, profile })
                    .then(() => setDoc(codeRef(code), { uid: user.uid }))
                    .catch(e => console.error("[Firebase] ❌ user doc create FAILED:", e))

                firestoreConnected.current = true
                setFirestoreReady(true)
            }
        }, (err) => console.error("Firestore user doc error:", err))

        return unsub
    }, [user])

    // 3. Write actions
    const syncStoreToFirestore = useCallback((newStore: HabitStore, changedMonthKey?: string) => {
        if (!user) return
        const today = new Date()
        const fallbackMonthKey = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0")
        const targetMonthKey = changedMonthKey || fallbackMonthKey
        const targetMonthData = newStore[targetMonthKey]
        
        if (targetMonthData) {
            setDoc(userRef(user.uid), { habits: { [targetMonthKey]: targetMonthData } }, { merge: true })
                .catch((e) => console.error("[Firebase] ❌ Store write FAILED:", e))
        }
    }, [user])

    const forceSyncStore = useCallback(async (newStore: HabitStore) => {
        if (!user) throw new Error("Not logged in")
        await setDoc(userRef(user.uid), { habits: newStore }, { merge: true })
    }, [user])

    const toggleHidden = useCallback((habit: string) => {
        setHiddenHabits((prev) => {
            const next = { ...prev, [habit]: !prev[habit] }
            saveToStorage(HIDDEN_KEY, next)
            if (user) {
                setDoc(userRef(user.uid), { hiddenHabits: next }, { merge: true }).catch(console.error)
            }
            return next
        })
    }, [user])

    return {
        firestoreReady,
        inviteCode,
        hiddenHabits,
        toggleHidden,
        syncStoreToFirestore,
        forceSyncStore
    }
}
