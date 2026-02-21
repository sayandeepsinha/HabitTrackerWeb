export function Avatar({ src, name, size = 32 }: { src?: string | null; name?: string | null; size?: number }) {
    if (src) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img
                src={src}
                alt={name ?? "User"}
                width={size}
                height={size}
                className="rounded-full object-cover"
                referrerPolicy="no-referrer"
            />
        )
    }
    const initials = (name ?? "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    return (
        <div
            style={{ width: size, height: size }}
            className="flex flex-shrink-0 items-center justify-center rounded-full bg-chart-3 text-[11px] font-bold text-foreground"
        >
            {initials}
        </div>
    )
}
