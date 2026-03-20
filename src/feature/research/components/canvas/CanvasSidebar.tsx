/**
 * Canvas Sidebar Component
 * 画布左侧边栏组件
 *
 * Contains draggable node types for the research canvas
 * 包含研究画布的可拖拽节点类型
 */

import { HelpCircle, FlaskConical, CheckCircle2, MessageSquare, Image, FileText } from 'lucide-react';
import { cn } from '@/utils/classNames';

interface CanvasSidebarProps {
  theme?: 'dark' | 'light';
}

interface DraggableItemProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  theme: 'dark' | 'light';
}

function DraggableItem({ type, label, icon, color, theme }: DraggableItemProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing hover:shadow-md group",
        theme === 'dark'
          ? "bg-slate-800/40 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-500"
          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300"
      )}
      draggable
      onDragStart={(event) => onDragStart(event, type)}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
        color
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[11px] font-medium",
        theme === 'dark' ? "text-slate-400 group-hover:text-slate-200" : "text-slate-500 group-hover:text-slate-700"
      )}>
        {label}
      </span>
    </div>
  );
}

export function CanvasSidebar({ theme = 'dark' }: CanvasSidebarProps) {
  const nodeTypes = [
    { type: 'problem', label: '问题', icon: <HelpCircle className="w-5 h-5 text-white" />, color: 'bg-amber-500 shadow-lg shadow-amber-500/20' },
    { type: 'experiment', label: '实验', icon: <FlaskConical className="w-5 h-5 text-white" />, color: 'bg-blue-500 shadow-lg shadow-blue-500/20' },
    { type: 'conclusion', label: '结论', icon: <CheckCircle2 className="w-5 h-5 text-white" />, color: 'bg-emerald-500 shadow-lg shadow-emerald-500/20' },
    { type: 'discussion', label: '讨论', icon: <MessageSquare className="w-5 h-5 text-white" />, color: 'bg-cyan-500 shadow-lg shadow-cyan-500/20' },
    { type: 'media', label: '媒体', icon: <Image className="w-5 h-5 text-white" />, color: 'bg-pink-500 shadow-lg shadow-pink-500/20' },
    { type: 'note', label: '便签', icon: <FileText className="w-5 h-5 text-white" />, color: 'bg-indigo-500 shadow-lg shadow-indigo-500/20' },
  ];

  return (
    <div className={cn(
      "w-24 flex-shrink-0 border-r flex flex-col items-center py-6 gap-4 overflow-y-auto overflow-x-hidden no-scrollbar",
      theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200"
    )}>
      <div className={cn(
        "text-[10px] uppercase tracking-widest font-bold mb-2",
        theme === 'dark' ? "text-slate-500" : "text-slate-400"
      )}>
        组件库
      </div>

      {nodeTypes.map((node) => (
        <DraggableItem
          key={node.type}
          type={node.type}
          label={node.label}
          icon={node.icon}
          color={node.color}
          theme={theme}
        />
      ))}

      <div className="mt-auto pt-4 opacity-30">
        <div className={cn(
          "w-8 h-px mb-4",
          theme === 'dark' ? "bg-slate-700" : "bg-slate-300"
        )} />
        <div className="flex flex-col gap-4">
           {/* Placeholder for future tools */}
        </div>
      </div>
    </div>
  );
}
