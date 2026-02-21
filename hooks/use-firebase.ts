"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    type User,
} from "firebase/auth"
import {
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    collection,
    deleteDoc,
    writeBatch,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import type {
    HabitStore,
    HiddenHabits,
    Friend,
    FriendData,
} from "@/components/habit-tracker/types"

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const HIDDEN_KEY = "habit-tracker-hidden"

function loadLocalHidden(): HiddenHabits {
    if (typeof window === "undefined") return {}
    try {
        const raw = localStorage.getItem(HIDDEN_KEY)
        return raw ? (JSON.parse(raw) as HiddenHabits) : {}
    } catch {
        return {}
    }
}

function generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return Array.from({ length: 7 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join("")
}

// --------------------------------------------------------------------------
// Firestore refs
// --------------------------------------------------------------------------

const userRef = (uid: string) => doc(db, "users", uid)
const codeRef = (code: string) => doc(db, "inviteCodes", code)
const friendsCol = (uid: string) => collection(db, "users", uid, "friends")
const friendRef = (uid: string, fUid: string) =>
    doc(db, "users", uid, "friends", fUid)
const requestsCol = (uid: string) =>
    collection(db, "users", uid, "friendRequests")
const requestRef = (uid: string, fromUid: string) =>
    doc(db, "users", uid, "friendRequests", fromUid)

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface FriendRequest {
    uid: string
    displayName: string
    email: string
    photoURL: string
    sentAt: number
}

// --------------------------------------------------------------------------
// Hook
// --------------------------------------------------------------------------

export function useFirebase(
    /**
     * Called when we receive habit data from Firestore so it goes directly
     * into the habit store's React state (not just localStorage).
     */
    setStoreFromFirestore?: (store: HabitStore) => void
) {
    const [user, setUser] = useState<User | null>(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [inviteCode, setInviteCode] = useState("")

    const [hiddenHabits, setHiddenHabits] = useState<HiddenHabits>({})
    const [friends, setFriends] = useState<Friend[]>([])
    const [friendStores, setFriendStores] = useState<
        Record<string, FriendData>
    >({})
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [addFriendError, setAddFriendError] = useState<string | null>(null)
    const [addFriendLoading, setAddFriendLoading] = useState(false)

    // Keep the callback ref fresh without triggering effect re-runs
    const storeCallbackRef = useRef(setStoreFromFirestore)
    storeCallbackRef.current = setStoreFromFirestore

    const firestoreConnected = useRef(false)
    const [firestoreReady, setFirestoreReady] = useState(false)
    const friendUnsubs = useRef<Record<string, () => void>>({})

    // -----------------------------------------------------------------------
    // Hydrate hidden habits from localStorage on mount (client only)
    // -----------------------------------------------------------------------
    useEffect(() => {
        setHiddenHabits(loadLocalHidden())
    }, [])

    // -----------------------------------------------------------------------
    // Auth listener
    // -----------------------------------------------------------------------
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u)
            setAuthLoading(false)
            if (!u) {
                firestoreConnected.current = false
                setHiddenHabits(loadLocalHidden())
                setFriends([])
                setFriendStores({})
                setFriendRequests([])
                setInviteCode("")
            }
        })
        return unsub
    }, [])

    // -----------------------------------------------------------------------
    // Firestore sync — background, never blocks rendering
    //
    // On every snapshot:
    //   1. Push habits into the habit store's React state (via callback)
    //   2. Pull hidden habits + invite code into local state
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!user) return

        const ref = userRef(user.uid)

        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data()

                    // Push habits directly into React state
                    if (
                        data.habits &&
                        Object.keys(data.habits as object).length > 0
                    ) {
                        storeCallbackRef.current?.(data.habits as HabitStore)
                    }

                    // Pull hidden habits
                    if (data.hiddenHabits) {
                        setHiddenHabits(data.hiddenHabits as HiddenHabits)
                    }

                    // Pull invite code
                    if (data.profile?.inviteCode) {
                        setInviteCode(data.profile.inviteCode as string)
                    } else if (!firestoreConnected.current) {
                        // Generate invite code for existing user who doesn't have one
                        const code = generateCode()
                        setInviteCode(code)
                        setDoc(
                            ref,
                            {
                                profile: {
                                    ...((data.profile as object) ?? {}),
                                    inviteCode: code,
                                },
                            },
                            { merge: true }
                        )
                            .then(() => setDoc(codeRef(code), { uid: user.uid }))
                            .catch((e) => console.error("invite code write:", e))
                    }

                    firestoreConnected.current = true
                    setFirestoreReady(true)
                } else {
                    // Brand-new user — create Firestore doc from current localStorage
                    const code = generateCode()
                    setInviteCode(code)

                    // Read current localStorage to seed the Firestore doc
                    let localStore: HabitStore = {}
                    try {
                        const raw = localStorage.getItem("habit-tracker-data")
                        if (raw) localStore = JSON.parse(raw) as HabitStore
                    } catch {
                        /* empty */
                    }

                    const profile = {
                        displayName: user.displayName ?? "",
                        email: user.email ?? "",
                        photoURL: user.photoURL ?? "",
                        inviteCode: code,
                    }

                    setDoc(ref, {
                        habits: localStore,
                        hiddenHabits: {},
                        profile,
                    })
                        .then(() => {
                            return setDoc(codeRef(code), { uid: user.uid })
                        })
                        .catch((e) => console.error("[Firebase] ❌ user doc create FAILED:", e))

                    firestoreConnected.current = true
                    setFirestoreReady(true)
                }
            },
            (err) => {
                console.error("Firestore user doc error:", err)
                // App still works from localStorage — no blocking
            }
        )

        return unsub
    }, [user])

    // -----------------------------------------------------------------------
    // Write habit changes to Firestore (called by useHabitStore on change)
    // NOTE: localStorage persistence is handled by useHabitStore itself,
    //       so we only write to Firestore here — no double-save.
    // -----------------------------------------------------------------------
    const syncStoreToFirestore = useCallback(
        (newStore: HabitStore) => {
            if (user) {
                setDoc(userRef(user.uid), { habits: newStore }, { merge: true })
                    .catch((e) => console.error("[Firebase] ❌ Store write FAILED:", e))
            }
        },
        [user]
    )

    // -----------------------------------------------------------------------
    // Toggle hidden habit
    // -----------------------------------------------------------------------
    const toggleHidden = useCallback(
        (habit: string) => {
            setHiddenHabits((prev) => {
                const next = { ...prev, [habit]: !prev[habit] }
                // Save locally
                try {
                    localStorage.setItem(HIDDEN_KEY, JSON.stringify(next))
                } catch {
                    /* empty */
                }
                // Sync to Firestore
                if (user) {
                    setDoc(
                        userRef(user.uid),
                        { hiddenHabits: next },
                        { merge: true }
                    ).catch((e) => console.error("hidden write:", e))
                }
                return next
            })
        },
        [user]
    )

    // -----------------------------------------------------------------------
    // Friends listener
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!user) return
        const unsub = onSnapshot(
            friendsCol(user.uid),
            (snap) => setFriends(snap.docs.map((d) => d.data() as Friend)),
            (err) => console.error("friends listener:", err)
        )
        return unsub
    }, [user])

    // -----------------------------------------------------------------------
    // Friend requests listener
    // -----------------------------------------------------------------------
    useEffect(() => {
        if (!user) return
        const unsub = onSnapshot(
            requestsCol(user.uid),
            (snap) =>
                setFriendRequests(
                    snap.docs.map((d) => d.data() as FriendRequest)
                ),
            (err) => console.error("requests listener:", err)
        )
        return unsub
    }, [user])

    // -----------------------------------------------------------------------
    // Subscribe to each accepted friend's data
    // -----------------------------------------------------------------------
    useEffect(() => {
        const currentUids = new Set(friends.map((f) => f.uid))

        for (const uid of Object.keys(friendUnsubs.current)) {
            if (!currentUids.has(uid)) {
                friendUnsubs.current[uid]()
                delete friendUnsubs.current[uid]
                setFriendStores((prev) => {
                    const next = { ...prev }
                    delete next[uid]
                    return next
                })
            }
        }

        for (const friend of friends) {
            if (friendUnsubs.current[friend.uid]) continue
            const unsub = onSnapshot(
                userRef(friend.uid),
                (snap) => {
                    if (!snap.exists()) return
                    const data = snap.data()
                    setFriendStores((prev) => ({
                        ...prev,
                        [friend.uid]: {
                            friend,
                            store: (data.habits as HabitStore) ?? {},
                            hiddenHabits: (data.hiddenHabits as HiddenHabits) ?? {},
                        },
                    }))
                },
                (err) => console.error("friend data listener:", err)
            )
            friendUnsubs.current[friend.uid] = unsub
        }

        return () => {
            for (const unsub of Object.values(friendUnsubs.current)) unsub()
            friendUnsubs.current = {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [friends])

    // -----------------------------------------------------------------------
    // Send friend request by invite code
    // -----------------------------------------------------------------------
    const sendFriendRequest = useCallback(
        async (code: string) => {
            if (!user) return
            setAddFriendError(null)
            setAddFriendLoading(true)
            try {
                const trimmed = code.trim().toUpperCase()
                if (!trimmed) throw new Error("Please enter an invite code.")
                if (trimmed === inviteCode)
                    throw new Error("That's your own invite code!")

                const codeSnap = await getDoc(codeRef(trimmed))
                if (!codeSnap.exists())
                    throw new Error(
                        "No user found with that code. Double-check it."
                    )

                const targetUid = (codeSnap.data() as { uid: string }).uid
                if (friends.some((f) => f.uid === targetUid))
                    throw new Error("You're already friends with this person.")

                const request: FriendRequest = {
                    uid: user.uid,
                    displayName: user.displayName ?? "",
                    email: user.email ?? "",
                    photoURL: user.photoURL ?? "",
                    sentAt: Date.now(),
                }
                await setDoc(requestRef(targetUid, user.uid), request)
            } catch (err: unknown) {
                setAddFriendError(
                    err instanceof Error ? err.message : "Failed to send request."
                )
            } finally {
                setAddFriendLoading(false)
            }
        },
        [user, inviteCode, friends]
    )

    // -----------------------------------------------------------------------
    // Accept friend request
    // -----------------------------------------------------------------------
    const acceptRequest = useCallback(
        async (req: FriendRequest) => {
            if (!user) return
            const myEntry: Friend = {
                uid: user.uid,
                displayName: user.displayName ?? "",
                email: user.email ?? "",
                photoURL: user.photoURL ?? "",
            }
            const theirEntry: Friend = {
                uid: req.uid,
                displayName: req.displayName,
                email: req.email,
                photoURL: req.photoURL,
            }
            const batch = writeBatch(db)
            batch.set(friendRef(user.uid, req.uid), theirEntry)
            batch.set(friendRef(req.uid, user.uid), myEntry)
            batch.delete(requestRef(user.uid, req.uid))
            await batch.commit().catch(console.error)
        },
        [user]
    )

    // -----------------------------------------------------------------------
    // Decline / Remove
    // -----------------------------------------------------------------------
    const declineRequest = useCallback(
        async (fromUid: string) => {
            if (!user) return
            await deleteDoc(requestRef(user.uid, fromUid)).catch(console.error)
        },
        [user]
    )

    const removeFriend = useCallback(
        async (friendUid: string) => {
            if (!user) return
            const batch = writeBatch(db)
            batch.delete(friendRef(user.uid, friendUid))
            batch.delete(friendRef(friendUid, user.uid))
            await batch.commit().catch(console.error)
        },
        [user]
    )

    // -----------------------------------------------------------------------
    // Sign out
    // -----------------------------------------------------------------------
    const signOut = useCallback(async () => {
        await firebaseSignOut(auth).catch(console.error)
    }, [])

    return {
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
    }
}
