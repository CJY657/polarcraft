import { IconProps, cn } from "./types";
// Icon: Microscope with light beam - represents hands-on experimentation
export function ESRTIcon({ className, size = 32, primaryColor }: IconProps) {
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
          id="esrt-esrt-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#06b6d4"}
          />
          <stop
            offset="100%"
            stopColor="#67e8f9"
          />
        </linearGradient>
        <filter id="esrt-esrt-glow">
          <feGaussianBlur
            stdDeviation="1"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Microscope eyepiece */}
      <rect
        x="13"
        y="4"
        width="6"
        height="4"
        rx="1"
        fill="url(#esrt-esrt-grad)"
      />
      {/* Microscope tube */}
      <path
        d="M14 8 L14 14 L10 14 L10 16 L22 16 L22 14 L18 14 L18 8"
        fill="none"
        stroke="url(#esrt-esrt-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Objective lens */}
      <rect
        x="14"
        y="16"
        width="4"
        height="3"
        rx="0.5"
        fill="url(#esrt-esrt-grad)"
        opacity="0.8"
      />
      {/* Stage */}
      <rect
        x="8"
        y="22"
        width="16"
        height="2"
        rx="1"
        fill="url(#esrt-esrt-grad)"
      />
      {/* Base */}
      <path
        d="M6 28 L26 28 L24 24 L8 24 Z"
        fill="url(#esrt-esrt-grad)"
        opacity="0.6"
      />
      {/* Light beam from objective */}
      <path
        d="M16 19 L16 22"
        stroke="url(#esrt-esrt-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#esrt-esrt-glow)"
        opacity="0.9"
      />
      <circle
        cx="16"
        cy="21"
        r="2"
        fill="url(#esrt-esrt-grad)"
        opacity="0.3"
        filter="url(#esrt-esrt-glow)"
      />
      {/* Measurement scale marks */}
      <path
        d="M25 12 L27 12"
        stroke="url(#esrt-esrt-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M25 14 L28 14"
        stroke="url(#esrt-esrt-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M25 16 L27 16"
        stroke="url(#esrt-esrt-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

// ORIC - Original Research & Innovation Contribution (Research level)
