import { IconProps, cn } from "./types";
// Icon: Globe with network connections - represents global research impact
export function SURFIcon({ className, size = 32, primaryColor }: IconProps) {
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
          id="surf-surf-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#f59e0b"}
          />
          <stop
            offset="100%"
            stopColor="#fcd34d"
          />
        </linearGradient>
        <filter id="surf-surf-glow">
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
      {/* Globe outline */}
      <circle
        cx="16"
        cy="16"
        r="11"
        fill="none"
        stroke="url(#surf-surf-grad)"
        strokeWidth="2"
      />
      {/* Latitude lines */}
      <ellipse
        cx="16"
        cy="16"
        rx="11"
        ry="4"
        fill="none"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.4"
      />
      <ellipse
        cx="16"
        cy="16"
        rx="11"
        ry="8"
        fill="none"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.3"
      />
      {/* Longitude line */}
      <ellipse
        cx="16"
        cy="16"
        rx="4"
        ry="11"
        fill="none"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Network nodes */}
      <circle
        cx="10"
        cy="12"
        r="2"
        fill="url(#surf-surf-grad)"
        filter="url(#surf-surf-glow)"
      />
      <circle
        cx="22"
        cy="14"
        r="2"
        fill="url(#surf-surf-grad)"
        filter="url(#surf-surf-glow)"
      />
      <circle
        cx="14"
        cy="22"
        r="2"
        fill="url(#surf-surf-grad)"
        filter="url(#surf-surf-glow)"
      />
      <circle
        cx="20"
        cy="20"
        r="1.5"
        fill="url(#surf-surf-grad)"
        opacity="0.7"
      />
      {/* Connection lines */}
      <path
        d="M10 12 L22 14"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M22 14 L20 20"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M20 20 L14 22"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.6"
      />
      <path
        d="M14 22 L10 12"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.6"
      />
      {/* Wave/signal emanating */}
      <path
        d="M26 8 Q28 10, 26 12"
        fill="none"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M28 6 Q31 10, 28 14"
        fill="none"
        stroke="url(#surf-surf-grad)"
        strokeWidth="1"
        opacity="0.3"
      />
    </svg>
  );
}

// Export a map for easy lookup - all 9 homepage modules + extras
