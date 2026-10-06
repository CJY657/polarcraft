import { useId, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/utils/classNames";
import { ResearchDangerPanel } from "../shared/ResearchDangerPanel";

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
          "research-button inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-medium text-[var(--color-destructive)]",
          className
        )}
      >
        <Trash2 className="h-4 w-4" />
        {triggerLabel}
      </button>
    );
  }

  return (
    <ResearchDangerPanel
      className={className}
      title={`确认删除「${projectName}」`}
      description="删除后会一并移除成员、画布和讨论记录，这个操作无法恢复。"
      actions={
        <>
          <button
            type="button"
            onClick={() => {
              setIsArmed(false);
              setConfirmationText("");
              setError(null);
            }}
            disabled={isDeleting}
            className="research-button rounded-full px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isDeleting || !isConfirmationValid}
            className="research-button-danger inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {isDeleting ? "删除中..." : "确认删除"}
          </button>
        </>
      }
    >
      <div className="mt-3 max-w-sm">
        <label
          htmlFor={confirmationInputId}
          className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--research-muted)]"
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
          className="research-input mt-2 w-full rounded-2xl px-4 py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="mt-2 text-sm leading-5 text-[var(--research-muted)]">
          只有输入完全匹配的 <span className="font-semibold text-[var(--paper-foreground)]">DELETE</span> 才会启用删除按钮。
        </p>
      </div>

      {error && (
        <div className="research-error mt-4 rounded-[1rem] px-4 py-3 text-base">{error}</div>
      )}
    </ResearchDangerPanel>
  );
}
