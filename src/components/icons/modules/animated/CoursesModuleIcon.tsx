/**
 * Courses Module Icon - 课程内容的时间线展示
 * Design: Hourglass with flowing light particles
 */

import React from "react";
import { cn, AnimatedIconProps, POLAR_COLORS } from "../types";

export function CoursesModuleIcon({
  className,
  size = 64,
  isHovered,
  theme = "dark",
}: AnimatedIconProps) {
  const primaryColor = theme === "dark" ? "#fbbf24" : "#d97706";
  const glowColor = theme === "dark" ? "rgba(251, 191, 36, 0.6)" : "rgba(217, 119, 6, 0.4)";

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
          id="courses-history-grad"
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
            offset="50%"
            stopColor="#fcd34d"
          />
          <stop
            offset="100%"
            stopColor={primaryColor}
          />
        </linearGradient>
        <linearGradient
          id="courses-history-light-flow"
          x1="50%"
          y1="0%"
          x2="50%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={POLAR_COLORS.deg0}
            stopOpacity="0.9"
          />
          <stop
            offset="33%"
            stopColor={POLAR_COLORS.deg45}
            stopOpacity="0.8"
          />
          <stop
            offset="66%"
            stopColor={POLAR_COLORS.deg90}
            stopOpacity="0.8"
          />
          <stop
            offset="100%"
            stopColor={POLAR_COLORS.deg135}
            stopOpacity="0.9"
          />
        </linearGradient>
        <filter
          id="courses-history-glow"
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

      {/* Outer decorative ring */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="none"
        stroke="url(#courses-history-grad)"
        strokeWidth="1"
        strokeDasharray="4 4"
        opacity="0.3"
        className={isHovered ? "animate-spin" : ""}
        style={{ animationDuration: "20s" }}
      />

      {/* Hourglass frame */}
      <path
        d="M18 10 L46 10 L46 16 L36 28 L36 36 L46 48 L46 54 L18 54 L18 48 L28 36 L28 28 L18 16 Z"
        fill="none"
        stroke="url(#courses-history-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={isHovered ? "url(#courses-history-glow)" : undefined}
      />

      {/* Top sand/light */}
      <path
        d="M22 14 L42 14 L42 18 L35 26 L29 26 L22 18 Z"
        fill="url(#courses-history-light-flow)"
        opacity={isHovered ? 0.8 : 0.5}
        className="transition-opacity duration-300"
      />

      {/* Bottom sand/light */}
      <path
        d="M22 50 L42 50 L42 46 L35 38 L29 38 L22 46 Z"
        fill="url(#courses-history-light-flow)"
        opacity={isHovered ? 0.9 : 0.6}
        className="transition-opacity duration-300"
      />

      {/* Flowing light particles */}
      <g className={isHovered ? "animate-pulse" : ""}>
        <circle
          cx="32"
          cy="20"
          r="2"
          fill={POLAR_COLORS.deg0}
          opacity="0.8"
          filter="url(#courses-history-glow)"
        />
        <circle
          cx="32"
          cy="28"
          r="1.5"
          fill={POLAR_COLORS.deg45}
          opacity="0.9"
          filter="url(#courses-history-glow)"
        />
        <circle
          cx="32"
          cy="36"
          r="1.5"
          fill={POLAR_COLORS.deg90}
          opacity="0.9"
          filter="url(#courses-history-glow)"
        />
        <circle
          cx="32"
          cy="44"
          r="2"
          fill={POLAR_COLORS.deg135}
          opacity="0.8"
          filter="url(#courses-history-glow)"
        />
      </g>

      {/* Center glow */}
      <circle
        cx="32"
        cy="32"
        r="4"
        fill={glowColor}
        filter="url(#courses-history-glow)"
        className={isHovered ? "animate-ping" : "animate-pulse"}
        style={{ animationDuration: isHovered ? "1s" : "2s" }}
      />

      {/* Timeline markers */}
      <g
        opacity={isHovered ? 0.8 : 0.4}
        className="transition-opacity duration-300"
      >
        <circle
          cx="12"
          cy="32"
          r="2"
          fill={POLAR_COLORS.deg0}
        />
        <circle
          cx="52"
          cy="32"
          r="2"
          fill={POLAR_COLORS.deg90}
        />
        <line
          x1="14"
          y1="32"
          x2="18"
          y2="32"
          stroke="url(#courses-history-grad)"
          strokeWidth="1"
        />
        <line
          x1="46"
          y1="32"
          x2="50"
          y2="32"
          stroke="url(#courses-history-grad)"
          strokeWidth="1"
        />
      </g>
    </svg>
  );
}
