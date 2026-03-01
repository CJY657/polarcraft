/**
 * Lab Module Icon - 虚拟课题
 * Design: Flask with polarized light experiment
 */

import React from "react";
import { cn, AnimatedIconProps, POLAR_COLORS } from "../types";

export function LabModuleIcon({
  className,
  size = 64,
  isHovered,
  theme = "dark",
}: AnimatedIconProps) {
  const primaryColor = theme === "dark" ? "#2dd4bf" : "#0d9488";

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
          id="lab-research-grad"
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
            stopColor="#5eead4"
          />
        </linearGradient>
        <linearGradient
          id="lab-research-liquid"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor}
            stopOpacity="0.3"
          />
          <stop
            offset="100%"
            stopColor={primaryColor}
            stopOpacity="0.7"
          />
        </linearGradient>
        <filter
          id="lab-research-glow"
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

      {/* Flask outline */}
      <path
        d="M24 8 L24 20 L12 48 L12 54 L52 54 L52 48 L40 20 L40 8"
        fill="none"
        stroke="url(#lab-research-grad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={isHovered ? "url(#lab-research-glow)" : undefined}
      />

      {/* Flask neck */}
      <rect
        x="24"
        y="4"
        width="16"
        height="6"
        rx="2"
        fill="url(#lab-research-grad)"
        opacity="0.4"
      />

      {/* Liquid inside */}
      <path
        d="M16 42 L48 42 L52 48 L52 54 L12 54 L12 48 Z"
        fill="url(#lab-research-liquid)"
      />

      {/* Light beam through liquid */}
      <g filter="url(#lab-research-glow)">
        <line
          x1="8"
          y1="46"
          x2="20"
          y2="46"
          stroke={POLAR_COLORS.deg0}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={isHovered ? 1 : 0.7}
        />
        <line
          x1="44"
          y1="46"
          x2="56"
          y2="46"
          stroke={POLAR_COLORS.deg90}
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity={isHovered ? 1 : 0.7}
        />
      </g>

      {/* Bubbles with polarization colors */}
      <g
        className={isHovered ? "animate-bounce" : ""}
        style={{ animationDuration: "1s" }}
      >
        <circle
          cx="24"
          cy="48"
          r="3"
          fill={POLAR_COLORS.deg0}
          opacity="0.6"
          filter="url(#lab-research-glow)"
        />
        <circle
          cx="36"
          cy="50"
          r="2.5"
          fill={POLAR_COLORS.deg45}
          opacity="0.6"
          filter="url(#lab-research-glow)"
        />
        <circle
          cx="30"
          cy="46"
          r="2"
          fill={POLAR_COLORS.deg90}
          opacity="0.7"
          filter="url(#lab-research-glow)"
        />
        <circle
          cx="40"
          cy="48"
          r="1.5"
          fill={POLAR_COLORS.deg135}
          opacity="0.6"
          filter="url(#lab-research-glow)"
        />
      </g>

      {/* Rising bubbles on hover */}
      {isHovered && (
        <g
          className="animate-pulse"
          style={{ animationDuration: "0.5s" }}
        >
          <circle
            cx="28"
            cy="38"
            r="1.5"
            fill={POLAR_COLORS.deg45}
            opacity="0.5"
          />
          <circle
            cx="34"
            cy="34"
            r="1"
            fill={POLAR_COLORS.deg90}
            opacity="0.4"
          />
          <circle
            cx="38"
            cy="40"
            r="1.5"
            fill={POLAR_COLORS.deg0}
            opacity="0.5"
          />
        </g>
      )}

      {/* Data/formula indicators 数据/公式 指标 */}
      <g
        opacity={isHovered ? 0.8 : 0.4}
        className="transition-opacity duration-300"
      >
        <text
          x="4"
          y="36"
          fill="url(#lab-research-grad)"
          fontSize="8"
          fontFamily="serif"
          fontStyle="italic"
        >
          λ
        </text>
        <text
          x="54"
          y="36"
          fill="url(#lab-research-grad)"
          fontSize="8"
          fontFamily="serif"
          fontStyle="italic"
        >
          θ
        </text>
      </g>

      {/* Sparkle effects 闪耀效果 */}
      <g
        opacity={isHovered ? 1 : 0.5}
        className="transition-opacity duration-300"
      >
        <circle
          cx="56"
          cy="12"
          r="2"
          fill={primaryColor}
          filter="url(#lab-research-glow)"
        />
        <circle
          cx="8"
          cy="16"
          r="1.5"
          fill={primaryColor}
          filter="url(#lab-research-glow)"
        />
      </g>
    </svg>
  );
}
