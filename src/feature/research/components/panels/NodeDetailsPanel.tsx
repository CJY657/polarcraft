/**
 * Node Details Panel Component
 * 节点属性面板组件
 *
 * Panel for viewing and editing node properties
 * 查看和编辑节点属性的面板
 */

import { useState, useEffect } from 'react';
import { X, Save, Trash2, Loader2 } from 'lucide-react';
import { useCanvasStore, selectSelectedNode } from '../../stores/canvasStore';
import { cn } from '@/utils/classNames';
import type { ResearchNode } from '@/types/research';
import type { Node } from 'reactflow';
import { MarkdownEditor } from '../shared/MarkdownEditor';
import { MarkdownRenderer } from '../shared/MarkdownRenderer';
import { api } from '@/lib/api';
import type {
  ProblemNodeData,
  ExperimentNodeData,
  ConclusionNodeData,
  DiscussionNodeData,
  MediaNodeData,
  NoteNodeData,
  BaseNodeData,
} from '../../types/node-data.types';
import { getNodeField } from '../../types/node-data.types';
import type { LabelI18n } from '@/types/i18n';

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

export function NodeDetailsPanel({ theme = 'dark', onUpdateNode, onRemoveNode, readOnly = false }: NodeDetailsPanelProps) {
  const selectedNode = useCanvasStore(selectSelectedNode) as Node<ResearchNode> | null;
  const storeUpdateNode = useCanvasStore((state) => state.updateNode);
  const storeRemoveNode = useCanvasStore((state) => state.removeNode);

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
        summary: getNodeField(data, 'summary') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        description: getNodeField(data, 'description') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        status: getNodeField(data, 'status') as string,
        priority: getNodeField(data, 'priority') as string,
        hypothesis: getNodeField(data, 'hypothesis') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        statement: getNodeField(data, 'statement') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        limitations: getNodeField(data, 'limitations') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        futureWork: getNodeField(data, 'futureWork') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        confidence: getNodeField(data, 'confidence') as number,
        topic: getNodeField(data, 'topic') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        participants: getNodeField(data, 'participants') as string[],
        url: getNodeField(data, 'url') as string,
        mediaType: getNodeField(data, 'mediaType') as 'image' | 'video',
        content: getNodeField(data, 'content') as { 'zh-CN'?: string; zh?: string; en?: string } | undefined,
        color: getNodeField(data, 'color') as 'yellow' | 'green' | 'blue' | 'pink' | 'purple',
        pinned: getNodeField(data, 'pinned') as boolean,
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
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h3 className={cn('text-sm font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
            节点属性
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className={cn('text-sm text-center', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
            点击节点查看属性
          </p>
        </div>
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className={cn('text-sm font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
          节点属性
        </h3>
        <button
          onClick={() => useCanvasStore.getState().clearSelection()}
          className={cn(
            'p-1 rounded hover:bg-slate-700 transition-colors',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Node Type Badge */}
        <div>
          <span className={cn('text-xs text-gray-500', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
            类型
          </span>
          <div className={cn(
            'mt-1 inline-block px-2 py-1 rounded text-xs font-medium',
            theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          )}>
            {nodeTypeLabels[nodeType] || nodeType}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
            标题
          </label>
          {editing ? (
            <input
              type="text"
              value={formData.title?.zh || formData.title?.['zh-CN'] || ''}
              onChange={(e) => setFormData({ ...formData, title: { 'zh-CN': e.target.value, zh: e.target.value, en: e.target.value } })}
              className={cn(
                'w-full px-2 py-1.5 rounded text-sm',
                theme === 'dark'
                  ? 'bg-slate-700 border border-slate-600 text-white focus:border-purple-500'
                  : 'bg-white border border-gray-300 text-gray-900 focus:border-purple-400'
              )}
            />
          ) : (
            <div className={cn('text-sm', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
              {selectedNode.data.title?.zh || selectedNode.data.title?.['zh-CN'] || selectedNode.data.title?.en || '-'}
            </div>
          )}
        </div>

        {/* Description (only for nodes that have it) */}
        {hasDescription && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              描述
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.description?.zh || formData.description?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, description: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={5}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-40 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {getData().description?.zh || getData().description?.['zh-CN'] || getData().description?.en ? (
                  <MarkdownRenderer content={getData().description?.zh || getData().description?.['zh-CN'] || getData().description?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Summary for literature nodes */}
        {nodeType === 'literature' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              摘要
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.summary?.zh || formData.summary?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, summary: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={5}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-40 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {(getNodeField(getData(), 'summary') as LabelI18n)?.zh || (getNodeField(getData(), 'summary') as LabelI18n)?.['zh-CN'] || (getNodeField(getData(), 'summary') as LabelI18n)?.en ? (
                  <MarkdownRenderer content={(getNodeField(getData(), 'summary') as LabelI18n)?.zh || (getNodeField(getData(), 'summary') as LabelI18n)?.['zh-CN'] || (getNodeField(getData(), 'summary') as LabelI18n)?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hypothesis for problem nodes */}
        {nodeType === 'problem' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              假设
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.hypothesis?.zh || formData.hypothesis?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, hypothesis: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={3}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-32 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {getData().hypothesis?.zh || getData().hypothesis?.['zh-CN'] || getData().hypothesis?.en ? (
                  <MarkdownRenderer content={getData().hypothesis?.zh || getData().hypothesis?.['zh-CN'] || getData().hypothesis?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statement for conclusion nodes */}
        {nodeType === 'conclusion' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              结论陈述
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.statement?.zh || formData.statement?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, statement: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={4}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-40 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {getData().statement?.zh || getData().statement?.['zh-CN'] || getData().statement?.en ? (
                  <MarkdownRenderer content={getData().statement?.zh || getData().statement?.['zh-CN'] || getData().statement?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confidence for conclusion nodes */}
        {nodeType === 'conclusion' && (() => {
          const currentConfidence = formData.confidence !== undefined
            ? formData.confidence
            : getData().confidence !== undefined
              ? getData().confidence as number
              : 0.5;
          return (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={cn('text-xs text-gray-500', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
                  可信度
                </label>
                <span className={cn('text-xs font-medium', theme === 'dark' ? 'text-purple-400' : 'text-purple-600')}>
                  {Math.round(currentConfidence * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={currentConfidence}
                onChange={(e) => {
                  const newConfidence = parseFloat(e.target.value);
                  setFormData({ ...formData, confidence: newConfidence });
                  // Immediately update the node without requiring save
                  updateNode(selectedNode.id, {
                    data: {
                      ...getData(),
                      confidence: newConfidence,
                    } as ResearchNode,
                  });
                }}
                className={cn(
                  'w-full h-2 rounded-lg appearance-none cursor-pointer',
                  theme === 'dark'
                    ? 'bg-slate-700 accent-purple-500'
                    : 'bg-gray-200 accent-purple-600'
                )}
              />
              <div className="flex justify-between mt-1">
                <span className={cn('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>低</span>
                <span className={cn('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>高</span>
              </div>
            </div>
          );
        })()}

        {/* Limitations for conclusion nodes */}
        {nodeType === 'conclusion' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              局限性
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.limitations?.zh || formData.limitations?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, limitations: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={3}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-32 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {getData().limitations?.zh || getData().limitations?.['zh-CN'] || getData().limitations?.en ? (
                  <MarkdownRenderer content={getData().limitations?.zh || getData().limitations?.['zh-CN'] || getData().limitations?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Future Work for conclusion nodes */}
        {nodeType === 'conclusion' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              后续工作
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.futureWork?.zh || formData.futureWork?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, futureWork: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={3}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-32 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {getData().futureWork?.zh || getData().futureWork?.['zh-CN'] || getData().futureWork?.en ? (
                  <MarkdownRenderer content={getData().futureWork?.zh || getData().futureWork?.['zh-CN'] || getData().futureWork?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Status (for nodes that have status) */}
        {hasStatus && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              状态
            </label>
            {editing ? (
              <select
                value={formData.status || getData().status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={cn(
                  'w-full px-2 py-1.5 rounded text-sm',
                  theme === 'dark'
                    ? 'bg-slate-700 border border-slate-600 text-white focus:border-purple-500'
                    : 'bg-white border border-gray-300 text-gray-900 focus:border-purple-400'
                )}
              >
                <option value="open">开放</option>
                <option value="investigating">调查中</option>
                <option value="answered">已解答</option>
                <option value="pending">待执行</option>
                <option value="running">运行中</option>
                <option value="completed">已完成</option>
                <option value="active">进行中</option>
                <option value="closed">已结束</option>
              </select>
            ) : (
              <div className={cn('text-sm', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                {getData().status as string}
              </div>
            )}
          </div>
        )}

        {/* Priority (for problem nodes) */}
        {nodeType === 'problem' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              优先级
            </label>
            {editing ? (
              <select
                value={formData.priority || (getData() as ProblemNodeData).priority || 'medium'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className={cn(
                  'w-full px-2 py-1.5 rounded text-sm',
                  theme === 'dark'
                    ? 'bg-slate-700 border border-slate-600 text-white focus:border-purple-500'
                    : 'bg-white border border-gray-300 text-gray-900 focus:border-purple-400'
                )}
              >
                <option value="low">低优先级</option>
                <option value="medium">中优先级</option>
                <option value="high">高优先级</option>
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border',
                    (getData() as ProblemNodeData).priority === 'low' && 'bg-gray-500/20 text-gray-400 border-gray-500',
                    (getData() as ProblemNodeData).priority === 'medium' && 'bg-amber-500/20 text-amber-400 border-amber-500',
                    (getData() as ProblemNodeData).priority === 'high' && 'bg-red-500/20 text-red-400 border-red-500',
                    !(getData() as ProblemNodeData).priority && 'bg-gray-500/20 text-gray-400 border-gray-500'
                  )}
                >
                  {(getData() as ProblemNodeData).priority === 'low' && '低优先级'}
                  {(getData() as ProblemNodeData).priority === 'medium' && '中优先级'}
                  {(getData() as ProblemNodeData).priority === 'high' && '高优先级'}
                  {!(getData() as ProblemNodeData).priority && '中优先级'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Topic for discussion nodes */}
        {nodeType === 'discussion' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              讨论主题
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.topic?.zh || formData.topic?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, topic: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={4}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-40 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {(getData() as DiscussionNodeData).topic?.zh || (getData() as DiscussionNodeData).topic?.['zh-CN'] || (getData() as DiscussionNodeData).topic?.en ? (
                  <MarkdownRenderer content={(getData() as DiscussionNodeData).topic?.zh || (getData() as DiscussionNodeData).topic?.['zh-CN'] || (getData() as DiscussionNodeData).topic?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Media URL for media nodes */}
        {nodeType === 'media' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              媒体链接
            </label>
            {editing ? (
              <input
                type="text"
                value={formData.url || (getData() as MediaNodeData).url || ''}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="输入图片或视频URL..."
                className={cn(
                  'w-full px-2 py-1.5 rounded text-sm',
                  theme === 'dark'
                    ? 'bg-slate-700 border border-slate-600 text-white focus:border-purple-500 focus:outline-none'
                    : 'bg-white border border-gray-300 text-gray-900 focus:border-purple-400 focus:outline-none'
                )}
              />
            ) : (
              <div className={cn('text-sm', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                {(getData() as MediaNodeData).url || '-'}
              </div>
            )}
          </div>
        )}

        {/* Media Type for media nodes */}
        {nodeType === 'media' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              媒体类型
            </label>
            {editing ? (
              <select
                value={formData.mediaType || (getData() as MediaNodeData).mediaType || 'image'}
                onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as 'image' | 'video' })}
                className={cn(
                  'w-full px-2 py-1.5 rounded text-sm',
                  theme === 'dark'
                    ? 'bg-slate-700 border border-slate-600 text-white focus:border-purple-500 focus:outline-none'
                    : 'bg-white border border-gray-300 text-gray-900 focus:border-purple-400 focus:outline-none'
                )}
              >
                <option value="image">图片</option>
                <option value="video">视频</option>
              </select>
            ) : (
              <div className={cn('text-sm', theme === 'dark' ? 'text-white' : 'text-gray-900')}>
                {(getData() as MediaNodeData).mediaType === 'video' ? '视频' : '图片'}
              </div>
            )}
          </div>
        )}

        {/* Content for note nodes */}
        {nodeType === 'note' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-1', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              内容
            </label>
            {editing ? (
              <MarkdownEditor
                value={formData.content?.zh || formData.content?.['zh-CN'] || ''}
                onChange={(value) => setFormData({ ...formData, content: { 'zh-CN': value, zh: value, en: value } })}
                placeholder="支持 Markdown 语法..."
                rows={6}
                theme={theme}
              />
            ) : (
              <div className={cn('p-2 rounded border text-sm max-h-48 overflow-y-auto', theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200')}>
                {(getData() as NoteNodeData).content?.zh || (getData() as NoteNodeData).content?.['zh-CN'] || (getData() as NoteNodeData).content?.en ? (
                  <MarkdownRenderer content={(getData() as NoteNodeData).content?.zh || (getData() as NoteNodeData).content?.['zh-CN'] || (getData() as NoteNodeData).content?.en || ''} className="prose-sm" />
                ) : (
                  <span className={cn('text-gray-500', theme === 'dark' ? 'text-gray-600' : '')}>-</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Color picker for note nodes */}
        {nodeType === 'note' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-2', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              颜色
            </label>
            <div className="flex gap-2">
              {[
                { value: 'yellow', label: '黄色', bgClass: 'bg-yellow-400', borderClass: 'ring-yellow-500' },
                { value: 'green', label: '绿色', bgClass: 'bg-green-400', borderClass: 'ring-green-500' },
                { value: 'blue', label: '蓝色', bgClass: 'bg-blue-400', borderClass: 'ring-blue-500' },
                { value: 'pink', label: '粉色', bgClass: 'bg-pink-400', borderClass: 'ring-pink-500' },
                { value: 'purple', label: '紫色', bgClass: 'bg-purple-400', borderClass: 'ring-purple-500' },
              ].map((colorOption) => {
                const currentColor = formData.color || (getData() as NoteNodeData).color || 'yellow';
                const isSelected = currentColor === colorOption.value;
                return (
                  <button
                    key={colorOption.value}
                    type="button"
                    onClick={() => {
                      const newColor = colorOption.value as 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
                      setFormData({ ...formData, color: newColor });
                      // Immediately update the node
                      updateNode(selectedNode.id, {
                        data: {
                          ...getData(),
                          color: newColor,
                        } as ResearchNode,
                      });
                    }}
                    className={cn(
                      'w-8 h-8 rounded-full transition-all',
                      colorOption.bgClass,
                      isSelected ? `ring-2 ${colorOption.borderClass} ring-offset-2` : 'hover:scale-110',
                      theme === 'dark' ? 'ring-offset-slate-800' : 'ring-offset-white'
                    )}
                    title={colorOption.label}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Pinned toggle for note nodes */}
        {nodeType === 'note' && (
          <div>
            <label className={cn('text-xs text-gray-500 block mb-2', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
              置顶
            </label>
            <button
              type="button"
              onClick={() => {
                const newPinned = !(formData.pinned ?? (getData() as NoteNodeData).pinned ?? false);
                setFormData({ ...formData, pinned: newPinned });
                // Immediately update the node
                updateNode(selectedNode.id, {
                  data: {
                    ...getData(),
                    pinned: newPinned,
                  } as ResearchNode,
                });
              }}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                (formData.pinned ?? (getData() as NoteNodeData).pinned ?? false)
                  ? 'bg-yellow-500'
                  : theme === 'dark' ? 'bg-slate-600' : 'bg-gray-300'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  (formData.pinned ?? (getData() as NoteNodeData).pinned ?? false)
                    ? 'translate-x-6'
                    : 'translate-x-1'
                )}
              />
            </button>
            <span className={cn('ml-2 text-xs', theme === 'dark' ? 'text-gray-400' : 'text-gray-500')}>
              {(formData.pinned ?? (getData() as NoteNodeData).pinned ?? false) ? '已置顶' : '未置顶'}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={cn(
            'p-3 rounded text-sm',
            theme === 'dark' ? 'bg-red-900/30 text-red-400 border border-red-700' : 'bg-red-50 text-red-600 border border-red-200'
          )}>
            {error}
          </div>
        )}

        {/* Created Info */}
        <div className="pt-4 border-t border-slate-700">
          <div className={cn('text-xs', theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}>
            <div>创建时间: {new Date(selectedNode.data.createdAt || Date.now()).toLocaleString('zh-CN')}</div>
            <div className="mt-1">节点ID: {selectedNode.id.slice(0, 8)}...</div>
          </div>
        </div>
      </div>

      {/* Footer Actions - 只读模式隐藏 */}
      {!readOnly && (
      <div className="p-4 border-t border-slate-700 flex gap-2">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  保存
                </>
              )}
            </button>
            <button
              onClick={() => setEditing(false)}
              className={cn(
                'px-3 py-2 rounded text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              )}
            >
              取消
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className={cn(
                'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
                theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              )}
            >
              编辑
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={cn(
                'px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                theme === 'dark'
                  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50'
                  : 'bg-red-100 hover:bg-red-200 text-red-600 border border-red-300'
              )}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </>
        )}
      </div>
      )}
    </div>
  );
}
