/**
 * Unit Form Dialog
 * 单元表单对话框
 *
 * Used for creating and editing units
 * 用于创建和编辑单元
 */

import { useState, useEffect } from "react";
import { useUnitAdminStore } from "@/stores/unitAdminStore";
import { Unit, CreateUnitInput, UpdateUnitInput } from "@/lib/unit.service";
import { FileUpload } from "@/components/ui/FileUpload";
import { X } from "lucide-react";

interface UnitFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  unit?: Unit;
}

const DEFAULT_COLOR = "#3B82F6";

export function UnitFormDialog({ isOpen, onClose, mode, unit }: UnitFormDialogProps) {
  const { createUnit, updateUnit, isLoading, error } = useUnitAdminStore();

  const [formData, setFormData] = useState({
    title_zh: "",
    title_en: "",
    description_zh: "",
    description_en: "",
    coverImage: "",
    color: DEFAULT_COLOR,
  });

  useEffect(() => {
    if (mode === "edit" && unit) {
      setFormData({
        title_zh: unit.title["zh-CN"] || "",
        title_en: unit.title["en-US"] || "",
        description_zh: unit.description?.["zh-CN"] || "",
        description_en: unit.description?.["en-US"] || "",
        coverImage: unit.coverImage || "",
        color: unit.color,
      });
    } else {
      setFormData({
        title_zh: "",
        title_en: "",
        description_zh: "",
        description_en: "",
        coverImage: "",
        color: DEFAULT_COLOR,
      });
    }
  }, [mode, unit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === "create") {
        const input: CreateUnitInput = {
          title_zh: formData.title_zh,
          title_en: formData.title_en || undefined,
          description_zh: formData.description_zh || undefined,
          description_en: formData.description_en || undefined,
          coverImage: formData.coverImage || undefined,
          color: formData.color,
        };
        await createUnit(input);
      } else if (unit) {
        const input: UpdateUnitInput = {
          title_zh: formData.title_zh,
          title_en: formData.title_en || undefined,
          description_zh: formData.description_zh || undefined,
          description_en: formData.description_en || undefined,
          coverImage: formData.coverImage || undefined,
          color: formData.color,
        };
        await updateUnit(unit.id, input);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save unit:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full mx-4 border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {mode === "create" ? "创建单元" : "编辑单元"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title (Chinese) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              标题 (中文) *
            </label>
            <input
              type="text"
              value={formData.title_zh}
              onChange={(e) => setFormData({ ...formData, title_zh: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="单元标题"
              required
            />
          </div>

          {/* Title (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              标题 (英文)
            </label>
            <input
              type="text"
              value={formData.title_en}
              onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Unit Title"
            />
          </div>

          {/* Description (Chinese) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              描述 (中文)
            </label>
            <textarea
              value={formData.description_zh}
              onChange={(e) => setFormData({ ...formData, description_zh: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="单元描述"
              rows={3}
            />
          </div>

          {/* Description (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              描述 (英文)
            </label>
            <textarea
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              placeholder="Unit description"
              rows={3}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              封面图片
            </label>
            <FileUpload
              category="image"
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              preview
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              主题色
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-10 rounded border border-slate-600 cursor-pointer"
              />
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white rounded-lg text-sm transition-colors"
            >
              {isLoading ? "保存中..." : mode === "create" ? "创建" : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
