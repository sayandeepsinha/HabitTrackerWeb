import type { SVGProps } from "react"

interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number
}

export function CheckIcon({ size = 13, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden="true" {...props}>
            <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function CrossIcon({ size = 11, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
            <path d="M2.5 2.5L9.5 9.5M9.5 2.5L2.5 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    )
}

export function SmallCrossIcon({ size = 8, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    )
}

export function ChevronUpIcon({ size = 10, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
            <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function ChevronDownIcon({ size = 10, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden="true" {...props}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

export function FireIcon({ size = 10, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true" {...props}>
            <path
                d="M8 1C8 1 3 6 3 9.5C3 12.5 5.2 15 8 15C10.8 15 13 12.5 13 9.5C13 6 8 1 8 1Z"
                fill="currentColor"
                opacity="0.9"
            />
        </svg>
    )
}

export function EyeIcon({ size = 13, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        </svg>
    )
}

export function EyeOffIcon({ size = 13, ...props }: IconProps) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    )
}
