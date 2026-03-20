/**
 * Discussion Node Component
 * 讨论节点组件
 *
 * Chat-style discussion interface with quote replies
 * 聊天风格讨论界面，支持引用回复
 */

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Users, ThumbsUp, Reply, Send, X, Shield } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';
import { useCanvasStore } from '../../stores/canvasStore';
import type { DiscussionNodeData, DiscussionComment } from '../../types/node-data.types';

export const DiscussionNode = memo(({ id, data, selected }: NodeProps) => {
  const { updateNode } = useCanvasStore();
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<DiscussionComment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const comments = (data as DiscussionNodeData).comments || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments.length]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmitMessage = () => {
    if (newMessage.trim()) {
      const comment: DiscussionComment = {
        id: `comment-${Date.now()}`,
        author: '当前用户',
        content: newMessage,
        timestamp: new Date().toISOString(),
        likes: 0,
        ...(replyingTo && {
          replyTo: {
            id: replyingTo.id,
            author: replyingTo.author,
            content: replyingTo.content,
          },
        }),
      };
      const updatedComments = [...comments, comment];
      updateNode(id, {
        data: {
          ...data,
          comments: updatedComments,
        },
      });
      setNewMessage('');
      setReplyingTo(null);
    }
  };

  return (
    <div
      className={cn(
        'group relative min-w-[300px] max-w-[400px] transition-all duration-300',
        selected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      )}
    >
      {/* Selection Glow */}
      {selected && (
        <div className="absolute -inset-0.5 bg-cyan-500/30 blur-md rounded-2xl -z-10 animate-pulse" />
      )}

      <div className={cn(
        'relative bg-slate-900 border-2 rounded-2xl overflow-hidden shadow-2xl transition-all flex flex-col max-h-[500px]',
        selected ? 'border-cyan-500 shadow-cyan-500/20' : 'border-slate-800 hover:border-slate-700'
      )}>
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-cyan-500" />

        <div className="p-4 flex flex-col h-full space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-100 truncate leading-tight">
                  {data.title?.zh || data.title?.['zh-CN'] || '课题研讨'}
                </h3>
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                   <Users className="w-2.5 h-2.5" />
                   {data.participants?.length || 0} 位参与者
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-bold uppercase tracking-wider">进行中</span>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[120px] scrollbar-thin scrollbar-thumb-slate-800">
             {comments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-40 py-8">
                   <Shield className="w-8 h-8" />
                   <p className="text-[10px] font-bold uppercase tracking-widest text-center">加密学术研讨通道<br/>等待开启讨论</p>
                </div>
             ) : (
                comments.map((c, i) => (
                   <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-slate-400">{c.author}</span>
                         <span className="text-[9px] text-slate-600">{formatTime(c.timestamp)}</span>
                      </div>
                      <div className="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 text-[11px] text-slate-300 leading-relaxed group/msg">
                         <CompactMarkdown content={c.content} />
                         <button
                            onClick={() => setReplyingTo(c)}
                            className="absolute right-2 bottom-2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 bg-slate-900 rounded text-slate-500 hover:text-cyan-400"
                         >
                            <Reply className="w-3 h-3" />
                         </button>
                      </div>
                   </div>
                ))
             )}
             <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="space-y-2 pt-2 border-t border-slate-800 shrink-0">
             {replyingTo && (
                <div className="flex items-center justify-between px-2 py-1 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                   <p className="text-[9px] text-cyan-500/80 truncate">正在回复: {replyingTo.author}</p>
                   <button onClick={() => setReplyingTo(null)} className="text-slate-500 hover:text-white"><X className="w-2.5 h-2.5"/></button>
                </div>
             )}
             <div className="relative">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitMessage()}
                  placeholder="说点什么吧..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-200 outline-none focus:border-cyan-500 transition-all pr-10"
                />
                <button
                  onClick={handleSubmitMessage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-500 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target" position={Position.Top}
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-cyan-500 !-top-1.5"
      />
      <Handle
        type="source" position={Position.Bottom}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900 !-bottom-1.5 shadow-lg"
      />
    </div>
  );
});

DiscussionNode.displayName = 'DiscussionNode';
