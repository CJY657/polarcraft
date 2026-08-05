/**
 * NodeIcons - Systematic SVG icons for scientist and concept network nodes
 * 科学家和概念网络节点的系统化SVG图标
 *
 * Icon Design System:
 *
 * For Scientists (by primary field):
 * - optics: Light ray/prism icon (amber)
 * - polarization: Polarizer/filter icon (cyan)
 * - wave: Wave oscillation icon (green)
 * - quantum: Atom/photon icon (purple)
 *
 * For Concepts (by status):
 * - phenomenon: Eye/observation icon (cyan)
 * - theory: Lightbulb/idea icon (violet)
 * - law: Formula/equation icon (green)
 * - principle: Compass/rule icon (amber)
 * - application: Gear/tool icon (pink)
 *
 * Era-based color variations for timeline positioning
 */

import React from 'react'

// ===== Types =====

export type ScientistField = 'optics' | 'polarization' | 'wave' | 'quantum'
export type ConceptStatus = 'phenomenon' | 'theory' | 'law' | 'principle' | 'application'
export type Era = '1600s' | '1700s' | '1800s' | '1900s' | 'modern'

export interface NodeIconProps {
  type: 'scientist' | 'concept'
  // For scientists: primary field
  field?: ScientistField
  // For concepts: status
  status?: ConceptStatus
  // Optional era for color variation
  era?: Era
  // Size in pixels
  size?: number
  // Whether the node is selected/highlighted
  isSelected?: boolean
  // Custom class name
  className?: string
}

// ===== Color Schemes =====

const FIELD_COLORS: Record<ScientistField, { primary: string; secondary: string; glow: string }> = {
  optics: { primary: '#f59e0b', secondary: '#fbbf24', glow: '#f59e0b' }, // amber
  polarization: { primary: '#22d3ee', secondary: '#67e8f9', glow: '#22d3ee' }, // cyan
  wave: { primary: '#22c55e', secondary: '#4ade80', glow: '#22c55e' }, // green
  quantum: { primary: '#a855f7', secondary: '#c084fc', glow: '#a855f7' }, // purple
}

const STATUS_COLORS: Record<ConceptStatus, { primary: string; secondary: string; glow: string }> = {
  phenomenon: { primary: '#06b6d4', secondary: '#22d3ee', glow: '#06b6d4' }, // cyan
  theory: { primary: '#8b5cf6', secondary: '#a78bfa', glow: '#8b5cf6' }, // violet
  law: { primary: '#22c55e', secondary: '#4ade80', glow: '#22c55e' }, // green
  principle: { primary: '#f59e0b', secondary: '#fbbf24', glow: '#f59e0b' }, // amber
  application: { primary: '#ec4899', secondary: '#f472b6', glow: '#ec4899' }, // pink
}

const ERA_COLORS: Record<Era, { accent: string }> = {
  '1600s': { accent: '#cd7f32' }, // bronze
  '1700s': { accent: '#c0c0c0' }, // silver
  '1800s': { accent: '#ffd700' }, // gold
  '1900s': { accent: '#3b82f6' }, // blue
  'modern': { accent: '#a855f7' }, // purple
}

// ===== Icon Components =====

// Optics: Light ray through prism
const OpticsIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Prism */}
    <path
      d={`M ${size * 0.3} ${size * 0.7} L ${size * 0.5} ${size * 0.25} L ${size * 0.7} ${size * 0.7} Z`}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.06}
      strokeLinejoin="round"
    />
    {/* Input ray */}
    <line
      x1={size * 0.1}
      y1={size * 0.45}
      x2={size * 0.38}
      y2={size * 0.45}
      stroke={secondaryColor}
      strokeWidth={size * 0.04}
    />
    {/* Output rays (dispersed) */}
    <line
      x1={size * 0.62}
      y1={size * 0.5}
      x2={size * 0.9}
      y2={size * 0.35}
      stroke="#ef4444"
      strokeWidth={size * 0.03}
    />
    <line
      x1={size * 0.62}
      y1={size * 0.52}
      x2={size * 0.9}
      y2={size * 0.52}
      stroke="#22c55e"
      strokeWidth={size * 0.03}
    />
    <line
      x1={size * 0.62}
      y1={size * 0.54}
      x2={size * 0.9}
      y2={size * 0.7}
      stroke="#3b82f6"
      strokeWidth={size * 0.03}
    />
  </g>
)

// Polarization: Linear polarizer with filtered light
const PolarizationIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Polarizer plate */}
    <rect
      x={size * 0.35}
      y={size * 0.2}
      width={size * 0.08}
      height={size * 0.6}
      fill={color}
      rx={size * 0.02}
    />
    {/* Horizontal lines on polarizer */}
    {[0.3, 0.4, 0.5, 0.6, 0.7].map((y, i) => (
      <line
        key={i}
        x1={size * 0.36}
        y1={size * y}
        x2={size * 0.42}
        y2={size * y}
        stroke={secondaryColor}
        strokeWidth={size * 0.015}
      />
    ))}
    {/* Input wave (unpolarized - multiple directions) */}
    <path
      d={`M ${size * 0.1} ${size * 0.5} Q ${size * 0.15} ${size * 0.4}, ${size * 0.2} ${size * 0.5} T ${size * 0.3} ${size * 0.5}`}
      fill="none"
      stroke={secondaryColor}
      strokeWidth={size * 0.03}
      opacity="0.7"
    />
    {/* Output wave (polarized - single direction) */}
    <path
      d={`M ${size * 0.48} ${size * 0.5} Q ${size * 0.58} ${size * 0.35}, ${size * 0.68} ${size * 0.5} T ${size * 0.88} ${size * 0.5}`}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.04}
    />
    {/* Arrow showing polarization direction */}
    <line
      x1={size * 0.68}
      y1={size * 0.35}
      x2={size * 0.68}
      y2={size * 0.65}
      stroke={color}
      strokeWidth={size * 0.02}
      strokeDasharray={`${size * 0.03} ${size * 0.02}`}
    />
  </g>
)

// Wave: Sine wave oscillation
const WaveIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Main wave */}
    <path
      d={`M ${size * 0.1} ${size * 0.5}
          Q ${size * 0.2} ${size * 0.2}, ${size * 0.35} ${size * 0.5}
          T ${size * 0.6} ${size * 0.5}
          T ${size * 0.85} ${size * 0.5}`}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.06}
      strokeLinecap="round"
    />
    {/* Secondary wave (phase shifted) */}
    <path
      d={`M ${size * 0.15} ${size * 0.5}
          Q ${size * 0.25} ${size * 0.75}, ${size * 0.4} ${size * 0.5}
          T ${size * 0.65} ${size * 0.5}
          T ${size * 0.9} ${size * 0.5}`}
      fill="none"
      stroke={secondaryColor}
      strokeWidth={size * 0.03}
      strokeLinecap="round"
      opacity="0.5"
    />
    {/* Propagation arrow */}
    <path
      d={`M ${size * 0.75} ${size * 0.8} L ${size * 0.9} ${size * 0.8} L ${size * 0.85} ${size * 0.75}`}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.025}
    />
  </g>
)

// Quantum: Atom/photon representation
const QuantumIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Central nucleus */}
    <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.1} fill={color} />
    {/* Orbital rings */}
    <ellipse
      cx={size * 0.5}
      cy={size * 0.5}
      rx={size * 0.35}
      ry={size * 0.15}
      fill="none"
      stroke={secondaryColor}
      strokeWidth={size * 0.025}
      transform={`rotate(-30, ${size * 0.5}, ${size * 0.5})`}
    />
    <ellipse
      cx={size * 0.5}
      cy={size * 0.5}
      rx={size * 0.35}
      ry={size * 0.15}
      fill="none"
      stroke={secondaryColor}
      strokeWidth={size * 0.025}
      transform={`rotate(30, ${size * 0.5}, ${size * 0.5})`}
    />
    <ellipse
      cx={size * 0.5}
      cy={size * 0.5}
      rx={size * 0.35}
      ry={size * 0.15}
      fill="none"
      stroke={secondaryColor}
      strokeWidth={size * 0.025}
      transform={`rotate(90, ${size * 0.5}, ${size * 0.5})`}
    />
    {/* Electron dots */}
    <circle cx={size * 0.15} cy={size * 0.5} r={size * 0.04} fill={color} />
    <circle cx={size * 0.85} cy={size * 0.5} r={size * 0.04} fill={color} />
  </g>
)

// Phenomenon: Eye/observation icon
const PhenomenonIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Eye outline */}
    <path
      d={`M ${size * 0.1} ${size * 0.5}
          Q ${size * 0.5} ${size * 0.15}, ${size * 0.9} ${size * 0.5}
          Q ${size * 0.5} ${size * 0.85}, ${size * 0.1} ${size * 0.5}`}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.05}
    />
    {/* Iris */}
    <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.18} fill={secondaryColor} />
    {/* Pupil */}
    <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.1} fill={color} />
    {/* Highlight */}
    <circle cx={size * 0.45} cy={size * 0.45} r={size * 0.04} fill="white" opacity="0.8" />
  </g>
)

// Theory: Lightbulb/idea icon
const TheoryIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Bulb */}
    <path
      d={`M ${size * 0.35} ${size * 0.55}
          Q ${size * 0.2} ${size * 0.35}, ${size * 0.35} ${size * 0.2}
          Q ${size * 0.5} ${size * 0.1}, ${size * 0.65} ${size * 0.2}
          Q ${size * 0.8} ${size * 0.35}, ${size * 0.65} ${size * 0.55}
          L ${size * 0.6} ${size * 0.65}
          L ${size * 0.4} ${size * 0.65}
          Z`}
      fill={secondaryColor}
      stroke={color}
      strokeWidth={size * 0.04}
    />
    {/* Base */}
    <rect
      x={size * 0.38}
      y={size * 0.65}
      width={size * 0.24}
      height={size * 0.1}
      fill={color}
      rx={size * 0.02}
    />
    <rect
      x={size * 0.4}
      y={size * 0.75}
      width={size * 0.2}
      height={size * 0.08}
      fill={color}
      rx={size * 0.02}
    />
    {/* Filament glow */}
    <path
      d={`M ${size * 0.42} ${size * 0.4} Q ${size * 0.5} ${size * 0.35}, ${size * 0.58} ${size * 0.4}`}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.025}
    />
    {/* Rays */}
    {[0, 45, 90, 135, 180].map((angle, i) => (
      <line
        key={i}
        x1={size * 0.5 + Math.cos((angle * Math.PI) / 180) * size * 0.25}
        y1={size * 0.35 + Math.sin((angle * Math.PI) / 180) * size * 0.25}
        x2={size * 0.5 + Math.cos((angle * Math.PI) / 180) * size * 0.35}
        y2={size * 0.35 + Math.sin((angle * Math.PI) / 180) * size * 0.35}
        stroke={secondaryColor}
        strokeWidth={size * 0.02}
        opacity="0.7"
        transform={`rotate(-90, ${size * 0.5}, ${size * 0.35})`}
      />
    ))}
  </g>
)

// Law: Mathematical formula/equation icon
const LawIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Equation background */}
    <rect
      x={size * 0.15}
      y={size * 0.25}
      width={size * 0.7}
      height={size * 0.5}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.04}
      rx={size * 0.05}
    />
    {/* Sigma symbol */}
    <path
      d={`M ${size * 0.25} ${size * 0.35}
          L ${size * 0.4} ${size * 0.35}
          L ${size * 0.32} ${size * 0.5}
          L ${size * 0.4} ${size * 0.65}
          L ${size * 0.25} ${size * 0.65}`}
      fill="none"
      stroke={secondaryColor}
      strokeWidth={size * 0.04}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Equal sign */}
    <line
      x1={size * 0.5}
      y1={size * 0.45}
      x2={size * 0.65}
      y2={size * 0.45}
      stroke={color}
      strokeWidth={size * 0.04}
    />
    <line
      x1={size * 0.5}
      y1={size * 0.55}
      x2={size * 0.65}
      y2={size * 0.55}
      stroke={color}
      strokeWidth={size * 0.04}
    />
    {/* Variable */}
    <circle cx={size * 0.75} cy={size * 0.5} r={size * 0.08} fill={secondaryColor} />
  </g>
)

// Principle: Compass/rule icon
const PrincipleIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Compass circle */}
    <circle
      cx={size * 0.5}
      cy={size * 0.5}
      r={size * 0.35}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.04}
    />
    {/* Compass needle */}
    <path
      d={`M ${size * 0.5} ${size * 0.2} L ${size * 0.55} ${size * 0.5} L ${size * 0.5} ${size * 0.8} L ${size * 0.45} ${size * 0.5} Z`}
      fill={secondaryColor}
      stroke={color}
      strokeWidth={size * 0.02}
    />
    {/* North indicator */}
    <path
      d={`M ${size * 0.5} ${size * 0.2} L ${size * 0.55} ${size * 0.5} L ${size * 0.45} ${size * 0.5} Z`}
      fill={color}
    />
    {/* Center point */}
    <circle cx={size * 0.5} cy={size * 0.5} r={size * 0.05} fill={color} />
    {/* Cardinal markers */}
    {[0, 90, 180, 270].map((angle, i) => (
      <line
        key={i}
        x1={size * 0.5 + Math.cos(((angle - 90) * Math.PI) / 180) * size * 0.3}
        y1={size * 0.5 + Math.sin(((angle - 90) * Math.PI) / 180) * size * 0.3}
        x2={size * 0.5 + Math.cos(((angle - 90) * Math.PI) / 180) * size * 0.38}
        y2={size * 0.5 + Math.sin(((angle - 90) * Math.PI) / 180) * size * 0.38}
        stroke={secondaryColor}
        strokeWidth={size * 0.03}
      />
    ))}
  </g>
)

// Application: Gear/tool icon
const ApplicationIcon: React.FC<{ color: string; secondaryColor: string; size: number }> = ({
  color,
  secondaryColor,
  size,
}) => (
  <g>
    {/* Outer gear teeth */}
    <path
      d={`M ${size * 0.5} ${size * 0.15}
          L ${size * 0.55} ${size * 0.22} L ${size * 0.62} ${size * 0.18}
          L ${size * 0.68} ${size * 0.25} L ${size * 0.75} ${size * 0.28}
          L ${size * 0.78} ${size * 0.35} L ${size * 0.85} ${size * 0.4}
          L ${size * 0.85} ${size * 0.48} L ${size * 0.88} ${size * 0.55}
          L ${size * 0.82} ${size * 0.6} L ${size * 0.85} ${size * 0.68}
          L ${size * 0.78} ${size * 0.72} L ${size * 0.75} ${size * 0.8}
          L ${size * 0.68} ${size * 0.78} L ${size * 0.6} ${size * 0.85}
          L ${size * 0.52} ${size * 0.82} L ${size * 0.45} ${size * 0.88}
          L ${size * 0.38} ${size * 0.82} L ${size * 0.3} ${size * 0.85}
          L ${size * 0.25} ${size * 0.78} L ${size * 0.18} ${size * 0.75}
          L ${size * 0.18} ${size * 0.68} L ${size * 0.12} ${size * 0.6}
          L ${size * 0.15} ${size * 0.52} L ${size * 0.12} ${size * 0.45}
          L ${size * 0.18} ${size * 0.38} L ${size * 0.18} ${size * 0.3}
          L ${size * 0.25} ${size * 0.25} L ${size * 0.32} ${size * 0.2}
          L ${size * 0.4} ${size * 0.22} L ${size * 0.45} ${size * 0.15}
          Z`}
      fill={secondaryColor}
      stroke={color}
      strokeWidth={size * 0.03}
    />
    {/* Inner circle */}
    <circle
      cx={size * 0.5}
      cy={size * 0.52}
      r={size * 0.2}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.04}
    />
    {/* Center hole */}
    <circle cx={size * 0.5} cy={size * 0.52} r={size * 0.08} fill={color} />
  </g>
)

// ===== Main Component =====

export const NodeIcon: React.FC<NodeIconProps> = ({
  type,
  field = 'optics',
  status = 'phenomenon',
  era,
  size = 32,
  isSelected = false,
  className = '',
}) => {
  // Get colors based on type
  const colors = type === 'scientist' ? FIELD_COLORS[field] : STATUS_COLORS[status]
  const eraAccent = era ? ERA_COLORS[era].accent : undefined

  // Render the appropriate icon
  const renderIcon = () => {
    if (type === 'scientist') {
      switch (field) {
        case 'optics':
          return <OpticsIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        case 'polarization':
          return <PolarizationIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        case 'wave':
          return <WaveIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        case 'quantum':
          return <QuantumIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        default:
          return <OpticsIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
      }
    } else {
      switch (status) {
        case 'phenomenon':
          return <PhenomenonIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        case 'theory':
          return <TheoryIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        case 'law':
          return <LawIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        case 'principle':
          return <PrincipleIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        case 'application':
          return <ApplicationIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
        default:
          return <PhenomenonIcon color={colors.primary} secondaryColor={colors.secondary} size={size} />
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {isSelected && (
          <filter id={`glow-${type}-${field || status}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
        {eraAccent && (
          <linearGradient id={`era-gradient-${era}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={eraAccent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={eraAccent} stopOpacity="0" />
          </linearGradient>
        )}
      </defs>

      {/* Era background tint */}
      {eraAccent && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.48}
          fill={`url(#era-gradient-${era})`}
        />
      )}

      {/* Selection glow */}
      {isSelected && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size * 0.45}
          fill={colors.glow}
          opacity="0.3"
          filter={`url(#glow-${type}-${field || status})`}
        />
      )}

      {/* Icon content */}
      <g filter={isSelected ? `url(#glow-${type}-${field || status})` : undefined}>
        {renderIcon()}
      </g>
    </svg>
  )
}

// ===== Helper Functions =====

/**
 * Get the primary field for a scientist based on their fields array
 */
export function getPrimaryField(fields: string[]): ScientistField {
  if (fields.includes('polarization')) return 'polarization'
  if (fields.includes('wave')) return 'wave'
  if (fields.includes('quantum')) return 'quantum'
  return 'optics'
}

/**
 * Get era from birth year
 */
export function getEraFromYear(year: number): Era {
  if (year < 1700) return '1600s'
  if (year < 1800) return '1700s'
  if (year < 1900) return '1800s'
  if (year < 2000) return '1900s'
  return 'modern'
}

export default NodeIcon
