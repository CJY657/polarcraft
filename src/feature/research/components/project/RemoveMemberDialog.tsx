/**
 * Remove Member Dialog
 * 移除成员确认弹窗
 *
 * Confirmation dialog for removing a member (or leaving the project when the
 * target is the current user). Extracted from ResearchProjectPage; markup is
 * unchanged.
 */

import { Loader2, UserMinus } from "lucide-react";
import { cn } from "@/utils/classNames";
import { Dialog } from "@/components/ui/dialog";
import { formatUserIdentity } from "@/lib/identity";
import type { ProjectMember } from "@/lib/research.service";

export function RemoveMemberDialog({
  member,
  isSelf,
  theme,
  error,
  isRemoving,
  onCancel,
  onConfirm,
}: {
  member: ProjectMember;
  isSelf: boolean;
  theme: "dark" | "light";
  error: string | null;
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog isOpen={true} onClose={onCancel}>
      <div className={cn(
        "w-full max-w-md p-6 rounded-xl",
        theme === "dark" ? "bg-gray-800" : "bg-white"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "p-2 rounded-lg",
            theme === "dark" ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-600"
          )}>
            <UserMinus className="w-5 h-5" />
          </div>
          <div>
            <h3 className={cn(
              "text-lg font-semibold",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}>
              {isSelf ? "退出课题组" : "移除成员"}
            </h3>
            <p className={cn(
              "text-base",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}>
              {isSelf
                ? "确定要退出该课题组吗？"
                : `确定要将 ${formatUserIdentity(member)} 从课题组移除吗？`
              }
            </p>
          </div>
        </div>

        {error && (
          <div className={cn(
            "mb-4 p-3 rounded-lg text-base",
            theme === "dark" ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
          )}>
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isRemoving}
            className={cn(
              "px-4 py-2 rounded-lg text-base font-medium transition-colors",
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700",
              isRemoving && "opacity-50 cursor-not-allowed"
            )}
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isRemoving}
            className={cn(
              "px-4 py-2 rounded-lg text-base font-medium transition-colors flex items-center gap-2",
              theme === "dark"
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-red-500 hover:bg-red-600 text-white",
              isRemoving && "opacity-50 cursor-not-allowed"
            )}
          >
            {isRemoving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isRemoving ? "处理中..." : "确认"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
