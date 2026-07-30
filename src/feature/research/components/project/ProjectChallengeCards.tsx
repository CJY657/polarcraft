import type { ReactNode } from 'react';
import { cn } from '@/utils/classNames';
import { ProjectLifecycleBadges } from '../../projectLifecycle';
import { ResearchSectionCard } from '../shared/ResearchSectionCard';
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
  showCurrentGapAndFirstStep?: boolean;
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
  children,
  accent = false,
}: {
  title: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={cn(
        'rounded-[0.625rem] border p-4',
        accent ? 'research-tint-peach' : 'research-panel-soft'
      )}
    >
      <h3 className="mb-2.5 text-base font-bold text-[var(--paper-foreground)]">{title}</h3>
      {children}
    </section>
  );
}

export function ProjectChallengePreview({
  project,
  className,
  showCurrentGapAndFirstStep = true,
}: ProjectChallengePreviewProps) {
  const challenge = buildProjectChallengeCard(project);

  return (
    <div className={cn('research-panel-soft rounded-2xl p-4', className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <ProjectLifecycleBadges status={project.status} isDormant={project.is_dormant} />
        <ChallengeChip accent>{challenge.difficultyLabel}</ChallengeChip>
        <ChallengeChip>{challenge.progress}</ChallengeChip>
        <ChallengeChip>{challenge.recruitmentState}</ChallengeChip>
      </div>

      <div className="space-y-3">
        {showCurrentGapAndFirstStep && (
          <div className="research-tint-pink rounded-2xl border px-3 py-3">
            <p className="mb-2 text-sm font-semibold text-[var(--paper-foreground)]">当前缺口</p>
            <ChallengeRoleList
              options={challenge.missingRoleOptions}
              fallbackItems={challenge.missingRoleItems}
              fallback={challenge.missingRoles}
              maxItems={4}
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--glass-text-muted)]">适合角色</p>
          <ChallengeList items={challenge.roleItems} fallback={challenge.roles} maxItems={4} />
        </div>

        {showCurrentGapAndFirstStep && (
          <div
            className="rounded-2xl px-3 py-2"
            style={{ background: 'color-mix(in srgb, var(--paper-link) 8%, transparent)' }}
          >
            <p className="text-sm font-medium text-[var(--glass-text-muted)]">第一步</p>
            <p className="mt-1 text-base leading-6 text-[var(--paper-foreground)]">
              {getProjectFirstStep(project)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectChallengeDetail({ project, className }: ProjectChallengeDetailProps) {
  const challenge = buildProjectChallengeCard(project);
  const recruitmentRequirements = project.recruitment_requirements?.trim();
  const requirementItems = (recruitmentRequirements ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const specRows = [
    { title: '入门步骤', text: challenge.beginnerSteps },
    { title: '最低交付物', text: challenge.minDeliverables },
    { title: '评价标准', text: challenge.reviewCriteria },
    { title: '时间节奏', text: challenge.timeline },
  ];

  return (
    <div className={cn('flex flex-col gap-4.5', className)}>
      <ResearchSectionCard
        title="挑战卡"
        note="课题目标、当前缺口与协作需求一览"
        actions={
          <>
            <ChallengeChip accent>{challenge.difficultyLabel}</ChallengeChip>
            <ChallengeChip>{challenge.progress}</ChallengeChip>
            <ChallengeChip>{challenge.recruitmentState}</ChallengeChip>
          </>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(17rem,0.9fr)]">
          <ChallengeSection title="挑战价值" accent>
            <p className="whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
              {challenge.value}
            </p>
          </ChallengeSection>

          <div className="grid content-start gap-4">
            <section className="research-tint-pink rounded-[0.625rem] border p-4">
              <h3 className="mb-2.5 text-base font-bold text-[var(--paper-foreground)]">当前缺口</h3>
              <ChallengeRoleList
                options={challenge.missingRoleOptions}
                fallbackItems={challenge.missingRoleItems}
                fallback={challenge.missingRoles}
              />
            </section>

            <ChallengeSection title="适合角色">
              <ChallengeList items={challenge.roleItems} fallback={challenge.roles} />
            </ChallengeSection>
          </div>
        </div>
      </ResearchSectionCard>

      <ResearchSectionCard title="研究目标">
        <ol className="flex flex-col gap-3.5">
          {challenge.objectiveItems.map((objective, index) => (
            <li key={objective} className="flex items-start gap-3.5">
              <span className="research-step-dot mt-0.5">{index + 1}</span>
              <p className="flex-1 pt-1 text-base leading-6 text-[var(--paper-foreground)]">
                {objective}
              </p>
            </li>
          ))}
        </ol>
      </ResearchSectionCard>

      {requirementItems.length > 0 && (
        <ResearchSectionCard
          title="招募要求"
          actions={
            <ChallengeChip accent>
              {challenge.recruitmentState}
            </ChallengeChip>
          }
        >
          <ul className="flex flex-col gap-2.5">
            {requirementItems.map((item) => (
              <li
                key={item}
                className="border-l-[3px] border-[var(--paper-accent)] pl-3 text-base leading-6 text-[var(--paper-foreground)]"
              >
                {item}
              </li>
            ))}
          </ul>
        </ResearchSectionCard>
      )}

      <ResearchSectionCard title="参与方式" flush>
        <dl className="divide-y divide-[var(--research-line)] px-5">
          {specRows.map((row) => (
            <div key={row.title} className="grid gap-1.5 py-3.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="self-start text-base font-bold text-[var(--paper-foreground)]">
                {row.title}
              </dt>
              <dd className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
                {row.text}
              </dd>
            </div>
          ))}
        </dl>
      </ResearchSectionCard>
    </div>
  );
}
