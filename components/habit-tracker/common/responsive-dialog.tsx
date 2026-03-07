"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"

interface ResponsiveDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description?: string
    trigger?: React.ReactNode
    children: React.ReactNode
    footer?: React.ReactNode
    preventAutoFocus?: boolean
}

export function ResponsiveDialog({
    open,
    onOpenChange,
    title,
    description,
    trigger,
    children,
    footer,
    preventAutoFocus
}: ResponsiveDialogProps) {
    const isMobile = useIsMobile()

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={onOpenChange}>
                {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
                <DrawerContent
                    className="max-h-[90vh]"
                    onOpenAutoFocus={preventAutoFocus ? (e) => e.preventDefault() : undefined}
                >
                    <DrawerHeader className="text-left shrink-0">
                        <DrawerTitle>{title}</DrawerTitle>
                        {description && <DrawerDescription>{description}</DrawerDescription>}
                    </DrawerHeader>
                    <div className="overflow-y-auto px-4 pb-8">
                        {children}
                    </div>
                    {footer && <div className="mt-auto px-4 pb-4 shrink-0">{footer}</div>}
                </DrawerContent>
            </Drawer>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent
                className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[480px]"
                onOpenAutoFocus={preventAutoFocus ? (e) => e.preventDefault() : undefined}
            >
                <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                    <DialogTitle>{title}</DialogTitle>
                    {description && <DialogDescription>{description}</DialogDescription>}
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {children}
                </div>
                {footer && <div className="border-t border-border/50 px-6 py-4 flex justify-end gap-2 shrink-0">{footer}</div>}
            </DialogContent>
        </Dialog>
    )
}
