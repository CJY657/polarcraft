import { FormEvent, useCallback, useEffect, useState } from "react";
import { AlertCircle, Bot, Loader2, Send } from "lucide-react";
import { cn } from "@/utils/classNames";
import {
  researchApi,
  type ResearchAgentMessage,
} from "@/lib/research.service";
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

export function ResearchAgentPanel({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<ResearchAgentMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
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

  return (
    <section className="research-panel mb-8 rounded-[1.9rem] p-5 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--paper-link)]" />
            <h2
              className="text-2xl font-semibold text-[var(--paper-foreground)]"
              style={{ fontFamily: "var(--font-ui-display)" }}
            >
              AI 研究顾问
            </h2>
          </div>
          <p className="text-base text-[var(--glass-text-muted)]">共享课题建议历史</p>
        </div>
        <span className="research-chip inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-sm font-medium sm:self-auto">
          只读建议
        </span>
      </div>

      {isLoading ? (
        <div className="research-panel-soft flex min-h-28 items-center justify-center rounded-[1.35rem]">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--paper-accent)]" />
        </div>
      ) : (
        <div className="space-y-4">
          {!isEnabled && (
            <div className="research-panel-soft flex items-start gap-3 rounded-[1.35rem] p-4 text-base text-[#9b3f3f]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>AI 顾问未配置，请在服务器环境变量中填写提供商地址、密钥和模型。</span>
            </div>
          )}

          {error && (
            <div className="research-panel-soft flex items-start gap-3 rounded-[1.35rem] p-4 text-base text-[#9b3f3f]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="research-panel-soft rounded-[1.35rem] p-4 text-base text-[var(--glass-text-muted)]">
                还没有顾问消息。
              </div>
            ) : (
              messages.map((message) => {
                const isAssistant = message.role === "assistant";
                return (
                  <article
                    key={message.id}
                    className={cn(
                      "rounded-[1.35rem] p-4",
                      isAssistant
                        ? "bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]"
                        : "research-panel-soft text-[var(--paper-foreground)]"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className={isAssistant ? "text-cyan-100" : "text-[var(--glass-text-muted)]"}>
                        {isAssistant ? "AI 顾问" : "成员"}
                      </span>
                      <time className={isAssistant ? "text-slate-400" : "text-[var(--glass-text-muted)]"}>
                        {formatMessageTime(message.created_at)}
                      </time>
                    </div>
                    {isAssistant ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap text-base leading-7">{message.content}</p>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <label className="sr-only" htmlFor="research-agent-message">
              AI 顾问消息
            </label>
            <textarea
              id="research-agent-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={!isEnabled || isSending}
              maxLength={MAX_AGENT_MESSAGE_LENGTH}
              rows={3}
              className="min-h-24 flex-1 resize-y rounded-[1.1rem] border border-[var(--glass-stroke)] bg-white/70 px-4 py-3 text-base leading-6 text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-accent)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950/50"
              placeholder="输入研究问题、实验思路或需要总结的不确定性"
            />
            <button
              type="submit"
              disabled={!draft.trim() || !isEnabled || isSending}
              className="glass-button glass-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:self-end"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              发送
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
