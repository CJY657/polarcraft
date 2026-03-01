import { IconProps, cn } from "./types";
// 12. SimulationLab - 仿真工坊 (Computation/simulation with matrices)
export function SimulationLabIcon({
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
          id="simulation-lab-sim-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#8B5CF6"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#7C3AED"}
          />
        </linearGradient>
        <filter id="simulation-lab-sim-glow">
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
      {/* Main gear */}
      <circle
        cx="24"
        cy="24"
        r="12"
        fill="none"
        stroke="url(#simulation-lab-sim-grad)"
        strokeWidth="2.5"
      />
      <circle
        cx="24"
        cy="24"
        r="5"
        fill="url(#simulation-lab-sim-grad)"
        opacity="0.3"
      />
      {/* Gear teeth */}
      <path
        d="M24 8 L22 12 L26 12 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      <path
        d="M24 40 L22 36 L26 36 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      <path
        d="M8 24 L12 22 L12 26 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      <path
        d="M40 24 L36 22 L36 26 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      <path
        d="M12.7 12.7 L15.5 14.1 L14.1 15.5 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      <path
        d="M35.3 35.3 L32.5 33.9 L33.9 32.5 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      <path
        d="M12.7 35.3 L14.1 32.5 L15.5 33.9 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      <path
        d="M35.3 12.7 L33.9 15.5 L32.5 14.1 Z"
        fill="url(#simulation-lab-sim-grad)"
      />
      {/* Matrix brackets */}
      <path
        d="M18 20 L16 20 L16 28 L18 28"
        fill="none"
        stroke="url(#simulation-lab-sim-grad)"
        strokeWidth="1.5"
        opacity="0.8"
      />
      <path
        d="M30 20 L32 20 L32 28 L30 28"
        fill="none"
        stroke="url(#simulation-lab-sim-grad)"
        strokeWidth="1.5"
        opacity="0.8"
      />
      {/* Matrix elements */}
      <circle
        cx="21"
        cy="22"
        r="1"
        fill="url(#simulation-lab-sim-grad)"
        filter="url(#simulation-lab-sim-glow)"
      />
      <circle
        cx="27"
        cy="22"
        r="1"
        fill="url(#simulation-lab-sim-grad)"
        filter="url(#simulation-lab-sim-glow)"
      />
      <circle
        cx="21"
        cy="26"
        r="1"
        fill="url(#simulation-lab-sim-grad)"
        filter="url(#simulation-lab-sim-glow)"
      />
      <circle
        cx="27"
        cy="26"
        r="1"
        fill="url(#simulation-lab-sim-grad)"
        filter="url(#simulation-lab-sim-glow)"
      />
      {/* Binary/code elements */}
      <text
        x="4"
        y="14"
        fill="url(#simulation-lab-sim-grad)"
        fontSize="6"
        opacity="0.5"
        fontFamily="monospace"
      >
        01
      </text>
      <text
        x="38"
        y="42"
        fill="url(#simulation-lab-sim-grad)"
        fontSize="6"
        opacity="0.5"
        fontFamily="monospace"
      >
        10
      </text>
    </svg>
  );
}

// 13. Course - 课程模块 (Book with light rays - represents structured learning)
