"use client"

import { useState, useEffect, useCallback } from "react"
import {
    onAuthStateChanged,
    signOut as firebaseSignOut,
    updateProfile,
    type User,
} from "firebase/auth"
import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, writeBatch } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

const userRef = (uid: string) => doc(db, "users", uid)
const codeRef = (code: string) => doc(db, "inviteCodes", code)
const friendsCol = (uid: string) => collection(db, "users", uid, "friends")
const friendRef = (uid: string, fUid: string) => doc(db, "users", uid, "friends", fUid)
const requestsCol = (uid: string) => collection(db, "users", uid, "friendRequests")

export function useFirebaseAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [authLoading, setAuthLoading] = useState(true)

    // Listen for auth state changes
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u)
            setAuthLoading(false)
        })
        return unsub
    }, [])

    const updateDisplayName = useCallback(
        async (newName: string) => {
            if (!user) return
            const trimmed = newName.trim()
            if (!trimmed) return
            await updateProfile(user, { displayName: trimmed })
            
            // Sync to Firestore profile
            await setDoc(
                userRef(user.uid),
                { profile: { displayName: trimmed } },
                { merge: true }
            )
            // Force local re-render
            setUser({ ...user, displayName: trimmed } as User)
        },
        [user]
    )

    const deleteAccount = useCallback(async () => {
        if (!user) return

        try {
            const batch = writeBatch(db)

            // 1 & 2. Remove self from friends' lists and delete own friends subcollection
            const friendSnap = await getDocs(friendsCol(user.uid))
            for (const d of friendSnap.docs) {
                batch.delete(friendRef(d.id, user.uid)) // Remove from their list
                batch.delete(d.ref)                     // Remove from my list
            }

            // 3. Delete own friend requests subcollection
            const reqSnap = await getDocs(requestsCol(user.uid))
            for (const d of reqSnap.docs) {
                batch.delete(d.ref)
            }

            // 4. Delete invite code doc if it exists
            const userSnap = await getDoc(userRef(user.uid))
            const inviteCode = userSnap.data()?.profile?.inviteCode
            if (inviteCode) {
                batch.delete(codeRef(inviteCode))
            }

            // 5. Delete actual user doc
            batch.delete(userRef(user.uid))

            await batch.commit()

            // 6. Clear local offline storage
            localStorage.clear()

            // 7. Delete underlying Firebase Auth account
            await user.delete()
        } catch (err) {
            console.error("Failed to delete account:", err)
            // If re-auth is needed, fallback to sign out
            await firebaseSignOut(auth).catch(console.error)
            throw err
        }
    }, [user])

    const signOut = useCallback(async () => {
        localStorage.removeItem("habit-tracker-data")
        localStorage.removeItem("habit-tracker-hidden")
        await firebaseSignOut(auth).catch(console.error)
    }, [])

    return {
        user,
        authLoading,
        updateDisplayName,
        deleteAccount,
        signOut,
    }
}
