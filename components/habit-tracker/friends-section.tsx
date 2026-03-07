"use client"

import { useState } from "react"
import { Avatar } from "./common/avatar"
import { CopyButton } from "./common/copy-button"
import { FriendCard } from "./friend-card"
import { PlusIcon, PeopleIcon } from "./common/icons"
import { ResponsiveDialog } from "./common/responsive-dialog"
import { useToast } from "@/hooks/use-toast"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
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

export function FriendsSection({
    inviteCode, friends, friendStores, friendRequests, onSendRequest,
    onAcceptRequest, onDeclineRequest, addFriendError, addFriendLoading,
    onRemoveFriend, today,
}: FriendsSectionProps) {
    const { toast } = useToast()
    const [inputCode, setInputCode] = useState("")
    const [showAddForm, setShowAddForm] = useState(false)

    const handleSend = async () => {
        if (!inputCode.trim()) return
        await onSendRequest(inputCode)
        if (!addFriendError) {
            toast({ title: "Request sent!", description: `Friend request sent to ${inputCode}` })
            setInputCode("")
            setShowAddForm(false)
        }
    }

    return (
        <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Friends</h2>
                    <p className="text-xs text-muted-foreground">Share your code or enter a friend&apos;s code to connect</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-1.5 rounded-xl bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-colors hover:bg-secondary"
                >
                    <PlusIcon />
                    Add friend
                </button>
            </div>

            <ResponsiveDialog
                open={showAddForm}
                onOpenChange={setShowAddForm}
                title="Add Friend"
                description="Share your code or enter a friend's code to connect."
            >
                <div className="space-y-4">
                    <div className="rounded-xl bg-secondary/60 px-4 py-3">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Your invite code</p>
                        <div className="flex items-center justify-between mt-0.5">
                            <p className="font-mono text-xl font-bold tracking-[0.2em] text-foreground">{inviteCode || "Loading…"}</p>
                            {inviteCode && <CopyButton text={inviteCode} />}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Enter a friend&apos;s code</p>
                        <div className="flex items-center gap-2">
                            <input
                                type="text" value={inputCode}
                                onChange={e => setInputCode(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === "Enter" && handleSend()}
                                placeholder="e.g. ABC1234" maxLength={8}
                                className="h-10 flex-1 rounded-xl border border-border bg-background px-3 font-mono text-sm uppercase tracking-wider text-foreground placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:border-ring focus:outline-none"
                            />
                            <button onClick={handleSend} disabled={addFriendLoading || !inputCode.trim()}
                                className="h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30 disabled:opacity-50">
                                {addFriendLoading ? "Sending…" : "Send"}
                            </button>
                        </div>
                        {addFriendError && <p className="text-xs text-destructive-foreground">{addFriendError}</p>}
                    </div>
                </div>
            </ResponsiveDialog>

            {friendRequests.length > 0 && (
                <Accordion type="single" collapsible className="mb-6 w-full">
                    <AccordionItem value="requests" className="border-none">
                        <AccordionTrigger className="flex h-12 w-full items-center justify-between rounded-2xl bg-card px-5 shadow-[0_1px_12px_rgba(0,0,0,0.04)] hover:no-underline">
                            <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                Friend requests
                                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-chart-2 px-1.5 text-[10px] font-bold text-foreground">{friendRequests.length}</span>
                            </span>
                        </AccordionTrigger>
                        <AccordionContent className="mt-2 space-y-3">
                            {friendRequests.map(req => (
                                <div key={req.uid} className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3">
                                    <Avatar src={req.photoURL} name={req.displayName} size={32} />
                                    <div className="flex min-w-0 flex-1 flex-col">
                                        <span className="truncate text-sm font-semibold text-foreground">{req.displayName || req.email}</span>
                                        <span className="truncate text-xs text-muted-foreground">{req.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => { onAcceptRequest(req); toast({ title: "Friend request accepted" }) }} className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-chart-1/30">Accept</button>
                                        <button onClick={() => { onDeclineRequest(req.uid); toast({ title: "Request declined" }) }} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-border">Decline</button>
                                    </div>
                                </div>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}

            {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl bg-card py-14 text-center shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
                        <PeopleIcon className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No friends yet</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">Share your invite code or enter a friend&apos;s code above</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {friends.map(friend => {
                        const data = friendStores[friend.uid]
                        if (!data) return null
                        return (
                            <div key={friend.uid} className="relative">
                                <FriendCard data={data} today={today} onRemove={() => {
                                    onRemoveFriend(friend.uid)
                                    toast({ title: "Friend removed" })
                                }} />
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
