/**
 * Research Section Card
 * 课题区块卡片
 *
 * The shared card shell for every section on the project detail page: a
 * full-bleed head strip carrying the title (plus optional right-aligned
 * actions) over a padded body.
 */

import type { ReactNode } from "react";
import { cn } from "@/utils/classNames";

interface ResearchSectionCardProps {
  title: string;
  /** Small category eyebrow above the title (research-kicker). */
  kicker?: string;
  /** Notebook step number rendered as a step dot beside the title. */
  step?: number;
  /** Rendered right-aligned in the head strip — counts, filters, buttons. */
  actions?: ReactNode;
  /** Short line under the title. Omit when the title already says enough. */
  note?: string;
  children: ReactNode;
  className?: string;
  /** Drop the body padding when the child manages its own (tables, feeds). */
  flush?: boolean;
  id?: string;
  "aria-label"?: string;
}

export function ResearchSectionCard({
  title,
  kicker,
  step,
  actions,
  note,
  children,
  className,
  flush = false,
  id,
  "aria-label": ariaLabel,
}: ResearchSectionCardProps) {
  const titleNode = (
    <h2
      className="text-xl font-semibold text-[var(--paper-foreground)]"
      style={{ fontFamily: "var(--font-ui-display)" }}
    >
      {title}
    </h2>
  );

  return (
    <section id={id} aria-label={ariaLabel} className={cn("research-card", className)}>
      <div className="research-card-head">
        <div className="min-w-0">
          {kicker && <p className="research-kicker">{kicker}</p>}
          {typeof step === "number" ? (
            <div className="flex items-center gap-2.5">
              <span className="research-step-dot" aria-hidden="true">
                {step}
              </span>
              {titleNode}
            </div>
          ) : (
            titleNode
          )}
          {note && <p className="research-section-note mt-0.5">{note}</p>}
        </div>
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      <div className={flush ? undefined : "research-card-body"}>{children}</div>
    </section>
  );
}
