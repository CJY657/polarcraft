/**
 * Admin Units Page
 * 单元管理页面
 *
 * Lists all units with CRUD operations
 * 列出所有单元并提供增删改查操作
 */

import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { useUnitAdminStore } from "@/stores/unitAdminStore";
import type { Unit } from "@/lib/unit.service";
import { UnitFormDialog } from "@/feature/admin/components/UnitFormDialog";
import { PersistentHeader } from "@/components/shared";
import {
  BookOpen,
  FileText,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

function areUnitsInSameOrder(left: Unit[], right: Unit[]) {
  return (
    left.length === right.length &&
    left.every((unit, index) => unit.id === right[index]?.id)
  );
}

export default function AdminUnitsPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    units,
    isLoading,
    error,
    fetchUnits,
    deleteUnit,
    reorderUnits,
    clearError,
  } = useUnitAdminStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [orderedUnits, setOrderedUnits] = useState<Unit[]>([]);
  const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const orderedUnitsRef = useRef<Unit[]>([]);

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

  useEffect(() => {
    if (!isSavingOrder) {
      setOrderedUnits(unitList);
    }
  }, [isSavingOrder, unitList]);

  useEffect(() => {
    orderedUnitsRef.current = orderedUnits;
  }, [orderedUnits]);

  const handleUnitsReorder = (nextUnits: Unit[]) => {
    orderedUnitsRef.current = nextUnits;
    setOrderedUnits(nextUnits);
  };

  const handlePersistOrder = async () => {
    const nextUnits = orderedUnitsRef.current;
    setDraggingUnitId(null);

    if (isSavingOrder || areUnitsInSameOrder(nextUnits, unitList)) {
      return;
    }

    setIsSavingOrder(true);
    try {
      await reorderUnits(nextUnits.map((unit) => unit.id));
    } catch (err) {
      console.error("Failed to reorder units:", err);
      setOrderedUnits(unitList);
    } finally {
      setIsSavingOrder(false);
    }
  };

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
            拖动左侧把手调整单元顺序，松手后自动保存
          </p>
          {isSavingOrder && (
            <div
              className={cn(
                "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm",
                theme === "dark"
                  ? "bg-slate-800 text-cyan-300"
                  : "bg-cyan-50 text-cyan-700"
              )}
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              正在保存顺序
            </div>
          )}
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
        <Reorder.Group
          axis="y"
          as="div"
          values={orderedUnits}
          onReorder={handleUnitsReorder}
          className={cn(
            "flex flex-col gap-4",
            isSavingOrder && "pointer-events-none opacity-80"
          )}
        >
          {orderedUnits.map((unit, index) => (
            <AdminUnitCard
              key={unit.id}
              index={index}
              unit={unit}
              theme={theme}
              isDragging={draggingUnitId === unit.id}
              isSavingOrder={isSavingOrder}
              onDragStart={() => setDraggingUnitId(unit.id)}
              onDragEnd={handlePersistOrder}
              onEdit={() => navigate(`/admin/units/${unit.id}`)}
              onDelete={() => setDeleteConfirmId(unit.id)}
            />
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
        </Reorder.Group>
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
              这将永久删除该单元及其下全部实验、主课件、媒体和超链接记录，系统也会尝试回收不再被引用的上传文件。此操作无法撤销。
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

interface AdminUnitCardProps {
  index: number;
  unit: Unit;
  theme: string;
  isDragging: boolean;
  isSavingOrder: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function AdminUnitCard({
  index,
  unit,
  theme,
  isDragging,
  isSavingOrder,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: AdminUnitCardProps) {
  const dragControls = useDragControls();
  const unitTitle = unit.title?.["zh-CN"] || "未命名单元";
  const unitDescription = unit.description?.["zh-CN"];

  return (
    <Reorder.Item
      as="div"
      value={unit}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{
        scale: 1.01,
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
      }}
      className={cn(
        "rounded-xl border p-4 sm:p-5 transition-[border-color,box-shadow]",
        theme === "dark"
          ? "bg-slate-800 border-slate-700"
          : "bg-white border-gray-200 shadow-sm",
        isDragging &&
          (theme === "dark"
            ? "border-cyan-400 shadow-lg shadow-cyan-950/30"
            : "border-cyan-400 shadow-lg shadow-cyan-100")
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          <button
            type="button"
            aria-label={`拖动排序 ${unitTitle}`}
            onPointerDown={(event) => {
              if (!isSavingOrder) {
                dragControls.start(event);
              }
            }}
            className={cn(
              "mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-colors touch-none",
              theme === "dark"
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200",
              !isSavingOrder && "cursor-grab active:cursor-grabbing"
            )}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div
            className={cn(
              "mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold",
              theme === "dark"
                ? "bg-slate-700/80 text-slate-200"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {index + 1}
          </div>

          <div
            className="w-1.5 min-h-[92px] flex-shrink-0 rounded-full"
            style={{ backgroundColor: unit.color || "#3B82F6" }}
          />

          <div className="min-w-0 flex-1">
            <h3
              className={cn(
                "text-xl font-semibold",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}
            >
              {unitTitle}
            </h3>

            {unitDescription && (
              <p
                className={cn(
                  "mt-1 line-clamp-2 text-sm",
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                )}
              >
                {unitDescription}
              </p>
            )}

            <div
              className={cn(
                "mt-4 flex flex-wrap items-center gap-4 text-sm",
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              )}
            >
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>{unit.mainSlide ? "有 PDF" : "无 PDF"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                <span>{unit.courseCount || 0} 个实验</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:pl-14 lg:pl-0">
          <button
            onClick={onEdit}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              theme === "dark"
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            )}
          >
            <Pencil className="h-4 w-4" />
            编辑
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            删除
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
}
