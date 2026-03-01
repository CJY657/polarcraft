import { IconProps, cn } from "./types";
// 6. Gallery/Studio - 偏振造物局 (Creative sparkle with polarization art)
export function GalleryIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="gallery-gallery-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#D97A8A"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#E11D48"}
          />
        </linearGradient>
        <filter id="gallery-gallery-glow">
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
      {/* Main star sparkle */}
      <path
        d="M24 4 L26 18 L40 18 L28 26 L32 40 L24 30 L16 40 L20 26 L8 18 L22 18 Z"
        fill="url(#gallery-gallery-grad)"
        opacity="0.3"
      />
      <path
        d="M24 4 L26 18 L40 18 L28 26 L32 40 L24 30 L16 40 L20 26 L8 18 L22 18 Z"
        fill="none"
        stroke="url(#gallery-gallery-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
        filter="url(#gallery-gallery-glow)"
      />
      {/* Center diamond */}
      <path
        d="M24 16 L28 24 L24 32 L20 24 Z"
        fill="url(#gallery-gallery-grad)"
        opacity="0.6"
      />
      {/* Small decorative sparkles */}
      <circle
        cx="10"
        cy="10"
        r="1.5"
        fill="url(#gallery-gallery-grad)"
        opacity="0.5"
      />
      <circle
        cx="38"
        cy="12"
        r="1.5"
        fill="url(#gallery-gallery-grad)"
        opacity="0.5"
      />
      <circle
        cx="36"
        cy="38"
        r="1.5"
        fill="url(#gallery-gallery-grad)"
        opacity="0.5"
      />
    </svg>
  );
}

// 7. Lab Group - 虚拟课题组 (Lab flask with light research)
