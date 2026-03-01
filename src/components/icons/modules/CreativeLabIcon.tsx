import { IconProps, cn } from "./types";
// 11. CreativeLab - 偏振造物局 (Creative workshop with polarization art)
export function CreativeLabIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="creative-lab-creative-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#EC4899"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#DB2777"}
          />
        </linearGradient>
        <linearGradient
          id="creative-lab-creative-rainbow"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#ff4444"
          />
          <stop
            offset="33%"
            stopColor="#44ff44"
          />
          <stop
            offset="66%"
            stopColor="#4444ff"
          />
          <stop
            offset="100%"
            stopColor="#ff4444"
          />
        </linearGradient>
        <filter id="creative-lab-creative-glow">
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
      {/* Paintbrush/wand shape */}
      <path
        d="M8 40 L16 32 L24 24 L32 16 L36 12"
        fill="none"
        stroke="url(#creative-lab-creative-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Brush tip with polarization colors */}
      <path
        d="M36 12 L40 8 L44 10 L42 14 L38 16 Z"
        fill="url(#creative-lab-creative-grad)"
        opacity="0.8"
      />
      {/* Color sparkles representing polarization states */}
      <circle
        cx="18"
        cy="14"
        r="3"
        fill="#ff4444"
        opacity="0.7"
        filter="url(#creative-lab-creative-glow)"
      />
      <circle
        cx="28"
        cy="10"
        r="2.5"
        fill="#44ff44"
        opacity="0.7"
        filter="url(#creative-lab-creative-glow)"
      />
      <circle
        cx="12"
        cy="22"
        r="2"
        fill="#4444ff"
        opacity="0.7"
        filter="url(#creative-lab-creative-glow)"
      />
      <circle
        cx="22"
        cy="36"
        r="2.5"
        fill="#ffaa00"
        opacity="0.7"
        filter="url(#creative-lab-creative-glow)"
      />
      {/* Decorative stars */}
      <path
        d="M38 28 L40 30 L42 28 L40 32 Z"
        fill="url(#creative-lab-creative-grad)"
        opacity="0.5"
      />
      <path
        d="M6 12 L8 14 L10 12 L8 16 Z"
        fill="url(#creative-lab-creative-grad)"
        opacity="0.5"
      />
      {/* Arc representing creative flow */}
      <path
        d="M10 30 Q24 10, 38 20"
        fill="none"
        stroke="url(#creative-lab-creative-rainbow)"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        opacity="0.6"
      />
    </svg>
  );
}

// 12. SimulationLab - 仿真工坊 (Computation/simulation with matrices)
