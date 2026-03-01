/**
 * Gallery Module Icon - 成果展示
 * Design: Star/award with radiating light
 */

import React from "react";
import { cn, AnimatedIconProps, POLAR_COLORS } from "../types";

export function GalleryModuleIcon({
  className,
  size = 64,
  isHovered,
  theme = "dark",
}: AnimatedIconProps) {
  const primaryColor = theme === "dark" ? "#f472b6" : "#db2777";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={cn("transition-all duration-500", className)}
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
            stopColor={primaryColor}
          />
          <stop
            offset="100%"
            stopColor="#f9a8d4"
          />
        </linearGradient>
        <linearGradient
          id="gallery-gallery-rainbow"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={POLAR_COLORS.deg0}
          />
          <stop
            offset="33%"
            stopColor={POLAR_COLORS.deg45}
          />
          <stop
            offset="66%"
            stopColor={POLAR_COLORS.deg90}
          />
          <stop
            offset="100%"
            stopColor={POLAR_COLORS.deg135}
          />
        </linearGradient>
        <filter
          id="gallery-gallery-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation="3"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ring */}
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="url(#gallery-gallery-grad)"
        strokeWidth="1"
        strokeDasharray={isHovered ? "8 4" : "4 4"}
        opacity="0.4"
        className={isHovered ? "animate-spin" : ""}
        style={{ animationDuration: "10s" }}
      />

      {/* Star shape */}
      <path
        d="M32 6 L36 24 L54 24 L40 34 L44 52 L32 42 L20 52 L24 34 L10 24 L28 24 Z"
        fill="url(#gallery-gallery-grad)"
        opacity={isHovered ? 0.4 : 0.2}
        className="transition-opacity duration-300"
      />
      <path
        d="M32 6 L36 24 L54 24 L40 34 L44 52 L32 42 L20 52 L24 34 L10 24 L28 24 Z"
        fill="none"
        stroke="url(#gallery-gallery-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter={isHovered ? "url(#gallery-gallery-glow)" : undefined}
      />

      {/* Inner diamond */}
      <path
        d="M32 20 L38 32 L32 44 L26 32 Z"
        fill="url(#gallery-gallery-rainbow)"
        opacity={isHovered ? 0.8 : 0.5}
        filter="url(#gallery-gallery-glow)"
        className="transition-opacity duration-300"
      />

      {/* Radiating light rays on hover */}
      <g
        opacity={isHovered ? 1 : 0}
        className="transition-opacity duration-500"
      >
        <line
          x1="32"
          y1="4"
          x2="32"
          y2="0"
          stroke={POLAR_COLORS.deg0}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gallery-gallery-glow)"
        />
        <line
          x1="56"
          y1="16"
          x2="60"
          y2="12"
          stroke={POLAR_COLORS.deg45}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gallery-gallery-glow)"
        />
        <line
          x1="60"
          y1="32"
          x2="64"
          y2="32"
          stroke={POLAR_COLORS.deg90}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gallery-gallery-glow)"
        />
        <line
          x1="56"
          y1="48"
          x2="60"
          y2="52"
          stroke={POLAR_COLORS.deg135}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gallery-gallery-glow)"
        />
        <line
          x1="8"
          y1="16"
          x2="4"
          y2="12"
          stroke={POLAR_COLORS.deg135}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gallery-gallery-glow)"
        />
        <line
          x1="4"
          y1="32"
          x2="0"
          y2="32"
          stroke={POLAR_COLORS.deg90}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gallery-gallery-glow)"
        />
        <line
          x1="8"
          y1="48"
          x2="4"
          y2="52"
          stroke={POLAR_COLORS.deg45}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#gallery-gallery-glow)"
        />
      </g>

      {/* Center glow */}
      <circle
        cx="32"
        cy="32"
        r={isHovered ? 8 : 5}
        fill={primaryColor}
        opacity={isHovered ? 0.6 : 0.4}
        filter="url(#gallery-gallery-glow)"
        className={`transition-all duration-300 ${isHovered ? "animate-pulse" : ""}`}
      />

      {/* Sparkle dots */}
      <g className={isHovered ? "animate-pulse" : ""}>
        <circle
          cx="12"
          cy="12"
          r="2"
          fill={POLAR_COLORS.deg0}
          opacity="0.6"
        />
        <circle
          cx="52"
          cy="12"
          r="2"
          fill={POLAR_COLORS.deg45}
          opacity="0.6"
        />
        <circle
          cx="52"
          cy="52"
          r="2"
          fill={POLAR_COLORS.deg90}
          opacity="0.6"
        />
        <circle
          cx="12"
          cy="52"
          r="2"
          fill={POLAR_COLORS.deg135}
          opacity="0.6"
        />
      </g>
    </svg>
  );
}
