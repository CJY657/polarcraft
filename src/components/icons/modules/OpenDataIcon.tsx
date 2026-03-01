import { IconProps, cn } from "./types";
// 14. OpenData - 开放数据 (Database with sharing/open science)
export function OpenDataIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="open-data-data-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#64748B"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#475569"}
          />
        </linearGradient>
        <filter id="open-data-data-glow">
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
      {/* Database cylinder */}
      <ellipse
        cx="24"
        cy="12"
        rx="14"
        ry="5"
        fill="none"
        stroke="url(#open-data-data-grad)"
        strokeWidth="2.5"
      />
      <path
        d="M10 12 L10 36"
        stroke="url(#open-data-data-grad)"
        strokeWidth="2.5"
      />
      <path
        d="M38 12 L38 36"
        stroke="url(#open-data-data-grad)"
        strokeWidth="2.5"
      />
      <ellipse
        cx="24"
        cy="36"
        rx="14"
        ry="5"
        fill="none"
        stroke="url(#open-data-data-grad)"
        strokeWidth="2.5"
      />
      {/* Middle section line */}
      <ellipse
        cx="24"
        cy="24"
        rx="14"
        ry="5"
        fill="none"
        stroke="url(#open-data-data-grad)"
        strokeWidth="1.5"
        opacity="0.4"
      />
      {/* Data rows/bars */}
      <rect
        x="14"
        y="16"
        width="8"
        height="2"
        rx="1"
        fill="url(#open-data-data-grad)"
        opacity="0.6"
      />
      <rect
        x="26"
        y="16"
        width="6"
        height="2"
        rx="1"
        fill="url(#open-data-data-grad)"
        opacity="0.4"
      />
      <rect
        x="14"
        y="28"
        width="10"
        height="2"
        rx="1"
        fill="url(#open-data-data-grad)"
        opacity="0.5"
      />
      <rect
        x="28"
        y="28"
        width="4"
        height="2"
        rx="1"
        fill="url(#open-data-data-grad)"
        opacity="0.3"
      />
      {/* Open/share symbol */}
      <circle
        cx="38"
        cy="8"
        r="6"
        fill="none"
        stroke="url(#open-data-data-grad)"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M35 8 L41 8 M38 5 L38 11"
        stroke="url(#open-data-data-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Connection dots */}
      <circle
        cx="8"
        cy="40"
        r="2"
        fill="url(#open-data-data-grad)"
        opacity="0.5"
        filter="url(#open-data-data-glow)"
      />
      <circle
        cx="40"
        cy="40"
        r="2"
        fill="url(#open-data-data-grad)"
        opacity="0.5"
        filter="url(#open-data-data-glow)"
      />
      <path
        d="M10 40 L24 44 L38 40"
        fill="none"
        stroke="url(#open-data-data-grad)"
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

// =================================================================
