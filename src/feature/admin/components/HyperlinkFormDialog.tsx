/**
 * Hyperlink Form Dialog
 * 超链接表单对话框
 *
 * Used for creating and editing hyperlinks
 * 用于创建和编辑超链接
 */

import { useState, useEffect } from 'react';
import { useCourseAdminStore } from '@/stores/courseAdminStore';
import {
  CourseMedia,
  CourseHyperlink,
  CreateHyperlinkInput,
  UpdateHyperlinkInput,
} from '@/lib/course.service';
import { X } from 'lucide-react';

interface HyperlinkFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  sourceMediaId: string;
  sourceMediaTitle: string;
  media: CourseMedia[];
  editingHyperlink?: CourseHyperlink | null;
  newPosition?: { x: number; y: number; width: number; height: number; page: number } | null;
}

const DEFAULT_WIDTH = 0.15;
const DEFAULT_HEIGHT = 0.1;

export function HyperlinkFormDialog({
  isOpen,
  onClose,
  courseId,
  sourceMediaId,
  sourceMediaTitle,
  media,
  editingHyperlink,
  newPosition,
}: HyperlinkFormDialogProps) {
  const { createHyperlink, updateHyperlink, isLoading, error } = useCourseAdminStore();

  const [formData, setFormData] = useState({
    page: 1,
    x: 0.5,
    y: 0.5,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    targetMediaId: '',
  });

  useEffect(() => {
    if (editingHyperlink) {
      setFormData({
        page: editingHyperlink.page,
        x: editingHyperlink.x,
        y: editingHyperlink.y,
        width: editingHyperlink.width,
        height: editingHyperlink.height,
        targetMediaId: editingHyperlink.targetMediaId,
      });
    } else if (newPosition) {
      setFormData({
        page: newPosition.page,
        x: newPosition.x,
        y: newPosition.y,
        width: newPosition.width,
        height: newPosition.height,
        targetMediaId: '',
      });
    } else {
      setFormData({
        page: 1,
        x: 0.5,
        y: 0.5,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        targetMediaId: '',
      });
    }
  }, [editingHyperlink, newPosition, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.targetMediaId) return;

    try {
      if (editingHyperlink) {
        const input: UpdateHyperlinkInput = {
          sourceMediaId,
          page: formData.page,
          x: formData.x,
          y: formData.y,
          width: formData.width,
          height: formData.height,
          targetMediaId: formData.targetMediaId,
        };
        await updateHyperlink(editingHyperlink.id, input);
      } else {
        const input: CreateHyperlinkInput = {
          sourceMediaId,
          page: formData.page,
          x: formData.x,
          y: formData.y,
          width: formData.width,
          height: formData.height,
          targetMediaId: formData.targetMediaId,
        };
        await createHyperlink(courseId, input);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save hyperlink:', err);
    }
  };

  // Convert value to percentage for display
  const toPercent = (value: number) => Math.round(value * 100);

  // Convert percentage to value
  const fromPercent = (value: number) => value / 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            {editingHyperlink ? '编辑实验媒体超链接' : '创建实验媒体超链接'}
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
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
            <p className="mb-1 text-xs text-gray-400">当前 PPT</p>
            <p className="text-sm text-white">{sourceMediaTitle}</p>
          </div>

          {/* Target Media */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              目标实验媒体 *
            </label>
            <select
              value={formData.targetMediaId}
              onChange={(e) => setFormData({ ...formData, targetMediaId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            >
              <option value="">选择右侧实验媒体...</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title['zh-CN']}
                  {m.title['en-US'] && ` (${m.title['en-US']})`}
                </option>
              ))}
            </select>
            {media.length === 0 && (
              <p className="text-amber-400 text-xs mt-1">
                暂无可用的图片或视频媒体，请先在“媒体”标签中添加。
              </p>
            )}
          </div>

          {/* Page */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">页码</label>
            <input
              type="number"
              value={formData.page}
              onChange={(e) => setFormData({ ...formData, page: parseInt(e.target.value, 10) || 1 })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              min="1"
            />
          </div>

          {/* Position */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                X 位置: {toPercent(formData.x)}%
              </label>
              <input
                type="range"
                value={toPercent(formData.x)}
                onChange={(e) =>
                  setFormData({ ...formData, x: fromPercent(parseInt(e.target.value, 10)) })
                }
                className="w-full"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Y 位置: {toPercent(formData.y)}%
              </label>
              <input
                type="range"
                value={toPercent(formData.y)}
                onChange={(e) =>
                  setFormData({ ...formData, y: fromPercent(parseInt(e.target.value, 10)) })
                }
                className="w-full"
                min="0"
                max="100"
              />
            </div>
          </div>

          {/* Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                宽度: {toPercent(formData.width)}%
              </label>
              <input
                type="range"
                value={toPercent(formData.width)}
                onChange={(e) =>
                  setFormData({ ...formData, width: fromPercent(parseInt(e.target.value, 10)) })
                }
                className="w-full"
                min="5"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                高度: {toPercent(formData.height)}%
              </label>
              <input
                type="range"
                value={toPercent(formData.height)}
                onChange={(e) =>
                  setFormData({ ...formData, height: fromPercent(parseInt(e.target.value, 10)) })
                }
                className="w-full"
                min="5"
                max="100"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-900 rounded-lg p-4 relative h-32">
            <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-xs">
              预览
            </div>
            <div
              className="absolute bg-blue-500/30 border-2 border-blue-500 rounded"
              style={{
                left: `${formData.x * 100}%`,
                top: `${formData.y * 100}%`,
                width: `${formData.width * 100}%`,
                height: `${formData.height * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
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
              disabled={isLoading || !formData.targetMediaId || media.length === 0}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white rounded-lg text-sm transition-colors"
            >
              {isLoading ? '保存中...' : editingHyperlink ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
