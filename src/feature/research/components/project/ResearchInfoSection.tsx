/**
 * Research Info Section
 * 研究信息区块
 *
 * Renders the topic summary, plans, and a jumpable index of research questions
 * and hypotheses. Extracted from ResearchProjectPage; markup is unchanged.
 */

import type { ReactNode } from "react";
import {
  BookOpen,
  FlaskConical,
  HelpCircle,
  Lightbulb,
  ListChecks,
} from "lucide-react";
import { cn } from "@/utils/classNames";
import type {
  ProjectDiscussionJumpTarget,
  ProjectDiscussionOutline,
} from "./ProjectDiscussionSection";

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
  canJumpToDiscussion,
  onJumpToDiscussion,
}: {
  outline: ProjectDiscussionOutline;
  canJumpToDiscussion: boolean;
  onJumpToDiscussion: (target: ProjectDiscussionJumpTarget) => void;
}) {
  const hasQuestions = outline.questions.length > 0;
  const hasHypotheses = outline.hypotheses.length > 0;
  const hasPlans = Boolean(outline.basicPlan?.trim() || outline.extendedPlan?.trim());

  if (!hasResearchOutline(outline)) {
    return null;
  }

  const renderJumpItem = (
    label: string,
    target: ProjectDiscussionJumpTarget,
    icon: ReactNode,
    toneClass: string
  ) => {
    const className = cn(
      "group flex min-h-[4rem] items-start gap-3 rounded-[1.1rem] border px-3.5 py-3 text-left transition",
      toneClass,
      canJumpToDiscussion && "hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.07)]"
    );

    const content = (
      <>
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/70">
          {icon}
        </span>
        <span className="min-w-0 flex-1 text-base font-medium leading-6 text-[var(--paper-foreground)]">
          {label}
        </span>
      </>
    );

    if (!canJumpToDiscussion) {
      return <div className={className}>{content}</div>;
    }

    return (
      <button type="button" onClick={() => onJumpToDiscussion(target)} className={className}>
        {content}
      </button>
    );
  };

  return (
    <section className="research-panel mb-4 rounded-[1.6rem] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: "var(--font-ui-display)" }}
          >
            研究信息
          </h2>
        </div>
        <span className="research-chip inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-medium sm:self-auto">
          <ListChecks className="h-3.5 w-3.5" />
          问题与假设索引
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
        <div className="research-panel-soft rounded-[1.35rem] p-4">
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[var(--paper-link)]" />
            <h3 className="text-base font-semibold text-[var(--paper-foreground)]">研究主题简述</h3>
          </div>
          <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
            {outline.topicSummary || "这个课题还没有写摘要。"}
          </p>
        </div>

        {hasPlans && (
          <div className="grid gap-3">
            {outline.basicPlan?.trim() && (
              <div className="research-panel-soft rounded-[1.35rem] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-[var(--paper-link)]" />
                  <h3 className="text-base font-semibold text-[var(--paper-foreground)]">基础实验与问题</h3>
                </div>
                <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
                  {outline.basicPlan}
                </p>
              </div>
            )}
            {outline.extendedPlan?.trim() && (
              <div className="research-panel-soft rounded-[1.35rem] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-[var(--paper-link)]" />
                  <h3 className="text-base font-semibold text-[var(--paper-foreground)]">拓展问题、假设与实验</h3>
                </div>
                <p className="whitespace-pre-wrap text-base leading-7 text-[var(--glass-text-muted)]">
                  {outline.extendedPlan}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {(hasQuestions || hasHypotheses) && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {outline.questions.map((question, index) => (
            <div key={`question-${index}`}>
              {renderJumpItem(
                question,
                { section: "basic", index },
                <HelpCircle className="h-4 w-4 text-[var(--paper-link)]" />,
                "border-[var(--paper-accent)]/14 bg-[var(--paper-accent)]/7"
              )}
            </div>
          ))}
          {outline.hypotheses.map((hypothesis, index) => (
            <div key={`hypothesis-${index}`}>
              {renderJumpItem(
                hypothesis,
                { section: "extended", index },
                <Lightbulb className="h-4 w-4 text-[var(--paper-link)]" />,
                "border-[#d7994c]/20 bg-[#d7994c]/8"
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
