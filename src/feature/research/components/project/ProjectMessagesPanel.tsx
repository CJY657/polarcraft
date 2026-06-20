import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Bell, Loader2, Megaphone, Send } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { researchApi, type ProjectMessage } from '@/lib/research.service';
import { useNotificationStore } from '@/stores/notificationStore';

const MAX_PROJECT_MESSAGE_LENGTH = 2000;
const POLL_INTERVAL_MS = 15000;

function formatMessageTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ProjectMessagesPanel({
  projectId,
  currentUserId,
  canAnnounce,
}: {
  projectId: string;
  currentUserId?: string;
  canAnnounce: boolean;
}) {
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [mode, setMode] = useState<'message' | 'announcement'>('message');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);

  const markRead = useCallback(async () => {
    try {
      await researchApi.markProjectMessagesRead(projectId);
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark project messages read:', error);
    }
  }, [fetchUnreadCount, projectId]);

  const loadMessages = useCallback(async (quiet = false) => {
    try {
      if (!quiet) {
        setIsLoading(true);
      }
      setError(null);
      const data = await researchApi.getProjectMessages(projectId, { limit: 50 });
      setMessages(data);
      await markRead();
    } catch (error) {
      setError(error instanceof Error ? error.message : '课题消息加载失败');
    } finally {
      if (!quiet) {
        setIsLoading(false);
      }
    }
  }, [markRead, projectId]);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => {
      void loadMessages(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadMessages]);

  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!canAnnounce && mode === 'announcement') {
      setMode('message');
    }
  }, [canAnnounce, mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    if (content.length > MAX_PROJECT_MESSAGE_LENGTH) {
      setError(`消息不能超过 ${MAX_PROJECT_MESSAGE_LENGTH} 字`);
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      if (mode === 'announcement') {
        await researchApi.sendProjectAnnouncement(projectId, content);
      } else {
        await researchApi.sendProjectMessage(projectId, content);
      }
      setDraft('');
      setMode('message');
      await loadMessages(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : '消息发送失败');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="project-messages" className="research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            className="text-2xl font-semibold text-[var(--paper-foreground)]"
            style={{ fontFamily: 'var(--font-ui-display)' }}
          >
            课题消息
          </h2>
          <p className="mt-2 text-base leading-6 text-[var(--glass-text-muted)]">
            组内同步和组长公告都会保存在这里。
          </p>
        </div>

        {canAnnounce && (
          <div className="research-chip inline-flex self-start rounded-full p-1 sm:self-auto">
            <button
              type="button"
              onClick={() => setMode('message')}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-semibold transition',
                mode === 'message' && 'bg-white text-[var(--paper-link)] shadow-sm'
              )}
            >
              消息
            </button>
            <button
              type="button"
              onClick={() => setMode('announcement')}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-semibold transition',
                mode === 'announcement' && 'bg-white text-[var(--paper-link)] shadow-sm'
              )}
            >
              公告
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200/70 bg-red-50 p-3 text-sm leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div
        ref={listRef}
        className="research-panel-soft mb-4 flex max-h-[28rem] min-h-[12rem] flex-col gap-3 overflow-y-auto rounded-[1.35rem] p-3 sm:p-4"
      >
        {isLoading ? (
          <div role="status" className="grid gap-3">
            <div className="h-16 w-4/5 animate-pulse rounded-2xl bg-[var(--paper-accent)]/10" />
            <div className="ml-auto h-16 w-3/5 animate-pulse rounded-2xl bg-[var(--paper-accent)]/10" />
            <div className="h-20 w-5/6 animate-pulse rounded-2xl bg-[var(--paper-accent)]/10" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-[10rem] flex-col items-center justify-center gap-2 text-center text-[var(--glass-text-muted)]">
            <Bell className="h-5 w-5" />
            <p className="text-sm">还没有课题消息。</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const isAnnouncement = message.kind === 'announcement';

            return (
              <article
                key={message.id}
                className={cn(
                  'max-w-[88%] rounded-[1.15rem] border px-3.5 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]',
                  isOwn ? 'ml-auto bg-[var(--paper-accent)]/12' : 'bg-white/75',
                  isAnnouncement
                    ? 'border-[#d7994c]/35 bg-[#d7994c]/10'
                    : 'border-[var(--paper-accent)]/12'
                )}
              >
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--glass-text-muted)]">
                  {isAnnouncement && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#d7994c]/18 px-2 py-0.5 font-semibold text-[#8a5a18]">
                      <Megaphone className="h-3 w-3" />
                      公告
                    </span>
                  )}
                  <span className="font-semibold text-[var(--paper-foreground)]">
                    {message.username || '成员'}
                  </span>
                  <span>{formatMessageTime(message.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--paper-foreground)]">
                  {message.content}
                </p>
              </article>
            );
          })
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--paper-foreground)]">
            {mode === 'announcement' ? '公告内容' : '消息内容'}
          </span>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_PROJECT_MESSAGE_LENGTH}
            rows={3}
            className="w-full resize-none rounded-[1.1rem] border border-[var(--paper-accent)]/18 bg-white/80 px-4 py-3 text-base leading-6 text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-accent)] focus:ring-2 focus:ring-[var(--paper-accent)]/20"
            placeholder={mode === 'announcement' ? '写一条组内公告' : '写一条组内消息'}
          />
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[var(--glass-text-muted)]">
            {draft.trim().length}/{MAX_PROJECT_MESSAGE_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!draft.trim() || isSending}
            className="glass-button glass-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {mode === 'announcement' ? '发布公告' : '发送消息'}
          </button>
        </div>
      </form>
    </section>
  );
}
