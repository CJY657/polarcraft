/**
 * Node Details Panel Component
 * 节点属性面板组件
 *
 * Panel for viewing and editing node properties
 * 查看和编辑节点属性的面板
 */

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2, Info, Palette, Settings2, Calendar, User, Fingerprint } from 'lucide-react';
import { useCanvasStore, selectSelectedNode } from '../../stores/canvasStore';
import { cn } from '@/utils/classNames';
import type { ResearchNode } from '@/types/research';
import type { Node } from 'reactflow';
import { MarkdownEditor } from '../shared/MarkdownEditor';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { api } from '@/lib/api';
import type {
  ProblemNodeData,
  NoteNodeData,
  BaseNodeData,
} from '../../types/node-data.types';
import { getNodeField } from '../../types/node-data.types';

interface NodeDetailsPanelProps {
  theme?: 'dark' | 'light';
  onUpdateNode?: (nodeId: string, updates: Partial<Node<ResearchNode>>) => void;
  onRemoveNode?: (nodeId: string) => void;
  readOnly?: boolean;
}

// Form data type that's more flexible for editing
interface FormData {
  title?: { 'zh-CN': string; zh?: string; en?: string };
  summary?: { 'zh-CN': string; zh?: string; en?: string };
  description?: { 'zh-CN': string; zh?: string; en?: string };
  keyFindings?: { 'zh-CN'?: string[]; zh?: string[]; en?: string[] };
  status?: string;
  priority?: string;
  hypothesis?: { 'zh-CN': string; zh?: string; en?: string };
  statement?: { 'zh-CN': string; zh?: string; en?: string };
  limitations?: { 'zh-CN': string; zh?: string; en?: string };
  futureWork?: { 'zh-CN': string; zh?: string; en?: string };
  confidence?: number;
  topic?: { 'zh-CN': string; zh?: string; en?: string };
  participants?: string[];
  url?: string;
  mediaType?: 'image' | 'video';
  content?: { 'zh-CN': string; zh?: string; en?: string };
  color?: 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
  pinned?: boolean;
}

type TabType = 'properties' | 'appearance' | 'advanced';

export function NodeDetailsPanel({ theme = 'dark', onUpdateNode, onRemoveNode, readOnly = false }: NodeDetailsPanelProps) {
  const selectedNode = useCanvasStore(selectSelectedNode) as Node<ResearchNode> | null;
  const storeUpdateNode = useCanvasStore((state) => state.updateNode);
  const storeRemoveNode = useCanvasStore((state) => state.removeNode);

  const [activeTab, setActiveTab] = useState<TabType>('properties');

  // Use passed functions if available, otherwise fall back to store functions
  const updateNode = onUpdateNode || storeUpdateNode;
  const removeNode = onRemoveNode || storeRemoveNode;

  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<FormData>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when node changes
  useEffect(() => {
    if (selectedNode?.data) {
      const data = selectedNode.data as BaseNodeData;
      setFormData({
        title: data.title,
        summary: getNodeField(data, 'summary' as any) as any,
        description: getNodeField(data, 'description' as any) as any,
        status: getNodeField(data, 'status' as any) as string,
        priority: getNodeField(data, 'priority' as any) as string,
        hypothesis: getNodeField(data, 'hypothesis' as any) as any,
        statement: getNodeField(data, 'statement' as any) as any,
        limitations: getNodeField(data, 'limitations' as any) as any,
        futureWork: getNodeField(data, 'futureWork' as any) as any,
        confidence: getNodeField(data, 'confidence' as any) as number,
        topic: getNodeField(data, 'topic' as any) as any,
        participants: getNodeField(data, 'participants' as any) as string[],
        url: getNodeField(data, 'url' as any) as string,
        mediaType: getNodeField(data, 'mediaType' as any) as 'image' | 'video',
        content: getNodeField(data, 'content' as any) as any,
        color: getNodeField(data, 'color' as any) as 'yellow' | 'green' | 'blue' | 'pink' | 'purple',
        pinned: getNodeField(data, 'pinned' as any) as boolean,
      });
      setEditing(false);
    }
  }, [selectedNode]);

  const handleSave = async () => {
    if (selectedNode && formData) {
      setSaving(true);
      setError(null);

      try {
        // Call backend API to update node
        await api.put(`/api/research/nodes/${selectedNode.id}`, formData);

        // Update local state after successful API call
        updateNode(selectedNode.id, {
          data: {
            ...selectedNode.data,
            ...formData,
          } as ResearchNode,
        });

        setEditing(false);
      } catch (err) {
        console.error('Failed to update node:', err);
        setError(err instanceof Error ? err.message : '保存失败，请重试');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedNode && confirm('确定要删除此节点吗？')) {
      setDeleting(true);
      setError(null);

      try {
        // Call backend API to delete node
        await api.delete(`/api/research/nodes/${selectedNode.id}`);

        // Update local state after successful API call
        removeNode(selectedNode.id);
      } catch (err) {
        console.error('Failed to delete node:', err);
        setError(err instanceof Error ? err.message : '删除失败，请重试');
      } finally {
        setDeleting(false);
      }
    }
  };

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className={cn(
          "w-16 h-16 rounded-3xl mb-4 flex items-center justify-center border transition-colors",
          theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-400"
        )}>
          <Info className="w-8 h-8" />
        </div>
        <h3 className={cn("text-sm font-medium mb-1", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
          未选中节点
        </h3>
        <p className={cn("text-xs", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
          在画布上点击任意节点以查看并编辑其详细属性
        </p>
      </div>
    );
  }

  const nodeTypeLabels: Record<string, string> = {
    problem: '问题',
    experiment: '实验',
    literature: '文献',
    data: '数据',
    conclusion: '结论',
    discussion: '讨论',
    media: '媒体',
    note: '便签',
  };

  const nodeType = selectedNode?.type || '';

  // Check if node has description field
  const hasDescription = selectedNode?.data && 'description' in selectedNode.data;
  // Check if node has status field
  const hasStatus = selectedNode?.data && 'status' in selectedNode.data;
  // Check if node has priority field
  const hasPriority = selectedNode?.data && 'priority' in selectedNode.data;

  // Type-safe data access helper
  const getData = () => selectedNode?.data as BaseNodeData;

  const TabButton = ({ id, label, icon: Icon }: { id: TabType; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex-1 flex flex-col items-center gap-1.5 py-3 border-b-2 transition-all",
        activeTab === id
          ? (theme === 'dark' ? "border-blue-500 text-blue-400" : "border-blue-600 text-blue-600")
          : (theme === 'dark' ? "border-transparent text-slate-500 hover:text-slate-300" : "border-transparent text-slate-400 hover:text-slate-600")
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={cn(
        "px-4 py-4 border-b flex items-center justify-between",
        theme === 'dark' ? "border-slate-800" : "border-slate-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            nodeType === 'problem' && "bg-amber-500/20 text-amber-500",
            nodeType === 'experiment' && "bg-blue-500/20 text-blue-500",
            nodeType === 'conclusion' && "bg-emerald-500/20 text-emerald-500",
            nodeType === 'discussion' && "bg-cyan-500/20 text-cyan-500",
            nodeType === 'media' && "bg-pink-500/20 text-pink-500",
            nodeType === 'note' && "bg-indigo-500/20 text-indigo-500",
          )}>
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className={cn('text-sm font-bold', theme === 'dark' ? 'text-white' : 'text-slate-900')}>
              {nodeTypeLabels[nodeType] || '属性'}
            </h3>
            <p className="text-[10px] text-slate-500 font-mono">ID: {selectedNode.id.slice(0, 12)}</p>
          </div>
        </div>
        <button
          onClick={() => useCanvasStore.getState().clearSelection()}
          className={cn(
            'p-1.5 rounded-full transition-colors',
            theme === 'dark' ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className={cn(
        "flex border-b",
        theme === 'dark' ? "border-slate-800" : "border-slate-200"
      )}>
        <TabButton id="properties" label="属性" icon={Info} />
        <TabButton id="appearance" label="样式" icon={Palette} />
        <TabButton id="advanced" label="高级" icon={Settings2} />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {activeTab === 'properties' && (
          <div className="p-5 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">标题</label>
              {editing ? (
                <input
                  type="text"
                  value={formData.title?.zh || formData.title?.['zh-CN'] || ''}
                  onChange={(e) => setFormData({ ...formData, title: { 'zh-CN': e.target.value, zh: e.target.value, en: e.target.value } })}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-sm transition-all focus:ring-2 outline-none',
                    theme === 'dark'
                      ? 'bg-slate-800 border border-slate-700 text-white focus:border-blue-500 focus:ring-blue-500/20'
                      : 'bg-white border border-slate-200 text-slate-900 focus:border-blue-400 focus:ring-blue-400/20'
                  )}
                  placeholder="输入节点标题..."
                />
              ) : (
                <div className={cn('text-sm font-medium leading-relaxed', theme === 'dark' ? 'text-slate-200' : 'text-slate-800')}>
                  {selectedNode.data.title?.zh || selectedNode.data.title?.['zh-CN'] || selectedNode.data.title?.en || '-'}
                </div>
              )}
            </div>

            {/* Description / Content */}
            {(hasDescription || nodeType === 'note') && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {nodeType === 'note' ? '内容' : '描述'}
                </label>
                {editing ? (
                  <MarkdownEditor
                    value={
                      nodeType === 'note'
                        ? (formData.content?.zh || formData.content?.['zh-CN'] || '')
                        : (formData.description?.zh || formData.description?.['zh-CN'] || '')
                    }
                    onChange={(value) =>
                      nodeType === 'note'
                        ? setFormData({ ...formData, content: { 'zh-CN': value, zh: value, en: value } })
                        : setFormData({ ...formData, description: { 'zh-CN': value, zh: value, en: value } })
                    }
                    placeholder="支持 Markdown 语法..."
                    rows={8}
                    theme={theme}
                  />
                ) : (
                  <div className={cn(
                    'p-3 rounded-xl border text-sm max-h-60 overflow-y-auto prose prose-invert prose-slate',
                    theme === 'dark' ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                  )}>
                    {nodeType === 'note' ? (
                      (getData() as NoteNodeData).content?.zh || (getData() as NoteNodeData).content?.['zh-CN'] ? (
                        <MarkdownRenderer content={(getData() as NoteNodeData).content?.zh || (getData() as NoteNodeData).content?.['zh-CN'] || ''} className="prose-sm" />
                      ) : <span className="text-slate-600 italic">暂无内容</span>
                    ) : (
                      (getData() as any).description?.zh || (getData() as any).description?.['zh-CN'] ? (
                        <MarkdownRenderer content={(getData() as any).description?.zh || (getData() as any).description?.['zh-CN'] || ''} className="prose-sm" />
                      ) : <span className="text-slate-600 italic">暂无描述</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Specific Fields per Node Type */}
            {nodeType === 'problem' && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">状态</label>
                    <select
                      disabled={!editing}
                      value={formData.status || (getData() as any).status || ''}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className={cn(
                        'w-full px-2 py-1.5 rounded-lg text-xs appearance-none',
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      )}
                    >
                      <option value="open">开放</option>
                      <option value="investigating">调查中</option>
                      <option value="answered">已解答</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">优先级</label>
                    <select
                      disabled={!editing}
                      value={formData.priority || (getData() as ProblemNodeData).priority || 'medium'}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className={cn(
                        'w-full px-2 py-1.5 rounded-lg text-xs appearance-none',
                        theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                      )}
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {nodeType === 'conclusion' && (
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">可信度</label>
                    <span className="text-xs font-mono text-blue-500">{Math.round((formData.confidence || (getData() as any).confidence as number || 0.5) * 100)}%</span>
                  </div>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    disabled={!editing}
                    value={formData.confidence || (getData() as any).confidence as number || 0.5}
                    onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'appearance' && (
          <div className="p-5 space-y-6">
            {nodeType === 'note' && (
              <div className="space-y-4">
                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">颜色方案</label>
                 <div className="grid grid-cols-5 gap-3">
                   {[
                    { value: 'yellow', color: '#fbbf24' },
                    { value: 'green', color: '#4ade80' },
                    { value: 'blue', color: '#60a5fa' },
                    { value: 'pink', color: '#f472b6' },
                    { value: 'purple', color: '#a78bfa' },
                   ].map((c) => (
                     <button
                        key={c.value}
                        onClick={() => {
                          setFormData({ ...formData, color: c.value as any });
                          updateNode(selectedNode.id, { data: { ...getData(), color: c.value } as any });
                        }}
                        className={cn(
                          "aspect-square rounded-full border-4 transition-all hover:scale-110",
                          (formData.color || (getData() as NoteNodeData).color) === c.value
                            ? "border-white shadow-lg"
                            : "border-transparent opacity-60"
                        )}
                        style={{ backgroundColor: c.color }}
                     />
                   ))}
                 </div>
              </div>
            )}

            <div className="space-y-4">
               <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">常用选项</label>
               <div className="space-y-2">
                  <button
                    disabled={!editing && nodeType !== 'note'}
                    onClick={() => {
                       const newPinned = !(formData.pinned ?? (getData() as NoteNodeData).pinned ?? false);
                       setFormData({ ...formData, pinned: newPinned });
                       updateNode(selectedNode.id, { data: { ...getData(), pinned: newPinned } as any });
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-sm",
                      (formData.pinned ?? (getData() as NoteNodeData).pinned)
                        ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
                        : "bg-slate-800/40 border-slate-700/50 text-slate-400 hover:bg-slate-800"
                    )}
                  >
                    <span>固定在最前端</span>
                    <div className={cn(
                      "w-8 h-4 rounded-full relative transition-colors",
                      (formData.pinned ?? (getData() as NoteNodeData).pinned) ? "bg-amber-500" : "bg-slate-700"
                    )}>
                      <div className={cn(
                        "w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all",
                        (formData.pinned ?? (getData() as NoteNodeData).pinned) ? "left-4.5" : "left-0.5"
                      )} />
                    </div>
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="p-5 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">创建时间</p>
                  <p className="text-xs text-slate-300">{new Date(selectedNode.data.createdAt || Date.now()).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">创建者</p>
                  <p className="text-xs text-slate-300">{selectedNode.data.createdBy || '系统系统'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Fingerprint className="w-4 h-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">唯一标识符</p>
                  <p className="text-[10px] text-slate-500 font-mono break-all">{selectedNode.id}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
               <button
                onClick={handleDelete}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all text-sm font-medium"
               >
                 {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                 永久删除节点
               </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions - 只读模式隐藏 */}
      {!readOnly && (
      <div className={cn(
        "p-4 border-t flex gap-2",
        theme === 'dark' ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"
      )}>
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/20 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存修改
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all text-sm font-medium"
            >
              取消
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all text-sm font-bold border border-slate-700/50"
          >
            编辑节点信息
          </button>
        )}
      </div>
      )}

      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[11px] flex items-center gap-2">
          <X className="w-3 h-3 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
