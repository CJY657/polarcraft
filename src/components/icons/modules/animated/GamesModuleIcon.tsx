/**
 * Games Module Icon - 游戏挑战
 * Design: Game controller with polarization light effects
 */

import React from "react";
import { cn, AnimatedIconProps, POLAR_COLORS } from "../types";

export function GamesModuleIcon({
  className,
  size = 64,
  isHovered,
  theme = "dark",
}: AnimatedIconProps) {
  const primaryColor = theme === "dark" ? "#34d399" : "#059669";

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
          id="games-games-grad"
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
            stopColor="#6ee7b7"
          />
        </linearGradient>
        <filter
          id="games-games-glow"
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

      {/* Controller body */}
      <path
        d="M8 28 Q8 20 16 20 L48 20 Q56 20 56 28 L56 40 Q56 48 48 48 L40 48 L36 56 L28 56 L24 48 L16 48 Q8 48 8 40 Z"
        fill="none"
        stroke="url(#games-games-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        filter={isHovered ? "url(#games-games-glow)" : undefined}
      />

      {/* D-pad */}
      <g>
        <rect
          x="16"
          y="30"
          width="4"
          height="10"
          rx="1"
          fill="url(#games-games-grad)"
          opacity="0.6"
        />
        <rect
          x="13"
          y="33"
          width="10"
          height="4"
          rx="1"
          fill="url(#games-games-grad)"
          opacity="0.6"
        />
      </g>

      {/* Action buttons - polarization colors */}
      <g
        className={isHovered ? "animate-pulse" : ""}
        style={{ animationDuration: "0.8s" }}
      >
        <circle
          cx="44"
          cy="28"
          r="3.5"
          fill={POLAR_COLORS.deg90}
          filter="url(#games-games-glow)"
        />
        <circle
          cx="50"
          cy="34"
          r="3.5"
          fill={POLAR_COLORS.deg0}
          filter="url(#games-games-glow)"
        />
        <circle
          cx="44"
          cy="40"
          r="3.5"
          fill={POLAR_COLORS.deg135}
          filter="url(#games-games-glow)"
        />
        <circle
          cx="38"
          cy="34"
          r="3.5"
          fill={POLAR_COLORS.deg45}
          filter="url(#games-games-glow)"
        />
      </g>

      {/* Light beam effects on hover */}
      {isHovered && (
        <g>
          <line
            x1="44"
            y1="8"
            x2="44"
            y2="16"
            stroke={POLAR_COLORS.deg90}
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#games-games-glow)"
            opacity="0.8"
          />
          <line
            x1="50"
            y1="12"
            x2="54"
            y2="8"
            stroke={POLAR_COLORS.deg0}
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#games-games-glow)"
            opacity="0.8"
          />
          <line
            x1="38"
            y1="12"
            x2="34"
            y2="8"
            stroke={POLAR_COLORS.deg45}
            strokeWidth="2"
            strokeLinecap="round"
            filter="url(#games-games-glow)"
            opacity="0.8"
          />
        </g>
      )}

      {/* Center light indicator */}
      <circle
        cx="32"
        cy="34"
        r={isHovered ? 4 : 3}
        fill={primaryColor}
        filter="url(#games-games-glow)"
        className="transition-all duration-300"
      />

      {/* Decorative waves */}
      <path
        d={isHovered ? "M4 38 Q8 34, 12 38" : "M6 38 Q8 36, 10 38"}
        fill="none"
        stroke="url(#games-games-grad)"
        strokeWidth="1.5"
        opacity="0.5"
        className="transition-all duration-300"
      />
      <path
        d={isHovered ? "M52 38 Q56 34, 60 38" : "M54 38 Q56 36, 58 38"}
        fill="none"
        stroke="url(#games-games-grad)"
        strokeWidth="1.5"
        opacity="0.5"
        className="transition-all duration-300"
      />
    </svg>
  );
}
