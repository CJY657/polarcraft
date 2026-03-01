import { IconProps, cn } from "./types";
// 2. Device Library - 偏振器件库 (Crystal prism with light)
export function DeviceLibraryIcon({
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
          id="device-library-device-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#4169E1"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#1D4ED8"}
          />
        </linearGradient>
        <linearGradient
          id="device-library-device-light"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#ffffff"
            stopOpacity="0.8"
          />
          <stop
            offset="50%"
            stopColor={primaryColor || "#4169E1"}
            stopOpacity="0.6"
          />
          <stop
            offset="100%"
            stopColor="#ffffff"
            stopOpacity="0.3"
          />
        </linearGradient>
      </defs>
      {/* Crystal/prism shape */}
      <path
        d="M24 6 L38 18 L38 30 L24 42 L10 30 L10 18 Z"
        fill="none"
        stroke="url(#device-library-device-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner crystal structure */}
      <path
        d="M24 6 L24 42 M10 18 L38 30 M38 18 L10 30"
        stroke="url(#device-library-device-grad)"
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Light beam through crystal */}
      <path
        d="M4 24 L10 24"
        stroke="url(#device-library-device-light)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Refracted beams */}
      <path
        d="M38 20 L44 16 M38 24 L44 24 M38 28 L44 32"
        stroke="url(#device-library-device-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

// 3. Optical Bench - 光路设计室 (Optical bench with components)
