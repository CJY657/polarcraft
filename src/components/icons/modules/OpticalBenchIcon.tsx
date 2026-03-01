import { IconProps, cn } from "./types";
// 3. Optical Bench - 光路设计室 (Optical bench with components)
export function OpticalBenchIcon({
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
          id="optical-bench-bench-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#6366F1"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#4338CA"}
          />
        </linearGradient>
        <filter id="optical-bench-bench-glow">
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
      {/* Optical rail/bench */}
      <rect
        x="4"
        y="34"
        width="40"
        height="4"
        rx="2"
        fill="url(#optical-bench-bench-grad)"
        opacity="0.3"
      />
      {/* Light source */}
      <circle
        cx="10"
        cy="24"
        r="4"
        fill="url(#optical-bench-bench-grad)"
        filter="url(#optical-bench-bench-glow)"
      />
      <path
        d="M14 24 L44 24"
        stroke="url(#optical-bench-bench-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
        filter="url(#optical-bench-bench-glow)"
      />
      {/* Polarizer */}
      <rect
        x="20"
        y="16"
        width="4"
        height="16"
        rx="1"
        fill="url(#optical-bench-bench-grad)"
        opacity="0.8"
      />
      <path
        d="M22 18 L22 30"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.5"
      />
      {/* Analyzer */}
      <rect
        x="32"
        y="16"
        width="4"
        height="16"
        rx="1"
        fill="url(#optical-bench-bench-grad)"
        opacity="0.8"
      />
      <path
        d="M34 20 L34 28"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.5"
        transform="rotate(45 34 24)"
      />
      {/* Detector */}
      <rect
        x="40"
        y="20"
        width="6"
        height="8"
        rx="1"
        fill="url(#optical-bench-bench-grad)"
      />
    </svg>
  );
}

// 4. Demo Gallery - 偏振演示馆 (Wave with polarization)
