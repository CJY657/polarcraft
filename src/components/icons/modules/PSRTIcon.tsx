import { IconProps, cn } from "./types";
// Icon: Seedling with light rays - represents growth and discovery
export function PSRTIcon({ className, size = 32, primaryColor }: IconProps) {
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
          id="psrt-psrt-grad"
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#22c55e"}
          />
          <stop
            offset="100%"
            stopColor="#86efac"
          />
        </linearGradient>
        <filter id="psrt-psrt-glow">
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
      {/* Soil/ground */}
      <path
        d="M4 26 Q16 28, 28 26"
        fill="none"
        stroke="url(#psrt-psrt-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Main stem */}
      <path
        d="M16 26 L16 14"
        stroke="url(#psrt-psrt-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Left leaf */}
      <path
        d="M16 18 Q10 16, 8 12 Q10 14, 16 16"
        fill="url(#psrt-psrt-grad)"
        opacity="0.8"
      />
      {/* Right leaf */}
      <path
        d="M16 14 Q22 12, 24 8 Q22 10, 16 12"
        fill="url(#psrt-psrt-grad)"
        opacity="0.9"
      />
      {/* Light rays from top */}
      <path
        d="M16 4 L16 8"
        stroke="url(#psrt-psrt-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        filter="url(#psrt-psrt-glow)"
        opacity="0.7"
      />
      <path
        d="M10 6 L12 9"
        stroke="url(#psrt-psrt-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M22 6 L20 9"
        stroke="url(#psrt-psrt-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      {/* Question mark accent */}
      <circle
        cx="26"
        cy="20"
        r="4"
        fill="none"
        stroke="url(#psrt-psrt-grad)"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <text
        x="24.5"
        y="22.5"
        fontSize="6"
        fill="url(#psrt-psrt-grad)"
        fontWeight="bold"
        opacity="0.7"
      >
        ?
      </text>
    </svg>
  );
}

// ESRT - Experimental Science Research Training (Application level)
