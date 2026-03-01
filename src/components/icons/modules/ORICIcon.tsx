import { IconProps, cn } from "./types";
// Icon: Rocket with trajectory - represents frontier exploration
export function ORICIcon({ className, size = 32, primaryColor }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("transition-all duration-300", className)}
    >
      <defs>
        <linearGradient
          id="oric-oric-grad"
          x1="100%"
          y1="100%"
          x2="0%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#a855f7"}
          />
          <stop
            offset="100%"
            stopColor="#d8b4fe"
          />
        </linearGradient>
        <linearGradient
          id="oric-oric-flame"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor="#fbbf24"
          />
          <stop
            offset="100%"
            stopColor="#f97316"
          />
        </linearGradient>
        <filter id="oric-oric-glow">
          <feGaussianBlur
            stdDeviation="1.5"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Rocket body */}
      <path
        d="M16 4 Q20 8, 20 16 L18 20 L14 20 L12 16 Q12 8, 16 4"
        fill="url(#oric-oric-grad)"
      />
      {/* Rocket window */}
      <circle
        cx="16"
        cy="12"
        r="2.5"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <circle
        cx="16"
        cy="12"
        r="1"
        fill="#fff"
        opacity="0.5"
      />
      {/* Left fin */}
      <path
        d="M12 16 L8 22 L12 20"
        fill="url(#oric-oric-grad)"
        opacity="0.8"
      />
      {/* Right fin */}
      <path
        d="M20 16 L24 22 L20 20"
        fill="url(#oric-oric-grad)"
        opacity="0.8"
      />
      {/* Flame */}
      <path
        d="M14 20 L16 28 L18 20"
        fill="url(#oric-oric-flame)"
        filter="url(#oric-oric-glow)"
      />
      <path
        d="M15 20 L16 25 L17 20"
        fill="#fef3c7"
        opacity="0.8"
      />
      {/* Trajectory trail */}
      <path
        d="M6 28 Q10 24, 14 22"
        fill="none"
        stroke="url(#oric-oric-grad)"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.4"
      />
      {/* Stars */}
      <circle
        cx="6"
        cy="8"
        r="1"
        fill="url(#oric-oric-grad)"
        opacity="0.5"
      />
      <circle
        cx="26"
        cy="6"
        r="0.8"
        fill="url(#oric-oric-grad)"
        opacity="0.4"
      />
      <circle
        cx="28"
        cy="14"
        r="0.6"
        fill="url(#oric-oric-grad)"
        opacity="0.3"
      />
    </svg>
  );
}

// SURF - Student Undergraduate Research Fellowship (Advanced Research)
