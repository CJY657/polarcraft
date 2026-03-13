import { type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpenText, Library } from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
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
  workspaceLabel: string;
  accent: string;
  inDevelopment?: boolean;
}

const MODULES: ModuleConfig[] = [
  {
    id: "courses",
    i18nNamespace: "home.modules.courses",
    path: "/experiments",
    IconComponent: CoursesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.courses.link1", path: "/experiments" },
      { labelKey: "home.modules.courses.link2", path: "/experiments" },
      { labelKey: "home.modules.courses.link3", path: "/experiments" },
    ],
    workspaceLabel: "实验内容",
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
    workspaceLabel: "研究协作",
    accent: "#0f9b74",
  },
];

const LEARNING_PATH = [
  {
    title: "先进入实验内容",
    description: "通过历史问题和实验情境建立偏振光学的学习动机。",
    path: "/experiments",
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

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const modulesSectionStyle = {
    borderColor: theme === "dark" ? "rgba(24, 101, 242, 0.28)" : "rgba(24, 101, 242, 0.16)",
    boxShadow:
      theme === "dark"
        ? "0 28px 68px -52px rgba(24, 101, 242, 0.55), inset 0 0 0 1px rgba(255,255,255,0.04)"
        : "0 24px 56px -46px rgba(24, 101, 242, 0.18), inset 0 0 0 1px rgba(255,255,255,0.72)",
  };
  const pathSectionStyle = {
    borderColor: theme === "dark" ? "rgba(15, 155, 116, 0.3)" : "rgba(15, 155, 116, 0.18)",
    boxShadow:
      theme === "dark"
        ? "0 30px 70px -54px rgba(15, 155, 116, 0.48), inset 0 0 0 1px rgba(255,255,255,0.04)"
        : "0 24px 56px -46px rgba(15, 155, 116, 0.16), inset 0 0 0 1px rgba(255,255,255,0.72)",
  };

  return (
    <div className="glass-page min-h-screen text-[var(--paper-foreground)]">
      <PersistentHeader
        variant="solid"
        showBreadcrumb={false}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-[2rem] border bg-[color:var(--paper-surface-strong)] p-6 sm:p-8"
          style={modulesSectionStyle}
        >
          <div
            className="pointer-events-none absolute inset-[12px] rounded-[1.45rem] border"
            style={{
              borderColor: theme === "dark" ? "rgba(24, 101, 242, 0.16)" : "rgba(24, 101, 242, 0.12)",
            }}
          />
          <div className="relative space-y-5">
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

              return (
                <div
                  key={module.id}
                  className="group relative flex flex-col overflow-hidden rounded-[1.6rem] border bg-[var(--glass-panel-soft)] p-5 transition-all hover:-translate-y-1"
                  style={{
                    borderColor: theme === "dark" ? `${module.accent}33` : `${module.accent}24`,
                    boxShadow:
                      theme === "dark"
                        ? `0 22px 52px -38px ${module.accent}55, inset 0 0 0 1px rgba(255,255,255,0.03)`
                        : `0 20px 44px -36px ${module.accent}22, inset 0 0 0 1px rgba(255,255,255,0.78)`,
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-[10px] rounded-[1.15rem] border"
                    style={{
                      borderColor: theme === "dark" ? `${module.accent}18` : `${module.accent}16`,
                    }}
                  />
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: `${module.accent}12`, color: module.accent }}
                    >
                      <IconComponent
                        size={30}
                        theme={theme}
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
          </div>
        </section>

        <section
          className="relative overflow-hidden rounded-[2rem] border bg-[color:var(--paper-surface-strong)] p-6 sm:p-8"
          style={pathSectionStyle}
        >
          <div
            className="pointer-events-none absolute inset-[12px] rounded-[1.45rem] border"
            style={{
              borderColor: theme === "dark" ? "rgba(15, 155, 116, 0.16)" : "rgba(15, 155, 116, 0.12)",
            }}
          />
          <div className="relative">
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
                className="group relative rounded-[1.75rem] border bg-[var(--glass-panel-soft)] p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[var(--glass-shadow-strong)]"
                style={{
                  borderColor: theme === "dark" ? "rgba(15, 155, 116, 0.22)" : "rgba(15, 155, 116, 0.14)",
                }}
              >
                <div
                  className="pointer-events-none absolute inset-[10px] rounded-[1.2rem] border"
                  style={{
                    borderColor: theme === "dark" ? "rgba(15, 155, 116, 0.12)" : "rgba(15, 155, 116, 0.1)",
                  }}
                />
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
          </div>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
