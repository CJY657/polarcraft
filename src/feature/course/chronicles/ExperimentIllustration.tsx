/**
 * ExperimentIllustration - 经典实验配图
 * SVG Illustrations for classic experiments in optical history
 */

import React from 'react'
import { useTheme } from '@/contexts/ThemeContext'

export interface ExperimentIllustrationProps {
  type: string
  className?: string
}

export function ExperimentIllustration({ type, className = '' }: { type: string; className?: string }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const illustrations: Record<string, React.ReactElement> = {
    prism: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Prism */}
        <polygon
          points="60,10 100,70 20,70"
          fill={isDark ? '#1e293b' : '#f8fafc'}
          stroke={isDark ? '#64748b' : '#94a3b8'}
          strokeWidth="2"
        />
        {/* Incoming white light */}
        <line x1="0" y1="40" x2="45" y2="40" stroke="#fff" strokeWidth="3" />
        {/* Spectrum rays */}
        <line x1="75" y1="45" x2="120" y2="25" stroke="#ef4444" strokeWidth="2" />
        <line x1="75" y1="47" x2="120" y2="35" stroke="#f97316" strokeWidth="2" />
        <line x1="75" y1="49" x2="120" y2="45" stroke="#eab308" strokeWidth="2" />
        <line x1="75" y1="51" x2="120" y2="55" stroke="#22c55e" strokeWidth="2" />
        <line x1="75" y1="53" x2="120" y2="65" stroke="#3b82f6" strokeWidth="2" />
        <line x1="75" y1="55" x2="120" y2="75" stroke="#8b5cf6" strokeWidth="2" />
      </svg>
    ),
    'double-slit': (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Light source */}
        <circle cx="10" cy="40" r="6" fill="#fbbf24" />
        {/* Barrier with slits */}
        <rect x="40" y="0" width="4" height="32" fill={isDark ? '#475569' : '#94a3b8'} />
        <rect x="40" y="38" width="4" height="4" fill={isDark ? '#0f172a' : '#f1f5f9'} />
        <rect x="40" y="48" width="4" height="32" fill={isDark ? '#475569' : '#94a3b8'} />
        {/* Waves from source */}
        <path d="M 16,40 Q 28,30 40,36" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.7" />
        <path d="M 16,40 Q 28,50 40,44" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity="0.7" />
        {/* Interference pattern */}
        <rect x="100" y="0" width="15" height="80" fill={isDark ? '#1e293b' : '#f1f5f9'} />
        {[0, 16, 32, 48, 64].map((y, i) => (
          <rect key={i} x="100" y={y + 4} width="15" height="8" fill="#fbbf24" opacity={i % 2 === 0 ? 0.9 : 0.3} />
        ))}
        {/* Waves from slits */}
        <path d="M 44,36 Q 70,20 100,20" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
        <path d="M 44,36 Q 70,40 100,40" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
        <path d="M 44,44 Q 70,40 100,40" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
        <path d="M 44,44 Q 70,60 100,60" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.5" />
      </svg>
    ),
    calcite: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Calcite crystal (rhombus) */}
        <polygon
          points="30,20 80,15 90,60 40,65"
          fill={isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(147, 197, 253, 0.4)'}
          stroke={isDark ? '#60a5fa' : '#3b82f6'}
          strokeWidth="2"
        />
        {/* Incoming light */}
        <line x1="0" y1="40" x2="30" y2="40" stroke="#fff" strokeWidth="3" />
        {/* Double refraction - ordinary ray */}
        <line x1="50" y1="42" x2="120" y2="50" stroke="#22d3ee" strokeWidth="2.5" />
        <text x="105" y="62" fill={isDark ? '#22d3ee' : '#0891b2'} fontSize="8">o-ray</text>
        {/* Extraordinary ray */}
        <line x1="50" y1="38" x2="120" y2="25" stroke="#fbbf24" strokeWidth="2.5" />
        <text x="105" y="20" fill={isDark ? '#fbbf24' : '#d97706'} fontSize="8">e-ray</text>
        {/* Double image dots */}
        <circle cx="15" cy="40" r="3" fill="#fff" />
      </svg>
    ),
    reflection: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Glass surface */}
        <rect x="0" y="50" width="120" height="30" fill={isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(147, 197, 253, 0.3)'} />
        <line x1="0" y1="50" x2="120" y2="50" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="2" />
        {/* Incident ray */}
        <line x1="20" y1="10" x2="60" y2="50" stroke="#fff" strokeWidth="2" />
        <polygon points="58,46 62,50 54,50" fill="#fff" />
        {/* Reflected ray (polarized) */}
        <line x1="60" y1="50" x2="100" y2="10" stroke="#22d3ee" strokeWidth="2.5" />
        {/* Polarization indicator */}
        <ellipse cx="85" cy="25" rx="8" ry="2" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
        {/* Angle arc */}
        <path d="M 60,35 A 15,15 0 0,1 75,50" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" />
        <text x="72" y="42" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">θB</text>
      </svg>
    ),
    polarizer: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Unpolarized light waves */}
        <g transform="translate(5, 40)">
          <line x1="0" y1="-10" x2="0" y2="10" stroke="#fbbf24" strokeWidth="2" />
          <line x1="-7" y1="-7" x2="7" y2="7" stroke="#fbbf24" strokeWidth="2" />
          <line x1="-10" y1="0" x2="10" y2="0" stroke="#fbbf24" strokeWidth="2" />
          <line x1="-7" y1="7" x2="7" y2="-7" stroke="#fbbf24" strokeWidth="2" />
        </g>
        {/* Arrow */}
        <line x1="20" y1="40" x2="40" y2="40" stroke="#fbbf24" strokeWidth="2" />
        {/* Polarizer 1 */}
        <rect x="45" y="15" width="8" height="50" fill={isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(34, 211, 238, 0.4)'} stroke="#22d3ee" strokeWidth="1.5" />
        <line x1="49" y1="18" x2="49" y2="62" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3,2" />
        {/* Polarized light */}
        <line x1="53" y1="40" x2="65" y2="40" stroke="#22d3ee" strokeWidth="2" />
        <g transform="translate(70, 40)">
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#22d3ee" strokeWidth="2" />
        </g>
        {/* Arrow */}
        <line x1="75" y1="40" x2="85" y2="40" stroke="#22d3ee" strokeWidth="2" />
        {/* Polarizer 2 (crossed) */}
        <rect x="90" y="15" width="8" height="50" fill={isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.4)'} stroke="#fbbf24" strokeWidth="1.5" />
        <line x1="91" y1="40" x2="97" y2="40" stroke="#fbbf24" strokeWidth="2" strokeDasharray="3,2" />
        {/* No light */}
        <line x1="98" y1="40" x2="115" y2="40" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" strokeDasharray="2,2" />
        <text x="105" y="55" fill={isDark ? '#ef4444' : '#dc2626'} fontSize="8">×</text>
      </svg>
    ),
    wave: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Propagation axis (z-direction) */}
        <line x1="10" y1="40" x2="110" y2="40" stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="0.5" strokeDasharray="2,2" />
        {/* E field wave - oscillates in vertical (y) direction */}
        <path
          d="M 10,40 Q 22,15 35,40 Q 47,65 60,40 Q 72,15 85,40 Q 97,65 110,40"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2.5"
        />
        {/* B field - perpendicular to E, shown as dots (into page) and crosses (out of page) */}
        {/* At wave peaks (E max), B = 0; At E = 0, B is max */}
        {/* Dots = into page (⊙), Crosses = out of page (⊗) */}
        <circle cx="22" cy="40" r="3" fill="none" stroke="#f472b6" strokeWidth="1.5" />
        <circle cx="22" cy="40" r="1" fill="#f472b6" />
        <circle cx="47" cy="40" r="3" fill="none" stroke="#f472b6" strokeWidth="1.5" />
        <line x1="44" y1="37" x2="50" y2="43" stroke="#f472b6" strokeWidth="1.5" />
        <line x1="44" y1="43" x2="50" y2="37" stroke="#f472b6" strokeWidth="1.5" />
        <circle cx="72" cy="40" r="3" fill="none" stroke="#f472b6" strokeWidth="1.5" />
        <circle cx="72" cy="40" r="1" fill="#f472b6" />
        <circle cx="97" cy="40" r="3" fill="none" stroke="#f472b6" strokeWidth="1.5" />
        <line x1="94" y1="37" x2="100" y2="43" stroke="#f472b6" strokeWidth="1.5" />
        <line x1="94" y1="43" x2="100" y2="37" stroke="#f472b6" strokeWidth="1.5" />
        {/* Labels */}
        <text x="5" y="18" fill="#22d3ee" fontSize="8" fontWeight="bold">E</text>
        <text x="112" y="35" fill="#f472b6" fontSize="7">B⊥</text>
        {/* Propagation arrow */}
        <line x1="45" y1="72" x2="70" y2="72" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1.5" />
        <polygon points="70,72 65,69 65,75" fill={isDark ? '#94a3b8' : '#64748b'} />
        <text x="52" y="68" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="6">k (z)</text>
        {/* Axes indicator */}
        <g transform="translate(105, 65)">
          <line x1="0" y1="0" x2="0" y2="-8" stroke="#22d3ee" strokeWidth="1" />
          <text x="-3" y="-10" fill="#22d3ee" fontSize="5">y</text>
          <line x1="0" y1="0" x2="8" y2="0" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" />
          <text x="9" y="3" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="5">z</text>
          <circle cx="0" cy="0" r="2" fill="none" stroke="#f472b6" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="0.8" fill="#f472b6" />
          <text x="-8" y="3" fill="#f472b6" fontSize="5">x</text>
        </g>
      </svg>
    ),
    lcd: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Backlight */}
        <rect x="0" y="25" width="15" height="30" fill="#fbbf24" opacity="0.8" />
        {/* Polarizer 1 */}
        <rect x="20" y="20" width="5" height="40" fill={isDark ? 'rgba(34, 211, 238, 0.4)' : 'rgba(34, 211, 238, 0.5)'} stroke="#22d3ee" />
        {/* LC layer */}
        <rect x="30" y="15" width="30" height="50" fill={isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)'} stroke="#8b5cf6" />
        {/* Twisted molecules */}
        <path d="M 35,25 Q 45,30 55,25" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M 35,40 Q 45,35 55,40" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
        <path d="M 35,55 Q 45,50 55,55" fill="none" stroke="#8b5cf6" strokeWidth="1.5" />
        {/* Polarizer 2 */}
        <rect x="65" y="20" width="5" height="40" fill={isDark ? 'rgba(34, 211, 238, 0.4)' : 'rgba(34, 211, 238, 0.5)'} stroke="#22d3ee" />
        {/* Display pixel */}
        <rect x="80" y="25" width="35" height="30" fill={isDark ? '#0f172a' : '#1e293b'} stroke={isDark ? '#475569' : '#64748b'} />
        <rect x="85" y="30" width="10" height="20" fill="#22c55e" />
        <rect x="100" y="30" width="10" height="20" fill="#3b82f6" />
      </svg>
    ),
    nicol: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Nicol prism shape */}
        <polygon
          points="20,20 70,15 100,40 70,65 20,60"
          fill={isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(147, 197, 253, 0.25)'}
          stroke={isDark ? '#60a5fa' : '#3b82f6'}
          strokeWidth="2"
        />
        {/* Diagonal cut */}
        <line x1="45" y1="17" x2="45" y2="63" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" strokeDasharray="3,2" />
        {/* Incoming light */}
        <line x1="0" y1="40" x2="20" y2="40" stroke="#fff" strokeWidth="2.5" />
        {/* Ordinary ray (reflected/absorbed) */}
        <line x1="45" y1="40" x2="70" y2="65" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" strokeDasharray="2,2" />
        <text x="60" y="75" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="7">absorbed</text>
        {/* Extraordinary ray (transmitted) */}
        <line x1="45" y1="40" x2="120" y2="40" stroke="#22d3ee" strokeWidth="2.5" />
        <text x="100" y="35" fill="#22d3ee" fontSize="7">e-ray</text>
      </svg>
    ),
    mantis: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Mantis shrimp eye (simplified) */}
        <ellipse cx="30" cy="40" rx="20" ry="25" fill={isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)'} stroke="#22c55e" strokeWidth="2" />
        {/* Eye bands */}
        <line x1="10" y1="35" x2="50" y2="35" stroke="#22c55e" strokeWidth="3" />
        <line x1="10" y1="45" x2="50" y2="45" stroke="#22c55e" strokeWidth="3" />
        {/* Incoming light types */}
        <g transform="translate(70, 20)">
          <circle cx="0" cy="0" r="4" fill="#22d3ee" />
          <path d="M -8,0 A 8,8 0 1,1 8,0" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
          <text x="12" y="4" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">linear</text>
        </g>
        <g transform="translate(70, 40)">
          <circle cx="0" cy="0" r="4" fill="#f472b6" />
          <ellipse cx="0" cy="0" rx="8" ry="4" fill="none" stroke="#f472b6" strokeWidth="1.5" />
          <text x="12" y="4" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">circular</text>
        </g>
        <g transform="translate(70, 60)">
          <circle cx="0" cy="0" r="4" fill="#fbbf24" />
          <ellipse cx="0" cy="0" rx="8" ry="6" fill="none" stroke="#fbbf24" strokeWidth="1.5" transform="rotate(30)" />
          <text x="12" y="4" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">elliptical</text>
        </g>
        {/* Arrows to eye */}
        <line x1="55" y1="20" x2="48" y2="35" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" />
        <line x1="55" y1="40" x2="50" y2="40" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" />
        <line x1="55" y1="60" x2="48" y2="45" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" />
      </svg>
    ),
    birefringence: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Crystal structure */}
        <rect x="40" y="10" width="40" height="60" fill={isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(147, 197, 253, 0.25)'} stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="2" />
        {/* Optic axis indicator */}
        <line x1="60" y1="5" x2="60" y2="75" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" strokeDasharray="3,2" />
        <text x="62" y="10" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="6">optic axis</text>
        {/* Incoming light */}
        <line x1="5" y1="40" x2="40" y2="40" stroke="#fff" strokeWidth="2.5" />
        {/* O-ray (follows optic axis) */}
        <line x1="80" y1="40" x2="115" y2="40" stroke="#22d3ee" strokeWidth="2" />
        {/* E-ray (deflected) */}
        <line x1="80" y1="40" x2="115" y2="25" stroke="#fbbf24" strokeWidth="2" />
        {/* Inside crystal paths */}
        <line x1="40" y1="40" x2="80" y2="40" stroke="#22d3ee" strokeWidth="1.5" opacity="0.6" />
        <line x1="40" y1="40" x2="80" y2="35" stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
        {/* Labels */}
        <text x="100" y="50" fill="#22d3ee" fontSize="7">o</text>
        <text x="108" y="23" fill="#fbbf24" fontSize="7">e</text>
      </svg>
    ),
    faraday: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Electromagnet coil */}
        <rect x="35" y="15" width="50" height="50" fill={isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)'} stroke="#8b5cf6" strokeWidth="2" rx="4" />
        {/* Coil windings */}
        {[20, 30, 40, 50, 60].map((y, i) => (
          <ellipse key={i} cx="60" cy={y} rx="25" ry="4" fill="none" stroke="#8b5cf6" strokeWidth="1" opacity="0.6" />
        ))}
        {/* Magnetic field arrow */}
        <line x1="60" y1="5" x2="60" y2="75" stroke={isDark ? '#c084fc' : '#a855f7'} strokeWidth="1.5" strokeDasharray="4,2" />
        <polygon points="60,5 55,12 65,12" fill={isDark ? '#c084fc' : '#a855f7'} />
        <text x="68" y="10" fill={isDark ? '#c084fc' : '#a855f7'} fontSize="7">B</text>
        {/* Incoming polarized light */}
        <line x1="0" y1="40" x2="30" y2="40" stroke="#22d3ee" strokeWidth="2" />
        <line x1="15" y1="33" x2="15" y2="47" stroke="#22d3ee" strokeWidth="2" />
        {/* Rotated outgoing light */}
        <line x1="90" y1="40" x2="120" y2="40" stroke="#22d3ee" strokeWidth="2" />
        <line x1="105" y1="32" x2="105" y2="48" stroke="#22d3ee" strokeWidth="2" transform="rotate(30, 105, 40)" />
        {/* Rotation arrow */}
        <path d="M 95,55 A 10,10 0 0,1 115,55" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        <polygon points="115,55 112,50 110,57" fill="#fbbf24" />
      </svg>
    ),
    chirality: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Left-handed molecule */}
        <g transform="translate(25, 40)">
          <circle cx="0" cy="0" r="8" fill="#22c55e" opacity="0.8" />
          <line x1="0" y1="-8" x2="0" y2="-20" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
          <circle cx="0" cy="-24" r="4" fill="#3b82f6" />
          <line x1="8" y1="0" x2="18" y2="8" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
          <circle cx="22" cy="10" r="4" fill="#ef4444" />
          <line x1="-8" y1="0" x2="-18" y2="8" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
          <circle cx="-22" cy="10" r="4" fill="#fbbf24" />
          <text x="-5" y="30" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">L</text>
        </g>
        {/* Mirror line */}
        <line x1="60" y1="10" x2="60" y2="70" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" strokeDasharray="4,2" />
        {/* Right-handed molecule (mirror) */}
        <g transform="translate(95, 40)">
          <circle cx="0" cy="0" r="8" fill="#22c55e" opacity="0.8" />
          <line x1="0" y1="-8" x2="0" y2="-20" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
          <circle cx="0" cy="-24" r="4" fill="#3b82f6" />
          <line x1="-8" y1="0" x2="-18" y2="8" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
          <circle cx="-22" cy="10" r="4" fill="#ef4444" />
          <line x1="8" y1="0" x2="18" y2="8" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="2" />
          <circle cx="22" cy="10" r="4" fill="#fbbf24" />
          <text x="-5" y="30" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">R</text>
        </g>
        {/* Mirror label */}
        <text x="52" y="78" fill={isDark ? '#64748b' : '#94a3b8'} fontSize="6">mirror</text>
      </svg>
    ),
    rayleigh: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Sun */}
        <circle cx="10" cy="40" r="8" fill="#fbbf24" />
        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1={10 + 10 * Math.cos(angle * Math.PI / 180)}
            y1={40 + 10 * Math.sin(angle * Math.PI / 180)}
            x2={10 + 14 * Math.cos(angle * Math.PI / 180)}
            y2={40 + 14 * Math.sin(angle * Math.PI / 180)}
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
        ))}
        {/* Incident beam */}
        <line x1="22" y1="40" x2="50" y2="40" stroke="#fff" strokeWidth="2" />
        {/* Scattering particle */}
        <circle cx="55" cy="40" r="4" fill={isDark ? '#475569' : '#94a3b8'} />
        {/* Scattered blue light (perpendicular) */}
        <line x1="55" y1="36" x2="55" y2="10" stroke="#3b82f6" strokeWidth="2" />
        <line x1="55" y1="44" x2="55" y2="70" stroke="#3b82f6" strokeWidth="2" />
        {/* Forward red light */}
        <line x1="59" y1="40" x2="90" y2="40" stroke="#ef4444" strokeWidth="2" />
        {/* Polarization indicators */}
        <line x1="55" y1="18" x2="48" y2="18" stroke="#3b82f6" strokeWidth="1.5" />
        <line x1="55" y1="18" x2="62" y2="18" stroke="#3b82f6" strokeWidth="1.5" />
        {/* Labels */}
        <text x="35" y="12" fill="#3b82f6" fontSize="7">blue</text>
        <text x="95" y="43" fill="#ef4444" fontSize="7">red</text>
        <text x="65" y="18" fill="#3b82f6" fontSize="6">⊥</text>
      </svg>
    ),
    poincare: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Sphere */}
        <ellipse cx="60" cy="40" rx="35" ry="35" fill="none" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="1.5" />
        {/* Equator */}
        <ellipse cx="60" cy="40" rx="35" ry="10" fill="none" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="1" strokeDasharray="3,2" />
        {/* Vertical meridian */}
        <ellipse cx="60" cy="40" rx="10" ry="35" fill="none" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="1" strokeDasharray="3,2" />
        {/* North pole - RCP */}
        <circle cx="60" cy="5" r="4" fill="#22d3ee" />
        <text x="68" y="10" fill="#22d3ee" fontSize="6">R</text>
        {/* South pole - LCP */}
        <circle cx="60" cy="75" r="4" fill="#f472b6" />
        <text x="68" y="75" fill="#f472b6" fontSize="6">L</text>
        {/* H polarization */}
        <circle cx="95" cy="40" r="3" fill="#fbbf24" />
        <text x="100" y="43" fill="#fbbf24" fontSize="6">H</text>
        {/* V polarization */}
        <circle cx="25" cy="40" r="3" fill="#22c55e" />
        <text x="10" y="43" fill="#22c55e" fontSize="6">V</text>
        {/* Diagonal */}
        <circle cx="60" cy="30" r="2" fill="#a855f7" />
        {/* Trajectory arc */}
        <path d="M 75,25 Q 85,40 75,55" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
        <polygon points="75,55 80,50 72,50" fill="#ef4444" />
      </svg>
    ),
    photoelectric: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Photon wave packets */}
        <g>
          <rect x="5" y="35" width="15" height="10" fill="#fbbf24" opacity="0.3" rx="2" />
          <path d="M 7,40 Q 10,35 13,40 Q 16,45 19,40" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          <text x="7" y="55" fill="#fbbf24" fontSize="6">hν</text>
        </g>
        {/* Arrow */}
        <line x1="22" y1="40" x2="38" y2="40" stroke="#fbbf24" strokeWidth="1.5" />
        <polygon points="38,40 33,37 33,43" fill="#fbbf24" />
        {/* Metal surface */}
        <rect x="40" y="25" width="40" height="30" fill={isDark ? '#475569' : '#94a3b8'} rx="2" />
        <text x="50" y="42" fill={isDark ? '#1e293b' : '#f1f5f9'} fontSize="7">Metal</text>
        {/* Ejected electron */}
        <circle cx="95" cy="30" r="4" fill="#22d3ee" />
        <text x="100" y="33" fill="#22d3ee" fontSize="6">e⁻</text>
        {/* Electron trajectory */}
        <path d="M 80,35 Q 85,25 95,30" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
        {/* Energy equation */}
        <text x="45" y="70" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">E = hν</text>
      </svg>
    ),
    jones: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Input vector */}
        <g transform="translate(15, 40)">
          <rect x="-8" y="-20" width="16" height="40" fill={isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(34, 211, 238, 0.3)'} stroke="#22d3ee" strokeWidth="1" rx="2" />
          <text x="-4" y="-5" fill="#22d3ee" fontSize="8">E</text>
          <text x="-4" y="10" fill="#22d3ee" fontSize="6">in</text>
        </g>
        {/* Arrow to matrix */}
        <line x1="28" y1="40" x2="38" y2="40" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" />
        {/* 2x2 Matrix */}
        <g transform="translate(55, 40)">
          <rect x="-18" y="-22" width="36" height="44" fill={isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)'} stroke="#8b5cf6" strokeWidth="1.5" rx="2" />
          <text x="-12" y="-5" fill="#8b5cf6" fontSize="7">a  b</text>
          <text x="-12" y="10" fill="#8b5cf6" fontSize="7">c  d</text>
        </g>
        {/* Arrow to output */}
        <line x1="78" y1="40" x2="88" y2="40" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" />
        {/* Output vector */}
        <g transform="translate(105, 40)">
          <rect x="-8" y="-20" width="16" height="40" fill={isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)'} stroke="#fbbf24" strokeWidth="1" rx="2" />
          <text x="-5" y="-5" fill="#fbbf24" fontSize="8">E</text>
          <text x="-6" y="10" fill="#fbbf24" fontSize="5">out</text>
        </g>
        {/* Equals sign */}
        <text x="82" y="43" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">=</text>
        {/* Multiplication sign */}
        <text x="32" y="43" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">×</text>
      </svg>
    ),
    snell: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Interface line */}
        <line x1="0" y1="45" x2="120" y2="45" stroke={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth="2" />
        {/* Upper medium (air) */}
        <rect x="0" y="0" width="120" height="45" fill={isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.5)'} />
        <text x="5" y="15" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">n₁ (air)</text>
        {/* Lower medium (glass) */}
        <rect x="0" y="45" width="120" height="35" fill={isDark ? 'rgba(147, 197, 253, 0.15)' : 'rgba(147, 197, 253, 0.3)'} />
        <text x="5" y="75" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">n₂ (glass)</text>
        {/* Incident ray */}
        <line x1="20" y1="5" x2="60" y2="45" stroke="#fbbf24" strokeWidth="2.5" />
        <polygon points="58,41 62,45 54,45" fill="#fbbf24" />
        {/* Refracted ray (bent toward normal) */}
        <line x1="60" y1="45" x2="85" y2="80" stroke="#22d3ee" strokeWidth="2.5" />
        {/* Normal line */}
        <line x1="60" y1="10" x2="60" y2="75" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" strokeDasharray="3,2" />
        {/* Angle arcs */}
        <path d="M 60,30 A 15,15 0 0,1 48,42" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
        <text x="42" y="32" fill="#fbbf24" fontSize="7">θ₁</text>
        <path d="M 60,60 A 15,15 0 0,0 70,53" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
        <text x="72" y="62" fill="#22d3ee" fontSize="7">θ₂</text>
        {/* Formula */}
        <text x="85" y="15" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="6">n₁sinθ₁=n₂sinθ₂</text>
      </svg>
    ),
    lightspeed: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Jupiter */}
        <circle cx="85" cy="40" r="18" fill={isDark ? '#d97706' : '#f59e0b'} />
        {/* Jupiter bands */}
        <ellipse cx="85" cy="35" rx="18" ry="3" fill={isDark ? '#92400e' : '#b45309'} />
        <ellipse cx="85" cy="45" rx="18" ry="3" fill={isDark ? '#92400e' : '#b45309'} />
        {/* Io moon */}
        <circle cx="110" cy="40" r="4" fill={isDark ? '#94a3b8' : '#64748b'} />
        {/* Earth */}
        <circle cx="20" cy="40" r="8" fill={isDark ? '#3b82f6' : '#60a5fa'} />
        <ellipse cx="20" cy="40" rx="8" ry="3" fill={isDark ? '#22c55e' : '#4ade80'} opacity="0.6" />
        {/* Light path from Io to Earth */}
        <line x1="106" y1="40" x2="28" y2="40" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,2" />
        {/* Light packets */}
        <circle cx="70" cy="40" r="2" fill="#fbbf24" />
        <circle cx="50" cy="40" r="2" fill="#fbbf24" />
        {/* Delay indicator */}
        <path d="M 45,55 A 20,20 0 0,1 75,55" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" />
        <text x="50" y="68" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="6">Δt delay</text>
        {/* Sun indicator */}
        <circle cx="55" cy="15" r="5" fill="#fbbf24" opacity="0.5" />
        {/* Orbits */}
        <ellipse cx="55" cy="40" rx="35" ry="10" fill="none" stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="0.5" strokeDasharray="2,2" />
      </svg>
    ),
    opticalactivity: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Tube with solution */}
        <rect x="30" y="25" width="60" height="30" fill={isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.25)'} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth="1.5" rx="4" />
        {/* Sugar molecules */}
        <text x="40" y="42" fill={isDark ? '#fbbf24' : '#d97706'} fontSize="8">🍬</text>
        <text x="55" y="38" fill={isDark ? '#fbbf24' : '#d97706'} fontSize="6">🍬</text>
        <text x="70" y="44" fill={isDark ? '#fbbf24' : '#d97706'} fontSize="7">🍬</text>
        {/* Input polarized light */}
        <line x1="5" y1="40" x2="25" y2="40" stroke="#22d3ee" strokeWidth="2" />
        <line x1="15" y1="32" x2="15" y2="48" stroke="#22d3ee" strokeWidth="2" />
        {/* Output rotated light */}
        <line x1="95" y1="40" x2="115" y2="40" stroke="#22d3ee" strokeWidth="2" />
        <line x1="105" y1="32" x2="105" y2="48" stroke="#22d3ee" strokeWidth="2" transform="rotate(35, 105, 40)" />
        {/* Rotation arc */}
        <path d="M 100,25 A 15,15 0 0,1 115,35" fill="none" stroke="#f472b6" strokeWidth="1.5" />
        <polygon points="115,35 110,32 112,38" fill="#f472b6" />
        <text x="100" y="18" fill="#f472b6" fontSize="7">α</text>
        {/* Arrow through tube */}
        <line x1="28" y1="40" x2="92" y2="40" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" strokeDasharray="3,2" />
        {/* Labels */}
        <text x="35" y="65" fill={isDark ? '#fbbf24' : '#d97706'} fontSize="6">sugar solution</text>
      </svg>
    ),
    transverse: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Propagation axis */}
        <line x1="10" y1="40" x2="110" y2="40" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" />
        <polygon points="110,40 105,37 105,43" fill={isDark ? '#475569' : '#94a3b8'} />
        <text x="105" y="55" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">k</text>
        {/* Transverse E-field oscillation */}
        <path
          d="M 15,40 L 15,20 M 30,40 L 30,60 M 45,40 L 45,20 M 60,40 L 60,60 M 75,40 L 75,20 M 90,40 L 90,60"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
        />
        {/* Arrowheads on E vectors */}
        <polygon points="15,20 12,25 18,25" fill="#22d3ee" />
        <polygon points="30,60 27,55 33,55" fill="#22d3ee" />
        <polygon points="45,20 42,25 48,25" fill="#22d3ee" />
        <polygon points="60,60 57,55 63,55" fill="#22d3ee" />
        <polygon points="75,20 72,25 78,25" fill="#22d3ee" />
        <polygon points="90,60 87,55 93,55" fill="#22d3ee" />
        {/* E label */}
        <text x="5" y="18" fill="#22d3ee" fontSize="8" fontWeight="bold">E</text>
        {/* Wave envelope */}
        <path
          d="M 10,40 Q 22,15 35,40 Q 47,65 60,40 Q 72,15 85,40 Q 97,65 110,40"
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1"
          opacity="0.4"
        />
        {/* "Transverse" label */}
        <text x="25" y="75" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="6">E ⊥ k (transverse)</text>
      </svg>
    ),
    stokes: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Stokes vector bracket */}
        <path d="M 20,10 L 15,10 L 15,70 L 20,70" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1.5" />
        <path d="M 50,10 L 55,10 L 55,70 L 50,70" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1.5" />
        {/* S0 - Total intensity */}
        <text x="25" y="22" fill="#fbbf24" fontSize="9" fontWeight="bold">S₀</text>
        <text x="60" y="22" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">← Total intensity</text>
        {/* S1 - Horizontal vs Vertical */}
        <text x="25" y="37" fill="#22d3ee" fontSize="9" fontWeight="bold">S₁</text>
        <text x="60" y="37" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">← H vs V</text>
        {/* S2 - Diagonal */}
        <text x="25" y="52" fill="#22c55e" fontSize="9" fontWeight="bold">S₂</text>
        <text x="60" y="52" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">← +45° vs -45°</text>
        {/* S3 - Circular */}
        <text x="25" y="67" fill="#f472b6" fontSize="9" fontWeight="bold">S₃</text>
        <text x="60" y="67" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="7">← R vs L circular</text>
        {/* Equals sign */}
        <text x="10" y="40" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">S =</text>
      </svg>
    ),
    mueller: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Input Stokes vector */}
        <g transform="translate(10, 40)">
          <rect x="-5" y="-25" width="12" height="50" fill={isDark ? 'rgba(34, 211, 238, 0.2)' : 'rgba(34, 211, 238, 0.3)'} stroke="#22d3ee" strokeWidth="1" rx="2" />
          <text x="-3" y="-10" fill="#22d3ee" fontSize="6">S₀</text>
          <text x="-3" y="0" fill="#22d3ee" fontSize="6">S₁</text>
          <text x="-3" y="10" fill="#22d3ee" fontSize="6">S₂</text>
          <text x="-3" y="20" fill="#22d3ee" fontSize="6">S₃</text>
        </g>
        {/* Multiplication sign */}
        <text x="22" y="43" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">×</text>
        {/* 4x4 Mueller Matrix */}
        <g transform="translate(55, 40)">
          <rect x="-22" y="-25" width="44" height="50" fill={isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.3)'} stroke="#8b5cf6" strokeWidth="1.5" rx="2" />
          <text x="-18" y="-10" fill="#8b5cf6" fontSize="5">m₀₀ m₀₁ m₀₂ m₀₃</text>
          <text x="-18" y="0" fill="#8b5cf6" fontSize="5">m₁₀ m₁₁ m₁₂ m₁₃</text>
          <text x="-18" y="10" fill="#8b5cf6" fontSize="5">m₂₀ m₂₁ m₂₂ m₂₃</text>
          <text x="-18" y="20" fill="#8b5cf6" fontSize="5">m₃₀ m₃₁ m₃₂ m₃₃</text>
        </g>
        {/* Equals sign */}
        <text x="82" y="43" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="10">=</text>
        {/* Output Stokes vector */}
        <g transform="translate(105, 40)">
          <rect x="-5" y="-25" width="14" height="50" fill={isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)'} stroke="#fbbf24" strokeWidth="1" rx="2" />
          <text x="-3" y="-10" fill="#fbbf24" fontSize="6">S'₀</text>
          <text x="-3" y="0" fill="#fbbf24" fontSize="6">S'₁</text>
          <text x="-3" y="10" fill="#fbbf24" fontSize="6">S'₂</text>
          <text x="-3" y="20" fill="#fbbf24" fontSize="6">S'₃</text>
        </g>
      </svg>
    ),
    medical: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Tissue sample */}
        <ellipse cx="60" cy="40" rx="30" ry="25" fill={isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.25)'} stroke={isDark ? '#ef4444' : '#dc2626'} strokeWidth="1.5" />
        {/* Collagen fibers (healthy - organized) */}
        <g opacity="0.6">
          <line x1="40" y1="30" x2="55" y2="30" stroke={isDark ? '#f472b6' : '#ec4899'} strokeWidth="1" />
          <line x1="42" y1="35" x2="58" y2="35" stroke={isDark ? '#f472b6' : '#ec4899'} strokeWidth="1" />
          <line x1="40" y1="40" x2="56" y2="40" stroke={isDark ? '#f472b6' : '#ec4899'} strokeWidth="1" />
        </g>
        {/* Cancer region (disorganized) */}
        <circle cx="72" cy="42" r="10" fill={isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.4)'} stroke="#fbbf24" strokeWidth="1" strokeDasharray="2,1" />
        <line x1="66" y1="38" x2="72" y2="45" stroke="#fbbf24" strokeWidth="1" />
        <line x1="70" y1="36" x2="78" y2="42" stroke="#fbbf24" strokeWidth="1" />
        <line x1="68" y1="46" x2="76" y2="40" stroke="#fbbf24" strokeWidth="1" />
        {/* Polarized light input */}
        <line x1="5" y1="40" x2="25" y2="40" stroke="#22d3ee" strokeWidth="2" />
        <line x1="15" y1="32" x2="15" y2="48" stroke="#22d3ee" strokeWidth="2" />
        {/* Camera/detector */}
        <rect x="100" y="30" width="15" height="20" fill={isDark ? '#475569' : '#94a3b8'} rx="2" />
        <circle cx="107" cy="40" r="5" fill={isDark ? '#1e293b' : '#334155'} />
        <circle cx="107" cy="40" r="3" fill="#3b82f6" />
        {/* Output arrow */}
        <line x1="92" y1="40" x2="98" y2="40" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1" />
        {/* Labels */}
        <text x="35" y="75" fill={isDark ? '#ef4444' : '#dc2626'} fontSize="6">tissue</text>
        <text x="68" y="60" fill="#fbbf24" fontSize="5">cancer</text>
      </svg>
    ),
    metasurface: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Substrate */}
        <rect x="30" y="35" width="60" height="10" fill={isDark ? '#475569' : '#94a3b8'} />
        {/* Nano-pillars array */}
        {[35, 45, 55, 65, 75, 85].map((x, i) => (
          <g key={i}>
            <rect
              x={x - 2}
              y={22 - (i % 2) * 3}
              width="4"
              height={13 + (i % 2) * 3}
              fill={isDark ? '#8b5cf6' : '#a855f7'}
              rx="1"
            />
          </g>
        ))}
        {/* Input light beam */}
        <line x1="5" y1="30" x2="28" y2="30" stroke="#fbbf24" strokeWidth="2" />
        <polygon points="28,30 23,27 23,33" fill="#fbbf24" />
        {/* Multiple output beams (beam steering) */}
        <line x1="92" y1="30" x2="115" y2="15" stroke="#22d3ee" strokeWidth="1.5" />
        <line x1="92" y1="30" x2="115" y2="30" stroke="#22d3ee" strokeWidth="1.5" />
        <line x1="92" y1="30" x2="115" y2="45" stroke="#22d3ee" strokeWidth="1.5" />
        {/* Polarization states */}
        <circle cx="115" cy="15" r="3" fill="none" stroke="#22d3ee" strokeWidth="1" />
        <line x1="113" y1="13" x2="117" y2="17" stroke="#22d3ee" strokeWidth="1" />
        <ellipse cx="115" cy="30" rx="4" ry="2" fill="none" stroke="#22d3ee" strokeWidth="1" />
        <line x1="112" y1="45" x2="118" y2="45" stroke="#22d3ee" strokeWidth="1.5" />
        {/* Control signal */}
        <path d="M 60,50 L 60,60 L 50,60" fill="none" stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1" />
        <text x="35" y="65" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="6">control</text>
        {/* Label */}
        <text x="35" y="75" fill={isDark ? '#8b5cf6' : '#7c3aed'} fontSize="6">metasurface</text>
      </svg>
    ),
    quantum: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* Source (entangled photon pair generator) */}
        <rect x="45" y="32" width="30" height="16" fill={isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.4)'} stroke="#8b5cf6" strokeWidth="1.5" rx="3" />
        <text x="52" y="43" fill="#8b5cf6" fontSize="6">BBO</text>
        {/* Pump laser */}
        <line x1="20" y1="40" x2="43" y2="40" stroke="#a855f7" strokeWidth="2" />
        <polygon points="43,40 38,37 38,43" fill="#a855f7" />
        <text x="22" y="35" fill={isDark ? '#a855f7' : '#9333ea'} fontSize="6">pump</text>
        {/* Entangled photon 1 */}
        <line x1="77" y1="35" x2="100" y2="20" stroke="#22d3ee" strokeWidth="2" />
        <circle cx="105" cy="17" r="4" fill="#22d3ee" />
        {/* Entangled photon 2 */}
        <line x1="77" y1="45" x2="100" y2="60" stroke="#f472b6" strokeWidth="2" />
        <circle cx="105" cy="63" r="4" fill="#f472b6" />
        {/* Entanglement wavy connection */}
        <path d="M 105,22 Q 115,40 105,58" fill="none" stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth="1" strokeDasharray="2,2" />
        {/* Entanglement symbol */}
        <text x="110" y="42" fill={isDark ? '#fbbf24' : '#d97706'} fontSize="8">⟨ψ⟩</text>
        {/* Labels */}
        <text x="95" y="10" fill="#22d3ee" fontSize="6">|H⟩+|V⟩</text>
        <text x="95" y="75" fill="#f472b6" fontSize="6">|V⟩+|H⟩</text>
        {/* Sub-shot noise indicator */}
        <text x="5" y="70" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="5">Δ &lt; SQL</text>
      </svg>
    ),
    chromaticpol: (
      <svg viewBox="0 0 120 80" className={className}>
        {/* White light source */}
        <circle cx="8" cy="40" r="5" fill="#fff" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <line
            key={i}
            x1={8 + 6 * Math.cos(angle * Math.PI / 180)}
            y1={40 + 6 * Math.sin(angle * Math.PI / 180)}
            x2={8 + 9 * Math.cos(angle * Math.PI / 180)}
            y2={40 + 9 * Math.sin(angle * Math.PI / 180)}
            stroke="#fff"
            strokeWidth="1"
          />
        ))}
        {/* First polarizer (vertical lines) */}
        <rect x="22" y="20" width="8" height="40" fill={isDark ? 'rgba(34, 211, 238, 0.3)' : 'rgba(34, 211, 238, 0.4)'} stroke="#22d3ee" strokeWidth="1.5" />
        <line x1="26" y1="22" x2="26" y2="58" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3,2" />
        {/* Thin crystal plate (mica) - with birefringence effect */}
        <rect x="45" y="25" width="15" height="30" fill={isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)'} stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth="1.5" rx="2" />
        {/* Crystal internal structure */}
        <line x1="48" y1="28" x2="57" y2="52" stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth="1" opacity="0.5" />
        <line x1="52" y1="28" x2="52" y2="52" stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth="1" opacity="0.5" />
        {/* Second polarizer (horizontal lines - crossed) */}
        <rect x="75" y="20" width="8" height="40" fill={isDark ? 'rgba(244, 114, 182, 0.3)' : 'rgba(244, 114, 182, 0.4)'} stroke="#f472b6" strokeWidth="1.5" />
        <line x1="76" y1="40" x2="82" y2="40" stroke="#f472b6" strokeWidth="2" strokeDasharray="3,2" />
        {/* Output interference colors (rainbow spectrum) */}
        <rect x="95" y="28" width="20" height="5" fill="#ef4444" rx="1" />
        <rect x="95" y="33" width="20" height="4" fill="#f97316" rx="1" />
        <rect x="95" y="37" width="20" height="4" fill="#eab308" rx="1" />
        <rect x="95" y="41" width="20" height="4" fill="#22c55e" rx="1" />
        <rect x="95" y="45" width="20" height="4" fill="#3b82f6" rx="1" />
        <rect x="95" y="49" width="20" height="4" fill="#8b5cf6" rx="1" />
        {/* Light path arrows */}
        <line x1="14" y1="40" x2="20" y2="40" stroke="#fff" strokeWidth="1.5" />
        <line x1="32" y1="40" x2="43" y2="40" stroke="#22d3ee" strokeWidth="1.5" />
        <line x1="62" y1="40" x2="73" y2="40" stroke={isDark ? '#fbbf24' : '#d97706'} strokeWidth="1.5" />
        <line x1="85" y1="40" x2="93" y2="40" stroke="#f472b6" strokeWidth="1.5" />
        {/* Labels */}
        <text x="22" y="68" fill={isDark ? '#22d3ee' : '#0891b2'} fontSize="5">P₁</text>
        <text x="48" y="68" fill={isDark ? '#fbbf24' : '#d97706'} fontSize="5">mica</text>
        <text x="75" y="68" fill={isDark ? '#f472b6' : '#db2777'} fontSize="5">P₂⊥</text>
        <text x="98" y="68" fill={isDark ? '#94a3b8' : '#64748b'} fontSize="5">colors</text>
      </svg>
    ),
  }

  return illustrations[type] || null
}

// ============================================
// ResourceGallery Component - 可展开的资源画廊
// 展示与时间线事件相关的实验图片和视频
