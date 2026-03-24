import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpenText,
  Compass,
  FlaskConical,
  GalleryVerticalEnd,
  LibraryBig,
  Orbit,
  Telescope,
  MessageSquarePlus,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";

interface AccentConfig {
  color: string;
  soft: string;
  glow: string;
}

interface Pillar {
  title: string;
  description: string;
  detail: string;
  Icon: LucideIcon;
  accent: AccentConfig;
}

interface ModuleCard {
  title: string;
  route: string;
  description: string;
  eyebrow: string;
  Icon: LucideIcon;
  accent: AccentConfig;
  spanClassName: string;
}

const PLATFORM_PILLARS: Pillar[] = [
  {
    title: "把抽象原理转成可操作对象",
    description: "不只给结论，而是把偏振态、器件作用和光路变化变成可以观察、比较和复盘的过程。",
    detail: "从现象进入，再回到公式、图像与实验解释。",
    Icon: Orbit,
    accent: { color: "#1865f2", soft: "rgba(24, 101, 242, 0.12)", glow: "rgba(24, 101, 242, 0.18)" },
  },
  {
    title: "把课程资源放回学习路径里",
    description: "PPT、图片、视频和实验记录不是孤立附件，而是沿着单元、课程和问题链路被重新组织。",
    detail: "同一个主题可以从历史、实验、模拟和作品多个入口抵达。",
    Icon: Workflow,
    accent: { color: "#0f9b74", soft: "rgba(15, 155, 116, 0.12)", glow: "rgba(15, 155, 116, 0.18)" },
  },
  {
    title: "把学习延伸到创作与协作",
    description: "平台不把“学完”定义为看完内容，而是让学习结果继续进入挑战、作品展示和研究项目。",
    detail: "理解之后要能表达、能设计、能提出自己的问题。",
    Icon: Telescope,
    accent: { color: "#d946a0", soft: "rgba(217, 70, 160, 0.12)", glow: "rgba(217, 70, 160, 0.18)" },
  },
];

const MODULE_MAP: ModuleCard[] = [
  {
    title: "实验内容",
    route: "/experiments",
    description: "用课程、材料与实验叙事建立第一层理解，让用户知道为什么学、从哪里进入。",
    eyebrow: "Experiment Core",
    Icon: FlaskConical,
    accent: { color: "#1865f2", soft: "rgba(24, 101, 242, 0.12)", glow: "rgba(24, 101, 242, 0.16)" },
    spanClassName: "md:col-span-3",
  },
  {
    title: "历史时间线",
    route: "/chronicles",
    description: "把偏振光学放回科学史现场，让概念、人物和问题演化彼此连通。",
    eyebrow: "Chronicles",
    Icon: LibraryBig,
    accent: { color: "#8a5cf6", soft: "rgba(138, 92, 246, 0.11)", glow: "rgba(138, 92, 246, 0.16)" },
    spanClassName: "md:col-span-3",
  },
  {
    title: "交互模拟",
    route: "/demos",
    description: "把公式、参数和图像放进同一个交互界面，让推导和现象可以来回切换。",
    eyebrow: "Simulation",
    Icon: Compass,
    accent: { color: "#0ea5a4", soft: "rgba(14, 165, 164, 0.12)", glow: "rgba(14, 165, 164, 0.16)" },
    spanClassName: "md:col-span-2",
  },
  {
    title: "游戏挑战",
    route: "/games",
    description: "把理解转成动作与判断，在任务约束中验证是否真的会用。",
    eyebrow: "Challenge",
    Icon: Orbit,
    accent: { color: "#c58b1d", soft: "rgba(197, 139, 29, 0.12)", glow: "rgba(197, 139, 29, 0.16)" },
    spanClassName: "md:col-span-2",
  },
  {
    title: "成果展示",
    route: "/gallery",
    description: "让实验记录、文创作品和表达能力成为学习链路的一部分，而不是课后附加项。",
    eyebrow: "Archive",
    Icon: GalleryVerticalEnd,
    accent: { color: "#f59e42", soft: "rgba(245, 158, 66, 0.12)", glow: "rgba(245, 158, 66, 0.16)" },
    spanClassName: "md:col-span-2",
  },
  {
    title: "研究协作",
    route: "/lab/explore",
    description: "把开放问题、课题协作和画布式研究工具连接起来，允许学习继续生长。",
    eyebrow: "Open Lab",
    Icon: Users,
    accent: { color: "#0f9b74", soft: "rgba(15, 155, 116, 0.12)", glow: "rgba(15, 155, 116, 0.16)" },
    spanClassName: "md:col-span-6 lg:col-span-2",
  },
];

const LEARNING_FLOW = [
  {
    step: "01",
    title: "先看到真实问题",
    description: "从实验现象、历史线索或任务场景切入，而不是直接把用户抛进抽象公式。",
  },
  {
    step: "02",
    title: "再建立模型与概念",
    description: "用模拟、图像和器件关系图把关键变量连接起来，形成可迁移的理解。",
  },
  {
    step: "03",
    title: "随后进入操作与验证",
    description: "通过课程资源、实验步骤和挑战任务反复验证，减少“看懂但不会用”的断层。",
  },
  {
    step: "04",
    title: "最后把结果带去表达与协作",
    description: "作品展示和研究协作不是尾声，而是学习闭环真正完成的位置。",
  },
];

function SectionHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-link)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold text-[var(--paper-foreground)] sm:text-4xl" style={{ fontFamily: "var(--font-ui-display)" }}>
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-[var(--glass-text-muted)] sm:text-lg">{description}</p>
    </div>
  );
}

export default function AboutPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const heroStyle = {
    borderColor: isDark ? "rgba(217, 70, 160, 0.24)" : "rgba(217, 70, 160, 0.14)",
    background: isDark
      ? "linear-gradient(135deg, rgba(19, 26, 34, 0.92) 0%, rgba(38, 20, 40, 0.9) 50%, rgba(11, 33, 36, 0.94) 100%)"
      : "linear-gradient(135deg, rgba(255, 248, 252, 0.96) 0%, rgba(255, 255, 255, 0.98) 36%, rgba(244, 251, 249, 0.98) 100%)",
    boxShadow: isDark
      ? "0 36px 80px -56px rgba(217, 70, 160, 0.45), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 32px 72px -54px rgba(217, 70, 160, 0.18), inset 0 1px 0 rgba(255,255,255,0.72)",
  } as const;

  const sectionStyle = {
    borderColor: isDark ? "rgba(36, 84, 110, 0.26)" : "rgba(36, 84, 110, 0.12)",
    boxShadow: isDark
      ? "0 28px 64px -54px rgba(20, 52, 70, 0.45), inset 0 1px 0 rgba(255,255,255,0.03)"
      : "0 22px 54px -42px rgba(20, 52, 70, 0.14), inset 0 1px 0 rgba(255,255,255,0.78)",
  } as const;

  return (
    <div className="glass-page min-h-screen text-[var(--paper-foreground)]">
      <PersistentHeader variant="solid" showBreadcrumb={false} />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.5rem] border px-6 py-8 sm:px-8 sm:py-10 lg:px-10" style={heroStyle}>
          <div className="pointer-events-none absolute inset-0 opacity-90">
            <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-[rgba(217,70,160,0.12)] blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-36 w-36 rounded-full bg-[rgba(15,155,116,0.12)] blur-3xl" />
            <div className="absolute inset-x-10 top-5 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] lg:gap-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-link)] backdrop-blur-sm">
                <BookOpenText className="h-3.5 w-3.5" />
                Platform Note
              </div>

              <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.7rem]" style={{ fontFamily: "var(--font-ui-display)" }}>
                把偏振光学拆成
                <span className="block text-[var(--paper-link)]">可进入、可实验、可协作的学习空间</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--glass-text-muted)] sm:text-lg">
                PolarCraft 是一个面向偏振光学学习与项目实践的数字化实验平台。它不只是课程页面集合，也不只是资源仓库，而是把实验内容、历史线索、交互模拟、挑战任务和研究协作放在同一条学习链路中。
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/experiments" className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white">
                  从实验入口开始
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/lab/explore" className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--paper-link)]">
                  查看研究协作
                </Link>
              </div>
            </div>

            <div className="grid gap-4 self-start">
              {[
                {
                  title: "内容不是堆叠",
                  text: "课程、PPT、图片、视频和案例会被重新放进单元与问题路径中。",
                  accent: "#1865f2",
                },
                {
                  title: "理解必须可视化",
                  text: "平台尽量把器件作用、偏振变化和实验结果转成可以直接观察的界面。",
                  accent: "#0f9b74",
                },
                {
                  title: "学习继续向外生长",
                  text: "当内容理解完成，用户还能进入作品展示、挑战任务和开放研究。",
                  accent: "#d946a0",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border px-5 py-5"
                  style={{
                    borderColor: isDark ? `${item.accent}40` : `${item.accent}26`,
                    background: isDark ? `${item.accent}12` : `${item.accent}0d`,
                    boxShadow: `0 22px 42px -34px ${item.accent}33`,
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: item.accent }}>
                    Design Principle
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[var(--paper-foreground)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2.3rem] border bg-[color:var(--paper-surface-strong)] px-6 py-8 sm:px-8 sm:py-9" style={sectionStyle}>
          <SectionHeader
            eyebrow="Why This Platform"
            title="平台想解决的，不是“内容不够”，而是“学习链路断了”"
            description="很多光学平台已经有资料，但学习者仍然容易卡在三个地方：概念进入门槛高，实验现象与模型脱节，以及学完后缺少表达和延伸的出口。PolarCraft 试图把这三段重新接起来。"
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {PLATFORM_PILLARS.map((pillar) => (
              <article
                key={pillar.title}
                className="relative overflow-hidden rounded-[2rem] border p-6"
                style={{
                  borderColor: isDark ? `${pillar.accent.color}38` : `${pillar.accent.color}1f`,
                  background: isDark
                    ? `linear-gradient(180deg, ${pillar.accent.soft}, rgba(8, 15, 22, 0.12))`
                    : `linear-gradient(180deg, ${pillar.accent.soft}, rgba(255, 255, 255, 0.72))`,
                  boxShadow: `0 22px 44px -36px ${pillar.accent.glow}`,
                }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: pillar.accent.soft, color: pillar.accent.color }}>
                  <pillar.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[var(--paper-foreground)]">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--glass-text-muted)]">{pillar.description}</p>
                <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-[var(--paper-foreground)]/82">{pillar.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2.3rem] border bg-[color:var(--paper-surface-strong)] px-6 py-8 sm:px-8 sm:py-9" style={sectionStyle}>
          <SectionHeader
            eyebrow="Module Map"
            title="六个入口，不是六个孤岛"
            description="每个模块都有自己的进入方式，但它们被设计成一张互相导流的地图。用户可以从课程进入模拟，也可以从作品回到课程，再从研究项目提出新的实验问题。"
          />

          <div className="mt-8 grid gap-4 md:grid-cols-6">
            {MODULE_MAP.map((module) => (
              <Link
                key={module.title}
                to={module.route}
                className={`group relative overflow-hidden rounded-[1.8rem] border p-5 transition-transform duration-200 hover:-translate-y-1 ${module.spanClassName}`}
                style={{
                  borderColor: isDark ? `${module.accent.color}30` : `${module.accent.color}20`,
                  background: isDark
                    ? `linear-gradient(180deg, ${module.accent.soft}, rgba(10, 18, 24, 0.22))`
                    : `linear-gradient(180deg, ${module.accent.soft}, rgba(255, 255, 255, 0.86))`,
                  boxShadow: `0 20px 40px -34px ${module.accent.glow}`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: module.accent.color }}>
                      {module.eyebrow}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-[var(--paper-foreground)]">{module.title}</h3>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: module.accent.soft, color: module.accent.color }}>
                    <module.Icon className="h-5 w-5" />
                  </div>
                </div>

                <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--glass-text-muted)]">{module.description}</p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: module.accent.color }}>
                  打开模块
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[2.3rem] border bg-[color:var(--paper-surface-strong)] px-6 py-8 sm:px-8 sm:py-9" style={sectionStyle}>
            <SectionHeader
              eyebrow="Learning Flow"
              title="理想中的使用方式"
              description="这个平台更像一张经过编排的学习工作台，而不是传统导航菜单。不同页面承担的是不同认知阶段的任务。"
            />

            <div className="mt-8 space-y-5">
              {LEARNING_FLOW.map((item) => (
                <div key={item.step} className="grid gap-4 rounded-[1.7rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] p-5 sm:grid-cols-[72px_minmax(0,1fr)] sm:items-start">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--paper-accent-soft)] text-lg font-semibold text-[var(--paper-link)]">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[2.3rem] border bg-[color:var(--paper-surface-strong)] px-6 py-8" style={sectionStyle}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-link)]">Who It Serves</p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--paper-foreground)]" style={{ fontFamily: "var(--font-ui-display)" }}>
              适合谁
            </h2>

            <div className="mt-6 space-y-4">
              {[
                "第一次接触偏振光学、需要更直观入口的学习者。",
                "希望把课程资源、实验任务和项目实践串起来的教师或组织者。",
                "已经掌握基础内容、想进一步做表达、作品或开放研究的学生团队。",
              ].map((text, index) => (
                <div key={text} className="rounded-[1.5rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--paper-link)]">0{index + 1}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[1.6rem] border px-4 py-5" style={{ borderColor: isDark ? "rgba(24, 101, 242, 0.24)" : "rgba(24, 101, 242, 0.14)", background: isDark ? "rgba(24, 101, 242, 0.12)" : "rgba(24, 101, 242, 0.06)" }}>
              <p className="text-sm font-semibold text-[var(--paper-foreground)]">项目背景</p>
              <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">
                首页中的“深圳零一学院”和“PolarCraft 数字化实验室”卡片，代表了这个平台当前的教育语境与实践来源。关于页则把这套方法论说明清楚。
              </p>
            </div>
          </aside>
        </section>

        <section className="relative overflow-hidden rounded-[2.5rem] border bg-[color:var(--paper-surface-strong)] px-6 py-8 sm:px-8 sm:py-10" style={sectionStyle}>
          <div className="pointer-events-none absolute inset-y-0 left-8 w-px bg-gradient-to-b from-transparent via-[rgba(184,92,56,0.28)] to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(280px,0.92fr)] lg:items-center">
            <div className="pl-4 sm:pl-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b85c38]">Feedback Desk</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--paper-foreground)] sm:text-4xl" style={{ fontFamily: "var(--font-ui-display)" }}>
                反馈现在有独立入口，不再挂在关于页末尾。
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--glass-text-muted)]">
                如果你想提交实验问题或平台建议，现在可以直接进入独立反馈页面。实验页跳转会自动带上实验上下文，平台级建议则会进入单独的产品改进列表。
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/feedback"
                  className="inline-flex items-center gap-2 rounded-full bg-[#b85c38] px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  打开反馈页面
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/experiments" className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--paper-link)]">
                  从实验入口开始
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {[
                {
                  title: "实验反馈",
                  description: "适合指出具体实验中的问题、缺失材料、说明不清或内容建议。",
                  detail: "从实验页跳转时，系统会自动附带实验编号、实验名称和来源路径。",
                  accent: "#1865f2",
                  soft: "rgba(24, 101, 242, 0.14)",
                  Icon: FlaskConical,
                },
                {
                  title: "平台建议",
                  description: "适合反馈导航结构、交互流程、界面信息组织和性能体验。",
                  detail: "它现在被提升为一级反馈入口，不需要再从关于页内部寻找表单。",
                  accent: "#b85c38",
                  soft: "rgba(184, 92, 56, 0.12)",
                  Icon: Workflow,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border px-5 py-5"
                  style={{
                    borderColor: isDark ? "rgba(148, 163, 184, 0.18)" : "rgba(148, 163, 184, 0.14)",
                    background: isDark
                      ? "linear-gradient(180deg, rgba(13, 19, 24, 0.84), rgba(17, 24, 30, 0.94))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,250,252,0.94))",
                    boxShadow: "0 22px 46px -38px rgba(34, 24, 18, 0.18)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: item.soft, color: item.accent }}>
                      <item.Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--paper-foreground)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">{item.description}</p>
                      <p className="mt-3 text-sm leading-7" style={{ color: item.accent }}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-[2.5rem] border bg-[color:var(--paper-surface-strong)] px-6 py-8 sm:px-8 sm:py-10" style={sectionStyle}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--paper-link)]/35 to-transparent" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-link)]">Next Step</p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--paper-foreground)] sm:text-4xl" style={{ fontFamily: "var(--font-ui-display)" }}>
                如果你想验证这套设计是否成立，最好的方式是直接进入模块。
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--glass-text-muted)]">
                从实验内容开始，或直接打开交互模拟与研究协作。关于页提供的是平台的方法说明，真正的判断仍然来自使用过程本身。
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link to="/experiments" className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white">
                浏览实验
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/demos" className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--paper-link)]">
                打开模拟
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
