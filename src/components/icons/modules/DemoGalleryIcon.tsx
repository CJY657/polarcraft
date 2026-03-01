import { IconProps, cn } from "./types";
// 4. Demo Gallery - 偏振演示馆 (Wave with polarization)
export function DemoGalleryIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="demo-gallery-demo-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#0891B2"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#0E7490"}
          />
        </linearGradient>
        <filter id="demo-gallery-demo-glow">
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
      {/* Polarizer disc */}
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke="url(#demo-gallery-demo-grad)"
        strokeWidth="2.5"
      />
      {/* Polarization axis - half filled effect */}
      <path
        d="M24 8 A16 16 0 0 1 24 40"
        fill="url(#demo-gallery-demo-grad)"
        opacity="0.4"
      />
      {/* Transmission axis */}
      <path
        d="M24 10 L24 38"
        stroke="url(#demo-gallery-demo-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Wave indicators */}
      <path
        d="M8 24 Q12 20, 16 24 T24 24"
        fill="none"
        stroke="url(#demo-gallery-demo-grad)"
        strokeWidth="1.5"
        opacity="0.6"
        filter="url(#demo-gallery-demo-glow)"
      />
      <path
        d="M24 24 Q28 28, 32 24 T40 24"
        fill="none"
        stroke="url(#demo-gallery-demo-grad)"
        strokeWidth="1.5"
        opacity="0.4"
        filter="url(#demo-gallery-demo-glow)"
      />
      {/* Angle indicator */}
      <circle
        cx="24"
        cy="24"
        r="4"
        fill="url(#demo-gallery-demo-grad)"
        opacity="0.6"
      />
    </svg>
  );
}

// 5. PolarQuest - 偏振探秘 (Hexagonal puzzle with light)
