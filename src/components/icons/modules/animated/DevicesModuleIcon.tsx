/**
 * Devices Module Icon - 光学器件和典型光路
 * Design: Crystal prism with refracted light beams
 */

import React from "react";
import { cn, AnimatedIconProps, POLAR_COLORS } from "../types";

export function DevicesModuleIcon({
  className,
  size = 64,
  isHovered,
  theme = "dark",
}: AnimatedIconProps) {
  const primaryColor = theme === "dark" ? "#22d3ee" : "#0891b2";

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
          id="devices-studio-crystal"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor}
            stopOpacity="0.9"
          />
          <stop
            offset="50%"
            stopColor="#a5f3fc"
            stopOpacity="0.7"
          />
          <stop
            offset="100%"
            stopColor={primaryColor}
            stopOpacity="0.9"
          />
        </linearGradient>
        <linearGradient
          id="devices-studio-beam-in"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#ffffff"
            stopOpacity="0"
          />
          <stop
            offset="50%"
            stopColor="#ffffff"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            stopColor="#ffffff"
            stopOpacity="0.8"
          />
        </linearGradient>
        <filter
          id="devices-studio-glow"
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
      {/* 折射光束经过棱镜的视觉效果 */}
      {/* Incoming white light beam */}
      <line
        x1="4"
        y1="32"
        x2="22"
        y2="32"
        stroke="url(#devices-studio-beam-in)"
        strokeWidth={isHovered ? 4 : 3}
        strokeLinecap="round"
        filter="url(#devices-studio-glow)"
        className="transition-all duration-300"
      />

      {/* Crystal prism */}
      <path
        d="M24 12 L48 32 L24 52 Z"
        fill="none"
        stroke="url(#devices-studio-crystal)"
        strokeWidth="3"
        strokeLinejoin="round"
        filter={isHovered ? "url(#devices-studio-glow)" : undefined}
      />

      {/* Crystal facets */}
      <path
        d="M24 12 L36 32 L24 52 M36 32 L48 32"
        stroke="url(#devices-studio-crystal)"
        strokeWidth="1"
        opacity="0.5"
      />
      {/* Refracted light beams - spread out on hover */}
      <g className="transition-all duration-500">
        {/* Red beam (0°) */}
        <line
          x1="40"
          y1="27"
          x2={isHovered ? 60 : 54}
          y2={isHovered ? 14 : 18}
          stroke={POLAR_COLORS.deg0}
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#devices-studio-glow)"
          opacity={isHovered ? 1 : 0.7}
          className="transition-all duration-300"
        />
        {/* Orange beam (45°) */}
        <line
          x1="44"
          y1="29"
          x2={isHovered ? 62 : 56}
          y2={isHovered ? 24 : 26}
          stroke={POLAR_COLORS.deg45}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#devices-studio-glow)"
          opacity={isHovered ? 1 : 0.7}
          className="transition-all duration-300"
        />
        {/* Green beam (90°) */}
        <line
          x1="46"
          y1="32"
          x2={isHovered ? 62 : 56}
          y2="32"
          stroke={POLAR_COLORS.deg90}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#devices-studio-glow)"
          opacity={isHovered ? 1 : 0.7}
          className="transition-all duration-300"
        />
        {/* Blue beam (135°) */}
        <line
          x1="44"
          y1="35"
          x2={isHovered ? 62 : 56}
          y2={isHovered ? 40 : 38}
          stroke={POLAR_COLORS.deg135}
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#devices-studio-glow)"
          opacity={isHovered ? 1 : 0.7}
          className="transition-all duration-300"
        />
        {/* Extra violet beam on hover */}
        <line
          x1="40"
          y1="37"
          x2={isHovered ? 60 : 54}
          y2={isHovered ? 50 : 46}
          stroke="#a855f7"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#devices-studio-glow)"
          opacity={isHovered ? 1 : 0.7}
          className="transition-all duration-300"
        />
      </g>

      {/* Crystal center glow */}
      <circle
        cx="36"
        cy="32"
        r={isHovered ? 6 : 4}
        fill={primaryColor}
        opacity={isHovered ? 0.5 : 0.3}
        filter="url(#devices-studio-glow)"
        className="transition-all duration-300"
      />
    </svg>
  );
}
