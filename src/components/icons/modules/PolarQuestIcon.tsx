import { IconProps, cn } from "./types";
// 5. PolarQuest - 偏振探秘 (Hexagonal puzzle with light)
export function PolarQuestIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("transition-all duration-300", className)}
    >
      <defs>
        <linearGradient
          id="polar-quest-quest-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#DAA520"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#D97706"}
          />
        </linearGradient>
        <filter id="polar-quest-quest-glow">
          <feGaussianBlur
            stdDeviation="2"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Main hexagon */}
      <path
        d="M24 4 L40 14 L40 34 L24 44 L8 34 L8 14 Z"
        fill="none"
        stroke="url(#polar-quest-quest-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner hexagon pattern */}
      <path
        d="M24 12 L32 17 L32 27 L24 32 L16 27 L16 17 Z"
        fill="url(#polar-quest-quest-grad)"
        opacity="0.2"
      />
      {/* Light beam through puzzle */}
      <path
        d="M4 24 L44 24"
        stroke="url(#polar-quest-quest-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
        filter="url(#polar-quest-quest-glow)"
      />
      {/* Center light effect */}
      <circle
        cx="24"
        cy="24"
        r="5"
        fill="url(#polar-quest-quest-grad)"
        opacity="0.8"
        filter="url(#polar-quest-quest-glow)"
      />
      {/* Connecting nodes */}
      <circle
        cx="24"
        cy="12"
        r="2"
        fill="url(#polar-quest-quest-grad)"
        opacity="0.6"
      />
      <circle
        cx="32"
        cy="17"
        r="2"
        fill="url(#polar-quest-quest-grad)"
        opacity="0.6"
      />
      <circle
        cx="16"
        cy="17"
        r="2"
        fill="url(#polar-quest-quest-grad)"
        opacity="0.6"
      />
    </svg>
  );
}

// 6. Gallery/Studio - 偏振造物局 (Creative sparkle with polarization art)
