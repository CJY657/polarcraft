/**
 * ExperimentCurriculumDrawer - 移动端实验目录抽屉
 *
 * 与桌面侧栏共用同一套层级导航内容；支持 Escape、遮罩关闭、
 * 关闭按钮、焦点归位与页面滚动锁定。
 */

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface ExperimentCurriculumDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  theme: "dark" | "light";
  children: ReactNode;
}

export function ExperimentCurriculumDrawer({
  isOpen,
  onClose,
  title,
  closeLabel,
  theme,
  children,
}: ExperimentCurriculumDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // 打开时记录来源焦点，关闭后归位
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus();

    return () => {
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 抽屉打开时锁定页面滚动
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-[9998] lg:hidden">
      <button
        type="button"
        data-testid="curriculum-drawer-backdrop"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-950/60 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        data-testid="curriculum-drawer"
        className={`persistent-scrollbar absolute inset-y-0 left-0 flex w-[88%] max-w-[360px] flex-col overflow-y-auto border-r shadow-2xl focus:outline-none ${
          isDark ? "border-slate-700/70 bg-slate-900" : "border-slate-200 bg-white"
        }`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3 ${
            isDark ? "border-slate-700/70 bg-slate-900" : "border-slate-200 bg-white"
          }`}
        >
          <p className={`text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</p>
          <button
            type="button"
            onClick={onClose}
            data-testid="curriculum-drawer-close"
            className={`rounded-xl p-2 transition-colors ${
              isDark
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
