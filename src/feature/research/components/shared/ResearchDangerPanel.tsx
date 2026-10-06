/**
 * Inline danger-confirmation panel — notebook chrome.
 * 行内危险操作确认面板（删除封面等）。
 */
import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/utils/classNames";

export function ResearchDangerPanel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions: ReactNode;
  /** Extra body content under the description (e.g. a confirmation input). */
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border px-4 py-3", className)}
      style={{
        borderColor: "color-mix(in srgb, var(--color-destructive) 30%, var(--research-line))",
        background: "color-mix(in srgb, var(--color-destructive) 6%, var(--research-surface))",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-destructive)]"
            style={{ background: "color-mix(in srgb, var(--color-destructive) 12%, transparent)" }}
          >
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-[var(--paper-foreground)]">{title}</p>
            {description && (
              <p className="mt-1 text-base leading-6 text-[var(--research-muted)]">{description}</p>
            )}
            {children}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
      </div>
    </div>
  );
}
