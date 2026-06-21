/**
 * PolariScope Logo - Main brand logo for the homepage
 * PolariScope 标志 - 首页主品牌标志
 *
 * Design concept:
 * - Central crystal/prism representing optical components
 * - Four light beams in polarization colors (0°, 45°, 90°, 135°)
 * - Animated pulse effect to simulate light propagation
 * - Rotation effect when light beam is active
 * - Works in both dark and light themes
 */

import { cn } from '@/utils/classNames'

interface PolariScopeLogoProps {
  className?: string
  size?: number
  animated?: boolean
  theme?: 'dark' | 'light'
  /** Enable slow rotation animation */
  rotating?: boolean
  /** Rotation speed: 'slow' (60s), 'medium' (30s), 'fast' (15s) */
  rotationSpeed?: 'slow' | 'medium' | 'fast'
  /** Whether light beam is currently active (triggers enhanced glow) */
  beamActive?: boolean
  /** Active module color for glow effect */
  activeColor?: string
}

export function PolariScopeLogo({
  className,
  size = 80,
  animated = true,
  theme = 'dark',
  rotating = false,
  rotationSpeed = 'slow',
  beamActive = false,
  activeColor,
}: PolariScopeLogoProps) {
  // 旋转速度映射
  const rotationDurations = {
    slow: '60s',
    medium: '30s',
    fast: '15s',
  }
  // Polarization angle colors
  const colors = {
    deg0: '#ff4444',    // 0° - Red (horizontal)
    deg45: '#ffaa00',   // 45° - Orange
    deg90: '#44ff44',   // 90° - Green (vertical)
    deg135: '#4488ff',  // 135° - Blue
    crystal: theme === 'dark' ? '#22d3ee' : '#0891b2', // Cyan crystal
    glow: theme === 'dark' ? 'rgba(34, 211, 238, 0.6)' : 'rgba(8, 145, 178, 0.4)',
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={cn('transition-all duration-300', className)}
      style={{
        // 添加旋转动画样式
        animation: rotating ? `logo-spin ${rotationDurations[rotationSpeed]} linear infinite` : 'none',
      }}
    >
      <style>{`
        @keyframes logo-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes beam-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes crystal-shimmer {
          0%, 100% { opacity: 0.9; filter: brightness(1); }
          50% { opacity: 1; filter: brightness(1.2); }
        }
      `}</style>
      <defs>
        {/* Crystal gradient */}
        <linearGradient id="crystal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.crystal} stopOpacity="0.9" />
          <stop offset="50%" stopColor={theme === 'dark' ? '#a5f3fc' : '#67e8f9'} stopOpacity="0.7" />
          <stop offset="100%" stopColor={colors.crystal} stopOpacity="0.9" />
        </linearGradient>

        {/* Beam gradients for each polarization angle */}
        <linearGradient id="beam-0" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor={colors.deg0} stopOpacity="0" />
          <stop offset="30%" stopColor={colors.deg0} stopOpacity="0.8" />
          <stop offset="70%" stopColor={colors.deg0} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.deg0} stopOpacity="0" />
        </linearGradient>

        <linearGradient id="beam-45" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.deg45} stopOpacity="0" />
          <stop offset="30%" stopColor={colors.deg45} stopOpacity="0.8" />
          <stop offset="70%" stopColor={colors.deg45} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.deg45} stopOpacity="0" />
        </linearGradient>

        <linearGradient id="beam-90" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={colors.deg90} stopOpacity="0" />
          <stop offset="30%" stopColor={colors.deg90} stopOpacity="0.8" />
          <stop offset="70%" stopColor={colors.deg90} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.deg90} stopOpacity="0" />
        </linearGradient>

        <linearGradient id="beam-135" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor={colors.deg135} stopOpacity="0" />
          <stop offset="30%" stopColor={colors.deg135} stopOpacity="0.8" />
          <stop offset="70%" stopColor={colors.deg135} stopOpacity="0.8" />
          <stop offset="100%" stopColor={colors.deg135} stopOpacity="0" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="logo-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pulse animation for center glow */}
        <filter id="pulse-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer ring - represents the optical system boundary */}
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke={beamActive ? (activeColor || colors.crystal) : colors.crystal}
        strokeWidth={beamActive ? '1.5' : '1'}
        strokeDasharray={beamActive ? '6 3' : '4 4'}
        opacity={beamActive ? 0.5 : 0.3}
        style={{
          transition: 'all 0.3s ease-out',
          animation: beamActive ? 'crystal-shimmer 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Light beams - 4 polarization directions */}
      <g
        opacity={beamActive ? 0.85 : 0.7}
        style={{
          transition: 'opacity 0.3s ease-out',
          animation: beamActive ? 'beam-pulse 2s ease-in-out infinite' : 'none',
        }}
      >
        {/* 0° beam (horizontal) - Red */}
        <line
          x1="8"
          y1="50"
          x2="92"
          y2="50"
          stroke="url(#beam-0)"
          strokeWidth={beamActive ? '3.5' : '3'}
          strokeLinecap="round"
          filter="url(#logo-glow)"
          style={{ transition: 'stroke-width 0.3s ease-out' }}
        />

        {/* 90° beam (vertical) - Green */}
        <line
          x1="50"
          y1="8"
          x2="50"
          y2="92"
          stroke="url(#beam-90)"
          strokeWidth={beamActive ? '3.5' : '3'}
          strokeLinecap="round"
          filter="url(#logo-glow)"
          style={{ transition: 'stroke-width 0.3s ease-out' }}
        />

        {/* 45° beam (diagonal) - Orange */}
        <line
          x1="15"
          y1="85"
          x2="85"
          y2="15"
          stroke="url(#beam-45)"
          strokeWidth={beamActive ? '3' : '2.5'}
          strokeLinecap="round"
          filter="url(#logo-glow)"
          style={{ transition: 'stroke-width 0.3s ease-out' }}
        />

        {/* 135° beam (diagonal) - Blue */}
        <line
          x1="15"
          y1="15"
          x2="85"
          y2="85"
          stroke="url(#beam-135)"
          strokeWidth={beamActive ? '3' : '2.5'}
          strokeLinecap="round"
          filter="url(#logo-glow)"
          style={{ transition: 'stroke-width 0.3s ease-out' }}
        />
      </g>

      {/* Central crystal - hexagonal prism shape */}
      <g filter="url(#logo-glow)">
        {/* Outer hexagon */}
        <path
          d="M50 26 L68 38 L68 62 L50 74 L32 62 L32 38 Z"
          fill="none"
          stroke="url(#crystal-grad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner facets - creates 3D crystal effect */}
        <path
          d="M50 26 L50 50 M68 38 L50 50 M68 62 L50 50 M50 74 L50 50 M32 62 L50 50 M32 38 L50 50"
          stroke="url(#crystal-grad)"
          strokeWidth="1"
          opacity="0.5"
        />
      </g>

      {/* Enhanced glow when beam is active */}
      {beamActive && (
        <circle
          cx="50"
          cy="50"
          r="20"
          fill={activeColor || colors.glow}
          opacity="0.25"
          filter="url(#pulse-glow)"
          style={{ animation: 'beam-pulse 1.5s ease-in-out infinite' }}
        />
      )}

      {/* Central glowing core - pulsing light source */}
      <circle
        cx="50"
        cy="50"
        r={beamActive ? 10 : 8}
        fill={beamActive ? (activeColor || colors.glow) : colors.glow}
        filter="url(#pulse-glow)"
        className={animated ? 'animate-pulse' : ''}
        style={{
          transition: 'r 0.3s ease-out, fill 0.3s ease-out',
        }}
      />
      <circle
        cx="50"
        cy="50"
        r={beamActive ? 5 : 4}
        fill={theme === 'dark' ? '#ffffff' : colors.crystal}
        opacity="0.9"
        style={{
          transition: 'r 0.3s ease-out',
        }}
      />

      {/* Polarization angle markers - small dots at beam endpoints */}
      <g opacity="0.6">
        {/* 0° markers */}
        <circle cx="10" cy="50" r="2" fill={colors.deg0} />
        <circle cx="90" cy="50" r="2" fill={colors.deg0} />

        {/* 90° markers */}
        <circle cx="50" cy="10" r="2" fill={colors.deg90} />
        <circle cx="50" cy="90" r="2" fill={colors.deg90} />

        {/* 45° markers */}
        <circle cx="17" cy="83" r="1.5" fill={colors.deg45} />
        <circle cx="83" cy="17" r="1.5" fill={colors.deg45} />

        {/* 135° markers */}
        <circle cx="17" cy="17" r="1.5" fill={colors.deg135} />
        <circle cx="83" cy="83" r="1.5" fill={colors.deg135} />
      </g>

      {/* Decorative wave patterns - represents light wave nature */}
      <g opacity="0.3">
        <path
          d="M20 50 Q25 45, 30 50 T40 50"
          fill="none"
          stroke={colors.crystal}
          strokeWidth="1"
        />
        <path
          d="M60 50 Q65 55, 70 50 T80 50"
          fill="none"
          stroke={colors.crystal}
          strokeWidth="1"
        />
      </g>
    </svg>
  )
}
