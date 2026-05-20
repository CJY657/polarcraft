import { useId, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/utils/classNames";

const DELETE_CONFIRMATION_KEYWORD = "DELETE";

interface ProjectDeleteActionProps {
  projectName: string;
  onDelete: (confirmationText: string) => Promise<void>;
  isDeleting?: boolean;
  triggerLabel?: string;
  className?: string;
}

export function ProjectDeleteAction({
  projectName,
  onDelete,
  isDeleting = false,
  triggerLabel = "删除课题",
  className,
}: ProjectDeleteActionProps) {
  const confirmationInputId = useId();
  const [isArmed, setIsArmed] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const isConfirmationValid = confirmationText.trim() === DELETE_CONFIRMATION_KEYWORD;

  async function handleConfirm() {
    if (!isConfirmationValid) {
      return;
    }

    try {
      setError(null);
      await onDelete(confirmationText.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除课题失败");
    }
  }

  if (!isArmed) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setConfirmationText("");
          setIsArmed(true);
        }}
        className={cn(
          "glass-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-medium text-[#a24432] transition-colors hover:text-[#892c1d]",
          className
        )}
      >
        <Trash2 className="h-4 w-4" />
        {triggerLabel}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[1.45rem] border p-4",
        className
      )}
      style={{
        borderColor: "color-mix(in srgb, #cb6a4f 30%, var(--glass-stroke))",
        background: "color-mix(in srgb, #cb6a4f 8%, var(--paper-surface-strong))",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#cb6a4f]/12 text-[#a24432]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-[var(--paper-foreground)]">确认删除「{projectName}」</p>
            <p className="mt-1 text-base leading-6 text-[var(--glass-text-muted)]">
              删除后会一并移除成员、画布和讨论记录，这个操作无法恢复。
            </p>
            <div className="mt-3 max-w-sm">
              <label
                htmlFor={confirmationInputId}
                className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--glass-text-muted)]"
              >
                输入大写 DELETE 以确认删除
              </label>
              <input
                id={confirmationInputId}
                type="text"
                value={confirmationText}
                onChange={(event) => {
                  setConfirmationText(event.target.value);
                  if (error) {
                    setError(null);
                  }
                }}
                disabled={isDeleting}
                autoComplete="off"
                spellCheck={false}
                placeholder="DELETE"
                className="mt-2 w-full rounded-2xl border border-[var(--glass-stroke)] bg-white/70 px-4 py-3 text-base text-[var(--paper-foreground)] outline-none transition focus:border-[#cb6a4f] focus:ring-2 focus:ring-[#cb6a4f]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950/40"
              />
              <p className="mt-2 text-sm leading-5 text-[var(--glass-text-muted)]">
                只有输入完全匹配的 <span className="font-semibold text-[var(--paper-foreground)]">DELETE</span> 才会启用删除按钮。
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setIsArmed(false);
              setConfirmationText("");
              setError(null);
            }}
            disabled={isDeleting}
            className="glass-button rounded-full px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isDeleting || !isConfirmationValid}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#a24432] px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-[#892c1d] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "删除中..." : "确认删除"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-[1rem] border border-[#cb6a4f]/20 bg-[#cb6a4f]/8 px-4 py-3 text-base text-[#a24432]">
          {error}
        </div>
      )}
    </div>
  );
}
