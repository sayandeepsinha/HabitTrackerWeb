"use client"

import { useState } from "react"
import { Avatar } from "./common/avatar"
import { CopyButton } from "./common/copy-button"
import { FriendCard } from "./friend-card"
import type { Friend, FriendData, FriendRequest } from "./common/types"

interface FriendsSectionProps {
    inviteCode: string
    friends: Friend[]
    friendStores: Record<string, FriendData>
    friendRequests: FriendRequest[]
    onSendRequest: (code: string) => Promise<void>
    onAcceptRequest: (req: FriendRequest) => Promise<void>
    onDeclineRequest: (fromUid: string) => Promise<void>
    addFriendError: string | null
    addFriendLoading: boolean
    onRemoveFriend: (uid: string) => void
    today: Date
}

// ---------------------------------------------------------------------------
// Main FriendsSection
// ---------------------------------------------------------------------------
export function FriendsSection({
    inviteCode,
    friends,
    friendStores,
    friendRequests,
    onSendRequest,
    onAcceptRequest,
    onDeclineRequest,
    addFriendError,
    addFriendLoading,
    onRemoveFriend,
    today,
}: FriendsSectionProps) {
    const [inputCode, setInputCode] = useState("")
    const [showAddForm, setShowAddForm] = useState(false)

    const handleSend = async () => {
        if (!inputCode.trim()) return
        await onSendRequest(inputCode)
        if (!addFriendError) setInputCode("")
    }

    return (
        <section className="mt-8">
            {/* Section header */}
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Friends</h2>
                    <p className="text-xs text-muted-foreground">
                        Share your code or enter a friend&apos;s code to connect
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm((v) => !v)}
                    className="flex items-center gap-1.5 rounded-xl bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    Add friend
                </button>
            </div>

            {/* Invite code card + Add form */}
            {showAddForm && (
                <div className="mb-5 rounded-2xl bg-card p-5 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
                    {/* My code */}
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-3">
                        <div className="flex-1">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                Your invite code
                            </p>
                            <p className="mt-0.5 font-mono text-xl font-bold tracking-[0.2em] text-foreground">
                                {inviteCode || "Loading…"}
                            </p>
                        </div>
                        {inviteCode && <CopyButton text={inviteCode} />}
                    </div>

                    {/* Enter friend's code */}
                    <p className="mb-2 text-sm font-medium text-foreground">
                        Enter a friend&apos;s code to send a request
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="e.g. ABC1234"
                            maxLength={8}
                            className="h-9 w-36 rounded-xl border border-border bg-background px-3 font-mono text-sm uppercase tracking-wider text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={addFriendLoading || !inputCode.trim()}
                            className="h-9 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-50"
                        >
                            {addFriendLoading ? "Sending…" : "Send request"}
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setInputCode("") }}
                            className="h-9 rounded-xl bg-secondary px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-border"
                        >
                            Close
                        </button>
                    </div>
                    {addFriendError && (
                        <p className="mt-2 text-xs text-destructive-foreground">{addFriendError}</p>
                    )}
                </div>
            )}

            {/* Pending friend requests */}
            {friendRequests.length > 0 && (
                <div className="mb-5 rounded-2xl bg-card p-5 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
                    <p className="mb-3 text-sm font-semibold text-foreground">
                        Friend requests
                        <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-chart-2 px-1.5 text-[10px] font-bold text-foreground">
                            {friendRequests.length}
                        </span>
                    </p>
                    <div className="flex flex-col gap-3">
                        {friendRequests.map((req) => (
                            <div key={req.uid} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                                <Avatar src={req.photoURL} name={req.displayName} size={32} />
                                <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate text-sm font-semibold text-foreground">
                                        {req.displayName || req.email}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">{req.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onAcceptRequest(req)}
                                        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => onDeclineRequest(req.uid)}
                                        className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Friends list */}
            {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-14 text-center shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-muted-foreground" aria-hidden="true">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No friends yet</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                        Share your invite code or enter a friend&apos;s code above
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {friends.map((friend) => {
                        const data = friendStores[friend.uid]
                        if (!data) return null
                        return (
                            <FriendCard
                                key={friend.uid}
                                data={data}
                                today={today}
                                onRemove={() => onRemoveFriend(friend.uid)}
                            />
                        )
                    })}
                </div>
            )}
        </section>
    )
}
