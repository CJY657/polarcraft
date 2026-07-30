/**
 * Research Info Section
 * 研究信息区块
 *
 * Renders the topic summary, plans, and read-only research hypotheses.
 */

import { ResearchSectionCard } from "../shared/ResearchSectionCard";
import type { ProjectDiscussionOutline } from "./ProjectDiscussionSection";

export function hasResearchOutline(outline: ProjectDiscussionOutline): boolean {
  return Boolean(
    outline.topicSummary.trim()
      || outline.basicPlan?.trim()
      || outline.extendedPlan?.trim()
      || outline.questions.length > 0
      || outline.hypotheses.length > 0
  );
}

export function ResearchInfoSection({
  outline,
  canManageQuestions,
  onManageQuestions,
}: {
  outline: ProjectDiscussionOutline;
  canManageQuestions: boolean;
  onManageQuestions: () => void;
}) {
  const hasHypotheses = outline.hypotheses.length > 0;

  if (!hasResearchOutline(outline)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4.5">
      <ResearchSectionCard
        title="研究信息"
        note="课题的研究主题、实验计划与研究假设"
        actions={
          canManageQuestions && (
            <button
              type="button"
              onClick={onManageQuestions}
              className="glass-button inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold"
            >
              管理问题
            </button>
          )
        }
      >
        <p className="whitespace-pre-wrap text-base leading-7 text-[var(--paper-foreground)]">
          {outline.topicSummary || "这个课题还没有写摘要。"}
        </p>
      </ResearchSectionCard>

      {hasHypotheses && (
        <ResearchSectionCard title="研究假设">
          <ul className="flex flex-col gap-2.5">
            {outline.hypotheses.map((hypothesis, index) => (
              <li
                key={`hypothesis-${index}`}
                className="research-tint-ochre rounded-md border border-l-[3px] border-l-[var(--clay-ochre)] px-3.5 py-3 text-base font-medium leading-6 text-[var(--paper-foreground)]"
              >
                {hypothesis}
              </li>
            ))}
          </ul>
        </ResearchSectionCard>
      )}

      {outline.basicPlan?.trim() && (
        <ResearchSectionCard title="基础实验与问题">
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {outline.basicPlan}
          </p>
        </ResearchSectionCard>
      )}

      {outline.extendedPlan?.trim() && (
        <ResearchSectionCard title="拓展问题、假设与实验">
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {outline.extendedPlan}
          </p>
        </ResearchSectionCard>
      )}
    </div>
  );
}
