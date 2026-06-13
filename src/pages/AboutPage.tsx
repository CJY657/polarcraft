import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";

import { PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";

interface Principle {
  label: string;
  title: string;
  description: string;
  accent: string;
}

interface ModuleLink {
  label: string;
  route?: string;
  status?: string;
}

interface ModuleGroup {
  title: string;
  description: string;
  accent: string;
  links: ModuleLink[];
}

const PRINCIPLES: Principle[] = [
  {
    label: "进入",
    title: "先降低抽象门槛",
    description: "从现象、故事和实验任务开始，让偏振态、器件作用和光路变化先变成可以观察的对象。",
    accent: "#1865f2",
  },
  {
    label: "理解",
    title: "再连接模型与操作",
    description: "把课程材料、图像、模拟和公式放在同一条路径里，减少“看懂但不会用”的断层。",
    accent: "#0f9b74",
  },
  {
    label: "延伸",
    title: "最后进入表达与协作",
    description: "作品展示、开放问题和研究项目不是附加入口，而是学习闭环真正完成的位置。",
    accent: "#d946a0",
  },
];

const MODULE_GROUPS: ModuleGroup[] = [
  {
    title: "学习入口",
    description: "用课程叙事和科学史先建立问题感。",
    accent: "#1865f2",
    links: [
      { label: "实验内容", route: "/experiments" },
      { label: "历史时间线", route: "/chronicles" },
    ],
  },
  {
    title: "操作验证",
    description: "把器件、参数和挑战任务收束到可验证的界面里。",
    accent: "#0f9b74",
    links: [
      { label: "交互模拟", route: "/demos" },
      { label: "游戏挑战", status: "筹备中" },
    ],
  },
  {
    title: "输出协作",
    description: "让学习结果继续进入作品、反馈和开放研究。",
    accent: "#d946a0",
    links: [
      { label: "成果展示", route: "/gallery" },
      { label: "研究协作", route: "/lab/explore" },
    ],
  },
];

const LEARNING_FLOW = [
  {
    step: "01",
    title: "看到真实问题",
    description: "从实验现象、历史线索或任务场景进入，而不是直接面对孤立公式。",
  },
  {
    step: "02",
    title: "建立可迁移模型",
    description: "用模拟和图像把变量关系连起来，让概念可以被复用。",
  },
  {
    step: "03",
    title: "操作并验证",
    description: "通过课程资源和挑战任务反复校准理解。",
  },
  {
    step: "04",
    title: "表达与协作",
    description: "把学习结果带到作品展示、反馈和研究项目中。",
  },
];

function Reveal({ children, className }: { children: ReactNode; className?: string; delay?: number }) {
  return <div className={className}>{children}</div>;
}

function Bezel({ children, className, coreClassName }: { children: ReactNode; className?: string; coreClassName?: string }) {
  return (
    <div className={cn("rounded-[2rem] bg-[var(--about-shell)] p-1.5 ring-1 ring-[var(--about-ring)]", className)}>
      <div
        className={cn("h-full rounded-[calc(2rem-0.375rem)] bg-[var(--about-core)]", coreClassName)}
        style={{ boxShadow: "inset 0 1px 0 var(--about-highlight)" }}
      >
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--paper-link)]", className)}>
      {children}
    </p>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[var(--paper-foreground)] [font-family:var(--about-display)] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-8 text-[var(--glass-text-muted)] sm:text-lg">{description}</p>
    </div>
  );
}

function ActionLink({ to, children, variant = "secondary" }: { to: string; children: ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex items-center rounded-full p-1 pl-6 text-sm font-semibold",
        "transition-[transform,box-shadow,background-color,color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]",
        variant === "primary"
          ? "bg-[var(--paper-foreground)] text-[var(--paper-bg)] shadow-[0_24px_46px_-34px_rgba(10,10,10,0.42)]"
          : "bg-[var(--about-core)] text-[var(--paper-foreground)] ring-1 ring-[var(--about-ring)]",
      )}
    >
      <span>{children}</span>
      <span
        className={cn(
          "ml-3 flex h-9 w-9 items-center justify-center rounded-full text-base",
          "transition-[transform,background-color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105",
          variant === "primary" ? "bg-[var(--about-primary-icon)] text-[var(--paper-bg)]" : "bg-[var(--about-shell)] text-[var(--paper-foreground)]",
        )}
        aria-hidden="true"
      >
        ↗
      </span>
    </Link>
  );
}

function PolarizationStudy() {
  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-[1.6rem] bg-[var(--about-visual)] p-6" aria-hidden="true">
      <div className="absolute inset-x-8 top-1/2 h-px bg-gradient-to-r from-transparent via-[var(--paper-link)]/50 to-transparent" />
      <div className="absolute left-[15%] top-[34%] h-24 w-1.5 rounded-full bg-[#1865f2]/85 shadow-[0_0_28px_rgba(24,101,242,0.28)]" />
      <div className="absolute left-[38%] top-[28%] h-32 w-1.5 rotate-45 rounded-full bg-[#0f9b74]/85 shadow-[0_0_28px_rgba(15,155,116,0.28)]" />
      <div className="absolute left-[63%] top-[31%] h-28 w-1.5 -rotate-45 rounded-full bg-[#d946a0]/85 shadow-[0_0_28px_rgba(217,70,160,0.25)]" />
      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-3 gap-2">
        {["observe", "model", "create"].map((item) => (
          <span key={item} className="h-1.5 rounded-full bg-[var(--about-shell)]" />
        ))}
      </div>
      <div className="absolute left-6 top-6 h-12 w-12 rounded-full ring-1 ring-[var(--about-ring)]" />
      <div className="absolute right-6 top-6 h-12 w-12 rounded-full ring-1 ring-[var(--about-ring)]" />
    </div>
  );
}

export default function AboutPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const pageStyle = {
    "--about-font": '"Plus Jakarta Sans", "Geist", "PingFang SC", "Noto Sans SC", sans-serif',
    "--about-display": '"Clash Display", "Plus Jakarta Sans", "Noto Serif SC", "Songti SC", serif',
    "--about-bg": isDark
      ? "linear-gradient(180deg, #081315 0%, #0f2428 52%, #102d33 100%)"
      : "linear-gradient(180deg, #fffaf0 0%, #fcf7ed 48%, #f4efe4 100%)",
    "--about-core": isDark ? "rgba(17, 38, 43, 0.9)" : "rgba(255, 253, 248, 0.88)",
    "--about-shell": isDark ? "rgba(255, 255, 255, 0.055)" : "rgba(10, 10, 10, 0.042)",
    "--about-ring": isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(10, 10, 10, 0.07)",
    "--about-highlight": isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.86)",
    "--about-primary-icon": isDark ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)",
    "--about-visual": isDark
      ? "linear-gradient(145deg, rgba(7, 16, 20, 0.82), rgba(20, 45, 50, 0.9))"
      : "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(244,249,245,0.92))",
  } as CSSProperties;

  return (
    <div className="glass-page min-h-screen overflow-hidden text-[var(--paper-foreground)]" style={{ ...pageStyle, background: "var(--about-bg)", fontFamily: "var(--about-font)" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "linear-gradient(90deg, rgba(24,101,242,0.08), transparent 26%, rgba(15,155,116,0.08) 62%, transparent), repeating-linear-gradient(90deg, transparent 0 72px, rgba(10,10,10,0.026) 72px 73px)",
        }}
        aria-hidden="true"
      />

      <PersistentHeader variant="solid" showBreadcrumb={false} />

      <main className="relative mx-auto flex max-w-7xl flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section className="grid min-h-[72dvh] gap-8 py-8 md:py-24 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.72fr)] lg:items-center">
          <Reveal>
            <div className="max-w-4xl">
              <Eyebrow>About PolarCraft</Eyebrow>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[1.03] tracking-normal text-[var(--paper-foreground)] [font-family:var(--about-display)] sm:text-6xl lg:text-[5.4rem]">
                把偏振光学变成清晰的学习路径。
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-9 text-[var(--glass-text-muted)]">
                PolarCraft 把实验内容、历史线索、交互模拟、挑战任务和研究协作重新编排成同一条学习链路。关于页只保留这件事的核心：它是什么、如何进入、学习会走向哪里。
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ActionLink to="/experiments" variant="primary">
                  从实验入口开始
                </ActionLink>
                <ActionLink to="/lab/explore">查看研究协作</ActionLink>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <Bezel>
              <div className="p-4 sm:p-5">
                <PolarizationStudy />
                <div className="mt-5 space-y-4 px-1 pb-1">
                  {PRINCIPLES.map((item) => (
                    <div key={item.title} className="grid grid-cols-[72px_minmax(0,1fr)] gap-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: item.accent }}>
                        {item.label}
                      </span>
                      <p className="text-sm leading-7 text-[var(--glass-text-muted)]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Bezel>
          </Reveal>
        </section>

        <Reveal className="py-8 md:py-24">
          <Bezel>
            <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)] lg:p-10">
              <SectionHeading
                eyebrow="平台定位"
                title="不是继续堆内容，而是把断开的学习链路接起来。"
                description="偏振光学真正难的地方，往往不是资料不够，而是现象、模型、操作和表达彼此分散。这个页面现在把说明压缩成三条原则，让信息密度降下来。"
              />

              <div className="space-y-7">
                {PRINCIPLES.map((principle) => (
                  <div key={principle.title} className="grid gap-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
                    <div>
                      <span
                        className="inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]"
                        style={{ backgroundColor: `${principle.accent}14`, color: principle.accent }}
                      >
                        {principle.label}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--paper-foreground)]">{principle.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--glass-text-muted)]">{principle.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Bezel>
        </Reveal>

        <section className="grid gap-6 py-8 md:py-24 lg:grid-cols-[minmax(280px,0.78fr)_minmax(0,1.22fr)]">
          <Reveal>
            <Bezel className="h-full">
              <div className="flex h-full flex-col justify-between gap-10 p-6 sm:p-8">
                <SectionHeading
                  eyebrow="学习流程"
                  title="四步足够，不需要更多说明层。"
                  description="让用户知道从哪里开始，也知道每一步为什么存在。"
                />
                <ActionLink to="/demos">直接打开模拟</ActionLink>
              </div>
            </Bezel>
          </Reveal>

          <Reveal delay={0.08}>
            <Bezel>
              <div className="p-6 sm:p-8 lg:p-10">
                <ol className="space-y-8">
                  {LEARNING_FLOW.map((item, index) => (
                    <li key={item.step} className="grid gap-5 sm:grid-cols-[4.25rem_minmax(0,1fr)]">
                      <span className="text-sm font-semibold tracking-[0.2em] text-[var(--paper-link)]">{item.step}</span>
                      <div
                        className="pb-8 last:pb-0"
                        style={index < LEARNING_FLOW.length - 1 ? { boxShadow: "inset 0 -1px 0 var(--about-ring)" } : undefined}
                      >
                        <h3 className="text-xl font-semibold text-[var(--paper-foreground)]">{item.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--glass-text-muted)]">{item.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </Bezel>
          </Reveal>
        </section>

        <Reveal className="py-8 md:py-24">
          <Bezel>
            <div className="grid gap-10 p-6 sm:p-8 lg:grid-cols-[minmax(260px,0.75fr)_minmax(0,1.25fr)] lg:p-10">
              <SectionHeading
                eyebrow="模块地图"
                title="把入口合并成三组，页面就安静很多。"
                description="保留原有导航目标，但不再让六个模块同时争抢注意力。用户只需要判断：先学习、去验证，还是继续产出。"
              />

              <div className="space-y-5">
                {MODULE_GROUPS.map((group) => (
                  <div key={group.title} className="grid gap-5 rounded-[1.5rem] bg-[var(--about-shell)] p-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] sm:items-center">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: group.accent }} />
                        <h3 className="text-xl font-semibold text-[var(--paper-foreground)]">{group.title}</h3>
                      </div>
                      <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">{group.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {group.links.map((link) =>
                        link.route ? (
                          <Link
                            key={link.label}
                            to={link.route}
                            className="group inline-flex items-center rounded-full bg-[var(--about-core)] px-4 py-2 text-sm font-semibold text-[var(--paper-foreground)] ring-1 ring-[var(--about-ring)] transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.98]"
                          >
                            {link.label}
                            <span className="ml-2 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5" aria-hidden="true">
                              ↗
                            </span>
                          </Link>
                        ) : (
                          <span
                            key={link.label}
                            className="inline-flex items-center rounded-full bg-[var(--about-shell)] px-4 py-2 text-sm font-semibold text-[var(--glass-text-muted)] ring-1 ring-[var(--about-ring)]"
                          >
                            {link.label}
                            <span className="ml-2 text-[10px] uppercase tracking-[0.18em]">{link.status}</span>
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Bezel>
        </Reveal>

        <Reveal className="py-8 md:py-24">
          <Bezel>
            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-10">
              <div>
                <Eyebrow>下一步</Eyebrow>
                <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-[var(--paper-foreground)] [font-family:var(--about-display)] sm:text-4xl">
                  如果想判断这套平台说明是否成立，最好的方式仍然是进入实际模块。
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--glass-text-muted)]">
                  关于页负责建立方向感；实验、模拟和反馈页负责让用户真正完成一次学习闭环。
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <ActionLink to="/experiments" variant="primary">
                  浏览实验
                </ActionLink>
                <ActionLink to="/feedback">提交反馈</ActionLink>
              </div>
            </div>
          </Bezel>
        </Reveal>
      </main>
    </div>
  );
}
