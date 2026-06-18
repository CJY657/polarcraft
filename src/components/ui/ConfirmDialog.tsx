/**
 * ConfirmDialog Component
 * 小型确认弹窗，用于删除等不可撤销操作的二次确认
 */

import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/utils/classNames';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
  theme?: 'dark' | 'light';
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isPending = false,
  theme = 'light',
}: ConfirmDialogProps) {
  const isDark = theme === 'dark';

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
      className={cn(
        'max-w-sm rounded-[1.25rem] border p-5',
        isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white',
      )}
    >
      <div role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#b33d3d]/12 text-[#b33d3d]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className={cn('text-base font-semibold', isDark ? 'text-slate-100' : 'text-slate-900')}>
              {title}
            </h2>
            {description && (
              <p className={cn('mt-1 text-sm leading-6', isDark ? 'text-slate-400' : 'text-slate-500')}>
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-full bg-[#b33d3d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#9a3333] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
