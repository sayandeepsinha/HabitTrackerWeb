"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { doc, getDoc, setDoc, onSnapshot, collection, deleteDoc, writeBatch } from "firebase/firestore"
import type { User } from "firebase/auth"
import { db } from "@/lib/firebase"
import type { HabitStore, HiddenHabits, Friend, FriendData, FriendRequest } from "@/components/habit-tracker/common/types"

const codeRef = (code: string) => doc(db, "inviteCodes", code)
const userRef = (uid: string) => doc(db, "users", uid)
const friendsCol = (uid: string) => collection(db, "users", uid, "friends")
const friendRef = (uid: string, fUid: string) => doc(db, "users", uid, "friends", fUid)
const requestsCol = (uid: string) => collection(db, "users", uid, "friendRequests")
const requestRef = (uid: string, fromUid: string) => doc(db, "users", uid, "friendRequests", fromUid)

export function useFirebaseSocial(user: User | null, inviteCode: string) {
    const [friends, setFriends] = useState<Friend[]>([])
    const [friendStores, setFriendStores] = useState<Record<string, FriendData>>({})
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [addFriendError, setAddFriendError] = useState<string | null>(null)
    const [addFriendLoading, setAddFriendLoading] = useState(false)

    const friendUnsubs = useRef<Record<string, () => void>>({})

    // Reset local state if user logs out
    useEffect(() => {
        if (!user) {
            setFriends([])
            setFriendStores({})
            setFriendRequests([])
        }
    }, [user])

    // 1. Friends list listener
    useEffect(() => {
        if (!user) return
        const unsub = onSnapshot(friendsCol(user.uid), 
            (snap) => setFriends(snap.docs.map(d => d.data() as Friend)),
            (err) => console.error("friends listener:", err)
        )
        return unsub
    }, [user])

    // 2. Friend requests listener
    useEffect(() => {
        if (!user) return
        const unsub = onSnapshot(requestsCol(user.uid), 
            (snap) => setFriendRequests(snap.docs.map(d => d.data() as FriendRequest)),
            (err) => console.error("requests listener:", err)
        )
        return unsub
    }, [user])

    // 3. Live sync for each accepted friend's data
    useEffect(() => {
        const currentUids = new Set(friends.map(f => f.uid))

        // Unsubscribe from removed friends
        for (const uid of Object.keys(friendUnsubs.current)) {
            if (!currentUids.has(uid)) {
                friendUnsubs.current[uid]()
                delete friendUnsubs.current[uid]
                setFriendStores(prev => {
                    const next = { ...prev }
                    delete next[uid]
                    return next
                })
            }
        }

        // Subscribe to new friends
        for (const friend of friends) {
            if (friendUnsubs.current[friend.uid]) continue
            const unsub = onSnapshot(userRef(friend.uid), 
                (snap) => {
                    if (!snap.exists()) return
                    const data = snap.data()
                    setFriendStores(prev => ({
                        ...prev,
                        [friend.uid]: {
                            friend,
                            store: (data.habits as HabitStore) ?? {},
                            hiddenHabits: (data.hiddenHabits as HiddenHabits) ?? {},
                        }
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
    }, [friends])

    // Actions
    const sendFriendRequest = useCallback(async (code: string) => {
        if (!user) return
        setAddFriendError(null)
        setAddFriendLoading(true)
        try {
            const trimmed = code.trim().toUpperCase()
            if (!trimmed) throw new Error("Please enter an invite code.")
            if (trimmed === inviteCode) throw new Error("That's your own invite code!")

            const codeSnap = await getDoc(codeRef(trimmed))
            if (!codeSnap.exists()) throw new Error("No user found with that code. Double-check it.")

            const targetUid = (codeSnap.data() as { uid: string }).uid
            if (friends.some((f) => f.uid === targetUid)) throw new Error("You're already friends with this person.")

            const request: FriendRequest = {
                uid: user.uid,
                displayName: user.displayName ?? "",
                email: user.email ?? "",
                photoURL: user.photoURL ?? "",
                sentAt: Date.now(),
            }
            await setDoc(requestRef(targetUid, user.uid), request)
        } catch (err: unknown) {
            setAddFriendError(err instanceof Error ? err.message : "Failed to send request.")
        } finally {
            setAddFriendLoading(false)
        }
    }, [user, inviteCode, friends])

    const acceptRequest = useCallback(async (req: FriendRequest) => {
        if (!user) return
        const myEntry: Friend = { uid: user.uid, displayName: user.displayName ?? "", email: user.email ?? "", photoURL: user.photoURL ?? "" }
        const theirEntry: Friend = { uid: req.uid, displayName: req.displayName, email: req.email, photoURL: req.photoURL }
        
        const batch = writeBatch(db)
        batch.set(friendRef(user.uid, req.uid), theirEntry)
        batch.set(friendRef(req.uid, user.uid), myEntry)
        batch.delete(requestRef(user.uid, req.uid))
        await batch.commit().catch(console.error)
    }, [user])

    const declineRequest = useCallback(async (fromUid: string) => {
        if (!user) return
        await deleteDoc(requestRef(user.uid, fromUid)).catch(console.error)
    }, [user])

    const removeFriend = useCallback(async (friendUid: string) => {
        if (!user) return
        const batch = writeBatch(db)
        batch.delete(friendRef(user.uid, friendUid))
        batch.delete(friendRef(friendUid, user.uid))
        await batch.commit().catch(console.error)
    }, [user])

    return {
        friends,
        friendStores,
        friendRequests,
        sendFriendRequest,
        acceptRequest,
        declineRequest,
        addFriendError,
        addFriendLoading,
        removeFriend
    }
}
