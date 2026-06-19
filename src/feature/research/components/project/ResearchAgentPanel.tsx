import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import { AlertCircle, Bot, Loader2, Minus, Send, Trash2 } from "lucide-react";
import { cn } from "@/utils/classNames";
import {
  researchApi,
  type ResearchAgentMessage,
} from "@/lib/research.service";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MarkdownRenderer } from "../shared/MarkdownRenderer";

const MAX_AGENT_MESSAGE_LENGTH = 2000;

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
  canClearHistory = false,
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
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await researchApi.sendProjectAgentMessage(projectId, content);
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

  const handleClearHistory = async () => {
    try {
      setIsClearing(true);
      setError(null);
      await researchApi.clearProjectAgentMessages(projectId);
      setMessages([]);
      setIsClearDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "清空 AI 顾问历史失败");
    } finally {
      setIsClearing(false);
    }
  };

  const showClearButton = canClearHistory && messages.length > 0;

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          aria-label="打开 AI 研究顾问"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full bg-[#001e2b] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(0,30,43,0.28)] transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ed64] active:translate-y-0 sm:bottom-6 sm:right-6"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00ed64] text-[#001e2b]">
            <Bot className="h-4 w-4" />
          </span>
          AI 研究顾问
        </button>
      ) : (
        <section
          aria-label="AI 研究顾问"
          className="fixed bottom-4 right-4 z-40 flex overflow-hidden rounded-[1.1rem] border border-slate-200 bg-white text-slate-950 shadow-[0_24px_70px_rgba(0,30,43,0.28)] sm:bottom-6 sm:right-6"
          style={{
            width: "min(calc(100vw - 2rem), 400px)",
            height: "min(42rem, calc(100dvh - 2rem))",
            maxHeight: "calc(100dvh - 2rem)",
          }}
        >
          <div className="flex min-h-0 w-full flex-col">
            <div className="bg-[#001e2b] px-4 py-3 text-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#00ed64]" />
                    <h2 className="truncate text-base font-semibold">AI 研究顾问</h2>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-white/70">共享课题建议历史</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {showClearButton && (
                    <button
                      type="button"
                      onClick={() => setIsClearDialogOpen(true)}
                      disabled={isClearing}
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-white/15 px-2.5 text-xs font-medium text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      清空历史
                    </button>
                  )}
                  <button
                    type="button"
                    aria-controls={bodyId}
                    aria-expanded={isOpen}
                    aria-label="收起 AI 研究顾问"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#00ed64] text-[#001e2b] transition hover:bg-[#3ff27f] active:scale-95"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div id={bodyId} className="flex min-h-0 flex-1 flex-col bg-white">
              {isLoading ? (
                <div
                  role="status"
                  aria-label="载入顾问历史"
                  className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4"
                >
                  <div className="h-16 w-4/5 animate-pulse rounded-2xl bg-slate-100" />
                  <div className="ml-auto h-14 w-3/5 animate-pulse rounded-2xl bg-slate-200" />
                  <div className="h-20 w-5/6 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ) : (
                <>
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[#f7f9fb] p-4">
                    {!isEnabled && (
                      <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-[#9b3f3f]">
                        <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                        <span>AI 顾问未配置，请在服务器环境变量中填写提供商地址、密钥和模型。</span>
                      </div>
                    )}

                    {error && (
                      <div className="flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm leading-6 text-[#9b3f3f]">
                        <AlertCircle className="mt-1 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {messages.length === 0 && !isSending ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                        还没有顾问消息。
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => {
                          const isAssistant = message.role === "assistant";
                          return (
                            <article
                              key={message.id}
                              className={cn(
                                "max-w-[86%] rounded-2xl p-3 text-sm shadow-sm",
                                isAssistant
                                  ? "mr-auto border border-slate-200 bg-white text-slate-800"
                                  : "ml-auto bg-[#001e2b] text-white"
                              )}
                            >
                              <div
                                className={cn(
                                  "mb-1.5 flex items-center justify-between gap-3 text-xs",
                                  isAssistant ? "text-slate-500" : "text-white/65"
                                )}
                              >
                                <span>{isAssistant ? "AI 顾问" : message.username || "成员"}</span>
                                <time>{formatMessageTime(message.created_at)}</time>
                              </div>
                              {isAssistant ? (
                                <MarkdownRenderer
                                  content={message.content}
                                  className="[&_a]:!text-[#00684a] [&_code]:!bg-emerald-50 [&_code]:!text-[#00684a] [&_li]:!text-slate-700 [&_p]:!text-slate-700 [&_strong]:!text-slate-950"
                                />
                              ) : (
                                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                              )}
                            </article>
                          );
                        })}
                        {isSending && (
                          <article className="mr-auto max-w-[86%] rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-sm">
                            <div className="mb-1.5 text-xs text-slate-500">AI 顾问</div>
                            <div className="inline-flex items-center gap-2 leading-6">
                              <Loader2 className="h-4 w-4 animate-spin text-[#00684a]" />
                              思考中...
                            </div>
                          </article>
                        )}
                      </>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
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
                      className="min-h-11 flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#00a35c] focus:bg-white focus:ring-2 focus:ring-[#00ed64]/30 disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="输入研究问题、实验思路或需要总结的不确定性"
                    />
                    <button
                      type="submit"
                      aria-label="发送"
                      disabled={!draft.trim() || !isEnabled || isSending}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00ed64] text-[#001e2b] transition hover:bg-[#3ff27f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00684a] active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
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

      <ConfirmDialog
        open={isClearDialogOpen}
        title="清空 AI 顾问历史？"
        description="这会删除本课题组共享的全部 AI 顾问消息，操作无法恢复。"
        confirmLabel="清空"
        cancelLabel="取消"
        isPending={isClearing}
        onCancel={() => setIsClearDialogOpen(false)}
        onConfirm={() => {
          void handleClearHistory();
        }}
      />
    </>
  );
}
