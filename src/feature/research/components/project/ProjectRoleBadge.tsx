import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/utils/classNames';

const roleBadgeAccents = [
  { fill: '#ff4d8b', text: '#9d174d' },
  { fill: '#1a3a3a', text: '#f8fffb' },
  { fill: '#b8a4ed', text: '#3f2b70' },
  { fill: '#ffb084', text: '#6b2f12' },
  { fill: '#e8b94a', text: '#4b3600' },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getProjectRoleBadgeStyle(
  seed: string | number,
  options: { selected?: boolean } = {}
): CSSProperties {
  const index = typeof seed === 'number' ? seed : hashSeed(seed);
  const accent = roleBadgeAccents[Math.abs(index) % roleBadgeAccents.length];
  const fillStrength = options.selected ? 24 : 14;
  const borderStrength = options.selected ? 62 : 38;

  return {
    color: accent.text,
    borderColor: `color-mix(in srgb, ${accent.fill} ${borderStrength}%, var(--glass-stroke))`,
    background: `color-mix(in srgb, ${accent.fill} ${fillStrength}%, transparent)`,
  };
}

export function ProjectRoleBadge({
  children,
  seed,
  selected = false,
  className,
}: {
  children: ReactNode;
  seed: string | number;
  selected?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full border px-3 py-1 text-sm font-semibold leading-5',
        className
      )}
      style={getProjectRoleBadgeStyle(seed, { selected })}
    >
      {children}
    </span>
  );
}
