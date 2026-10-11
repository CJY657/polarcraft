/**
 * Research Info Section
 * 研究信息区块
 *
 * Renders the topic summary, plans, and read-only research hypotheses.
 */

import { cn } from "@/utils/classNames";
import { ResearchSectionCard } from "../shared/ResearchSectionCard";
import { hasResearchOutline } from "../../pages/researchProjectViewModel";
import type { ProjectDiscussionOutline } from "./ProjectDiscussionSection";

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
  const hasBasicPlan = Boolean(outline.basicPlan?.trim());
  const hasExtendedPlan = Boolean(outline.extendedPlan?.trim());
  // Two columns only when there is more than one card; a lone card would sit half-width.
  // 仅多卡时双栏，单卡不半宽。
  const useColumns = hasHypotheses || hasBasicPlan || hasExtendedPlan;

  if (!hasResearchOutline(outline)) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-4.5", useColumns && "xl:block xl:columns-2")}>
      <ResearchSectionCard
        title="研究信息"
        kicker="Overview"
        step={1}
        note="课题的研究主题、实验计划与研究假设"
        className="xl:mb-4.5 xl:break-inside-avoid"
        actions={
          canManageQuestions && (
            <button
              type="button"
              onClick={onManageQuestions}
              className="research-button inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold"
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
        <ResearchSectionCard title="研究假设" className="xl:mb-4.5 xl:break-inside-avoid">
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

      {hasBasicPlan && (
        <ResearchSectionCard title="基础实验与问题" className="xl:mb-4.5 xl:break-inside-avoid">
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--research-muted)]">
            {outline.basicPlan}
          </p>
        </ResearchSectionCard>
      )}

      {hasExtendedPlan && (
        <ResearchSectionCard title="拓展问题、假设与实验" className="xl:mb-4.5 xl:break-inside-avoid">
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--research-muted)]">
            {outline.extendedPlan}
          </p>
        </ResearchSectionCard>
      )}
    </div>
  );
}
