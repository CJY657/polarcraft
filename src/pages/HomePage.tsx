import { type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BookOpenText,
  Globe,
  Library,
  LockKeyhole,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";

import { useTheme } from "@/contexts/ThemeContext";
import { PersistentHeader } from "@/components/shared";
import { cn } from "@/utils/classNames";
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

type ClayVariant = "pink" | "teal" | "lavender" | "peach" | "ochre" | "cream";

interface ModuleConfig {
  id: string;
  i18nNamespace: string;
  path: string;
  IconComponent: AnimatedIconComponent;
  quickLinks: QuickLink[];
  workspaceLabel: string;
  variant: ClayVariant;
  status?: "available" | "unavailable";
  statusLabel?: string;
}

const VARIANT_TEXT: Record<ClayVariant, { title: string; body: string; caption: string; iconBg: string; iconFg: string }> = {
  pink: {
    title: "text-white",
    body: "text-white/85",
    caption: "text-white/70",
    iconBg: "bg-white/20",
    iconFg: "text-white",
  },
  teal: {
    title: "text-white",
    body: "text-white/85",
    caption: "text-white/70",
    iconBg: "bg-white/15",
    iconFg: "text-white",
  },
  lavender: {
    title: "text-clay-ink",
    body: "text-clay-ink/80",
    caption: "text-clay-ink/65",
    iconBg: "bg-white/55",
    iconFg: "text-clay-ink",
  },
  peach: {
    title: "text-clay-ink",
    body: "text-clay-ink/80",
    caption: "text-clay-ink/65",
    iconBg: "bg-white/55",
    iconFg: "text-clay-ink",
  },
  ochre: {
    title: "text-clay-ink",
    body: "text-clay-ink/80",
    caption: "text-clay-ink/65",
    iconBg: "bg-white/55",
    iconFg: "text-clay-ink",
  },
  cream: {
    title: "text-clay-ink",
    body: "text-clay-body",
    caption: "text-clay-muted",
    iconBg: "bg-white",
    iconFg: "text-clay-ink",
  },
};

const VARIANT_CARD_CLASS: Record<ClayVariant, string> = {
  pink: "clay-card-pink",
  teal: "clay-card-teal",
  lavender: "clay-card-lavender",
  peach: "clay-card-peach",
  ochre: "clay-card-ochre",
  cream: "clay-card-cream",
};

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
    variant: "pink",
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
    variant: "teal",
    status: "unavailable",
    statusLabel: "暂不开放",
  },
  {
    id: "demos",
    i18nNamespace: "home.modules.theory",
    path: "/demos",
    IconComponent: DemosModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.theory.link1", path: "/demos/em-wave" },
      { labelKey: "home.modules.theory.link2", path: "/demos/birefringence-iceland-spar" },
      { labelKey: "home.modules.theory.link3", path: "/demos/brewster-angle" },
    ],
    workspaceLabel: "计算模拟",
    variant: "lavender",
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
    variant: "peach",
    status: "unavailable",
    statusLabel: "暂不开放",
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
    variant: "ochre",
  },
  {
    id: "lab",
    i18nNamespace: "home.modules.lab",
    path: "/lab/explore",
    IconComponent: LabModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.lab.link1", path: "/lab/explore" },
      { labelKey: "home.modules.lab.link2", path: "/lab/explore" },
      { labelKey: "home.modules.lab.link3", path: "/lab/explore" },
    ],
    workspaceLabel: "研究协作",
    variant: "cream",
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
    path: "/lab/explore",
  },
];

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className="clay-canvas min-h-screen">
      <PersistentHeader variant="solid" showBreadcrumb={false} />

      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-16 pt-8 sm:gap-20 sm:px-6 sm:pb-20 sm:pt-10 lg:gap-24 lg:px-8 lg:pb-24 lg:pt-12">
        {/* ============ LAUNCHER — headline + 6 modules above the fold ============ */}
        <section
          data-testid="home-hero"
          className="flex min-h-[calc(100vh-7rem)] flex-col gap-8 sm:gap-10 lg:min-h-[calc(100vh-8rem)]"
        >
          <div className="flex flex-col gap-4 sm:gap-5">
            <span className="clay-badge self-start">
              <Sparkles className="h-3.5 w-3.5" />
              Polarized light × Learning lab
            </span>

            <h1 className="clay-display-xl">
              用偏振光<br />打开科学的窗户
            </h1>

            <p className="max-w-2xl text-base leading-7 text-clay-body sm:text-lg">
              历史故事、真实实验、交互模拟与课题研究，六个学习空间一站直达。
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/experiments")}
                className="clay-button-primary"
              >
                <BookOpenText className="h-4 w-4" />
                从实验内容开始
              </button>
              <button
                type="button"
                onClick={() => navigate("/lab/explore")}
                className="clay-button-secondary"
              >
                浏览研究项目
              </button>
            </div>
          </div>

          <div className="-mx-4 flex flex-1 snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:grid-rows-2">
            {MODULES.map((module) => {
              const IconComponent = module.IconComponent;
              const isUnavailable = module.status === "unavailable";
              const variantClass = VARIANT_CARD_CLASS[module.variant];
              const variantStyle = VARIANT_TEXT[module.variant];
              const isLab = module.id === "lab";

              return (
                <button
                  key={module.id}
                  type="button"
                  data-testid={`home-module-${module.id}`}
                  aria-disabled={isUnavailable}
                  onClick={() => navigate(module.path)}
                  className={cn(
                    "clay-card group relative flex w-[78%] shrink-0 snap-center flex-col p-5 text-left transition-transform duration-200 sm:w-auto sm:p-6",
                    "min-h-[200px] sm:min-h-[180px] lg:min-h-[200px]",
                    variantClass,
                    isUnavailable ? "cursor-default opacity-90" : "hover:-translate-y-1",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl",
                        variantStyle.iconBg,
                        variantStyle.iconFg,
                      )}
                    >
                      <IconComponent size={26} theme={theme} />
                    </div>
                    {isUnavailable && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em]",
                          variantStyle.iconBg,
                          variantStyle.iconFg,
                        )}
                      >
                        <LockKeyhole className="h-3 w-3" />
                        {module.statusLabel}
                      </span>
                    )}
                  </div>

                  <p className={cn("clay-caption mt-4", variantStyle.caption)}>
                    {module.workspaceLabel}
                  </p>
                  <h3
                    className={cn(
                      "mt-1.5 font-semibold",
                      isLab ? "text-2xl" : "text-xl",
                      variantStyle.title,
                    )}
                    style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                  >
                    {t(`${module.i18nNamespace}.title`)}
                  </h3>
                  <p
                    className={cn(
                      "mt-1.5 leading-snug",
                      isLab ? "text-base line-clamp-3" : "text-sm line-clamp-2",
                      variantStyle.body,
                    )}
                  >
                    {t(`${module.i18nNamespace}.description`)}
                  </p>

                  {!isUnavailable && (
                    <span
                      className={cn(
                        "mt-auto pt-3 inline-flex items-center gap-1.5 text-sm font-semibold",
                        variantStyle.title,
                      )}
                    >
                      进入
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ============ MISSION BAND — cream surface-soft ============ */}
        <section className="rounded-[1.5rem] bg-clay-surface-soft px-6 py-12 text-center sm:rounded-[2rem] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <img
              src={theme === "dark" ? "/images/combined-logo-white.png" : "/images/combined-logo.png"}
              alt="PolarCraft Logo"
              className="mx-auto h-12 w-auto object-contain"
            />
            <div className="mx-auto mt-6 h-px w-12 bg-clay-surface-strong" />

            <h2 className="clay-display-md mt-8">{t("home.hero.title")}</h2>
            <p className="mt-3 text-lg font-medium text-clay-body" style={{ letterSpacing: "-0.01em" }}>
              {t("home.hero.subtitle")}
            </p>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-clay-body">
              “{t("home.hero.platformIntro")}”
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <span className="clay-badge">X-Institute Course</span>
              <span className="clay-badge">Research Learning</span>
            </div>
          </div>
        </section>

        {/* ============ PROMOTION GRID — lavender + peach feature cards ============ */}
        <section className="grid gap-6 lg:grid-cols-2">
          <article className="clay-card clay-card-lavender flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55 text-clay-ink">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <p className="clay-caption text-clay-ink/65">X-Institute</p>
                  <h3
                    className="text-2xl font-semibold text-clay-ink"
                    style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                  >
                    深圳零一学院
                  </h3>
                </div>
              </div>
              <p className="mt-6 text-base leading-7 text-clay-ink/80">
                由清华大学钱学森力学班创办，致力于发掘和培养极具创新潜质的青少年。
                通过挑战性问题驱动的学习（Problem-based Learning），连接创意与智能的未来。
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-clay-ink/75">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  汇聚顶尖导师与极客
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  颠覆式创新教育
                </span>
              </div>
            </div>
            <a
              href="https://www.x-institute.org.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-clay-ink hover:translate-x-0.5"
            >
              了解更多关于零一学院
              <ArrowRight className="h-4 w-4" />
            </a>
          </article>

          <article className="clay-card clay-card-peach flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/55 text-clay-ink">
                  <Rocket className="h-6 w-6" />
                </div>
                <div>
                  <p className="clay-caption text-clay-ink/65">Open Wisdom Lab</p>
                  <h3
                    className="text-2xl font-semibold text-clay-ink"
                    style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                  >
                    PolarCraft 数字化实验室
                  </h3>
                </div>
              </div>
              <p className="mt-6 text-base leading-7 text-clay-ink/80">
                一个基于物理仿真的交互式偏振光学学习平台。
                我们通过数字化手段，将抽象的光学原理转化为直观的可视化体验，让科学探索变得更有趣、更高效。
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-clay-ink/75">
                <span className="inline-flex items-center gap-2">
                  <BookOpenText className="h-4 w-4" />
                  沉浸式实验体验
                </span>
                <span className="inline-flex items-center gap-2">
                  <Library className="h-4 w-4" />
                  丰富的学术资源
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-clay-ink hover:translate-x-0.5"
            >
              探索平台的使命与愿景
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </section>

        {/* ============ LEARNING PATH — three product-mockup cards ============ */}
        <section>
          <div className="mb-8 flex flex-col gap-3 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="clay-caption">推荐路径</span>
              <h2 className="clay-display-lg mt-3">
                第一次进入<br />可以按这个顺序开始
              </h2>
            </div>
            <p className="inline-flex max-w-xs items-center gap-2 text-base text-clay-body">
              <Library className="h-5 w-5 text-clay-ink" />
              适合从课堂导入到项目实践的完整路线
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {LEARNING_PATH.map((step, index) => (
              <button
                key={step.path}
                type="button"
                onClick={() => navigate(step.path)}
                className="group flex flex-col rounded-[1.25rem] border border-clay-surface-strong bg-clay-canvas p-8 text-left transition-transform hover:-translate-y-1"
              >
                <span
                  className="text-5xl font-medium text-clay-ink/15"
                  style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.04em" }}
                >
                  0{index + 1}
                </span>
                <h3
                  className="mt-6 text-xl font-semibold text-clay-ink"
                  style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                >
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-clay-body">{step.description}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-clay-ink">
                  前往此步骤
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ============ PRE-FOOTER CTA BAND ============ */}
        <section className="grid gap-8 rounded-[1.5rem] bg-clay-surface-soft px-6 py-10 sm:rounded-[2rem] sm:px-10 sm:py-14 lg:grid-cols-[1.4fr_0.9fr] lg:items-center lg:px-16 lg:py-16">
          <div>
            <span className="clay-caption">从这里开始</span>
            <h2 className="clay-display-md mt-3">
              把偏振光的<br />学习变成一件有趣的事
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-clay-body">
              无论你是第一次接触偏振光，还是希望把课堂内容用更具象的方式表达，
              这里都准备好了实验、模拟和项目作为起点。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/experiments")}
                className="clay-button-primary"
              >
                进入实验内容
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/demos")}
                className="clay-button-secondary"
              >
                尝试交互模拟
              </button>
            </div>
          </div>
          <div
            className="relative aspect-square rounded-[1.5rem] bg-clay-surface-card"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 30%, rgba(255, 77, 139, 0.28), transparent 50%), radial-gradient(circle at 78% 70%, rgba(232, 185, 74, 0.32), transparent 55%), radial-gradient(circle at 60% 20%, rgba(184, 164, 237, 0.28), transparent 55%)",
            }}
          />
        </section>
      </main>
    </div>
  );
}

export default HomePage;
