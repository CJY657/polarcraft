import { useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpenText, Compass, GraduationCap, Library, Sparkles } from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { PersistentHeader } from "@/components/shared";
import {
  CoursesModuleIcon,
  DevicesModuleIcon,
  DemosModuleIcon,
  GamesModuleIcon,
  GalleryModuleIcon,
  LabModuleIcon,
} from "@/components/icons";

type AnimatedIconComponent = ComponentType<{
  className?: string;
  size?: number;
  isHovered?: boolean;
  theme?: "dark" | "light";
}>;

type ModuleGroupId = "teaching" | "practice";

interface QuickLink {
  labelKey: string;
  path: string;
}

interface ModuleConfig {
  id: string;
  i18nNamespace: string;
  path: string;
  IconComponent: AnimatedIconComponent;
  quickLinks: QuickLink[];
  group: ModuleGroupId;
  workspaceLabel: string;
  accent: string;
  inDevelopment?: boolean;
}

interface NavigationGroup {
  id: ModuleGroupId;
  label: string;
  description: string;
  items: string[];
}

const MODULES: ModuleConfig[] = [
  {
    id: "courses",
    i18nNamespace: "home.modules.courses",
    path: "/courses",
    IconComponent: CoursesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.courses.link1", path: "/courses" },
      { labelKey: "home.modules.courses.link2", path: "/courses" },
      { labelKey: "home.modules.courses.link3", path: "/courses" },
    ],
    group: "teaching",
    workspaceLabel: "课程主线",
    accent: "#1865f2",
  },
  {
    id: "devices",
    i18nNamespace: "home.modules.studio",
    path: "/devices",
    IconComponent: DevicesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.studio.link1", path: "/devices" },
      { labelKey: "home.modules.studio.link2", path: "/devices" },
      { labelKey: "home.modules.studio.link3", path: "/devices" },
    ],
    group: "teaching",
    workspaceLabel: "器件与实验",
    accent: "#14bf96",
    inDevelopment: true,
  },
  {
    id: "demos",
    i18nNamespace: "home.modules.theory",
    path: "/demos",
    IconComponent: DemosModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.theory.link1", path: "/demos/malus-law" },
      { labelKey: "home.modules.theory.link2", path: "/demos/birefringence" },
      { labelKey: "home.modules.theory.link3", path: "/demos/stokes-vector" },
    ],
    group: "teaching",
    workspaceLabel: "计算模拟",
    accent: "#0ea5a4",
  },
  {
    id: "games",
    i18nNamespace: "home.modules.games",
    path: "/games",
    IconComponent: GamesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.games.link1", path: "/games/escape" },
      { labelKey: "home.modules.games.link2", path: "/games/minecraft" },
      { labelKey: "home.modules.games.link3", path: "/games" },
    ],
    group: "practice",
    workspaceLabel: "游戏挑战",
    accent: "#d48b1e",
  },
  {
    id: "gallery",
    i18nNamespace: "home.modules.gallery",
    path: "/gallery",
    IconComponent: GalleryModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.gallery.link1", path: "/gallery/diy" },
      { labelKey: "home.modules.gallery.link2", path: "/gallery/generator" },
      { labelKey: "home.modules.gallery.link3", path: "/gallery/gallery" },
    ],
    group: "practice",
    workspaceLabel: "成果归档",
    accent: "#f59e42",
  },
  {
    id: "lab",
    i18nNamespace: "home.modules.lab",
    path: "/lab",
    IconComponent: LabModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.lab.link1", path: "/lab" },
      { labelKey: "home.modules.lab.link2", path: "/lab/explore" },
      { labelKey: "home.modules.lab.link3", path: "/lab" },
    ],
    group: "practice",
    workspaceLabel: "研究协作",
    accent: "#0f9b74",
  },
];

const NAV_GROUPS: NavigationGroup[] = [
  {
    id: "teaching",
    label: "教学主线",
    description: "从课程、器件到交互模拟，先建立概念和实验直觉。",
    items: ["courses", "devices", "demos"],
  },
  {
    id: "practice",
    label: "实践拓展",
    description: "把理解迁移到挑战任务、成果表达与研究协作中。",
    items: ["games", "gallery", "lab"],
  },
];

const LEARNING_PATH = [
  {
    title: "先进入课程故事",
    description: "通过历史问题和实验情境建立偏振光学的学习动机。",
    path: "/courses",
  },
  {
    title: "再看交互模拟",
    description: "把器件、公式和光学现象放到同一条可视化链路里。",
    path: "/demos",
  },
  {
    title: "最后做项目实践",
    description: "从作品、挑战和研究协作中验证自己的理解。",
    path: "/lab",
  },
];

function getModuleById(moduleId: string) {
  return MODULES.find((module) => module.id === moduleId) ?? MODULES[0];
}

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);

  const activeModule = getModuleById(activeModuleId);
  const activeGroup = NAV_GROUPS.find((group) => group.id === activeModule.group) ?? NAV_GROUPS[0];
  const activeModuleTitle = t(`${activeModule.i18nNamespace}.title`);
  const activeModuleDescription = t(`${activeModule.i18nNamespace}.description`);
  const totalQuickLinks = MODULES.reduce((count, module) => count + module.quickLinks.length, 0);

  const summaryItems = [
    { label: "学习模块", value: String(MODULES.length) },
    { label: "快捷入口", value: String(totalQuickLinks) },
    { label: "推荐路径", value: String(LEARNING_PATH.length) },
    { label: "当前焦点", value: activeGroup.label },
  ];

  return (
    <div className="glass-page min-h-screen text-[var(--paper-foreground)]">
      <PersistentHeader
        variant="solid"
        showBreadcrumb={false}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--paper-border)] bg-[color:var(--paper-surface-strong)] px-6 py-8 shadow-[var(--glass-shadow-strong)] sm:px-8 sm:py-10">
          <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_left,rgba(20,191,150,0.16),transparent_58%),radial-gradient(circle_at_top_right,rgba(24,101,242,0.14),transparent_52%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_360px] lg:items-start">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--paper-border)] bg-[var(--glass-chip)] px-4 py-2 text-sm font-medium text-[var(--paper-link)]">
                <Sparkles className="h-4 w-4" />
                更像学习平台的首页入口
              </div>

              <div className="space-y-4">
                <h1
                  className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl"
                  style={{ fontFamily: "var(--font-ui-display)" }}
                >
                  从课程故事到项目实践，把偏振光学组织成一条清晰的学习路径。
                </h1>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(activeModule.quickLinks[0]?.path ?? activeModule.path)}
                  className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-6 py-4 text-base font-bold text-white"
                >
                  继续从 {activeModuleTitle} 开始
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/courses")}
                  className="glass-button inline-flex items-center gap-2 rounded-full px-6 py-4 text-base font-bold text-[var(--paper-link)]"
                >
                  查看课程总览
                </button>
              </div>
            </div>

            <div
              className={cn(
                "rounded-[1.75rem] border p-5 shadow-[var(--glass-shadow)]",
                theme === "dark"
                  ? "border-[var(--paper-border)] bg-[linear-gradient(180deg,rgba(16,35,40,0.98),rgba(13,27,29,0.94))] text-[var(--paper-foreground)]"
                  : "border-[var(--paper-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,250,247,0.94))] text-[var(--color-foreground)]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--paper-link)]">本页焦点</p>
                  <h2
                    className={cn(
                      "mt-1 text-xl font-semibold",
                      theme === "dark" ? "text-[var(--paper-foreground)]" : "text-slate-900",
                    )}
                  >
                    {activeModuleTitle}
                  </h2>
                  <p
                    className={cn(
                      "mt-2 text-sm leading-7",
                      theme === "dark" ? "text-[var(--paper-muted)]" : "text-slate-600",
                    )}
                  >
                    {activeModuleDescription}
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: `${activeModule.accent}16`,
                    color: activeModule.accent,
                  }}
                >
                  <activeModule.IconComponent
                    size={28}
                    theme={theme}
                    isHovered
                  />
                </div>
              </div>

              <div className="mt-5 space-y-2">
                {activeGroup.items.map((moduleId) => {
                  const module = getModuleById(moduleId);
                  const isActive = module.id === activeModule.id;
                  const IconComponent = module.IconComponent;

                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => setActiveModuleId(module.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                        isActive
                          ? "border-transparent bg-[var(--paper-accent-soft)]"
                          : theme === "dark"
                            ? "border-[var(--paper-border)] bg-white/6 hover:border-[var(--paper-link)] hover:bg-white/10"
                            : "border-[var(--paper-border)] bg-white hover:border-[var(--paper-link)] hover:bg-[var(--color-secondary)]",
                      )}
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: `${module.accent}14`, color: module.accent }}
                      >
                        <IconComponent
                          size={22}
                          theme={theme}
                          isHovered={isActive}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            theme === "dark" ? "text-[var(--paper-foreground)]" : "text-slate-900",
                          )}
                        >
                          {t(`${module.i18nNamespace}.title`)}
                        </p>
                        <p
                          className={cn(
                            "truncate text-xs",
                            theme === "dark" ? "text-[var(--paper-muted)]" : "text-slate-500",
                          )}
                        >
                          {module.workspaceLabel}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--paper-link)]",
                          theme === "dark" ? "bg-white/8" : "bg-white",
                        )}
                      >
                        {module.quickLinks.length}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {activeModule.quickLinks.map((link) => (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="rounded-full border border-[var(--paper-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--paper-link)] transition-colors hover:border-[var(--paper-link)] hover:bg-[var(--color-secondary)]"
                  >
                    {t(link.labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          {NAV_GROUPS.map((group) => (
            <article
              key={group.id}
              className="rounded-[1.75rem] border border-[var(--paper-border)] bg-[color:var(--paper-surface-strong)] p-6 shadow-[var(--glass-shadow)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--paper-link)]">
                    {group.id === "teaching" ? "Start learning" : "Apply what you learned"}
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold">{group.label}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">
                    {group.description}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--glass-panel-soft)] p-3 text-[var(--paper-link)]">
                  {group.id === "teaching" ? (
                    <GraduationCap className="h-6 w-6" />
                  ) : (
                    <Compass className="h-6 w-6" />
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {group.items.map((moduleId) => {
                  const module = getModuleById(moduleId);

                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => {
                        setActiveModuleId(module.id);
                        navigate(module.path);
                      }}
                      className="glass-button inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
                    >
                      {t(`${module.i18nNamespace}.title`)}
                      <ArrowRight className="h-4 w-4 text-[var(--paper-link)]" />
                    </button>
                  );
                })}
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--paper-link)]">Explore all modules</p>
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                直接进入你需要的学习空间
              </h2>
            </div>

          </div>

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {MODULES.map((module) => {
              const IconComponent = module.IconComponent;
              const isActive = module.id === activeModule.id;

              return (
                <div
                  key={module.id}
                  className="group relative flex flex-col transition-all hover:translate-x-1"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${module.accent}12`, color: module.accent }}
                    >
                      <IconComponent
                        size={30}
                        theme={theme}
                        isHovered={isActive}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{t(`${module.i18nNamespace}.title`)}</h3>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--paper-link)]">
                        {module.workspaceLabel}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--glass-text-muted)]">
                    {t(`${module.i18nNamespace}.description`)}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {module.quickLinks.map((link) => (
                      <button
                        key={link.path}
                        type="button"
                        onClick={() => navigate(link.path)}
                        className="text-xs font-medium text-[var(--paper-link)] hover:underline"
                      >
                        {t(link.labelKey)}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModuleId(module.id);
                      navigate(module.path);
                    }}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--paper-link)]"
                  >
                    进入学习空间
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] border border-[var(--paper-border)] bg-[color:var(--paper-surface-strong)] p-6 shadow-[var(--glass-shadow)] sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--paper-link)]">Recommended path</p>
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                如果第一次进入平台，可以按这个顺序开始
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--glass-panel-soft)] px-4 py-2 text-sm font-medium text-[var(--paper-foreground)]">
              <Library className="h-4 w-4 text-[var(--paper-link)]" />
              适合课堂导入到项目实践的完整路线
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {LEARNING_PATH.map((step, index) => (
              <button
                key={step.path}
                type="button"
                onClick={() => navigate(step.path)}
                className="group rounded-[1.75rem] border border-[var(--paper-border)] bg-[var(--glass-panel-soft)] p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-sm font-semibold text-[var(--paper-link)]">
                    {index + 1}
                  </span>
                  <BookOpenText className="h-5 w-5 text-[var(--paper-link)] transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">
                  {step.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--paper-link)]">
                  前往此步骤
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
