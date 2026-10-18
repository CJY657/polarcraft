import { useState } from 'react';
import { CircleCheck, CircleDot, FilePenLine } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { ProjectLifecycleBadges } from '../../projectLifecycle';
import { splitResearchItems } from '../../pages/researchProjectViewModel';
import type { ProjectDiscussionOutline } from './ProjectDiscussionSection';
import {
  buildProjectIssue,
  getProjectFirstStep,
  getProjectIssueStateMeta,
  type ProjectIssueRoleOption,
  type ProjectIssueSource,
} from './projectIssue';
import { ProjectRoleBadge } from './ProjectRoleBadge';
import { ResearchChip } from '../shared/ResearchChip';

interface ProjectIssuePreviewProps {
  project: ProjectIssueSource;
  className?: string;
  showCurrentGapAndFirstStep?: boolean;
}

interface ProjectIssueDetailProps {
  project: ProjectIssueSource;
  outline?: ProjectDiscussionOutline;
  canManageQuestions?: boolean;
  onManageQuestions?: () => void;
  className?: string;
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
        <ResearchChip key={item}>{item}</ResearchChip>
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
        {issue.issueNumberLabel && <ResearchChip>{issue.issueNumberLabel}</ResearchChip>}
        {issue.state.key === 'open' && <ProjectIssueStateBadge status={project.status} />}
        <ProjectLifecycleBadges status={project.status} isDormant={project.is_dormant} />
        <ResearchChip accent>{issue.difficultyLabel}</ResearchChip>
        <ResearchChip>{issue.recruitmentState}</ResearchChip>
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
          <p className="mb-2 text-sm font-medium text-[var(--research-muted)]">适合角色</p>
          <IssueList items={issue.roleItems} fallback={issue.roles} maxItems={4} />
        </div>

        {showCurrentGapAndFirstStep && (
          <div
            className="rounded-2xl px-3 py-2"
            style={{ background: 'color-mix(in srgb, var(--paper-link) 8%, transparent)' }}
          >
            <p className="text-sm font-medium text-[var(--research-muted)]">第一步</p>
            <p className="mt-1 text-base leading-6 text-[var(--paper-foreground)]">
              {getProjectFirstStep(project)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectIssueDetail({
  project,
  outline,
  canManageQuestions = false,
  onManageQuestions,
  className,
}: ProjectIssueDetailProps) {
  const issue = buildProjectIssue(project);
  const recruitmentRequirements = project.recruitment_requirements?.trim();
  const requirementItems = (recruitmentRequirements ?? '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const questions = outline?.questions ?? splitResearchItems(project.research_questions_zh);
  const hypotheses = outline?.hypotheses ?? splitResearchItems(project.research_hypotheses_zh);
  const basicPlan = (outline?.basicPlan ?? project.basic_plan_zh ?? '').trim();
  const extendedPlan = (outline?.extendedPlan ?? project.extended_plan_zh ?? '').trim();
  const hasBasicPlan = Boolean(basicPlan);
  const hasExtendedPlan = Boolean(extendedPlan);
  const pairCount = Math.max(questions.length, hypotheses.length);
  const showQuestionHypothesisCard = pairCount > 0 || canManageQuestions;

  // 手账单页收起/展开状态
  const [foldedSheets, setFoldedSheets] = useState<Record<string, boolean>>({});
  // 问题 ↔ 猜想防溢出：题号书签筛选 + 超过 2 组时的叠纸夹层展开
  const [selectedQhIndex, setSelectedQhIndex] = useState<number | 'all'>('all');
  const [isExtraQhOpen, setIsExtraQhOpen] = useState(false);
  // 研究目标防溢出：超过 3 条时折叠后续目标
  const [isExtraObjectivesOpen, setIsExtraObjectivesOpen] = useState(false);
  // 实验方案活页顶签切换（基础实验 vs 进阶探索）
  const [activePlanTab, setActivePlanTab] = useState<'basic' | 'extended'>('basic');
  // 入组手账附页折页袋（阶段小成果 / 互评标准 / 投入时间）展开状态
  const [isAppendixOpen, setIsAppendixOpen] = useState(false);

  const toggleSheetFold = (sheetId: string) => {
    setFoldedSheets((current) => ({
      ...current,
      [sheetId]: !current[sheetId],
    }));
  };

  const focusSheet = (sheetId: string) => {
    setFoldedSheets((current) => ({
      ...current,
      [sheetId]: false,
    }));
    document.getElementById(sheetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const appendixCells = [
    {
      step: '阶段成果',
      text: issue.minDeliverables,
    },
    {
      step: '评价标准',
      text: issue.reviewCriteria,
    },
    {
      step: '时间与要求',
      text: issue.timeline,
      extraItems: requirementItems,
    },
  ];

  const extraQhCount = Math.max(pairCount - 2, 0);
  const extraObjectiveCount = Math.max(issue.objectiveItems.length - 3, 0);
  const effectivePlanTab =
    activePlanTab === 'extended' && hasExtendedPlan
      ? 'extended'
      : hasBasicPlan
        ? 'basic'
        : 'extended';

  return (
    <div className={cn('research-notebook-stack', className)} aria-label="议题正文">
      {/* 第 01 页手账：最新进展与议题价值 */}
      <section
        id="notebook-sheet-progress"
        className="research-notebook-sheet"
        data-folded={foldedSheets['notebook-sheet-progress'] ? 'true' : 'false'}
      >
        <span
          role="button"
          tabIndex={0}
          onClick={() => focusSheet('notebook-sheet-progress')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              focusSheet('notebook-sheet-progress');
            }
          }}
          className="research-notebook-tab bg-[var(--clay-mint)] text-[#0a0a0a]"
          title="进展"
        >
          进展
        </span>

        <div className="research-notebook-head">
          <h2 className="text-lg font-extrabold text-[var(--paper-foreground)]">
            {issue.progress ? '最新进展与议题价值' : '议题价值'}
          </h2>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSheetFold('notebook-sheet-progress')}
              className="research-button rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--research-muted)]"
            >
              {foldedSheets['notebook-sheet-progress'] ? '展开 ▾' : '收起'}
            </button>
          </div>
        </div>

        {!foldedSheets['notebook-sheet-progress'] && (
          <div>
            {issue.progress ? (
              <>
                <div className="research-tint-mint rounded-xl border px-4 py-3.5">
                  <div className="mb-1 text-xs font-extrabold text-[var(--research-muted)]">
                    最新进展
                  </div>
                  <p className="whitespace-pre-wrap text-base font-semibold leading-7 text-[var(--paper-foreground)]">
                    {issue.progress}
                  </p>
                </div>
                <div className="mt-3.5 border-t border-[var(--research-line)] pt-3">
                  <div className="mb-1 text-xs font-extrabold text-[var(--research-muted)]">
                    议题价值
                  </div>
                  <p className="whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
                    {issue.value}
                  </p>
                </div>
              </>
            ) : (
              <div className="research-tint-mint rounded-xl border px-4 py-3.5">
                <p className="whitespace-pre-wrap text-base font-semibold leading-7 text-[var(--paper-foreground)]">
                  {issue.value}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 第 02 页手账：核心科学问题 ↔ 研究假设 */}
      {showQuestionHypothesisCard && (
        <section
          id="notebook-sheet-hypothesis"
          className="research-notebook-sheet"
          data-folded={foldedSheets['notebook-sheet-hypothesis'] ? 'true' : 'false'}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={() => focusSheet('notebook-sheet-hypothesis')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                focusSheet('notebook-sheet-hypothesis');
              }
            }}
            className="research-notebook-tab bg-[var(--clay-ochre)] text-[#0a0a0a]"
            title="猜想"
          >
            猜想
          </span>

          <div className="research-notebook-head">
            <h2 className="text-lg font-extrabold text-[var(--paper-foreground)]">
              核心科学问题与研究假设
            </h2>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {pairCount > 0 && <ResearchChip>{pairCount} 组</ResearchChip>}
              {canManageQuestions && onManageQuestions && (
                <button
                  type="button"
                  onClick={onManageQuestions}
                  className="research-button inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold"
                >
                  管理问题
                </button>
              )}
              <button
                type="button"
                onClick={() => toggleSheetFold('notebook-sheet-hypothesis')}
                className="research-button rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--research-muted)]"
              >
                {foldedSheets['notebook-sheet-hypothesis'] ? '展开 ▾' : '收起'}
              </button>
            </div>
          </div>

          {!foldedSheets['notebook-sheet-hypothesis'] && (
            <div>
              {pairCount > 0 ? (
                <>
                  {pairCount > 2 && (
                    <div className="mb-3.5 flex flex-wrap gap-1.5" role="group" aria-label="按问题编号筛选">
                      <button
                        type="button"
                        onClick={() => setSelectedQhIndex('all')}
                        className={cn(
                          'rounded-md border px-2.5 py-1 text-xs font-bold transition',
                          selectedQhIndex === 'all'
                            ? 'border-[var(--research-edge)] bg-[var(--paper-accent)] text-[var(--paper-bg)]'
                            : 'border-[var(--research-line)] bg-[var(--research-head)] text-[var(--paper-foreground)]'
                        )}
                      >
                        全部 ({pairCount})
                      </button>
                      {Array.from({ length: pairCount }).map((_, idx) => (
                        <button
                          key={`qh-bm-${idx}`}
                          type="button"
                          onClick={() => setSelectedQhIndex(idx)}
                          className={cn(
                            'rounded-md border px-2.5 py-1 text-xs font-bold transition',
                            selectedQhIndex === idx
                              ? 'border-[var(--research-edge)] bg-[var(--paper-accent)] text-[var(--paper-bg)]'
                              : 'border-[var(--research-line)] bg-[var(--research-head)] text-[var(--paper-foreground)]'
                          )}
                        >
                          Q{idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-3.5">
                    {Array.from({ length: pairCount }).map((_, index) => {
                      const question = questions[index];
                      const hypothesis = hypotheses[index];
                      const isHiddenByOverflow =
                        selectedQhIndex === 'all'
                          ? index >= 2 && !isExtraQhOpen
                          : selectedQhIndex !== index;

                      return (
                        <div
                          key={`qh-pair-${index}`}
                          hidden={isHiddenByOverflow}
                          className="research-qh-matrix"
                        >
                          <div className="research-qh-box">
                            <div className="mb-1.5 text-xs font-extrabold text-[var(--research-muted)]">
                              Q{index + 1} · 研究问题
                            </div>
                            {question ? (
                              <p className="whitespace-pre-wrap text-base font-bold leading-6 text-[var(--paper-foreground)]">
                                {question}
                              </p>
                            ) : (
                              <p className="text-sm italic text-[var(--research-muted)]">
                                待补充研究问题
                              </p>
                            )}
                          </div>

                          <div className="research-qh-box-hypothesis">
                            <div className="mb-1.5 text-xs font-extrabold text-[var(--research-muted)]">
                              📌 H{index + 1} · 对应假设
                            </div>
                            {hypothesis ? (
                              <p className="whitespace-pre-wrap text-base font-bold leading-6 text-[var(--paper-foreground)]">
                                {hypothesis}
                              </p>
                            ) : (
                              <p className="text-sm italic text-[var(--research-muted)]">
                                待补充对应假设
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {extraQhCount > 0 && selectedQhIndex === 'all' && (
                    <button
                      type="button"
                      onClick={() => setIsExtraQhOpen((open) => !open)}
                      className="research-stacked-pocket"
                    >
                      <span className="text-sm font-extrabold text-[var(--paper-foreground)]">
                        {isExtraQhOpen
                          ? `已展开全部 ${pairCount} 组`
                          : `还有 ${extraQhCount} 组问题与假设（Q3 ~ Q${pairCount}）`}
                      </span>
                      <ResearchChip className="research-tint-ochre font-bold">
                        {isExtraQhOpen ? '收起 ▴' : '展开全部 ▾'}
                      </ResearchChip>
                    </button>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-[var(--research-line)] bg-[var(--research-head)] px-4 py-3.5 text-sm text-[var(--research-muted)]">
                  暂未添加研究问题与假设
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 第 03 页手账：研究目标与实验路线 */}
      <section
        id="notebook-sheet-experiment"
        className="research-notebook-sheet"
        data-folded={foldedSheets['notebook-sheet-experiment'] ? 'true' : 'false'}
      >
        <span
          role="button"
          tabIndex={0}
          onClick={() => focusSheet('notebook-sheet-experiment')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              focusSheet('notebook-sheet-experiment');
            }
          }}
          className="research-notebook-tab bg-[var(--clay-lavender)] text-[#0a0a0a]"
          title="实验"
        >
          实验
        </span>

        <div className="research-notebook-head">
          <h2 className="text-lg font-extrabold text-[var(--paper-foreground)]">
            研究目标与实验路线
          </h2>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => toggleSheetFold('notebook-sheet-experiment')}
              className="research-button rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--research-muted)]"
            >
              {foldedSheets['notebook-sheet-experiment'] ? '展开 ▾' : '收起'}
            </button>
          </div>
        </div>

        {!foldedSheets['notebook-sheet-experiment'] && (
          <div
            className={cn(
              'grid gap-5 items-start',
              (hasBasicPlan || hasExtendedPlan) && 'lg:grid-cols-2'
            )}
          >
            <div>
              <h3 className="mb-3 text-xs font-extrabold text-[var(--research-muted)]">
                研究目标
              </h3>
              <ol className="flex flex-col gap-3">
                {issue.objectiveItems.map((objective, index) => (
                  <li
                    key={objective}
                    hidden={index >= 3 && !isExtraObjectivesOpen}
                    className="flex items-start gap-3"
                  >
                    <span
                      className={cn(
                        'research-step-dot mt-0.5',
                        index === 0 && 'bg-[var(--clay-pink)] text-white shadow-[var(--research-lift)]'
                      )}
                    >
                      {index + 1}
                    </span>
                    <p className="flex-1 pt-0.5 text-base font-medium leading-6 text-[var(--paper-foreground)]">
                      {objective}
                    </p>
                  </li>
                ))}
              </ol>

              {extraObjectiveCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsExtraObjectivesOpen((open) => !open)}
                  className="research-button mt-3 w-full rounded-md px-3 py-1.5 text-xs font-bold text-[var(--research-muted)]"
                >
                  {isExtraObjectivesOpen
                    ? '收起其余目标 ▴'
                    : `展开其余 ${extraObjectiveCount} 项研究目标 ▾`}
                </button>
              )}
            </div>

            {(hasBasicPlan || hasExtendedPlan) && (
              <div className="research-plan-folder">
                {hasBasicPlan && hasExtendedPlan ? (
                  <div className="research-plan-tabs" role="tablist" aria-label="切换实验阶段路线">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={effectivePlanTab === 'basic'}
                      onClick={() => setActivePlanTab('basic')}
                      className="research-plan-tab"
                    >
                      基础实验
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={effectivePlanTab === 'extended'}
                      onClick={() => setActivePlanTab('extended')}
                      className="research-plan-tab"
                    >
                      进阶探索
                    </button>
                  </div>
                ) : null}

                {hasBasicPlan && (
                  <div
                    hidden={hasExtendedPlan && effectivePlanTab !== 'basic'}
                    className="p-4"
                  >
                    {!hasExtendedPlan && (
                      <strong className="mb-1.5 block text-xs font-extrabold text-[var(--research-muted)]">
                        基础实验
                      </strong>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--paper-foreground)]">
                      {basicPlan}
                    </p>
                  </div>
                )}

                {hasExtendedPlan && (
                  <div
                    hidden={hasBasicPlan && effectivePlanTab !== 'extended'}
                    className="p-4"
                  >
                    {!hasBasicPlan && (
                      <strong className="mb-1.5 block text-xs font-extrabold text-[var(--research-muted)]">
                        进阶探索
                      </strong>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--paper-foreground)]">
                      {extendedPlan}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 第 04 页手账：加入指南与合作约定 */}
      <section
        id="notebook-sheet-join"
        className="research-notebook-sheet"
        data-folded={foldedSheets['notebook-sheet-join'] ? 'true' : 'false'}
      >
        <span
          role="button"
          tabIndex={0}
          onClick={() => focusSheet('notebook-sheet-join')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              focusSheet('notebook-sheet-join');
            }
          }}
          className="research-notebook-tab bg-[var(--clay-pink)] text-white"
          title="入组"
        >
          入组
        </span>

        <div className="research-notebook-head">
          <h2 className="text-lg font-extrabold text-[var(--paper-foreground)]">
            加入指南与合作约定
          </h2>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ProjectLifecycleBadges status={project.status} isDormant={project.is_dormant} />
            <ResearchChip accent>{issue.difficultyLabel}</ResearchChip>
            <ResearchChip>{issue.recruitmentState}</ResearchChip>
            <button
              type="button"
              onClick={() => toggleSheetFold('notebook-sheet-join')}
              className="research-button rounded-md px-2.5 py-1 text-xs font-semibold text-[var(--research-muted)]"
            >
              {foldedSheets['notebook-sheet-join'] ? '展开 ▾' : '收起'}
            </button>
          </div>
        </div>

        {!foldedSheets['notebook-sheet-join'] && (
          <div>
            <div
              className="grid gap-4 md:grid-cols-2"
              aria-label="议题协作信息"
            >
              <div className="research-tint-pink flex flex-col justify-between gap-3 rounded-xl border border-dashed p-4">
                <div>
                  <h3 className="mb-2 text-xs font-extrabold text-[var(--paper-foreground)]">
                    当前缺口
                  </h3>
                  <IssueRoleList
                    options={issue.missingRoleOptions}
                    fallbackItems={issue.missingRoleItems}
                    fallback={issue.missingRoles}
                  />
                </div>

                <div className="border-t border-dashed border-[var(--research-line)] pt-2.5">
                  <h3 className="mb-1.5 text-xs font-extrabold text-[var(--research-muted)]">
                    适合角色
                  </h3>
                  <IssueList items={issue.roleItems} fallback={issue.roles} />
                </div>
              </div>

              <div className="research-qh-box-hypothesis">
                <h3 className="mb-2 text-xs font-extrabold text-[var(--research-muted)]">
                  📌 上手第一步
                </h3>
                <p className="whitespace-pre-wrap text-base font-bold leading-6 text-[var(--paper-foreground)]">
                  {issue.beginnerSteps}
                </p>
              </div>
            </div>

            <div className="research-appendix-pocket">
              <button
                type="button"
                onClick={() => setIsAppendixOpen((open) => !open)}
                aria-expanded={isAppendixOpen}
                className="research-appendix-trigger"
              >
                <span>合作约定（阶段成果 · 评价标准 · 时间与要求）</span>
                <ResearchChip className="px-2.5 py-0.5 text-xs font-bold">
                  {isAppendixOpen ? '收起 ▴' : '展开 ▾'}
                </ResearchChip>
              </button>

              <div
                className="research-appendix-wrap"
                data-open={isAppendixOpen ? 'true' : 'false'}
              >
                <div className="research-appendix-inner">
                  <div className="research-appendix-grid">
                    {appendixCells.map((cell) => (
                      <div key={cell.step} className="research-contract-cell">
                        <h4 className="mb-1.5 text-xs font-extrabold text-[var(--research-muted)]">
                          {cell.step}
                        </h4>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--paper-foreground)]">
                          {cell.text}
                        </p>
                        {cell.extraItems && cell.extraItems.length > 0 && (
                          <ul className="mt-2.5 list-disc space-y-1.5 border-t border-[var(--research-line)] pt-2.5 pl-4 text-sm leading-6 text-[var(--paper-foreground)]">
                            {cell.extraItems.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
