/**
 * Admin Units Page
 * 单元管理页面
 *
 * Lists all units with CRUD operations
 * 列出所有单元并提供增删改查操作
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { useUnitAdminStore } from "@/stores/unitAdminStore";
import { UnitFormDialog } from "@/feature/admin/components/UnitFormDialog";
import { PersistentHeader } from "@/components/shared";
import { Plus, Pencil, Trash2, FileText, BookOpen } from "lucide-react";

export default function AdminUnitsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    units,
    isLoading,
    error,
    fetchUnits,
    deleteUnit,
    clearError,
  } = useUnitAdminStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const handleDelete = async (id: string) => {
    try {
      await deleteUnit(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete unit:", err);
    }
  };

  // Ensure units is always an array
  const unitList = units || [];

  if (isLoading && unitList.length === 0) {
    return (
      <div
        className={cn(
          "min-h-screen flex flex-col",
          theme === "dark" ? "bg-slate-900" : "bg-gray-50"
        )}
      >
        <PersistentHeader
          moduleKey="unit"
          moduleName="单元管理"
          variant="glass"
          className={cn(
            "sticky top-0 z-40",
            theme === "dark"
              ? "bg-slate-900/80 border-b border-slate-700"
              : "bg-white/80 border-b border-gray-200"
          )}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-cyan-500 text-sm">加载单元中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark" ? "bg-slate-900" : "bg-gray-50"
      )}
    >
      {/* Header with Persistent Logo */}
      <PersistentHeader
        moduleKey="unit"
        moduleName="单元管理"
        variant="glass"
        className={cn(
          "sticky top-0 z-40",
          theme === "dark"
            ? "bg-slate-900/80 border-b border-slate-700"
            : "bg-white/80 border-b border-gray-200"
        )}
        rightContent={
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建单元
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1
            className={cn(
              "text-3xl font-bold",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            单元管理
          </h1>
          <p
            className={cn(
              "mt-1",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            管理实验单元及其下的实验
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
            <span className="text-red-400">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              ×
            </button>
          </div>
        )}

        {/* Unit List */}
        <div className="grid gap-4">
          {unitList.map((unit) => (
            <div
              key={unit.id}
              className={cn(
                "rounded-xl p-6 border transition-colors",
                theme === "dark"
                  ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                  : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Color indicator */}
                  <div
                    className="w-2 h-full min-h-[80px] rounded-full flex-shrink-0"
                    style={{ backgroundColor: unit.color || "#3B82F6" }}
                  />

                  {/* Unit info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={cn(
                          "text-xl font-semibold",
                          theme === "dark" ? "text-white" : "text-gray-900"
                        )}
                      >
                        {unit.title?.["zh-CN"] || unit.title_zh}
                      </h3>
                    </div>

                    {unit.description?.["zh-CN"] && (
                      <p
                        className={cn(
                          "text-sm mb-4 line-clamp-2",
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        )}
                      >
                        {unit.description["zh-CN"]}
                      </p>
                    )}

                    {/* Stats */}
                    <div
                      className={cn(
                        "flex items-center gap-4 text-sm",
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        <span>{unit.mainSlide ? "PDF" : "无 PDF"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>{unit.courseCount || 0} 个实验</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => navigate(`/admin/units/${unit.id}`)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      theme === "dark"
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    <Pencil className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(unit.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}

          {unitList.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <p
                className={cn(
                  "mb-4",
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                )}
              >
                暂无单元
              </p>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="text-cyan-500 hover:text-cyan-600 text-sm"
              >
                创建您的第一个单元
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <UnitFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={cn(
              "rounded-xl p-6 max-w-md w-full mx-4 border",
              theme === "dark"
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-gray-200"
            )}
          >
            <h3
              className={cn(
                "text-xl font-semibold mb-2",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}
            >
              删除单元？
            </h3>
            <p
              className={cn(
                "mb-6",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              这将永久删除该单元。此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  theme === "dark"
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
