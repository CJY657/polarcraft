import { IconProps, cn } from "./types";
// 8. Applications - 偏振应用图鉴 (Connected nodes showing applications)
export function ApplicationsIcon({
  className,
  size = 48,
  primaryColor,
  secondaryColor,
}: IconProps) {
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
          id="applications-apps-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#E57373"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#EF4444"}
          />
        </linearGradient>
        <filter id="applications-apps-glow">
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
      {/* Center node */}
      <circle
        cx="24"
        cy="24"
        r="6"
        fill="url(#applications-apps-grad)"
        opacity="0.8"
        filter="url(#applications-apps-glow)"
      />
      {/* Outer ring */}
      <circle
        cx="24"
        cy="24"
        r="14"
        fill="none"
        stroke="url(#applications-apps-grad)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
        opacity="0.4"
      />
      {/* Connecting lines */}
      <path
        d="M24 10 L24 18"
        stroke="url(#applications-apps-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 30 L24 38"
        stroke="url(#applications-apps-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 24 L18 24"
        stroke="url(#applications-apps-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M30 24 L38 24"
        stroke="url(#applications-apps-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Corner connections */}
      <path
        d="M14 14 L19 19"
        stroke="url(#applications-apps-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M34 14 L29 19"
        stroke="url(#applications-apps-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M14 34 L19 29"
        stroke="url(#applications-apps-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M34 34 L29 29"
        stroke="url(#applications-apps-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Outer nodes */}
      <circle
        cx="24"
        cy="6"
        r="3"
        fill="url(#applications-apps-grad)"
        opacity="0.6"
      />
      <circle
        cx="24"
        cy="42"
        r="3"
        fill="url(#applications-apps-grad)"
        opacity="0.6"
      />
      <circle
        cx="6"
        cy="24"
        r="3"
        fill="url(#applications-apps-grad)"
        opacity="0.6"
      />
      <circle
        cx="42"
        cy="24"
        r="3"
        fill="url(#applications-apps-grad)"
        opacity="0.6"
      />
      {/* Decorative asterisk in center */}
      <path
        d="M24 21 L24 27 M21 24 L27 24"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

// 9. Experiments - 偏振实验手册 (Lightning/experiment symbol)
