/**
 * Discussion Node Component
 * 讨论节点组件
 *
 * Chat-style discussion interface with quote replies
 * 聊天风格讨论界面，支持引用回复
 */

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { MessageSquare, Users, ThumbsUp, Reply, Send, X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { CompactMarkdown } from '../shared/MarkdownRenderer';
import { useCanvasStore } from '../../stores/canvasStore';
import type { DiscussionNodeData, DiscussionComment } from '../../types/node-data.types';

export const DiscussionNode = memo(({ id, data, selected }: NodeProps) => {
  const { updateNode } = useCanvasStore();
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<DiscussionComment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Local state for comments - initialized from data.comments
  const [comments, setComments] = useState<DiscussionComment[]>(() => (data as DiscussionNodeData).comments || []);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    return `${diffDays}天前`;
  };

  const handleSubmitMessage = () => {
    if (newMessage.trim()) {
      const comment: DiscussionComment = {
        id: `comment-${Date.now()}`,
        author: '我',
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
      setComments(updatedComments);
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

  const handleReply = (comment: DiscussionComment) => {
    setReplyingTo(replyingTo?.id === comment.id ? null : comment);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const getAvatarColor = (author: string) => {
    const colors = [
      'from-cyan-500 to-blue-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
    ];
    const index = author.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderMessage = (comment: DiscussionComment) => {
    const isOwnMessage = comment.author === '我';

    return (
      <div key={comment.id} className={cn('flex gap-2 mb-3', isOwnMessage && 'flex-row-reverse')}>
        {/* Avatar */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-medium',
            'bg-gradient-to-br',
            getAvatarColor(comment.author)
          )}
        >
          {comment.author.charAt(0)}
        </div>

        {/* Message Content */}
        <div className={cn('flex flex-col max-w-[80%]', isOwnMessage ? 'items-end' : 'items-start')}>
          {/* Author & Time */}
          <div className={cn('flex items-center gap-2 mb-1', isOwnMessage ? 'flex-row-reverse' : '')}>
            <span className="text-xs font-medium text-white">{comment.author}</span>
            <span className="text-xs text-gray-500">{formatTime(comment.timestamp)}</span>
          </div>

          {/* Message Bubble */}
          <div
            className={cn(
              'rounded-2xl px-2 py-1.5',
              isOwnMessage
                ? 'bg-cyan-600 text-white rounded-br-sm'
                : 'bg-slate-700 text-gray-200 rounded-bl-sm'
            )}
          >
            {/* Quote Reply */}
            {comment.replyTo && (
              <div className="mb-2 pb-2 border-b border-white/20">
                <div className="flex items-center gap-1 text-xs opacity-70 mb-1">
                  <Reply className="w-3 h-3" />
                  <span>回复 {comment.replyTo.author}</span>
                </div>
                <div className="text-xs opacity-60 line-clamp-2">
                  <CompactMarkdown content={comment.replyTo.content} />
                </div>
              </div>
            )}

            {/* Message Content */}
            <div className="text-sm">
              <CompactMarkdown content={comment.content} />
            </div>
          </div>

          {/* Actions */}
          <div className={cn('flex items-center gap-3 mt-1', isOwnMessage ? 'justify-end' : '')}>
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors">
              <ThumbsUp className="w-3 h-3" />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>
            <button
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
              onClick={() => handleReply(comment)}
            >
              <Reply className="w-3 h-3" />
              回复
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 min-w-[280px] bg-slate-800 transition-all max-w-[400px]',
        selected ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' : 'border-cyan-600'
      )}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-cyan-500 !border-2 !border-cyan-400"
      />

      {/* Node Header */}
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <span className="font-semibold text-white text-sm truncate">
          {data.title?.zh || data.title?.['zh-CN'] || data.title?.en || '讨论'}
        </span>
      </div>

      {/* Topic - Markdown rendered */}
      {data.topic && (
        <div className="mb-3 p-2 bg-slate-900/50 rounded">
          <CompactMarkdown
            content={data.topic?.zh || data.topic?.['zh-CN'] || data.topic?.en || ''}
          />
        </div>
      )}

      {/* Participants */}
      {data.participants && data.participants.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-3 h-3 text-cyan-400" />
          <span className="text-xs text-gray-400">
            {data.participants.length} 位参与者
          </span>
          <div className="flex -space-x-1">
            {data.participants.slice(0, 3).map((participant: string, i: number) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 border border-cyan-400 flex items-center justify-center text-xs text-white"
                title={participant}
              >
                {participant.charAt(0)}
              </div>
            ))}
            {data.participants.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs text-gray-400">
                +{data.participants.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Badge */}
      {data.status && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full border',
              data.status === 'active' && 'bg-green-500/20 text-green-400 border-green-500',
              data.status === 'pending' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
              data.status === 'closed' && 'bg-gray-500/20 text-gray-400 border-gray-500'
            )}
          >
            {data.status === 'active' && '进行中'}
            {data.status === 'pending' && '待开始'}
            {data.status === 'closed' && '已结束'}
          </span>
          <span className="text-xs text-gray-500">
            {comments.length} 条评论
          </span>
        </div>
      )}

      {/* Chat Messages Section */}
      <div
        className="mb-3 max-h-[300px] overflow-y-auto pr-1 space-y-1"
        onWheel={(e) => e.stopPropagation()}
      >
        {comments.length === 0 ? (
          <div className="text-center text-xs text-gray-500 py-4">
            暂无消息，来发送第一条吧！
          </div>
        ) : (
          <>
            {comments.map((comment) => renderMessage(comment))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 p-2 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-cyan-400">
              <Reply className="w-3 h-3" />
              <span>回复 {replyingTo.author}</span>
            </div>
            <button
              onClick={cancelReply}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs text-gray-400 line-clamp-2">
            <CompactMarkdown content={replyingTo.content} />
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="flex gap-2 pt-2 border-t border-slate-700/50">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyingTo ? '写下回复...' : '输入消息...'}
            className="w-full px-3 py-2 pr-10 text-xs bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitMessage();
              }
            }}
          />
        </div>
        <button
          onClick={handleSubmitMessage}
          disabled={!newMessage.trim()}
          className={cn(
            'px-3 py-2 rounded-lg text-white text-xs flex items-center gap-1 transition-colors',
            newMessage.trim()
              ? 'bg-cyan-600 hover:bg-cyan-500'
              : 'bg-slate-700 text-gray-500 cursor-not-allowed'
          )}
        >
          <Send className="w-3 h-3" />
          发送
        </button>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-cyan-500 !border-2 !border-cyan-400"
      />
    </div>
  );
});

DiscussionNode.displayName = 'DiscussionNode';
