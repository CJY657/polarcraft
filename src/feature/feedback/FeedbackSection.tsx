import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { FlaskConical, Lightbulb, Send, Sparkles } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
  feedbackApi,
  type FeedbackCategory,
} from "@/lib/feedback.service";

interface FeedbackSectionProps {
  isDark: boolean;
}

interface FeedbackFormState {
  category: FeedbackCategory;
  subject: string;
  content: string;
  courseId: string;
  courseTitle: string;
  contactName: string;
  contactEmail: string;
}

interface NoticeState {
  tone: "success" | "error";
  text: string;
}

interface FeedbackCategoryOption {
  value: FeedbackCategory;
  title: string;
  description: string;
  icon: typeof FlaskConical;
  accent: string;
}

const CATEGORY_OPTIONS: FeedbackCategoryOption[] = [
  {
    value: "experiment",
    title: "实验问题与建议",
    description: "用于记录某个实验中的疑问、错误、材料改进或内容补充建议。",
    icon: FlaskConical,
    accent: "#1865f2",
  },
  {
    value: "product",
    title: "软件建议",
    description: "用于反馈导航、交互、功能设计、性能和整体使用体验的问题。",
    icon: Lightbulb,
    accent: "#d97706",
  },
];

function getSearchValue(searchParams: URLSearchParams, key: string): string {
  return searchParams.get(key)?.trim() || "";
}

function parseCategory(value: string): FeedbackCategory {
  return value === "experiment" ? "experiment" : "product";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function FeedbackSection({ isDark }: FeedbackSectionProps) {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();
  const sectionRef = useRef<HTMLElement | null>(null);

  const originPath = getSearchValue(searchParams, "originPath");
  const originPage = getSearchValue(searchParams, "originPage");

  const [form, setForm] = useState<FeedbackFormState>(() => ({
    category: parseCategory(getSearchValue(searchParams, "feedback")),
    subject: "",
    content: "",
    courseId: getSearchValue(searchParams, "courseId"),
    courseTitle: getSearchValue(searchParams, "courseTitle"),
    contactName: "",
    contactEmail: "",
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      contactName: current.contactName || user?.username || "",
      contactEmail: current.contactEmail || user?.email || "",
    }));
  }, [user?.email, user?.username]);

  useEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    if (location.hash === "#feedback" || location.search.includes("feedback=")) {
      window.requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [location.hash, location.search]);

  const activeOption =
    CATEGORY_OPTIONS.find((option) => option.value === form.category) || CATEGORY_OPTIONS[0];

  const handleFieldChange = <K extends keyof FeedbackFormState>(
    key: K,
    value: FeedbackFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (notice) {
      setNotice(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const subject = form.subject.trim();
    const content = form.content.trim();
    const courseId = form.courseId.trim();
    const courseTitle = form.courseTitle.trim();
    const contactName = form.contactName.trim();
    const contactEmail = form.contactEmail.trim();

    if (subject.length < 4 || subject.length > 120) {
      setNotice({ tone: "error", text: "主题长度需要在 4 到 120 个字符之间。" });
      return;
    }

    if (content.length < 10 || content.length > 4000) {
      setNotice({ tone: "error", text: "反馈内容长度需要在 10 到 4000 个字符之间。" });
      return;
    }

    if (form.category === "experiment" && !courseTitle && !courseId) {
      setNotice({ tone: "error", text: "实验反馈请至少填写实验名称或实验编号。" });
      return;
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      setNotice({ tone: "error", text: "联系邮箱格式不正确。" });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const result = await feedbackApi.submit({
        category: form.category,
        subject,
        content,
        courseId: form.category === "experiment" ? courseId || undefined : undefined,
        courseTitle: form.category === "experiment" ? courseTitle || undefined : undefined,
        sourcePage: originPage || "about-page",
        pagePath: originPath || `${location.pathname}${location.search}`,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
      });

      setSubmissionId(result.id);
      setNotice({ tone: "success", text: "反馈已提交，管理员可在后台反馈面板查看。" });
      setForm((current) => ({
        ...current,
        subject: "",
        content: "",
      }));
    } catch (error) {
      setSubmissionId(null);
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "提交反馈失败，请稍后再试。",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="feedback"
      ref={sectionRef}
      className="rounded-[2.5rem] border bg-[color:var(--paper-surface-strong)] px-6 py-8 sm:px-8 sm:py-10"
      style={{
        borderColor: isDark ? "rgba(36, 84, 110, 0.26)" : "rgba(36, 84, 110, 0.12)",
        boxShadow: isDark
          ? "0 28px 64px -54px rgba(20, 52, 70, 0.45), inset 0 1px 0 rgba(255,255,255,0.03)"
          : "0 22px 54px -42px rgba(20, 52, 70, 0.14), inset 0 1px 0 rgba(255,255,255,0.78)",
      }}
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.86fr)_minmax(360px,1fr)] xl:gap-10">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-link)]">
            Feedback Loop
          </p>
          <h2
            className="mt-3 text-3xl font-semibold text-[var(--paper-foreground)] sm:text-4xl"
            style={{ fontFamily: "var(--font-ui-display)" }}
          >
            把使用过程里的问题，直接送回对应的人手里。
          </h2>
          <p className="mt-4 text-base leading-8 text-[var(--glass-text-muted)] sm:text-lg">
            这里区分两类反馈：一类是具体实验的问题与建议，另一类是针对平台本身的功能建议。提交后内容会保存到后台，只有管理员账户可以在管理员面板查看。
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {CATEGORY_OPTIONS.map((option) => {
              const selected = option.value === form.category;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange("category", option.value)}
                  className="rounded-[1.75rem] border px-5 py-5 text-left transition-transform duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: selected
                      ? `${option.accent}${isDark ? "88" : "44"}`
                      : isDark
                        ? "rgba(148, 163, 184, 0.18)"
                        : "rgba(148, 163, 184, 0.16)",
                    background: selected
                      ? isDark
                        ? `linear-gradient(180deg, ${option.accent}24, rgba(14, 22, 29, 0.52))`
                        : `linear-gradient(180deg, ${option.accent}16, rgba(255,255,255,0.92))`
                      : "var(--glass-panel-soft)",
                    boxShadow: selected ? `0 20px 42px -34px ${option.accent}55` : "none",
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${option.accent}18`, color: option.accent }}
                  >
                    <option.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--paper-foreground)]">
                    {option.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div
            className="mt-7 rounded-[1.8rem] border px-5 py-5"
            style={{
              borderColor: isDark
                ? `${activeOption.accent}33`
                : `${activeOption.accent}26`,
              background: isDark
                ? `linear-gradient(145deg, ${activeOption.accent}16, rgba(12, 20, 28, 0.46))`
                : `linear-gradient(145deg, ${activeOption.accent}0f, rgba(255,255,255,0.96))`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${activeOption.accent}18`, color: activeOption.accent }}
              >
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--paper-foreground)]">
                  当前路由类型
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">
                  {form.category === "experiment"
                    ? "这条反馈会归档到后台的实验反馈列表，便于管理员按实验问题集中处理。"
                    : "这条反馈会归档到后台的软件建议列表，便于管理员集中查看和跟进。"}
                </p>
                {originPath ? (
                  <p className="mt-3 text-xs leading-6 text-[var(--glass-text-muted)]">
                    来源页面: {originPath}
                  </p>
                ) : null}
                {originPath ? (
                  <Link
                    to={originPath}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"
                    style={{ color: activeOption.accent }}
                  >
                    返回来源页面
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-[2rem] border p-5 sm:p-6"
          style={{
            borderColor: isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.14)",
            background: isDark
              ? "linear-gradient(180deg, rgba(10, 18, 24, 0.82), rgba(16, 24, 30, 0.92))"
              : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,250,252,0.96))",
            boxShadow: isDark
              ? "0 34px 56px -46px rgba(0, 0, 0, 0.52)"
              : "0 28px 52px -46px rgba(15, 23, 42, 0.18)",
          }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            {notice ? (
              <div
                className="rounded-[1.4rem] border px-4 py-3"
                style={{
                  borderColor:
                    notice.tone === "success"
                      ? isDark
                        ? "rgba(15, 155, 116, 0.32)"
                        : "rgba(15, 155, 116, 0.22)"
                      : isDark
                        ? "rgba(220, 38, 38, 0.34)"
                        : "rgba(220, 38, 38, 0.18)",
                  background:
                    notice.tone === "success"
                      ? isDark
                        ? "rgba(15, 155, 116, 0.12)"
                        : "rgba(15, 155, 116, 0.08)"
                      : isDark
                        ? "rgba(220, 38, 38, 0.12)"
                        : "rgba(220, 38, 38, 0.06)",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      notice.tone === "success"
                        ? isDark
                          ? "#7dd3b0"
                          : "#0f766e"
                        : isDark
                          ? "#fca5a5"
                          : "#b91c1c",
                  }}
                >
                  {notice.text}
                </p>
                {submissionId ? (
                  <p className="mt-2 text-xs text-[var(--glass-text-muted)]">
                    反馈编号: {submissionId}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--paper-foreground)]">
                主题
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(event) => handleFieldChange("subject", event.target.value)}
                placeholder={
                  form.category === "experiment"
                    ? "例如：第二单元某段视频说明不清楚"
                    : "例如：希望增加实验反馈入口"
                }
                maxLength={120}
                className="w-full rounded-[1.2rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] px-4 py-3 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-link)] focus:ring-2 focus:ring-[var(--paper-link)]"
              />
            </div>

            {form.category === "experiment" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--paper-foreground)]">
                    实验名称
                  </label>
                  <input
                    type="text"
                    value={form.courseTitle}
                    onChange={(event) =>
                      handleFieldChange("courseTitle", event.target.value)
                    }
                    placeholder="例如：冰洲石和布儒斯特实验介绍"
                    maxLength={200}
                    className="w-full rounded-[1.2rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] px-4 py-3 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-link)] focus:ring-2 focus:ring-[var(--paper-link)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--paper-foreground)]">
                    实验编号
                  </label>
                  <input
                    type="text"
                    value={form.courseId}
                    onChange={(event) => handleFieldChange("courseId", event.target.value)}
                    placeholder="例如：course1"
                    maxLength={100}
                    className="w-full rounded-[1.2rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] px-4 py-3 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-link)] focus:ring-2 focus:ring-[var(--paper-link)]"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--paper-foreground)]">
                详细内容
              </label>
              <textarea
                value={form.content}
                onChange={(event) => handleFieldChange("content", event.target.value)}
                placeholder={
                  form.category === "experiment"
                    ? "请描述你在哪个实验、哪个环节遇到了问题，或者你希望增加什么说明、资源和交互。"
                    : "请描述你对导航、交互、功能、性能或整体流程的改进建议。"
                }
                rows={7}
                maxLength={4000}
                className="w-full rounded-[1.2rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] px-4 py-3 text-sm leading-7 text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-link)] focus:ring-2 focus:ring-[var(--paper-link)]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--paper-foreground)]">
                  联系人
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(event) => handleFieldChange("contactName", event.target.value)}
                  placeholder="你的名字或称呼"
                  maxLength={80}
                  className="w-full rounded-[1.2rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] px-4 py-3 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-link)] focus:ring-2 focus:ring-[var(--paper-link)]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--paper-foreground)]">
                  联系邮箱
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) =>
                    handleFieldChange("contactEmail", event.target.value)
                  }
                  placeholder="name@example.com"
                  className="w-full rounded-[1.2rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] px-4 py-3 text-sm text-[var(--paper-foreground)] outline-none transition focus:border-[var(--paper-link)] focus:ring-2 focus:ring-[var(--paper-link)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--paper-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-[var(--glass-text-muted)]">
                提交后内容会直接保存到后台反馈面板，仅管理员账户可见。
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background:
                    form.category === "experiment"
                      ? "linear-gradient(135deg, #1865f2 0%, #0ea5a4 100%)"
                      : "linear-gradient(135deg, #d97706 0%, #d946a0 100%)",
                }}
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? "提交中..." : "提交反馈"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
