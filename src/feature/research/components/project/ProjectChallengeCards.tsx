import type { ReactNode } from 'react';
import { Award, ClipboardCheck, Compass, Flag, Footprints, Gauge, Target, Users } from 'lucide-react';
import { cn } from '@/utils/classNames';
import {
  buildProjectChallengeCard,
  getProjectFirstStep,
  type ChallengeRoleOption,
  type ProjectChallengeSource,
} from './projectChallengeCard';
import { ProjectRoleBadge } from './ProjectRoleBadge';

interface ProjectChallengePreviewProps {
  project: ProjectChallengeSource;
  className?: string;
}

interface ProjectChallengeDetailProps {
  project: ProjectChallengeSource;
  className?: string;
}

function ChallengeChip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        'research-chip inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
        accent && 'research-chip-accent font-semibold'
      )}
    >
      {children}
    </span>
  );
}

function ChallengeList({
  items,
  fallback,
  maxItems,
}: {
  items: string[];
  fallback: string;
  maxItems?: number;
}) {
  const visibleItems = items.length > 0 ? items : [fallback];
  const renderedItems = typeof maxItems === 'number' ? visibleItems.slice(0, maxItems) : visibleItems;

  return (
    <div className="flex flex-wrap gap-2">
      {renderedItems.map((item) => (
        <ChallengeChip key={item}>{item}</ChallengeChip>
      ))}
    </div>
  );
}

function ChallengeRoleList({
  options,
  fallbackItems,
  fallback,
  maxItems,
}: {
  options: ChallengeRoleOption[];
  fallbackItems: string[];
  fallback: string;
  maxItems?: number;
}) {
  const visibleOptions = typeof maxItems === 'number' ? options.slice(0, maxItems) : options;

  if (visibleOptions.length > 0) {
    return (
      <div className="flex flex-wrap gap-2">
        {visibleOptions.map((option, index) => (
          <ProjectRoleBadge key={option.id} seed={index} className="text-sm">
            {option.label}
          </ProjectRoleBadge>
        ))}
      </div>
    );
  }

  return <ChallengeList items={fallbackItems} fallback={fallback} maxItems={maxItems} />;
}

function ChallengeSection({
  title,
  icon,
  children,
  accent = false,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-[1.35rem] border p-4',
        accent
          ? 'border-[#ffb084]/45 bg-[#ffb084]/18'
          : 'border-[var(--glass-stroke)] bg-[var(--glass-surface-soft)]'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/70 text-[var(--paper-link)]">
          {icon}
        </span>
        <h3 className="text-base font-semibold text-[var(--paper-foreground)]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function ProjectChallengePreview({ project, className }: ProjectChallengePreviewProps) {
  const challenge = buildProjectChallengeCard(project);

  return (
    <div className={cn('research-panel-soft rounded-[1.25rem] p-4', className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ChallengeChip accent>{challenge.difficultyLabel}</ChallengeChip>
        <ChallengeChip>{challenge.progress}</ChallengeChip>
        <ChallengeChip>{challenge.recruitmentState}</ChallengeChip>
      </div>

      <div className="space-y-3">
        <div
          className="rounded-[1rem] border px-3 py-3"
          style={{
            borderColor: 'color-mix(in srgb, #ff4d8b 24%, var(--glass-stroke))',
            background: 'color-mix(in srgb, #ff4d8b 7%, transparent)',
          }}
        >
          <p className="mb-2 text-sm font-semibold text-[var(--paper-foreground)]">当前缺口</p>
          <ChallengeRoleList
            options={challenge.missingRoleOptions}
            fallbackItems={challenge.missingRoleItems}
            fallback={challenge.missingRoles}
            maxItems={4}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--glass-text-muted)]">适合角色</p>
          <ChallengeList items={challenge.roleItems} fallback={challenge.roles} maxItems={4} />
        </div>

        <div
          className="rounded-[1rem] px-3 py-2"
          style={{ background: 'color-mix(in srgb, var(--paper-link) 8%, transparent)' }}
        >
          <p className="text-sm font-medium text-[var(--glass-text-muted)]">第一步</p>
          <p className="mt-1 text-base leading-6 text-[var(--paper-foreground)]">
            {getProjectFirstStep(project)}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProjectChallengeDetail({ project, className }: ProjectChallengeDetailProps) {
  const challenge = buildProjectChallengeCard(project);

  return (
    <section className={cn('research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6', className)}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            挑战卡
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-6 text-[var(--glass-text-muted)]">
            把课题拆成学生可以直接理解的目标、角色和交付物。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ChallengeChip accent>{challenge.difficultyLabel}</ChallengeChip>
          <ChallengeChip>{challenge.progress}</ChallengeChip>
          <ChallengeChip>{challenge.recruitmentState}</ChallengeChip>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <ChallengeSection title="挑战价值" icon={<Compass className="h-4 w-4" />} accent>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
            {challenge.value}
          </p>
        </ChallengeSection>

        <ChallengeSection title="适合角色" icon={<Users className="h-4 w-4" />}>
          <ChallengeList items={challenge.roleItems} fallback={challenge.roles} />
        </ChallengeSection>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ChallengeSection title="挑战目标" icon={<Target className="h-4 w-4" />}>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {challenge.objectives}
          </p>
        </ChallengeSection>

        <ChallengeSection title="入门步骤" icon={<Footprints className="h-4 w-4" />}>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {challenge.beginnerSteps}
          </p>
        </ChallengeSection>

        <ChallengeSection title="最低交付物" icon={<ClipboardCheck className="h-4 w-4" />}>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {challenge.minDeliverables}
          </p>
        </ChallengeSection>

        <ChallengeSection title="评价标准" icon={<Award className="h-4 w-4" />}>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {challenge.reviewCriteria}
          </p>
        </ChallengeSection>

        <ChallengeSection title="时间节奏" icon={<Flag className="h-4 w-4" />}>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {challenge.timeline}
          </p>
        </ChallengeSection>

        <ChallengeSection title="当前缺口" icon={<Gauge className="h-4 w-4" />}>
          <ChallengeRoleList
            options={challenge.missingRoleOptions}
            fallbackItems={challenge.missingRoleItems}
            fallback={challenge.missingRoles}
          />
        </ChallengeSection>
      </div>
    </section>
  );
}
