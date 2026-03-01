import { IconProps, cn } from "./types";
// 7. Lab Group - 虚拟课题组 (Lab flask with light research)
export function LabGroupIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="lab-group-lab-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#3AAE8C"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#059669"}
          />
        </linearGradient>
        <linearGradient
          id="lab-group-lab-liquid"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#3AAE8C"}
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor={primaryColor || "#3AAE8C"}
            stopOpacity="0.7"
          />
        </linearGradient>
        <filter id="lab-group-lab-glow">
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
      {/* Flask body */}
      <path
        d="M18 6 L18 16 L8 38 L8 42 L40 42 L40 38 L30 16 L30 6"
        fill="none"
        stroke="url(#lab-group-lab-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Flask neck */}
      <rect
        x="18"
        y="4"
        width="12"
        height="4"
        rx="1"
        fill="url(#lab-group-lab-grad)"
        opacity="0.4"
      />
      {/* Liquid inside */}
      <path
        d="M12 32 L36 32 L40 38 L40 42 L8 42 L8 38 Z"
        fill="url(#lab-group-lab-liquid)"
      />
      {/* Light beam inside liquid */}
      <path
        d="M16 36 L32 36"
        stroke="url(#lab-group-lab-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.8"
        filter="url(#lab-group-lab-glow)"
      />
      {/* Bubbles */}
      <circle
        cx="20"
        cy="36"
        r="2"
        fill="url(#lab-group-lab-grad)"
        opacity="0.5"
      />
      <circle
        cx="28"
        cy="38"
        r="1.5"
        fill="url(#lab-group-lab-grad)"
        opacity="0.5"
      />
      <circle
        cx="24"
        cy="34"
        r="1"
        fill="url(#lab-group-lab-grad)"
        opacity="0.6"
      />
    </svg>
  );
}

// 8. Applications - 偏振应用图鉴 (Connected nodes showing applications)
