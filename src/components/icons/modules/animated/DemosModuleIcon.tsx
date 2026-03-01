/**
 * Demos Module Icon - 基本理论和计算模拟
 * Design: Mathematical formulas with light waves
 */

import React from "react";
import { cn, AnimatedIconProps, POLAR_COLORS } from "../types";

export function DemosModuleIcon({
  className,
  size = 64,
  isHovered,
  theme = "dark",
}: AnimatedIconProps) {
  const primaryColor = theme === "dark" ? "#818cf8" : "#4f46e5";

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
          id="demos-theory-grad"
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
            stopColor="#a5b4fc"
          />
        </linearGradient>
        <filter
          id="demos-theory-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
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

      {/* Matrix brackets */}
      <g
        opacity={isHovered ? 1 : 0.8}
        className="transition-opacity duration-300"
      >
        <path
          d="M12 16 L8 16 L8 48 L12 48"
          fill="none"
          stroke="url(#demos-theory-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M52 16 L56 16 L56 48 L52 48"
          fill="none"
          stroke="url(#demos-theory-grad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Matrix elements - Jones vectors */}
      <g filter={isHovered ? "url(#demos-theory-glow)" : undefined}>
        {/* cos θ */}
        <text
          x="20"
          y="28"
          fill="url(#demos-theory-grad)"
          fontSize="10"
          fontFamily="serif"
          fontStyle="italic"
          opacity={isHovered ? 1 : 0.7}
        >
          cos
        </text>
        <text
          x="38"
          y="28"
          fill={POLAR_COLORS.deg0}
          fontSize="10"
          fontFamily="serif"
          fontStyle="italic"
        >
          θ
        </text>

        {/* sin θ */}
        <text
          x="20"
          y="44"
          fill="url(#demos-theory-grad)"
          fontSize="10"
          fontFamily="serif"
          fontStyle="italic"
          opacity={isHovered ? 1 : 0.7}
        >
          sin
        </text>
        <text
          x="38"
          y="44"
          fill={POLAR_COLORS.deg90}
          fontSize="10"
          fontFamily="serif"
          fontStyle="italic"
        >
          θ
        </text>
      </g>

      {/* Wave visualization at top */}
      <path
        d={isHovered ? "M8 8 Q16 2, 24 8 T40 8 T56 8" : "M12 10 Q20 6, 28 10 T44 10 T52 10"}
        fill="none"
        stroke="url(#demos-theory-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#demos-theory-glow)"
        opacity="0.6"
        className="transition-all duration-500"
      />

      {/* Wave visualization at bottom */}
      <path
        d={isHovered ? "M8 56 Q16 62, 24 56 T40 56 T56 56" : "M12 54 Q20 58, 28 54 T44 54 T52 54"}
        fill="none"
        stroke="url(#demos-theory-grad)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#demos-theory-glow)"
        opacity="0.6"
        className="transition-all duration-500"
      />

      {/* Floating polarization dots */}
      <g
        className={isHovered ? "animate-pulse" : ""}
        style={{ animationDuration: "1.5s" }}
      >
        <circle
          cx="48"
          cy="20"
          r="3"
          fill={POLAR_COLORS.deg0}
          opacity="0.6"
          filter="url(#demos-theory-glow)"
        />
        <circle
          cx="16"
          cy="56"
          r="3"
          fill={POLAR_COLORS.deg90}
          opacity="0.6"
          filter="url(#demos-theory-glow)"
        />
      </g>

      {/* Center glow */}
      <circle
        cx="32"
        cy="32"
        r={isHovered ? 8 : 0}
        fill={primaryColor}
        opacity="0.2"
        filter="url(#demos-theory-glow)"
        className="transition-all duration-500"
      />
    </svg>
  );
}
