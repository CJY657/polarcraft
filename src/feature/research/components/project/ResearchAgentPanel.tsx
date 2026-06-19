import { FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertCircle, Bot, Loader2, Minus, Send, Sparkles } from "lucide-react";
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
            "group inline-flex items-center gap-2.5",
            "rounded-full px-5 py-3.5",
            "bg-[#0a0a0a] text-sm font-semibold text-white",
            "shadow-[0_8px_30px_rgba(10,10,10,0.25)]",
            "transition-all duration-300 ease-out",
            "hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(10,10,10,0.35)]",
            "active:translate-y-0 active:shadow-[0_4px_16px_rgba(10,10,10,0.3)]",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8a4ed]",
          )}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#b8a4ed] to-[#a4d4c5]">
            <Sparkles className="h-3.5 w-3.5 text-white" />
            {/* Ping dot */}
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#22c55e] ring-2 ring-[#0a0a0a]" />
          </span>
          AI 研究顾问
        </button>
      ) : (
        /* ── Chat Panel ── */
        <section
          aria-label="AI 研究顾问"
          className={cn(
            "fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6",
            "flex overflow-hidden rounded-2xl",
            "border border-[#e5e5e5]/80",
            "bg-[#fffaf0]/95 backdrop-blur-xl",
            "text-[#0a0a0a]",
            "shadow-[0_24px_80px_-12px_rgba(10,10,10,0.22),0_0_0_1px_rgba(10,10,10,0.03)]",
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
            <div className="relative overflow-hidden bg-[#0a0a0a] px-4 py-3.5 text-white">
              {/* Subtle gradient accent line at top */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#b8a4ed] via-[#a4d4c5] to-[#ffb084]" />

              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#b8a4ed] to-[#a4d4c5]">
                      <Sparkles className="h-3 w-3 text-white" />
                    </span>
                    <h2 className="truncate text-[15px] font-semibold tracking-tight">AI 研究顾问</h2>
                  </div>
                  <p className="mt-1 pl-[34px] text-[11px] leading-4 text-white/50">当前标签页即时对话</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    aria-controls={bodyId}
                    aria-expanded={isOpen}
                    aria-label="收起 AI 研究顾问"
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-lg",
                      "bg-white/10 text-white/70",
                      "transition-all duration-200",
                      "hover:bg-white/20 hover:text-white",
                      "active:scale-95",
                    )}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div id={bodyId} className="flex min-h-0 flex-1 flex-col">
              {isLoading ? (
                <div
                  role="status"
                  aria-label="载入顾问历史"
                  className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4"
                >
                  <div className="h-16 w-4/5 animate-pulse rounded-2xl bg-[#f5f0e0]" />
                  <div className="ml-auto h-14 w-3/5 animate-pulse rounded-2xl bg-[#ebe6d6]" />
                  <div className="h-20 w-5/6 animate-pulse rounded-2xl bg-[#f5f0e0]" />
                </div>
              ) : (
                <>
                  <div
                    ref={scrollRef}
                    className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[#fffaf0] p-4"
                  >
                    {!isEnabled && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-200/60 bg-red-50/80 p-3 text-sm leading-6 text-red-700">
                        <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                        <span>AI 顾问未配置，请在服务器环境变量中填写提供商地址、密钥和模型。</span>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-start gap-2 rounded-xl border border-red-200/60 bg-red-50/80 p-3 text-sm leading-6 text-red-700">
                        <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {messages.length === 0 && !isSending ? (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#b8a4ed]/20 to-[#a4d4c5]/20">
                          <Bot className="h-5 w-5 text-[#6a6a6a]" />
                        </span>
                        <p className="text-sm text-[#6a6a6a]">
                          还没有顾问消息。
                        </p>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => {
                          const isAssistant = message.role === "assistant";
                          return (
                            <article
                              key={message.id}
                              className={cn(
                                "max-w-[86%] rounded-2xl p-3 text-sm",
                                "transition-all duration-200",
                                isAssistant
                                  ? "mr-auto border border-[#e5e5e5]/70 bg-white text-[#3a3a3a] shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                                  : "ml-auto bg-[#0a0a0a] text-white shadow-[0_2px_8px_rgba(10,10,10,0.15)]"
                              )}
                            >
                              <div
                                className={cn(
                                  "mb-1.5 flex items-center justify-between gap-3 text-[11px]",
                                  isAssistant ? "text-[#9a9a9a]" : "text-white/50"
                                )}
                              >
                                <span>{isAssistant ? "AI 顾问" : "你的即时提问"}</span>
                                <time>{formatMessageTime(message.created_at)}</time>
                              </div>
                              {isAssistant ? (
                                <MarkdownRenderer
                                  content={message.content}
                                  className="[&_a]:!text-[#1a3a3a] [&_code]:!bg-[#f5f0e0] [&_code]:!text-[#1a3a3a] [&_li]:!text-[#3a3a3a] [&_p]:!text-[#3a3a3a] [&_strong]:!text-[#0a0a0a]"
                                />
                              ) : (
                                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                              )}
                            </article>
                          );
                        })}
                        {isSending && (
                          <article className="mr-auto max-w-[86%] rounded-2xl border border-[#e5e5e5]/70 bg-white p-3 text-sm text-[#3a3a3a] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                            <div className="mb-1.5 text-[11px] text-[#9a9a9a]">AI 顾问</div>
                            <div className="inline-flex items-center gap-2 leading-6">
                              <Loader2 className="h-4 w-4 animate-spin text-[#b8a4ed]" />
                              <span className="text-[#6a6a6a]">思考中...</span>
                            </div>
                          </article>
                        )}
                      </>
                    )}
                  </div>

                  {/* ── Input Area ── */}
                  <form
                    onSubmit={handleSubmit}
                    className="flex items-end gap-2 border-t border-[#e5e5e5]/60 bg-[#fffaf0] px-3 py-3"
                  >
                    <label className="sr-only" htmlFor="research-agent-message">
                      AI 顾问消息
                    </label>
                    <textarea
                      id="research-agent-message"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      disabled={!isEnabled || isSending}
                      maxLength={MAX_AGENT_MESSAGE_LENGTH}
                      rows={2}
                      className={cn(
                        "min-h-11 flex-1 resize-none rounded-xl",
                        "border border-[#e5e5e5] bg-white",
                        "px-3 py-2 text-sm leading-6 text-[#0a0a0a]",
                        "outline-none transition-all duration-200",
                        "placeholder:text-[#9a9a9a]",
                        "focus:border-[#b8a4ed]/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(184,164,237,0.12)]",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                      placeholder="输入研究问题、实验思路或需要总结的不确定性"
                    />
                    <button
                      type="submit"
                      aria-label="发送"
                      disabled={!draft.trim() || !isEnabled || isSending}
                      className={cn(
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        "bg-[#0a0a0a] text-white",
                        "transition-all duration-200",
                        "hover:bg-[#1f1f1f] hover:shadow-[0_4px_12px_rgba(10,10,10,0.2)]",
                        "active:scale-95",
                        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b8a4ed]",
                        "disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-[#9a9a9a] disabled:shadow-none",
                      )}
                    >
                      {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
