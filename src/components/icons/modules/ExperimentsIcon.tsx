import { IconProps, cn } from "./types";
// 9. Experiments - 偏振实验手册 (Lightning/experiment symbol)
export function ExperimentsIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="experiments-exp-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#2AA198"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#0D9488"}
          />
        </linearGradient>
        <filter id="experiments-exp-glow">
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
      {/* Lightning bolt */}
      <path
        d="M28 4 L16 22 L22 22 L18 44 L34 22 L26 22 L32 4 Z"
        fill="url(#experiments-exp-grad)"
        opacity="0.3"
      />
      <path
        d="M28 4 L16 22 L22 22 L18 44 L34 22 L26 22 L32 4 Z"
        fill="none"
        stroke="url(#experiments-exp-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        filter="url(#experiments-exp-glow)"
      />
      {/* Energy sparks */}
      <circle
        cx="10"
        cy="16"
        r="2"
        fill="url(#experiments-exp-grad)"
        opacity="0.5"
      />
      <circle
        cx="38"
        cy="32"
        r="2"
        fill="url(#experiments-exp-grad)"
        opacity="0.5"
      />
      <circle
        cx="40"
        cy="14"
        r="1.5"
        fill="url(#experiments-exp-grad)"
        opacity="0.4"
      />
      <circle
        cx="8"
        cy="34"
        r="1.5"
        fill="url(#experiments-exp-grad)"
        opacity="0.4"
      />
      {/* Light waves */}
      <path
        d="M6 24 Q8 22, 10 24 T14 24"
        fill="none"
        stroke="url(#experiments-exp-grad)"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path
        d="M34 24 Q36 26, 38 24 T42 24"
        fill="none"
        stroke="url(#experiments-exp-grad)"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}

// 10. OpticsLab / Optical Design Studio - 光学设计室 (Optical bench with components and polarized light path)
