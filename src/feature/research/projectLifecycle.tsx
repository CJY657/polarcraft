import type { CSSProperties } from 'react';
import { Check } from 'lucide-react';

export const PROJECT_LIFECYCLE_STATUSES = [
  'draft',
  'recruiting',
  'forming',
  'active',
  'review_pending',
  'showcased',
  'relay_open',
  'archived',
] as const;

export type ProjectStatus = (typeof PROJECT_LIFECYCLE_STATUSES)[number];

interface ProjectStatusMeta {
  label: string;
  style: CSSProperties;
}

const UNKNOWN_STATUS_STYLE: CSSProperties = {
  color: 'var(--glass-text-muted)',
  borderColor: 'var(--glass-stroke)',
  background: 'color-mix(in srgb, var(--glass-chip) 90%, transparent)',
};

const PROJECT_STATUS_META: Record<ProjectStatus, ProjectStatusMeta> = {
  draft: {
    label: '草稿',
    style: {
      color: 'var(--glass-text-muted)',
      borderColor: 'var(--glass-stroke)',
      background: 'color-mix(in srgb, var(--glass-chip) 90%, transparent)',
    },
  },
  recruiting: {
    label: '招募中',
    style: {
      color: '#0a0a0a',
      borderColor: '#d93670',
      background: '#ff4d8b',
    },
  },
  forming: {
    label: '组队中',
    style: {
      color: '#0a0a0a',
      borderColor: '#8f78c9',
      background: '#b8a4ed',
    },
  },
  active: {
    label: '进行中',
    style: {
      color: '#0a0a0a',
      borderColor: '#6cae99',
      background: '#a4d4c5',
    },
  },
  review_pending: {
    label: '待评审',
    style: {
      color: '#0a0a0a',
      borderColor: '#b8891d',
      background: '#e8b94a',
    },
  },
  showcased: {
    label: '已展示',
    style: {
      color: '#0a0a0a',
      borderColor: '#d98255',
      background: '#ffb084',
    },
  },
  relay_open: {
    label: '接力开放',
    style: {
      color: '#ffffff',
      borderColor: '#1a3a3a',
      background: '#1a3a3a',
    },
  },
  archived: {
    label: '已归档',
    style: {
      color: 'var(--glass-text-muted)',
      borderColor: 'var(--glass-stroke)',
      background: 'color-mix(in srgb, var(--glass-surface-soft) 92%, transparent)',
    },
  },
};

export function getProjectStatusMeta(status: string): ProjectStatusMeta {
  if (status === 'completed') {
    return {
      ...PROJECT_STATUS_META.review_pending,
      label: '待评审（旧状态）',
    };
  }

  if (PROJECT_LIFECYCLE_STATUSES.includes(status as ProjectStatus)) {
    return PROJECT_STATUS_META[status as ProjectStatus];
  }

  return {
    label: `状态：${status || '未知'}`,
    style: UNKNOWN_STATUS_STYLE,
  };
}

export function getProjectStatusControlOptions(status: ProjectStatus, canRollback = false) {
  const currentIndex = PROJECT_LIFECYCLE_STATUSES.indexOf(status);
  return PROJECT_LIFECYCLE_STATUSES.map((value, index) => {
    const isCurrent = index === currentIndex;
    const isNext = index === currentIndex + 1;
    const isPrevious = canRollback && index < currentIndex;

    return {
      value,
      label: PROJECT_STATUS_META[value].label,
      disabled: canRollback ? false : !(isCurrent || isNext || isPrevious),
    };
  });
}

export function ProjectLifecycleBadges({
  status,
  isDormant = false,
  className = '',
}: {
  status: string;
  isDormant?: boolean;
  className?: string;
}) {
  const meta = getProjectStatusMeta(status);

  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <span
        className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold"
        style={meta.style}
      >
        {meta.label}
      </span>
      {isDormant && (
        <span
          className="inline-flex items-center rounded-full border bg-transparent px-3 py-1 text-[11px] font-semibold"
          style={{
            color: '#a83224',
            borderColor: 'var(--brand-coral, #ff6b5a)',
          }}
        >
          休眠
        </span>
      )}
    </span>
  );
}

export function ProjectLifecycleJourney({ status }: { status: string }) {
  const normalizedStatus = status === 'completed' ? 'review_pending' : status;
  const currentIndex = PROJECT_LIFECYCLE_STATUSES.indexOf(normalizedStatus as ProjectStatus);

  return (
    <section
      className="research-panel mb-8 rounded-[1.7rem] px-5 py-5 sm:px-6"
      aria-labelledby="project-lifecycle-journey-title"
    >
      <div className="mb-5">
        <h2
          id="project-lifecycle-journey-title"
          className="text-lg font-semibold text-[var(--paper-foreground)]"
        >
          课题旅程
        </h2>
        <p className="mt-1 text-sm text-[var(--glass-text-muted)]">
          从草稿到归档，当前阶段和后续路径一目了然。
        </p>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-8" aria-label="课题生命周期">
        {PROJECT_LIFECYCLE_STATUSES.map((stage, index) => {
          const meta = PROJECT_STATUS_META[stage];
          const isCompleted = currentIndex >= 0 && index < currentIndex;
          const isCurrent = index === currentIndex;
          const isReached = isCompleted || isCurrent;

          return (
            <li
              key={stage}
              className="relative grid grid-cols-[2rem_1fr] items-center gap-3 pb-4 last:pb-0 md:grid-cols-1 md:justify-items-center md:gap-2 md:pb-0"
              data-state={isCurrent ? 'current' : isCompleted ? 'completed' : 'upcoming'}
              aria-current={isCurrent ? 'step' : undefined}
            >
              {index < PROJECT_LIFECYCLE_STATUSES.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[0.9375rem] top-8 h-[calc(100%-1rem)] w-px md:left-1/2 md:top-4 md:h-px md:w-full"
                  style={{
                    background: isCompleted ? 'var(--paper-accent)' : 'var(--glass-stroke-strong)',
                  }}
                />
              )}

              <span
                aria-hidden="true"
                className="relative z-[1] flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold"
                style={isReached ? meta.style : UNKNOWN_STATUS_STYLE}
              >
                {isCompleted ? <Check className="h-4 w-4" strokeWidth={2.5} /> : (
                  <span className="h-2 w-2 rounded-full bg-current" />
                )}
              </span>

              <span
                className={`text-sm font-medium md:text-center ${
                  isCurrent ? 'text-[var(--paper-foreground)]' : 'text-[var(--glass-text-muted)]'
                }`}
              >
                {meta.label}
              </span>
            </li>
          );
        })}
      </ol>

      {currentIndex < 0 && (
        <p className="mt-4 text-sm text-[var(--glass-text-muted)]">
          当前状态尚未纳入标准课题流程。
        </p>
      )}
    </section>
  );
}
