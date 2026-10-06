/**
 * Research confirm dialog — confirmations on notebook chrome.
 * Replicates the shared ConfirmDialog contract: role="alertdialog",
 * aria-modal, aria-label=title, isPending lock, Loader2 spinner.
 * Initial focus lands on Cancel (destructive actions are never the default).
 * 课题组确认弹窗：语义与通用 ConfirmDialog 一致，样式使用墨色令牌。
 */
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

interface ResearchConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function ResearchConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isPending = false,
}: ResearchConfirmDialogProps) {
  return (
    <Dialog
      isOpen={open}
      onClose={() => {
        if (!isPending) {
          onCancel();
        }
      }}
      closeOnOverlayClick={!isPending}
      closeOnEsc={!isPending}
      className="max-w-sm rounded-xl border-[1.5px] border-[var(--research-edge)] bg-[var(--research-surface)] p-5 shadow-[var(--research-lift)]"
    >
      <div role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-destructive)]"
            style={{ background: "color-mix(in srgb, var(--color-destructive) 12%, transparent)" }}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[var(--paper-foreground)]">{title}</h2>
            {description && (
              <p className="mt-1 text-base leading-6 text-[var(--research-muted)]">{description}</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={isPending}
            className="research-button rounded-full px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="research-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
