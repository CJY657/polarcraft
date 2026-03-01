import { IconProps, cn } from "./types";
// 1. Chronicles of Light - 光的编年史 (Hourglass with light)
export function CoursesIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="courses-chronicles-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#C9A227"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#92650F"}
          />
        </linearGradient>
        <filter id="courses-chronicles-glow">
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
      {/* Hourglass frame */}
      <path
        d="M12 8 L36 8 L36 12 L28 20 L28 28 L36 36 L36 40 L12 40 L12 36 L20 28 L20 20 L12 12 Z"
        fill="none"
        stroke="url(#courses-chronicles-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sand/light particles flowing */}
      <circle
        cx="24"
        cy="16"
        r="2"
        fill="url(#courses-chronicles-grad)"
        opacity="0.9"
      />
      <circle
        cx="24"
        cy="24"
        r="1.5"
        fill="url(#courses-chronicles-grad)"
        opacity="0.7"
        filter="url(#courses-chronicles-glow)"
      />
      <circle
        cx="24"
        cy="32"
        r="2.5"
        fill="url(#courses-chronicles-grad)"
        opacity="0.8"
      />
      {/* Light rays */}
      <path
        d="M24 4 L24 6 M18 6 L20 8 M30 6 L28 8"
        stroke="url(#courses-chronicles-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

// 2. Device Library - 偏振器件库 (Crystal prism with light)
