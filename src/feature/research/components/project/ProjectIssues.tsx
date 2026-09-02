import type { ReactNode } from 'react';
import { CircleCheck, CircleDot, FilePenLine } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { ProjectLifecycleBadges } from '../../projectLifecycle';
import {
  buildProjectIssue,
  getProjectFirstStep,
  getProjectIssueStateMeta,
  type ProjectIssueRoleOption,
  type ProjectIssueSource,
} from './projectIssue';
import { ProjectRoleBadge } from './ProjectRoleBadge';

interface ProjectIssuePreviewProps {
  project: ProjectIssueSource;
  className?: string;
  showCurrentGapAndFirstStep?: boolean;
}

interface ProjectIssueDetailProps {
  project: ProjectIssueSource;
  className?: string;
}

function IssueChip({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
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

function IssueList({
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
        <IssueChip key={item}>{item}</IssueChip>
      ))}
    </div>
  );
}

function IssueRoleList({
  options,
  fallbackItems,
  fallback,
  maxItems,
}: {
  options: ProjectIssueRoleOption[];
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

  return <IssueList items={fallbackItems} fallback={fallback} maxItems={maxItems} />;
}

function IssueBodySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--research-line)] px-5 py-5 last:border-b-0 sm:px-6">
      <h2 className="mb-3 text-lg font-bold text-[var(--paper-foreground)]">{title}</h2>
      {children}
    </section>
  );
}

export function ProjectIssueStateBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const state = getProjectIssueStateMeta(status);
  const Icon = state.key === 'open' ? CircleDot : state.key === 'closed' ? CircleCheck : FilePenLine;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
        state.key === 'open' && 'research-tint-mint',
        state.key === 'closed' && 'research-chip',
        state.key === 'draft' && 'research-tint-ochre',
        className
      )}
      data-issue-state={state.key}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {state.label}
    </span>
  );
}

export function ProjectIssuePreview({
  project,
  className,
  showCurrentGapAndFirstStep = true,
}: ProjectIssuePreviewProps) {
  const issue = buildProjectIssue(project);

  return (
    <div className={cn('research-panel-soft rounded-2xl p-4', className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {issue.issueNumberLabel && <IssueChip>{issue.issueNumberLabel}</IssueChip>}
        <ProjectIssueStateBadge status={project.status} />
        <ProjectLifecycleBadges status={project.status} isDormant={project.is_dormant} />
        <IssueChip accent>{issue.difficultyLabel}</IssueChip>
        <IssueChip>{issue.recruitmentState}</IssueChip>
      </div>

      <div className="space-y-3">
        {showCurrentGapAndFirstStep && (
          <div className="research-tint-pink rounded-2xl border px-3 py-3">
            <p className="mb-2 text-sm font-semibold text-[var(--paper-foreground)]">当前缺口</p>
            <IssueRoleList
              options={issue.missingRoleOptions}
              fallbackItems={issue.missingRoleItems}
              fallback={issue.missingRoles}
              maxItems={4}
            />
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-medium text-[var(--glass-text-muted)]">适合角色</p>
          <IssueList items={issue.roleItems} fallback={issue.roles} maxItems={4} />
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

export function ProjectIssueDetail({ project, className }: ProjectIssueDetailProps) {
  const issue = buildProjectIssue(project);
  const recruitmentRequirements = project.recruitment_requirements?.trim();
  const requirementItems = (recruitmentRequirements ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const participationSections = [
    { title: '入门步骤', text: issue.beginnerSteps },
    { title: '最低交付物', text: issue.minDeliverables },
    { title: '评价标准', text: issue.reviewCriteria },
    { title: '时间节奏', text: issue.timeline },
  ];

  return (
    <div className={cn('grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]', className)}>
      <aside
        className="research-card self-start lg:col-start-2 lg:row-start-1"
        aria-label="议题协作信息"
      >
        <div className="research-card-head">
          <h2 className="text-lg font-bold text-[var(--paper-foreground)]">协作信息</h2>
        </div>
        <div className="divide-y divide-[var(--research-line)]">
          <section className="research-tint-pink p-4">
            <h3 className="mb-2.5 text-base font-bold text-[var(--paper-foreground)]">当前缺口</h3>
            <IssueRoleList
              options={issue.missingRoleOptions}
              fallbackItems={issue.missingRoleItems}
              fallback={issue.missingRoles}
            />
          </section>
          <section className="p-4">
            <h3 className="mb-2.5 text-base font-bold text-[var(--paper-foreground)]">适合角色</h3>
            <IssueList items={issue.roleItems} fallback={issue.roles} />
          </section>
          <section className="p-4">
            <h3 className="mb-2.5 text-base font-bold text-[var(--paper-foreground)]">标签</h3>
            <div className="flex flex-wrap gap-2">
              <ProjectLifecycleBadges status={project.status} isDormant={project.is_dormant} />
              <IssueChip accent>{issue.difficultyLabel}</IssueChip>
              <IssueChip>{issue.recruitmentState}</IssueChip>
            </div>
          </section>
        </div>
      </aside>

      <article
        className="research-card lg:col-start-1 lg:row-start-1"
        aria-label="议题正文"
      >
        <IssueBodySection title="议题价值">
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
            {issue.value}
          </p>
        </IssueBodySection>

        <IssueBodySection title="研究目标">
          <ol className="flex flex-col gap-3.5">
            {issue.objectiveItems.map((objective, index) => (
              <li key={objective} className="flex items-start gap-3.5">
                <span className="research-step-dot mt-0.5">{index + 1}</span>
                <p className="flex-1 pt-1 text-base leading-6 text-[var(--paper-foreground)]">
                  {objective}
                </p>
              </li>
            ))}
          </ol>
        </IssueBodySection>

        {issue.progress && (
          <IssueBodySection title="最新进展">
            <p className="whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
              {issue.progress}
            </p>
          </IssueBodySection>
        )}

        {requirementItems.length > 0 && (
          <IssueBodySection title="招募要求">
            <ul className="list-disc space-y-2.5 pl-5 text-base leading-6 text-[var(--paper-foreground)]">
              {requirementItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </IssueBodySection>
        )}

        {participationSections.map((section) => (
          <IssueBodySection key={section.title} title={section.title}>
            <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
              {section.text}
            </p>
          </IssueBodySection>
        ))}
      </article>
    </div>
  );
}
