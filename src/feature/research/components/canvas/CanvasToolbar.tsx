/**
 * Canvas Toolbar Component
 * 画布工具栏组件
 *
 * Provides common actions for the research canvas
 * 提供研究画布的常用操作
 */

import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo2,
  Redo2,
  Trash2,
  MousePointer2,
  Grab,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { cn } from '@/utils/classNames';
import { useReactFlow } from 'reactflow';

interface CanvasToolbarProps {
  theme?: 'dark' | 'light';
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  selectedCount?: number;
}

export function CanvasToolbar({
  theme = 'dark',
  onUndo,
  onRedo,
  onDelete,
  canUndo = false,
  canRedo = false,
  selectedCount = 0
}: CanvasToolbarProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleZoomIn = () => zoomIn();
  const handleZoomOut = () => zoomOut();
  const handleFitView = () => fitView({ padding: 0.2, duration: 800 });

  const ToolButton = ({
    icon: Icon,
    onClick,
    disabled = false,
    label,
    active = false,
    danger = false
  }: {
    icon: any;
    onClick?: () => void;
    disabled?: boolean;
    label: string;
    active?: boolean;
    danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "p-2 rounded-lg transition-all flex items-center justify-center relative group",
        theme === 'dark'
          ? "text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30",
        active && (theme === 'dark' ? "bg-slate-800 text-blue-400" : "bg-slate-200 text-blue-600"),
        danger && "hover:bg-red-500/10 hover:text-red-500"
      )}
    >
      <Icon className="w-4 h-4" />
      {/* Tooltip */}
      <span className="absolute bottom-full mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl border border-slate-700">
        {label}
      </span>
    </button>
  );

  const Separator = () => (
    <div className={cn(
      "w-px h-6 mx-1",
      theme === 'dark' ? "bg-slate-800" : "bg-slate-200"
    )} />
  );

  return (
    <div className={cn(
      "absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1.5 rounded-2xl border shadow-2xl backdrop-blur-md z-40 transition-all",
      theme === 'dark'
        ? "bg-slate-900/80 border-slate-700/50 shadow-black/40"
        : "bg-white/80 border-slate-200 shadow-slate-200/50"
    )}>
      <div className="flex items-center gap-1 px-1">
        <ToolButton icon={MousePointer2} label="选择模式" active />
        <ToolButton icon={Grab} label="抓手模式" />
      </div>

      <Separator />

      <div className="flex items-center gap-1">
        <ToolButton icon={Undo2} onClick={onUndo} disabled={!canUndo} label="撤销 (Ctrl+Z)" />
        <ToolButton icon={Redo2} onClick={onRedo} disabled={!canRedo} label="重做 (Ctrl+Y)" />
      </div>

      <Separator />

      <div className="flex items-center gap-1">
        <ToolButton icon={ZoomIn} onClick={handleZoomIn} label="放大" />
        <ToolButton icon={ZoomOut} onClick={handleZoomOut} label="缩小" />
        <ToolButton icon={Maximize} onClick={handleFitView} label="自适应视图" />
      </div>

      {selectedCount > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-1">
            <ToolButton
              icon={Trash2}
              onClick={onDelete}
              label={`删除选中项 (${selectedCount})`}
              danger
            />
            <ToolButton icon={Layers} label="组合选中项" />
          </div>
        </>
      )}

      <Separator />

      <div className="flex items-center gap-1">
        <ToolButton icon={LayoutGrid} label="自动布局" />
      </div>
    </div>
  );
}
