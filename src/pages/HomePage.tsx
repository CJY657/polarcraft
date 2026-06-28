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

const HERO_IMAGE = "/images/chromatic-polarization/钢化玻璃-正交偏振系统-正视图.jpg";
const SUPPORTING_IMAGES = [
  {
    src: "/images/calcite/双折射成像.jpg",
    alt: "冰洲石双折射成像",
  },
  {
    src: "/images/optical-rotation/关闭室内照明、开启绿色激光和红色激光并使光经过偏振片后的正视图.jpg",
    alt: "旋光实验中的红绿激光",
  },
];

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
    workspaceLabel: "Classic Experiments",
    variant: "pink",
  },
  {
    id: "applications",
    i18nNamespace: "home.modules.applications",
    path: "/applications",
    IconComponent: GamesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.applications.link1", path: "/applications/mueller-microscopy" },
      { labelKey: "home.modules.applications.link2", path: "/applications/polarization-scattering" },
      { labelKey: "home.modules.applications.link3", path: "/applications/in-situ-detection" },
    ],
    workspaceLabel: "Frontier Applications",
    variant: "peach",
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
    workspaceLabel: "Computational Simulation",
    variant: "lavender",
  },
  {
    id: "devices",
    i18nNamespace: "home.modules.studio",
    path: "/devices",
    IconComponent: DevicesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.studio.link1", path: "/devices/calcite-case" },
      { labelKey: "home.modules.studio.link2", path: "/devices" },
      { labelKey: "home.modules.studio.link3", path: "/devices" },
    ],
    workspaceLabel: "Gamified Learning",
    variant: "teal",
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
    workspaceLabel: "Achievement Showcase",
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
    workspaceLabel: "Virtual Research Group",
    variant: "cream",
  },
];

const LEARNING_PATH = [
  {
    Icon: BookOpenText,
    title: "第一步：探索实验",
    description: "从历史谜题与真实情境出发，点燃对偏振光学的求知欲。",
    path: "/experiments",
  },
  {
    Icon: Globe,
    title: "第二步：交互模拟",
    description: "将抽象公式、光学器件与物理现象无缝融于可视化链路。",
    path: "/demos",
  },
  {
    Icon: Rocket,
    title: "第三步：项目实践",
    description: "在创新作品、硬核挑战与协作研究中检验并深化所学。",
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

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 pb-12 pt-6 sm:gap-12 sm:px-6 sm:pb-16 sm:pt-8 lg:gap-14 lg:px-8 lg:pb-20 lg:pt-8">
        {/* ============ MODULES & IMAGES ============ */}
        <section
          data-testid="home-modules-showcase"
          className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(400px,0.9fr)] lg:items-start"
        >
          <div aria-label="PolariScope 平台的六个模块" className="grid gap-5 sm:grid-cols-2">
            {MODULES.map((module) => {
              const IconComponent = module.IconComponent;
              const isUnavailable = module.status === "unavailable";
              const variantClass = VARIANT_CARD_CLASS[module.variant];
              const variantStyle = VARIANT_TEXT[module.variant];

              return (
                <button
                  key={module.id}
                  type="button"
                  data-testid={`home-module-${module.id}`}
                  aria-disabled={isUnavailable}
                  onClick={() => {
                    if (!isUnavailable) {
                      navigate(module.path);
                    }
                  }}
                  className={cn(
                    "clay-card group relative flex min-h-[160px] flex-col p-5 text-left transition-all duration-300",
                    variantClass,
                    isUnavailable ? "cursor-default opacity-90" : "hover:-translate-y-1.5 hover:shadow-lg",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors duration-300",
                        variantStyle.iconBg,
                        variantStyle.iconFg,
                      )}
                    >
                      <IconComponent size={24} theme={theme} />
                    </div>
                    {isUnavailable && (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase",
                          variantStyle.iconBg,
                          variantStyle.iconFg,
                        )}
                      >
                        <LockKeyhole className="h-3.5 w-3.5" />
                        {module.statusLabel}
                      </span>
                    )}
                  </div>

                  <p className={cn("clay-caption mt-4 text-xs font-medium tracking-wide", variantStyle.caption)}>
                    {module.workspaceLabel}
                  </p>
                  <h3
                    className={cn(
                      "mt-1.5 font-bold text-xl",
                      variantStyle.title,
                    )}
                    style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                  >
                    {t(`${module.i18nNamespace}.title`)}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 leading-relaxed text-sm line-clamp-2",
                      variantStyle.body,
                    )}
                  >
                    {t(`${module.i18nNamespace}.description`)}
                  </p>

                  {!isUnavailable && (
                    <span
                      className={cn(
                        "mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-bold tracking-wide",
                        variantStyle.title,
                      )}
                    >
                      进入探索
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <figure className="grid gap-5 lg:sticky lg:top-24">
            <div className="group overflow-hidden rounded-[1.75rem] border border-clay-surface-strong bg-clay-surface-card p-2.5 shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="overflow-hidden rounded-[1.25rem]">
                <img
                  src={HERO_IMAGE}
                  alt="偏振光下的钢化玻璃纹理"
                  className="aspect-[4/3] xl:aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {SUPPORTING_IMAGES.map((image) => (
                <div
                  key={image.src}
                  className="group overflow-hidden rounded-[1.25rem] border border-clay-surface-strong bg-clay-surface-card p-2 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div className="overflow-hidden rounded-[0.9rem]">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="aspect-[4/3] xl:aspect-[3/2] w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                </div>
              ))}
            </div>
          </figure>
        </section>

        {/* ============ MISSION BAND ============ */}
        <section className="rounded-[1.5rem] bg-clay-surface-soft px-6 py-12 text-center sm:rounded-[2rem] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <img
              src={theme === "dark" ? "/images/combined-logo-white.png" : "/images/combined-logo.png"}
              alt="PolariScope Logo"
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
          </div>
        </section>

        {/* ============ PROMOTION GRID ============ */}
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
                源自清华大学钱学森力学班理念，致力于发掘与培养极具创新潜质的顶尖青年。
                以进阶式挑战问题为核心驱动力，连接科技、创意与智能的未来。
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-clay-ink/75">
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  顶尖导师与极客社区
                </span>
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  无边界创新教育
                </span>
              </div>
            </div>
            <a
              href="https://www.x-institute.org.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-clay-ink hover:translate-x-0.5"
            >
              了解零一学院详情
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
                    PolariScope 数字化实验室
                  </h3>
                </div>
              </div>
              <p className="mt-6 text-base leading-7 text-clay-ink/80">
                前沿的物理仿真与交互式偏振光学探索平台。
                我们将晦涩抽象的光学定律转化为生动直观的数字体验，让科学探索从此触手可及、引人入胜。
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm font-medium text-clay-ink/75">
                <span className="inline-flex items-center gap-2">
                  <BookOpenText className="h-4 w-4" />
                  沉浸式数字实验
                </span>
                <span className="inline-flex items-center gap-2">
                  <Library className="h-4 w-4" />
                  多维度学术资源
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/about")}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-clay-ink hover:translate-x-0.5"
            >
              探索我们的使命与愿景
              <ArrowRight className="h-4 w-4" />
            </button>
          </article>
        </section>

        {/* ============ LEARNING PATH ============ */}
        <section>
          <div className="mb-8 flex flex-col gap-3 sm:mb-12">
            <div>
              <span className="clay-caption">探索指南</span>
              <h2 className="clay-display-lg mt-3">
                初次访问？<br />由此开启您的光学之旅
              </h2>
            </div>
            <p className="inline-flex max-w-xs items-center gap-2 text-base text-clay-body">
              <Library className="h-5 w-5 text-clay-ink" />
              覆盖从基础概念到高阶实践的完整成长路径
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {LEARNING_PATH.map((step) => {
              const StepIcon = step.Icon;

              return (
                <button
                  key={step.path}
                  type="button"
                  onClick={() => navigate(step.path)}
                  className="group flex flex-col rounded-[1.25rem] border border-clay-surface-strong bg-clay-canvas p-8 text-left transition-transform hover:-translate-y-1"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clay-surface-card text-clay-ink">
                    <StepIcon className="h-5 w-5" />
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
              );
            })}
          </div>
        </section>

        {/* ============ PRE-FOOTER CTA BAND ============ */}
        <section className="grid gap-8 rounded-[1.5rem] bg-clay-surface-soft px-6 py-10 sm:rounded-[2rem] sm:px-10 sm:py-14 lg:grid-cols-[1.4fr_0.9fr] lg:items-center lg:px-16 lg:py-16">
          <div>
            <span className="clay-caption">即刻启程</span>
            <h2 className="clay-display-md mt-3">
              让偏振光学的<br />探索充满无限可能
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-clay-body">
              无论您是初探光学世界的新手，还是寻求具象表达的进阶学习者，
              这里海量的实验、模拟与项目都将是您最好的起点。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/experiments")}
                className="clay-button-primary"
              >
                开启实验之旅
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/demos")}
                className="clay-button-secondary"
              >
                体验交互模拟
              </button>
            </div>
          </div>
          <figure className="overflow-hidden rounded-[1.5rem] bg-clay-surface-card p-2">
            <img
              src="/images/chromatic-polarization/透明胶条（重叠阵列）-正交偏振系统-正视图.jpg"
              alt="透明胶条在正交偏振系统中的彩色纹理"
              className="aspect-square w-full rounded-[1.1rem] object-cover"
            />
          </figure>
        </section>
      </main>
    </div>
  );
}

export default HomePage;
