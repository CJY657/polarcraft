import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { FlaskConical, Lightbulb, Send } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
  feedbackApi,
  type FeedbackCategory,
} from "@/lib/feedback.service";
import { formatUserIdentity } from "@/lib/identity";

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
  activeBg: string;
}

const CATEGORY_OPTIONS: FeedbackCategoryOption[] = [
  {
    value: "experiment",
    title: "实验问题",
    description: "具体实验相关的疑问与建议。",
    icon: FlaskConical,
    activeBg: "#ffb084",
  },
  {
    value: "product",
    title: "产品建议",
    description: "平台整体功能与体验的建议。",
    icon: Lightbulb,
    activeBg: "#b8a4ed",
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

export function FeedbackSection() {
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
      contactName: current.contactName || formatUserIdentity(user, ""),
      contactEmail: current.contactEmail || user?.email || "",
    }));
  }, [user]);

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
        sourcePage: originPage || "feedback-page",
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
      className="font-['Inter',sans-serif]"
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
        {/* Left Column: Context & Category */}
        <div className="flex flex-col">
          <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#0a0a0a]">
            Feedback Loop
          </p>
          <h2
            className="mt-6 text-[40px] font-medium leading-[1.1] tracking-[-1px] text-[#0a0a0a] sm:text-[56px] sm:tracking-[-2px]"
            style={{ fontFamily: "'Plain Black', Inter, sans-serif" }}
          >
            告诉我们你的想法。
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {CATEGORY_OPTIONS.map((option) => {
              const selected = option.value === form.category;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange("category", option.value)}
                  className="group relative overflow-hidden rounded-[24px] p-[32px] text-left transition-all duration-300"
                  style={{
                    backgroundColor: selected ? option.activeBg : "#f5f0e0",
                    color: "#0a0a0a",
                  }}
                >
                  <div className="relative z-10">
                    <option.icon className="h-8 w-8" />
                    <h3 className="mt-6 text-[18px] font-semibold leading-[1.4]">
                      {option.title}
                    </h3>
                    <p className="mt-3 text-[14px] leading-[1.55] opacity-80">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {originPath ? (
            <div className="mt-8">
              <Link
                to={originPath}
                className="inline-flex items-center text-[14px] font-semibold text-[#6a6a6a] hover:text-[#0a0a0a] transition-colors"
              >
                ← 返回 {originPath}
              </Link>
            </div>
          ) : null}
        </div>

        {/* Right Column: Form */}
        <div className="rounded-[16px] bg-[#faf5e8] p-[32px] sm:p-[48px]">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {notice ? (
              <div
                className="rounded-[12px] p-[16px]"
                style={{
                  backgroundColor: notice.tone === "success" ? "#dcfce7" : "#fee2e2",
                  color: notice.tone === "success" ? "#166534" : "#991b1b",
                }}
              >
                <p className="text-[14px] font-semibold">{notice.text}</p>
                {submissionId ? (
                  <p className="mt-2 text-[13px] opacity-80">
                    反馈编号: {submissionId}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-semibold text-[#1a1a1a]">
                主题
              </label>
              <input
                type="text"
                value={form.subject}
                onChange={(event) => handleFieldChange("subject", event.target.value)}
                placeholder="一句话概括"
                maxLength={120}
                className="h-[44px] w-full rounded-[12px] border border-[#e5e5e5] bg-[#fffaf0] px-[16px] text-[16px] text-[#0a0a0a] outline-none transition-colors focus:border-[#0a0a0a] placeholder:text-[#9a9a9a]"
              />
            </div>

            {form.category === "experiment" ? (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1a1a1a]">
                    实验名称
                  </label>
                  <input
                    type="text"
                    value={form.courseTitle}
                    onChange={(event) =>
                      handleFieldChange("courseTitle", event.target.value)
                    }
                    placeholder="如：冰洲石实验"
                    maxLength={200}
                    className="h-[44px] w-full rounded-[12px] border border-[#e5e5e5] bg-[#fffaf0] px-[16px] text-[16px] text-[#0a0a0a] outline-none transition-colors focus:border-[#0a0a0a] placeholder:text-[#9a9a9a]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-[#1a1a1a]">
                    实验编号
                  </label>
                  <input
                    type="text"
                    value={form.courseId}
                    onChange={(event) => handleFieldChange("courseId", event.target.value)}
                    placeholder="如：course1"
                    maxLength={100}
                    className="h-[44px] w-full rounded-[12px] border border-[#e5e5e5] bg-[#fffaf0] px-[16px] text-[16px] text-[#0a0a0a] outline-none transition-colors focus:border-[#0a0a0a] placeholder:text-[#9a9a9a]"
                  />
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-semibold text-[#1a1a1a]">
                详细内容
              </label>
              <textarea
                value={form.content}
                onChange={(event) => handleFieldChange("content", event.target.value)}
                placeholder="详细描述..."
                rows={6}
                maxLength={4000}
                className="w-full resize-y rounded-[12px] border border-[#e5e5e5] bg-[#fffaf0] p-[16px] text-[16px] leading-[1.55] text-[#0a0a0a] outline-none transition-colors focus:border-[#0a0a0a] placeholder:text-[#9a9a9a]"
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  联系人
                </label>
                <input
                  type="text"
                  value={form.contactName}
                  onChange={(event) => handleFieldChange("contactName", event.target.value)}
                  placeholder="如何称呼"
                  maxLength={80}
                  className="h-[44px] w-full rounded-[12px] border border-[#e5e5e5] bg-[#fffaf0] px-[16px] text-[16px] text-[#0a0a0a] outline-none transition-colors focus:border-[#0a0a0a] placeholder:text-[#9a9a9a]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  联系邮箱
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) =>
                    handleFieldChange("contactEmail", event.target.value)
                  }
                  placeholder="name@example.com"
                  className="h-[44px] w-full rounded-[12px] border border-[#e5e5e5] bg-[#fffaf0] px-[16px] text-[16px] text-[#0a0a0a] outline-none transition-colors focus:border-[#0a0a0a] placeholder:text-[#9a9a9a]"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[14px] text-[#6a6a6a]">
                仅管理员可见
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-[44px] w-full shrink-0 items-center justify-center rounded-[12px] bg-[#0a0a0a] px-[20px] text-[14px] font-semibold text-[#ffffff] transition-colors hover:bg-[#1f1f1f] disabled:cursor-not-allowed disabled:bg-[#e5e5e5] disabled:text-[#6a6a6a] sm:w-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSubmitting ? "提交中..." : "提交反馈"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
