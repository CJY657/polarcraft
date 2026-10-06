/**
 * Research dialog shell — shared chrome for 虚拟课题组 dialogs.
 * 课题组对话框外壳：统一的面板样式与标题栏。
 */
import { X } from "lucide-react";
import { cn } from "@/utils/classNames";

/** Panel class string for the shared <Dialog className={...}>. */
export const RESEARCH_DIALOG_PANEL =
  "max-w-2xl overflow-hidden rounded-xl border-[1.5px] border-[var(--research-edge)] bg-[var(--research-surface)] shadow-[var(--research-lift)]";

export function ResearchDialogHead({
  title,
  note,
  onClose,
  className,
  closeLabel = "关闭",
}: {
  title: string;
  note?: string;
  onClose: () => void;
  className?: string;
  closeLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-start justify-between gap-3 border-b border-[var(--research-line)] bg-[var(--research-head)] px-5 py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2
          className="truncate text-xl font-semibold text-[var(--paper-foreground)]"
          style={{ fontFamily: "var(--font-ui-display)" }}
        >
          {title}
        </h2>
        {note && <p className="research-section-note mt-0.5">{note}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={closeLabel}
        className="rounded-md p-1.5 text-[var(--research-muted)] hover:bg-[var(--research-chip)]"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
