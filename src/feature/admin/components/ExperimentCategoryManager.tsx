/**
 * ExperimentCategoryManager - 单元内经典实验子分类管理
 *
 * 新建 / 重命名 / 上下排序 / 删除（删除只清空归属，不删实验）。
 * 失败时保留已输入内容并显示错误，可直接重试。
 */

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, FolderTree, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { cn } from "@/utils/classNames";
import { unitApi, type ExperimentCategory } from "@/lib/unit.service";

interface ExperimentCategoryManagerProps {
  unitId: string;
  categories: ExperimentCategory[];
  theme: string;
  /** 任一操作成功后回调（父级重新拉取单元） */
  onChanged: () => void;
}

interface NameDraft {
  name_zh: string;
  name_en: string;
}

const EMPTY_DRAFT: NameDraft = { name_zh: "", name_en: "" };

export function ExperimentCategoryManager({
  unitId,
  categories,
  theme,
  onChanged,
}: ExperimentCategoryManagerProps) {
  const isDark = theme === "dark";
  const [createDraft, setCreateDraft] = useState<NameDraft>(EMPTY_DRAFT);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<NameDraft>(EMPTY_DRAFT);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputClass = cn(
    "px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500",
    isDark
      ? "bg-slate-700 border-slate-600 text-white placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-400",
  );
  const iconButtonClass = cn(
    "p-1.5 rounded transition-colors disabled:opacity-30",
    isDark
      ? "hover:bg-slate-700 text-gray-400 hover:text-white"
      : "hover:bg-gray-100 text-gray-500 hover:text-gray-900",
  );

  const run = async (id: string, action: () => Promise<unknown>, onSuccess?: () => void) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      onSuccess?.();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = () => {
    const name_zh = createDraft.name_zh.trim();
    if (!name_zh) return;
    void run(
      "new",
      () =>
        unitApi.createExperimentCategory(unitId, {
          name_zh,
          name_en: createDraft.name_en.trim() || undefined,
        }),
      () => {
        setCreateDraft(EMPTY_DRAFT);
        setIsCreateOpen(false);
      },
    );
  };

  const handleRename = (categoryId: string) => {
    const name_zh = editDraft.name_zh.trim();
    if (!name_zh) return;
    void run(
      categoryId,
      () =>
        unitApi.updateExperimentCategory(unitId, categoryId, {
          name_zh,
          name_en: editDraft.name_en.trim() || undefined,
        }),
      () => setEditingId(null),
    );
  };

  const handleDelete = (category: ExperimentCategory) => {
    const label = category.name["zh-CN"] || category.name["en-US"] || "";
    if (!confirm(`确定删除分类「${label}」？其中的实验会保留，并变为未分类。`)) {
      return;
    }
    void run(category.id, () => unitApi.deleteExperimentCategory(unitId, category.id));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const ids = categories.map((category) => category.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    void run(ids[target], () => unitApi.reorderExperimentCategories(unitId, ids));
  };

  const renderDraftFields = (draft: NameDraft, setDraft: (next: NameDraft) => void, onSubmit: () => void) => (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        value={draft.name_zh}
        onChange={(e) => setDraft({ ...draft, name_zh: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="分类名称（中文）*"
        aria-label="分类名称（中文）"
        className={cn(inputClass, "w-44")}
      />
      <input
        type="text"
        value={draft.name_en}
        onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder="Name (English, optional)"
        aria-label="分类名称（英文）"
        className={cn(inputClass, "w-52")}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "rounded-xl p-5 border",
        isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200 shadow-sm",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h4
          className={cn(
            "text-md font-semibold flex items-center gap-2",
            isDark ? "text-white" : "text-gray-900",
          )}
        >
          <FolderTree className="w-4 h-4" />
          实验子分类 ({categories.length})
        </h4>
        <button
          type="button"
          onClick={() => setIsCreateOpen((open) => !open)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            isDark
              ? "bg-slate-700 hover:bg-slate-600 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700",
          )}
        >
          <Plus className="w-4 h-4" />
          新建分类
        </button>
      </div>
      <p className={cn("mt-1 text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
        仅对“基础知识”实验生效；学生端按此顺序显示分类，未分类实验直接挂在单元下。
      </p>

      {isCreateOpen && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {renderDraftFields(createDraft, setCreateDraft, handleCreate)}
          <button
            type="button"
            onClick={handleCreate}
            disabled={!createDraft.name_zh.trim() || busyId === "new"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors"
          >
            {busyId === "new" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            创建
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(false)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isDark
                ? "bg-slate-700 hover:bg-slate-600 text-gray-300"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700",
            )}
          >
            取消
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className={cn(
            "mt-3 px-3 py-2 rounded-lg text-sm",
            isDark ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-red-50 border border-red-200 text-red-600",
          )}
        >
          {error}
        </div>
      )}

      {categories.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {categories.map((category, index) => {
            const isEditing = editingId === category.id;
            const isBusy = busyId === category.id;

            return (
              <li
                key={category.id}
                className={cn(
                  "flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg border",
                  isDark ? "border-slate-700 bg-slate-800/60" : "border-gray-200 bg-gray-50",
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0",
                    isDark ? "bg-slate-700 text-gray-300" : "bg-white text-gray-600",
                  )}
                >
                  {index + 1}
                </span>

                {isEditing ? (
                  <>
                    {renderDraftFields(editDraft, setEditDraft, () => handleRename(category.id))}
                    <button
                      type="button"
                      onClick={() => handleRename(category.id)}
                      disabled={!editDraft.name_zh.trim() || isBusy}
                      aria-label="保存分类名称"
                      className={iconButtonClass}
                    >
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      aria-label="取消重命名"
                      className={iconButtonClass}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={cn("flex-1 min-w-0 truncate text-sm font-medium", isDark ? "text-white" : "text-gray-900")}>
                      {category.name["zh-CN"]}
                      {category.name["en-US"] && (
                        <span className={cn("ml-2 text-xs font-normal", isDark ? "text-gray-400" : "text-gray-500")}>
                          {category.name["en-US"]}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMove(index, -1)}
                      disabled={index === 0 || busyId !== null}
                      aria-label="上移分类"
                      className={iconButtonClass}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 1)}
                      disabled={index === categories.length - 1 || busyId !== null}
                      aria-label="下移分类"
                      className={iconButtonClass}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(category.id);
                        setEditDraft({
                          name_zh: category.name["zh-CN"] || "",
                          name_en: category.name["en-US"] || "",
                        });
                      }}
                      disabled={busyId !== null}
                      aria-label="重命名分类"
                      className={iconButtonClass}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      disabled={busyId !== null}
                      aria-label="删除分类"
                      className={cn(iconButtonClass, isDark ? "hover:text-red-300" : "hover:text-red-600")}
                    >
                      {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
