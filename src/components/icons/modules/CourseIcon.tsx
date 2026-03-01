import { IconProps, cn } from "./types";
// 13. Course - 课程模块 (Book with light rays - represents structured learning)
export function CourseIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
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
          id="course-course-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#3B82F6"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#1D4ED8"}
          />
        </linearGradient>
        <linearGradient
          id="course-course-light"
          x1="0%"
          y1="100%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#ff4444"
            stopOpacity="0.8"
          />
          <stop
            offset="33%"
            stopColor="#ffaa00"
            stopOpacity="0.8"
          />
          <stop
            offset="66%"
            stopColor="#44ff44"
            stopOpacity="0.8"
          />
          <stop
            offset="100%"
            stopColor="#4488ff"
            stopOpacity="0.8"
          />
        </linearGradient>
        <filter id="course-course-glow">
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
      {/* Open book shape */}
      <path
        d="M6 12 C6 8, 12 6, 24 6 C36 6, 42 8, 42 12 L42 38 C42 40, 36 42, 24 42 C12 42, 6 40, 6 38 Z"
        fill="none"
        stroke="url(#course-course-grad)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Book spine */}
      <path
        d="M24 6 L24 42"
        stroke="url(#course-course-grad)"
        strokeWidth="2"
        opacity="0.6"
      />
      {/* Pages texture left */}
      <path
        d="M10 14 L20 14 M10 20 L18 20 M10 26 L20 26 M10 32 L16 32"
        stroke="url(#course-course-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Pages texture right */}
      <path
        d="M28 14 L38 14 M30 20 L38 20 M28 26 L38 26 M32 32 L38 32"
        stroke="url(#course-course-grad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Light rays emanating from book */}
      <path
        d="M24 2 L24 6"
        stroke="url(#course-course-light)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#course-course-glow)"
      />
      <path
        d="M16 4 L18 8"
        stroke="url(#course-course-light)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
        filter="url(#course-course-glow)"
      />
      <path
        d="M32 4 L30 8"
        stroke="url(#course-course-light)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
        filter="url(#course-course-glow)"
      />
      {/* Light orb above book */}
      <circle
        cx="24"
        cy="0"
        r="2"
        fill="url(#course-course-light)"
        filter="url(#course-course-glow)"
        opacity="0.8"
      />
      {/* Decorative sparkles */}
      <circle
        cx="8"
        cy="8"
        r="1"
        fill="url(#course-course-grad)"
        opacity="0.5"
      />
      <circle
        cx="40"
        cy="8"
        r="1"
        fill="url(#course-course-grad)"
        opacity="0.5"
      />
    </svg>
  );
}

// 14. OpenData - 开放数据 (Database with sharing/open science)
