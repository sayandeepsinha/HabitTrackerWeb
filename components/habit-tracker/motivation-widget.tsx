"use client"

export function MotivationWidget() {
  return (
    <div className="flex h-full flex-col items-center justify-between rounded-3xl bg-card p-6 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
      <p className="text-center text-sm font-medium leading-relaxed tracking-wide text-muted-foreground">
        Grow through what you go through
      </p>

      <div className="flex flex-1 items-center justify-center py-4">
        <svg
          viewBox="0 0 200 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-44 w-44"
          aria-hidden="true"
        >
          {/* Pot */}
          <path
            d="M70 180 L130 180 L125 210 L75 210 Z"
            fill="#F6D6AD"
            stroke="#C4A882"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M65 175 L135 175 L132 185 L68 185 Z"
            fill="#F6D6AD"
            stroke="#C4A882"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Stem */}
          <path
            d="M100 175 C100 140, 100 120, 100 90"
            stroke="#A7C7A2"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Left branch */}
          <path
            d="M100 140 C85 135, 65 130, 55 115"
            stroke="#A7C7A2"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Right branch */}
          <path
            d="M100 120 C115 115, 135 110, 145 95"
            stroke="#A7C7A2"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Leaves */}
          <ellipse cx="100" cy="75" rx="18" ry="24" fill="#D1FAE5" stroke="#A7C7A2" strokeWidth="1.5" />
          <path d="M100 55 L100 95" stroke="#A7C7A2" strokeWidth="1" />

          <ellipse cx="50" cy="105" rx="16" ry="20" fill="#D1FAE5" stroke="#A7C7A2" strokeWidth="1.5" transform="rotate(-20 50 105)" />
          <path d="M50 90 L50 120" stroke="#A7C7A2" strokeWidth="1" transform="rotate(-20 50 105)" />

          <ellipse cx="150" cy="82" rx="16" ry="20" fill="#D1FAE5" stroke="#A7C7A2" strokeWidth="1.5" transform="rotate(20 150 82)" />
          <path d="M150 67 L150 97" stroke="#A7C7A2" strokeWidth="1" transform="rotate(20 150 82)" />

          {/* Small leaves */}
          <ellipse cx="75" cy="130" rx="10" ry="14" fill="#E8F5E9" stroke="#A7C7A2" strokeWidth="1" transform="rotate(-30 75 130)" />
          <ellipse cx="125" cy="108" rx="10" ry="14" fill="#E8F5E9" stroke="#A7C7A2" strokeWidth="1" transform="rotate(25 125 108)" />

          {/* Person silhouette - simplified cute style */}
          <circle cx="100" cy="30" r="12" fill="none" stroke="#6B7280" strokeWidth="1.5" />
          {/* Eyes */}
          <circle cx="96" cy="28" r="1.5" fill="#6B7280" />
          <circle cx="104" cy="28" r="1.5" fill="#6B7280" />
          {/* Smile */}
          <path d="M96 33 Q100 37 104 33" stroke="#6B7280" strokeWidth="1.2" fill="none" strokeLinecap="round" />

          {/* Arms holding pot */}
          <path
            d="M60 180 C45 170, 40 155, 50 145"
            stroke="#6B7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M140 180 C155 170, 160 155, 150 145"
            stroke="#6B7280"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Sparkles */}
          <circle cx="35" cy="75" r="2" fill="#F6D6AD" opacity="0.7" />
          <circle cx="165" cy="65" r="2.5" fill="#F9A8B8" opacity="0.6" />
          <circle cx="170" cy="135" r="2" fill="#A8D0E6" opacity="0.7" />
          <circle cx="30" cy="140" r="1.5" fill="#F6D6AD" opacity="0.6" />
        </svg>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-chart-1" />
        <p className="text-xs text-muted-foreground">Keep going</p>
      </div>
    </div>
  )
}
