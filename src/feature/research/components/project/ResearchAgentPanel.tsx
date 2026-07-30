import { FormEvent, KeyboardEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/classNames";
import {
  researchApi,
  type ResearchAgentMessage,
} from "@/lib/research.service";
import { MarkdownRenderer } from "../shared/MarkdownRenderer";

const MAX_AGENT_MESSAGE_LENGTH = 2000;
const MAX_LIVE_HISTORY_MESSAGES = 12;

function formatMessageTime(value: string): string {
  return new Date(value).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ResearchAgentPanel({
  projectId,
}: {
  projectId: string;
  canClearHistory?: boolean;
}) {
  const bodyId = useId();
  const [messages, setMessages] = useState<ResearchAgentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await researchApi.getProjectAgentMessages(projectId, 30);
      setMessages(response.messages);
      setIsEnabled(response.enabled);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 顾问历史加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  /* Auto-scroll to bottom when new messages arrive */
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = draft.trim();
    if (!content || isSending || !isEnabled) {
      return;
    }

    if (content.length > MAX_AGENT_MESSAGE_LENGTH) {
      setError(`消息不能超过 ${MAX_AGENT_MESSAGE_LENGTH} 字`);
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      const history = messages.slice(-MAX_LIVE_HISTORY_MESSAGES).map((message) => ({
        role: message.role,
        content: message.content,
      }));
      const response = await researchApi.sendProjectAgentMessage(projectId, content, history);
      setMessages((current) => [...current, response.user, response.assistant]);
      setDraft("");
    } catch (err) {
      const maybeCode = (err as { code?: string }).code;
      if (maybeCode === "AI_ADVISOR_DISABLED") {
        setIsEnabled(false);
      }
      setError(err instanceof Error ? err.message : "AI 顾问暂时不可用");
    } finally {
      setIsSending(false);
    }
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <>
      {!isOpen ? (
        /* ── Floating Action Button ── */
        <button
          type="button"
          aria-label="打开 AI 研究顾问"
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6",
            "inline-flex items-center gap-2 rounded-full px-5 py-3",
            "border-[1.5px] border-[var(--research-edge)]",
            "bg-[var(--paper-accent)] text-base font-semibold text-[var(--paper-bg)]",
            "shadow-[var(--research-lift)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--research-edge)]",
          )}
        >
          AI 研究顾问
        </button>
      ) : (
        /* ── Chat Panel ── */
        <section
          aria-label="AI 研究顾问"
          className={cn(
            "fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6",
            "flex overflow-hidden rounded-xl",
            "border-[1.5px] border-[var(--research-edge)]",
            "bg-[var(--research-surface)] text-[var(--paper-foreground)]",
            "shadow-[var(--research-lift)]",
            "animate-fade-in-up",
          )}
          style={{
            width: "min(calc(100vw - 2rem), 400px)",
            height: "min(42rem, calc(100dvh - 2rem))",
            maxHeight: "calc(100dvh - 2rem)",
          }}
        >
          <div className="flex min-h-0 w-full flex-col">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 border-b border-[var(--research-line)] bg-[var(--research-head)] px-4 py-3">
              <div className="min-w-0 flex-1">
                <h2
                  className="truncate text-base font-semibold text-[var(--paper-foreground)]"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  AI 研究顾问
                </h2>
                <p className="research-section-note mt-0.5">当前标签页即时对话</p>
              </div>
              <button
                type="button"
                aria-controls={bodyId}
                aria-expanded={isOpen}
                aria-label="收起 AI 研究顾问"
                onClick={() => setIsOpen(false)}
                className="glass-button shrink-0 rounded-md px-2.5 py-1.5 text-sm font-semibold text-[var(--glass-text-muted)]"
              >
                收起
              </button>
            </div>

            {/* ── Body ── */}
            <div id={bodyId} className="flex min-h-0 flex-1 flex-col">
              {isLoading ? (
                <div
                  role="status"
                  aria-label="载入顾问历史"
                  className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4"
                >
                  <div className="h-16 w-4/5 animate-pulse rounded-lg bg-[var(--research-head)]" />
                  <div className="ml-auto h-14 w-3/5 animate-pulse rounded-lg bg-[var(--research-head)]" />
                  <div className="h-20 w-5/6 animate-pulse rounded-lg bg-[var(--research-head)]" />
                </div>
              ) : (
                <>
                  <div
                    ref={scrollRef}
                    className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
                  >
                    {!isEnabled && (
                      <div className="research-error rounded-md p-3 text-sm leading-6">
                        AI 顾问未配置，请在服务器环境变量中填写提供商地址、密钥和模型。
                      </div>
                    )}

                    {error && (
                      <div className="research-error rounded-md p-3 text-sm leading-6">{error}</div>
                    )}

                    {messages.length === 0 && !isSending ? (
                      <p className="py-8 text-center text-sm text-[var(--glass-text-muted)]">
                        还没有顾问消息。
                      </p>
                    ) : (
                      <>
                        {messages.map((message) => {
                          const isAssistant = message.role === "assistant";
                          return (
                            <article
                              key={message.id}
                              className={cn(
                                "max-w-[86%] rounded-lg border p-3 text-sm",
                                isAssistant
                                  ? "mr-auto border-[var(--research-line)] bg-[var(--research-head)] text-[var(--paper-foreground)]"
                                  : "ml-auto border-[var(--research-edge)] bg-[var(--paper-accent)] text-[var(--paper-bg)]"
                              )}
                            >
                              <div
                                className={cn(
                                  "mb-1.5 flex items-center justify-between gap-3 text-xs",
                                  isAssistant ? "text-[var(--glass-text-muted)]" : "opacity-70"
                                )}
                              >
                                <span>{isAssistant ? "AI 顾问" : "你的即时提问"}</span>
                                <time>{formatMessageTime(message.created_at)}</time>
                              </div>
                              {isAssistant ? (
                                <MarkdownRenderer
                                  content={message.content}
                                  className="[&_a]:!text-[var(--paper-link)] [&_code]:!bg-[var(--glass-chip)] [&_code]:!text-[var(--paper-link)] [&_li]:!text-[var(--paper-foreground)] [&_p]:!text-[var(--paper-foreground)] [&_strong]:!text-[var(--paper-foreground)]"
                                />
                              ) : (
                                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                              )}
                            </article>
                          );
                        })}
                        {isSending && (
                          <article className="mr-auto max-w-[86%] rounded-lg border border-[var(--research-line)] bg-[var(--research-head)] p-3 text-sm">
                            <div className="mb-1.5 text-xs text-[var(--glass-text-muted)]">AI 顾问</div>
                            <div className="inline-flex items-center gap-2 leading-6">
                              <Loader2 className="h-4 w-4 animate-spin text-[var(--paper-accent)]" />
                              <span className="text-[var(--glass-text-muted)]">思考中...</span>
                            </div>
                          </article>
                        )}
                      </>
                    )}
                  </div>

                  {/* ── Input Area ── */}
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-end gap-2 border-t border-[var(--research-line)] bg-[var(--research-head)] px-3 py-3"
                  >
                    <label className="sr-only" htmlFor="research-agent-message">
                      AI 顾问消息
                    </label>
                    <textarea
                      id="research-agent-message"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={handleDraftKeyDown}
                      disabled={!isEnabled || isSending}
                      maxLength={MAX_AGENT_MESSAGE_LENGTH}
                      rows={2}
                      className="research-input min-h-11 flex-1 resize-none rounded-md px-3 py-2 text-sm leading-6 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="输入研究问题、实验思路或需要总结的不确定性"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || !isEnabled || isSending}
                      className={cn(
                        "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md px-4",
                        "border-[1.5px] border-[var(--research-edge)]",
                        "bg-[var(--paper-accent)] text-sm font-semibold text-[var(--paper-bg)]",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--research-edge)]",
                        "disabled:cursor-not-allowed disabled:border-[var(--research-line)] disabled:bg-[var(--glass-chip)] disabled:text-[var(--glass-text-muted)]",
                      )}
                    >
                      {isSending && <Loader2 className="h-4 w-4 animate-spin" />}
                      发送
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      )}

    </>
  );
}
