import { useEffect, useState } from "react";
import { Loader2, LogIn, MessageSquare, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/contexts/AuthContext";
import { courseApi, type CourseDiscussionComment } from "@/lib/course.service";
import { useAuthDialogStore } from "@/stores/authDialogStore";
import { cn } from "@/utils/classNames";

interface ExperimentDiscussionSectionProps {
  courseId: string;
  courseTitle: string;
  theme: "dark" | "light";
  accentColor?: string;
}

function formatCommentTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getUserInitial(username: string) {
  return (username || "U").trim().charAt(0).toUpperCase();
}

export function ExperimentDiscussionSection({
  courseId,
  courseTitle,
  theme,
  accentColor = "#C9A227",
}: ExperimentDiscussionSectionProps) {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const openDialog = useAuthDialogStore((state) => state.openDialog);
  const isZh = i18n.language.startsWith("zh");
  const locale = isZh ? "zh-CN" : "en-US";

  const [comments, setComments] = useState<CourseDiscussionComment[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const canParticipate = Boolean(user);
  const maxLength = 2000;

  async function loadComments() {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await courseApi.getPublicDiscussionComments(courseId);
      setComments(data);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : isZh
            ? "加载讨论失败"
            : "Failed to load discussion",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadComments();
  }, [courseId]);

  async function handleSubmit() {
    const content = draft.trim();
    if (!canParticipate) {
      openDialog("login");
      return;
    }

    if (!content) {
      setSubmitError(isZh ? "请输入讨论内容" : "Please enter a comment");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await courseApi.addDiscussionComment(courseId, { content });
      setDraft("");
      await loadComments();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isZh
            ? "发布失败，请稍后再试"
            : "Failed to post comment",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      setDeletingCommentId(commentId);
      setSubmitError(null);
      await courseApi.deleteDiscussionComment(commentId);
      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : isZh
            ? "删除失败，请稍后再试"
            : "Failed to delete comment",
      );
    } finally {
      setDeletingCommentId(null);
    }
  }

  function canDeleteComment(comment: CourseDiscussionComment) {
    if (!user) {
      return false;
    }

    return comment.userId === user.id || user.role === "admin";
  }

  const prompts = isZh
    ? ["追问某一页课件", "补充实验现象", "提出改进建议"]
    : ["Ask about a slide", "Add an observation", "Suggest an improvement"];

  return (
    <section className="px-2 pb-2 pt-2 xl:px-4">
      <div
        className={cn(
          "overflow-hidden rounded-[22px] border",
          theme === "dark" ? "border-slate-700/70 bg-slate-900/70" : "border-slate-200 bg-white",
        )}
      >
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.18fr]">
          <div
            className={cn(
              "border-b px-4 py-3 sm:px-5 sm:py-4 lg:border-b-0 lg:border-r",
              theme === "dark"
                ? "border-slate-700/70 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.12),transparent_46%),linear-gradient(180deg,rgba(15,23,42,0.8),rgba(15,23,42,0.92))]"
                : "border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_42%),linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.98))]",
            )}
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]">
              <span
                className="h-px w-8"
                style={{ backgroundColor: accentColor }}
              />
              <span style={{ color: accentColor }}>{isZh ? "实验讨论" : "Discussion"}</span>
            </div>
            <h2
              className={cn(
                "mt-3 text-xl font-semibold leading-tight",
                theme === "dark" ? "text-white" : "text-slate-900",
              )}
            >
              {isZh ? "围绕课件直接讨论" : "Discuss the deck in context"}
            </h2>
            <p
              className={cn(
                "mt-3 text-sm leading-6",
                theme === "dark" ? "text-slate-300" : "text-slate-600",
              )}
            >
              {isZh
                ? `看到某一页 PPT 有疑问、发现了实验现象，或者想补充做法，都可以在这里接着聊。当前实验：${courseTitle}`
                : `Use this area to discuss questions from the deck, observations from the experiment, and suggestions for improvement. Current experiment: ${courseTitle}`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <span
                  key={prompt}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                    theme === "dark"
                      ? "border-slate-600 bg-slate-800/70 text-slate-200"
                      : "border-slate-200 bg-white/90 text-slate-700",
                  )}
                >
                  {prompt}
                </span>
              ))}
            </div>

            <div
              className={cn(
                "mt-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold",
                theme === "dark" ? "bg-slate-800/80 text-slate-200" : "bg-slate-100 text-slate-700",
              )}
            >
              <MessageSquare
                className="h-4 w-4"
                style={{ color: accentColor }}
              />
              {isZh ? `${comments.length} 条讨论` : `${comments.length} comments`}
            </div>
          </div>

          <div className="px-4 py-3 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    theme === "dark" ? "text-slate-100" : "text-slate-900",
                  )}
                >
                  {isZh ? "发一条留言" : "Start a comment"}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    theme === "dark" ? "text-slate-400" : "text-slate-500",
                  )}
                >
                  {isZh
                    ? "建议一条评论只聚焦一个问题，后面的人更容易接着讨论。"
                    : "Keep each comment focused on one question so others can respond clearly."}
                </p>
              </div>

              {!canParticipate && (
                <button
                  onClick={() => openDialog("login")}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                    theme === "dark"
                      ? "bg-slate-100 text-slate-900 hover:bg-white"
                      : "bg-slate-900 text-white hover:bg-slate-800",
                  )}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  {isZh ? "登录后参与" : "Log in to join"}
                </button>
              )}
            </div>

            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
              maxLength={maxLength}
              disabled={!canParticipate || isSubmitting}
              placeholder={
                canParticipate
                  ? isZh
                    ? "例如：第 3 页里的现象为什么会在某个角度突然反转？"
                    : "For example: why does the effect on slide 3 flip at that angle?"
                  : isZh
                    ? "登录后即可参与实验讨论"
                    : "Log in to participate in the discussion"
              }
              className={cn(
                "mt-4 w-full resize-y rounded-[18px] border px-4 py-3 text-sm outline-none transition",
                theme === "dark"
                  ? "border-slate-700 bg-slate-950/70 text-slate-100 placeholder:text-slate-500 focus:border-slate-500"
                  : "border-slate-200 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:border-slate-400",
                !canParticipate && "cursor-not-allowed opacity-75",
              )}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p
                  className={cn("text-xs", theme === "dark" ? "text-slate-400" : "text-slate-500")}
                >
                  {isZh ? `最多 ${maxLength} 字` : `Up to ${maxLength} characters`}
                </p>
                {submitError && <p className="mt-1 text-xs text-red-500">{submitError}</p>}
              </div>

              <button
                onClick={() => void handleSubmit()}
                disabled={isSubmitting || (canParticipate && !draft.trim())}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60",
                  "hover:opacity-90",
                )}
                style={{ backgroundColor: accentColor }}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isZh ? "发布讨论" : "Post comment"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div
            className={cn(
              "flex items-center justify-center gap-3 rounded-[18px] border px-4 py-8 text-sm",
              theme === "dark"
                ? "border-slate-700/70 bg-slate-900/60 text-slate-300"
                : "border-slate-200 bg-white text-slate-600",
            )}
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            {isZh ? "正在加载讨论内容" : "Loading discussion"}
          </div>
        ) : loadError ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600">
            <div>{loadError}</div>
            <button
              onClick={() => void loadComments()}
              className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-4"
            >
              {isZh ? "重新加载" : "Retry"}
            </button>
          </div>
        ) : comments.length === 0 ? (
          <div
            className={cn(
              "rounded-[18px] border px-6 py-8 text-center",
              theme === "dark"
                ? "border-slate-700/70 bg-slate-900/60"
                : "border-slate-200 bg-white",
            )}
          >
            <p
              className={cn(
                "text-sm font-semibold",
                theme === "dark" ? "text-white" : "text-slate-900",
              )}
            >
              {isZh ? "还没有人开场" : "No discussion yet"}
            </p>
            <p
              className={cn(
                "mx-auto mt-2 max-w-2xl text-sm leading-6",
                theme === "dark" ? "text-slate-400" : "text-slate-500",
              )}
            >
              {isZh
                ? "先问一个具体问题，比如某页课件里的推导、某段实验视频里的异常现象，后面的讨论会更容易接住。"
                : "Start with a specific question about a slide or an observed effect so the discussion can build from there."}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {comments.map((comment) => (
              <article
                key={comment.id}
                className={cn(
                  "rounded-[18px] border px-4 py-3 sm:px-5",
                  theme === "dark"
                    ? "border-slate-700/70 bg-slate-900/70"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      theme === "dark"
                        ? "bg-slate-800 text-slate-100"
                        : "bg-amber-50 text-slate-900",
                    )}
                    style={theme === "light" ? { border: `1px solid ${accentColor}` } : undefined}
                  >
                    {getUserInitial(comment.username)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span
                        className={cn(
                          "font-semibold",
                          theme === "dark" ? "text-white" : "text-slate-900",
                        )}
                      >
                        {comment.username || (isZh ? "未命名用户" : "Unknown user")}
                      </span>
                      {comment.userId === user?.id && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            theme === "dark"
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {isZh ? "你" : "You"}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-xs",
                          theme === "dark" ? "text-slate-400" : "text-slate-500",
                        )}
                      >
                        {formatCommentTime(comment.createdAt, locale)}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "mt-1.5 whitespace-pre-wrap break-words text-sm leading-5",
                        theme === "dark" ? "text-slate-200" : "text-slate-700",
                      )}
                    >
                      {comment.content}
                    </p>
                  </div>

                  {canDeleteComment(comment) && (
                    <button
                      onClick={() => void handleDelete(comment.id)}
                      disabled={deletingCommentId === comment.id}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
                        theme === "dark"
                          ? "text-red-300 hover:bg-red-500/10"
                          : "text-red-600 hover:bg-red-50",
                        deletingCommentId === comment.id && "cursor-not-allowed opacity-60",
                      )}
                    >
                      {deletingCommentId === comment.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      {isZh ? "删除" : "Delete"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
