import { IconProps, cn } from "./types";
// 10. OpticsLab / Optical Design Studio - 光学设计室 (Optical bench with components and polarized light path)
export function OpticsLabIcon({ className, size = 48, primaryColor, secondaryColor }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={cn("transition-all duration-300", className)}
    >
      <defs>
        {/* Main gradient - Indigo theme */}
        <linearGradient
          id="optics-lab-opticslab-grad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor={primaryColor || "#6366F1"}
          />
          <stop
            offset="100%"
            stopColor={secondaryColor || "#4338CA"}
          />
        </linearGradient>
        {/* Polarized light colors */}
        <linearGradient
          id="optics-lab-opticslab-polar-0"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#ff4444"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            stopColor="#ff6666"
            stopOpacity="0.5"
          />
        </linearGradient>
        <linearGradient
          id="optics-lab-opticslab-polar-45"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#ffaa00"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            stopColor="#ffcc44"
            stopOpacity="0.5"
          />
        </linearGradient>
        <linearGradient
          id="optics-lab-opticslab-polar-90"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop
            offset="0%"
            stopColor="#44ff44"
            stopOpacity="0.9"
          />
          <stop
            offset="100%"
            stopColor="#66ff66"
            stopOpacity="0.5"
          />
        </linearGradient>
        {/* Glow filter */}
        <filter id="optics-lab-opticslab-glow">
          <feGaussianBlur
            stdDeviation="2"
            result="blur"
          />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Soft glow for beams */}
        <filter id="optics-lab-opticslab-beam-glow">
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

      {/* Hexagonal optical table outline */}
      <path
        d="M8 38 L4 24 L8 10 L40 10 L44 24 L40 38 Z"
        fill="none"
        stroke="url(#optics-lab-opticslab-grad)"
        strokeWidth="1.5"
        opacity="0.3"
      />

      {/* Optical rail/bench base */}
      <rect
        x="6"
        y="36"
        width="36"
        height="4"
        rx="2"
        fill="url(#optics-lab-opticslab-grad)"
        opacity="0.4"
      />

      {/* Light source emitter */}
      <g>
        <rect
          x="6"
          y="20"
          width="6"
          height="12"
          rx="2"
          fill="url(#optics-lab-opticslab-grad)"
          opacity="0.9"
        />
        {/* Emitter aperture */}
        <circle
          cx="12"
          cy="26"
          r="2.5"
          fill="url(#optics-lab-opticslab-polar-0)"
          filter="url(#optics-lab-opticslab-glow)"
        />
        {/* Emitter glow ring */}
        <circle
          cx="12"
          cy="26"
          r="4"
          fill="none"
          stroke="#ff4444"
          strokeWidth="0.5"
          opacity="0.5"
        />
      </g>

      {/* Main light beam - 0° polarization (red) */}
      <path
        d="M14 26 L19 26"
        stroke="url(#optics-lab-opticslab-polar-0)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#optics-lab-opticslab-beam-glow)"
      />

      {/* First polarizer */}
      <g>
        <rect
          x="19"
          y="17"
          width="3"
          height="18"
          rx="1"
          fill="url(#optics-lab-opticslab-grad)"
          opacity="0.85"
        />
        {/* Polarization axis indicator */}
        <line
          x1="20.5"
          y1="19"
          x2="20.5"
          y2="33"
          stroke="white"
          strokeWidth="0.8"
          opacity="0.6"
        />
        {/* Polarizer mount */}
        <circle
          cx="20.5"
          cy="26"
          r="1"
          fill="url(#optics-lab-opticslab-grad)"
        />
      </g>

      {/* Light beam after first polarizer - 45° (orange) */}
      <path
        d="M22 26 L27 26"
        stroke="url(#optics-lab-opticslab-polar-45)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#optics-lab-opticslab-beam-glow)"
      />

      {/* Rotator / Wave plate (45° rotation) */}
      <g>
        <ellipse
          cx="27"
          cy="26"
          rx="2.5"
          ry="6"
          fill="none"
          stroke="url(#optics-lab-opticslab-grad)"
          strokeWidth="2"
          opacity="0.8"
        />
        {/* Rotation indicator */}
        <path
          d="M25.5 22 L28.5 22"
          stroke="url(#optics-lab-opticslab-grad)"
          strokeWidth="1"
          opacity="0.6"
        />
        <path
          d="M25.5 30 L28.5 30"
          stroke="url(#optics-lab-opticslab-grad)"
          strokeWidth="1"
          opacity="0.6"
        />
      </g>

      {/* Light beam after rotator - 90° (green) */}
      <path
        d="M29.5 26 L34 26"
        stroke="url(#optics-lab-opticslab-polar-90)"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#optics-lab-opticslab-beam-glow)"
      />

      {/* Analyzer (second polarizer) */}
      <g>
        <rect
          x="34"
          y="17"
          width="3"
          height="18"
          rx="1"
          fill="url(#optics-lab-opticslab-grad)"
          opacity="0.85"
        />
        {/* Crossed polarization axis */}
        <line
          x1="35.5"
          y1="20"
          x2="35.5"
          y2="32"
          stroke="white"
          strokeWidth="0.8"
          opacity="0.4"
          transform="rotate(45 35.5 26)"
        />
        {/* Polarizer mount */}
        <circle
          cx="35.5"
          cy="26"
          r="1"
          fill="url(#optics-lab-opticslab-grad)"
        />
      </g>

      {/* Final output beam - attenuated */}
      <path
        d="M37 26 L40 26"
        stroke="url(#optics-lab-opticslab-polar-90)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
        filter="url(#optics-lab-opticslab-beam-glow)"
      />

      {/* Detector/sensor */}
      <g>
        <rect
          x="40"
          y="20"
          width="5"
          height="12"
          rx="1.5"
          fill="url(#optics-lab-opticslab-grad)"
          opacity="0.95"
        />
        {/* Sensor active area */}
        <rect
          x="41"
          y="22"
          width="3"
          height="8"
          rx="0.5"
          fill="#44ff44"
          opacity="0.4"
        />
        {/* Detection indicator */}
        <circle
          cx="42.5"
          cy="26"
          r="1.5"
          fill="#44ff44"
          opacity="0.8"
          filter="url(#optics-lab-opticslab-glow)"
        />
      </g>

      {/* Polarization state indicators at top */}
      <g opacity="0.7">
        <circle
          cx="12"
          cy="8"
          r="2"
          fill="#ff4444"
        />
        <circle
          cx="24"
          cy="8"
          r="2"
          fill="#ffaa00"
        />
        <circle
          cx="36"
          cy="8"
          r="2"
          fill="#44ff44"
        />
        {/* Connecting line */}
        <path
          d="M14 8 L22 8 M26 8 L34 8"
          stroke="url(#optics-lab-opticslab-grad)"
          strokeWidth="0.5"
          strokeDasharray="1 1"
        />
      </g>

      {/* Decorative corner markers */}
      <path
        d="M4 14 L4 10 L8 10"
        stroke="url(#optics-lab-opticslab-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M44 14 L44 10 L40 10"
        stroke="url(#optics-lab-opticslab-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M4 34 L4 38 L8 38"
        stroke="url(#optics-lab-opticslab-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
      <path
        d="M44 34 L44 38 L40 38"
        stroke="url(#optics-lab-opticslab-grad)"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

// 11. CreativeLab - 偏振造物局 (Creative workshop with polarization art)
