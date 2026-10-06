/**
 * Remove Member Dialog
 * 移除成员确认弹窗
 *
 * Confirmation dialog for removing a member (or leaving the project when the
 * target is the current user). Extracted from ResearchProjectPage; restyled
 * onto research tokens.
 */

import { Loader2, UserMinus } from "lucide-react";
import { cn } from "@/utils/classNames";
import { Dialog } from "@/components/ui/dialog";
import { RESEARCH_DIALOG_PANEL } from "../shared/ResearchDialog";
import { formatUserIdentity } from "@/lib/identity";
import type { ProjectMember } from "@/lib/research.service";

export function RemoveMemberDialog({
  member,
  isSelf,
  error,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  member: ProjectMember;
  isSelf: boolean;
  error: string | null;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog isOpen={true} onClose={onCancel} containerClassName="items-end sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={isSelf ? "退出课题组" : "移除成员"}
        className={cn(
          RESEARCH_DIALOG_PANEL,
          "max-w-md rounded-t-[1.25rem] p-6 sm:rounded-xl"
        )}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-destructive)]"
            style={{ background: "color-mix(in srgb, var(--color-destructive) 12%, transparent)" }}
          >
            <UserMinus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[var(--paper-foreground)]">
              {isSelf ? "退出课题组" : "移除成员"}
            </h3>
            <p className="text-base text-[var(--research-muted)]">
              {isSelf
                ? "确定要退出该课题组吗？"
                : `确定要将 ${formatUserIdentity(member)} 从课题组移除吗？`
              }
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="research-error mb-4 rounded-lg p-3 text-base">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isRemoving}
            className="research-button rounded-full px-4 py-2 text-base font-medium disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isRemoving}
            className="research-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRemoving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRemoving ? "处理中..." : "确认"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
