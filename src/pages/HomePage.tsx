// src/pages/Homepage.tsx
// Home Page Component - Main landing page with module overviews

// 导入外部库
import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// 导入组件
import { useTheme } from "@/contexts/ThemeContext";

// 导入类型
// import type { ModuleEffectType } from '@/components/effects'

// 导入图标组件
import {
  CoursesModuleIcon,
  DevicesModuleIcon,
  DemosModuleIcon,
  GamesModuleIcon,
  GalleryModuleIcon,
  LabModuleIcon,
} from "@/components/icons";

import { AuthThemeSwitcher } from "@/components/ui/AuthThemeSwitcher";

// Icon component type for animated module icons
type AnimatedIconComponent = React.ComponentType<{
  className?: string;
  size?: number;
  isHovered?: boolean;
  theme?: "dark" | "light";
}>;

// Quick link configuration
interface QuickLink {
  labelKey: string; // i18n 的标签键
  path: string; // 跳转路径
}

// Module configuration for the 6 core modules
interface ModuleConfig {
  id: string;
  // Use the dedicated i18n namespace for each module card content
  i18nNamespace: string; // e.g., 'home.courses'
  path: string;
  IconComponent: AnimatedIconComponent;
  quickLinks: QuickLink[];
  inDevelopment?: boolean;
  colorTheme: {
    bg: string;
    bgHover: string;
    border: string;
    borderHover: string;
    iconBg: string;
    iconColor: string;
    shadow: string;
    glowColor: string;
    tagBg: string;
    tagText: string;
  };
}

const MODULES: ModuleConfig[] = [
  {
    // 1. 课程历史
    id: "courses",
    i18nNamespace: "home.modules.courses",
    path: "/courses",
    IconComponent: CoursesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.courses.link1", path: "/courses" },
      { labelKey: "home.modules.courses.link2", path: "/courses" },
      { labelKey: "home.modules.courses.link3", path: "/courses" },
    ],
    colorTheme: {
      bg: "bg-cyan-950/20 backdrop-blur-sm",
      bgHover: "group-hover:bg-cyan-900/40",
      border: "border-cyan-800/50",
      borderHover:
        "group-hover:border-cyan-400/80 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]",
      iconBg: "bg-cyan-500/10",
      iconColor: "text-cyan-400",
      shadow: "",
      glowColor: "cyan",
      tagBg: "bg-cyan-950/40 border border-cyan-800",
      tagText: "text-cyan-300",
    },
  },
  {
    // 2. 光学器件
    id: "devices",
    i18nNamespace: "home.modules.studio",
    // 原路径为 "/studio"，但在App.tsx中对应的路由路径是 "/devices"
    // 由于路径不一致，访问/studio时会显示Footer而不是错误边界
    // 已修改为 "/devices" 以与App.tsx中的路由配置保持一致
    path: "/devices",
    IconComponent: DevicesModuleIcon,
    inDevelopment: true,
    quickLinks: [
      // 原路径为 "/studio"，已修改为 "/devices"
      { labelKey: "home.modules.studio.link1", path: "/devices" },
      { labelKey: "home.modules.studio.link2", path: "/devices" },
      { labelKey: "home.modules.studio.link3", path: "/devices" },
    ],
    colorTheme: {
      bg: "bg-blue-950/20 backdrop-blur-sm",
      bgHover: "group-hover:bg-blue-900/40",
      border: "border-blue-800/50",
      borderHover:
        "group-hover:border-blue-400/80 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.3)]",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
      shadow: "",
      glowColor: "indigo",
      tagBg: "bg-blue-950/40 border border-blue-800",
      tagText: "text-blue-300",
    },
  },
  {
    // 3. 理论模拟
    id: "demos",
    i18nNamespace: "home.modules.theory",
    path: "/demos",
    IconComponent: DemosModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.theory.link1", path: "/demos/malus-law" },
      { labelKey: "home.modules.theory.link2", path: "/demos/birefringence" },
      { labelKey: "home.modules.theory.link3", path: "/demos/stokes-vector" },
    ],
    colorTheme: {
      bg: "bg-violet-950/20 backdrop-blur-sm",
      bgHover: "group-hover:bg-violet-900/40",
      border: "border-violet-800/50",
      borderHover:
        "group-hover:border-violet-400/80 group-hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-400",
      shadow: "",
      glowColor: "violet",
      tagBg: "bg-violet-950/40 border border-violet-800",
      tagText: "text-violet-300",
    },
  },
  {
    // 4. 游戏挑战
    id: "games",
    i18nNamespace: "home.modules.games",
    path: "/games",
    IconComponent: GamesModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.games.link1", path: "/games/escape" },
      { labelKey: "home.modules.games.link2", path: "/games/minecraft" },
      { labelKey: "home.modules.games.link3", path: "/games" },
    ],
    colorTheme: {
      bg: "bg-purple-950/20 backdrop-blur-sm",
      bgHover: "group-hover:bg-purple-900/40",
      border: "border-purple-800/50",
      borderHover:
        "group-hover:border-purple-400/80 group-hover:shadow-[0_0_20px_rgba(192,132,252,0.3)]",
      iconBg: "bg-purple-500/10",
      iconColor: "text-purple-400",
      shadow: "",
      glowColor: "violet",
      tagBg: "bg-purple-950/40 border border-purple-800",
      tagText: "text-purple-300",
    },
  },
  {
    // 5. 成果展示
    id: "gallery",
    i18nNamespace: "home.modules.gallery",
    path: "/gallery",
    IconComponent: GalleryModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.gallery.link1", path: "/gallery/diy" },
      { labelKey: "home.modules.gallery.link2", path: "/gallery/generator" },
      { labelKey: "home.modules.gallery.link3", path: "/gallery/gallery" },
    ],
    colorTheme: {
      bg: "bg-fuchsia-950/20 backdrop-blur-sm",
      bgHover: "group-hover:bg-fuchsia-900/40",
      border: "border-fuchsia-800/50",
      borderHover:
        "group-hover:border-fuchsia-400/80 group-hover:shadow-[0_0_20px_rgba(232,121,249,0.3)]",
      iconBg: "bg-fuchsia-500/10",
      iconColor: "text-fuchsia-400",
      shadow: "",
      glowColor: "pink",
      tagBg: "bg-fuchsia-950/40 border border-fuchsia-800",
      tagText: "text-fuchsia-300",
    },
  },
  {
    // 6. 虚拟课题
    id: "lab",
    i18nNamespace: "home.modules.lab",
    path: "/lab",
    IconComponent: LabModuleIcon,
    quickLinks: [
      { labelKey: "home.modules.lab.link1", path: "/lab" },
      { labelKey: "home.modules.lab.link2", path: "/lab/explore" },
      { labelKey: "home.modules.lab.link3", path: "/lab" },
    ],
    colorTheme: {
      bg: "bg-teal-950/20 backdrop-blur-sm",
      bgHover: "group-hover:bg-teal-900/40",
      border: "border-teal-800/50",
      borderHover:
        "group-hover:border-teal-400/80 group-hover:shadow-[0_0_20px_rgba(45,212,191,0.3)]",
      iconBg: "bg-teal-500/10",
      iconColor: "text-teal-400",
      shadow: "",
      glowColor: "teal",
      tagBg: "bg-teal-950/40 border border-teal-800",
      tagText: "text-teal-300",
    },
  },
];

// Glow styles for different colors 光效样式
const GLOW_STYLES: Record<string, string> = {
  amber: "rgba(251, 191, 36, 0.4)",
  cyan: "rgba(34, 211, 238, 0.4)",
  indigo: "rgba(129, 140, 248, 0.4)",
  violet: "rgba(139, 92, 246, 0.4)",
  emerald: "rgba(52, 211, 153, 0.4)",
  pink: "rgba(244, 114, 182, 0.4)",
  teal: "rgba(45, 212, 191, 0.4)",
};

function ModuleCard({
  module, // 模块配置
  theme, // 当前主题
  onHoverStart, // 鼠标悬停开始的回调
  onHoverEnd, // 鼠标悬停开始和结束的回调
  cardRef, // 卡片ref用于可能的定位
  iconRef, // 图标ref用于光束效果定位
}: {
  module: ModuleConfig;
  theme: "dark" | "light";
  onHoverStart: () => void;
  onHoverEnd: () => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
  iconRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = module.IconComponent;

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverStart();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverEnd();
  };

  // Get translated content from i18n namespace 获取翻译内容
  const title = t(`${module.i18nNamespace}.title`);
  const description = t(`${module.i18nNamespace}.description`);

  return (
    <Link
      to={module.path}
      ref={cardRef as unknown as React.RefObject<HTMLAnchorElement>}
      className={`
        group relative flex flex-col p-4 sm:p-6 rounded-xl sm:rounded-2xl border transition-all duration-500
        ${module.colorTheme.bg} ${module.colorTheme.bgHover}
        ${module.colorTheme.border} ${module.colorTheme.borderHover}
        hover:-translate-y-2
        overflow-hidden cursor-pointer
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* "In Development" Badge */}
      {module.inDevelopment && (
        <div
          className={`
            absolute top-2 right-2 sm:top-3 sm:right-3 z-10
            px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full
            ${
              theme === "dark"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-amber-100 text-amber-700 border border-amber-300"
            }
          `}
        >
          {t("home.badges.inDevelopment")}
        </div>
      )}

      {/* Background glow effect on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${GLOW_STYLES[module.colorTheme.glowColor]} 0%, transparent 60%)`,
        }}
      />

      {/* Light beam decoration on hover 光线装饰 */}
      <div
        className={`
          absolute -top-20 -right-20 w-40 h-40 rounded-full
          transition-all duration-700 pointer-events-none
          ${isHovered ? "opacity-30 scale-100" : "opacity-0 scale-50"}
        `}
        style={{
          background: `conic-gradient(from 0deg, ${GLOW_STYLES[module.colorTheme.glowColor]}, transparent, ${GLOW_STYLES[module.colorTheme.glowColor]})`,
        }}
      />

      {/* Header: Icon + Title side by side */}
      <div className="flex items-start gap-3 sm:gap-4 mb-3">
        {/* Animated Icon with ref for light beam targeting */}
        <div
          ref={iconRef}
          className={`
            relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0
            ${module.colorTheme.iconBg}
            transition-all duration-500
            ${isHovered ? "scale-110 rotate-3" : "scale-100 rotate-0"}
          `}
        >
          <IconComponent
            size={48}
            isHovered={isHovered}
            theme={theme}
            className="w-10 h-10 sm:w-14 sm:h-14"
          />

          {/* Pulse ring effect on hover */}
          <div
            className={`
              absolute inset-0 rounded-xl border-2
              ${module.colorTheme.border}
              transition-all duration-500 pointer-events-none
              ${isHovered ? "scale-125 opacity-0" : "scale-100 opacity-0"}
            `}
          />
        </div>

        {/* Title block - right of icon */}
        <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
          <h3
            className={`
              text-lg sm:text-xl font-bold leading-tight mb-1
              transition-all duration-300
              ${theme === "dark" ? "text-white" : "text-gray-900"}
              ${isHovered ? "translate-x-1" : "translate-x-0"}
            `}
          >
            {title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <p
        className={`
          text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 flex-1
          transition-all duration-300
          ${theme === "dark" ? "text-gray-400" : "text-gray-600"}
          ${isHovered ? (theme === "dark" ? "text-gray-200" : "text-gray-800") : ""}
        `}
      >
        {description}
      </p>

      {/* Quick Links Tags */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {module.quickLinks.map((link, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              navigate(link.path);
            }}
            className={`
              px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium rounded-full
              transition-all duration-200 border cursor-pointer
              ${module.colorTheme.tagBg} ${module.colorTheme.tagText}
              hover:scale-105 hover:bg-white/10
            `}
          >
            {t(link.labelKey)}
          </button>
        ))}
      </div>

      {/* Corner light beam decoration */}
      <div
        className={`
          absolute bottom-0 left-0 w-full h-1
          transition-all duration-500 pointer-events-none
          ${isHovered ? "opacity-60" : "opacity-0"}
        `}
        style={{
          background: `linear-gradient(90deg, transparent, ${GLOW_STYLES[module.colorTheme.glowColor]}, transparent)`,
        }}
      />
    </Link>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const logoRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track which module is hovered for beam effect 追蹤光纖
  /*
  const [activeModule, setActiveModule] = useState<ModuleEffectType | null>(null)
  */

  // Track logo hover state for interactive effects
  const [logoHovered, setLogoHovered] = useState(false);
  const cardRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());
  const iconRefs = useRef<Map<string, React.RefObject<HTMLDivElement | null>>>(new Map());

  // Get or create a ref for each module card
  const getCardRef = useCallback((moduleId: string) => {
    if (!cardRefs.current.has(moduleId)) {
      cardRefs.current.set(moduleId, { current: null });
    }
    return cardRefs.current.get(moduleId)!;
  }, []);

  // Get or create a ref for each module icon (for light beam targeting)
  const getIconRef = useCallback((moduleId: string) => {
    if (!iconRefs.current.has(moduleId)) {
      iconRefs.current.set(moduleId, { current: null });
    }
    return iconRefs.current.get(moduleId)!;
  }, []);

  // Get the ref for the currently hovered module's icon

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col ${
        theme === "dark"
          ? "bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black"
          : "bg-slate-50"
      }`}
    >
      {/* Ambient floating particles background */}
      {/* <AmbientParticles theme={theme} count={15} enabled /> */}

      {/* Light beam effect from logo to hovered module icons */}
      {/* <LightBeamEffect
        logoRef={logoRef}
        containerRef={containerRef}
        activeModule={activeModule}
        targetRef={activeIconRef}
        leftLogoActive={logoHovered || activeModule !== null}
      /> */}

      {/* Settings */}
      <div className="fixed top-4 right-4 z-50">
        <AuthThemeSwitcher />
      </div>

      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center pt-12 pb-8 px-4 text-center">
        {/* Logo Row - Compact inline layout */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {/* Combined Logo - X-Institute + Open Wisdom Lab */}
          <div
            ref={logoRef}
            className={`
              transition-all duration-500 cursor-pointer
              ${logoHovered ? "scale-105" : "scale-100"}
            `}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
          ></div>
        </div>

        {/* Title */}
        <h1
          className={`text-4xl sm:text-5xl md:text-6xl font-black mb-5 ${
            theme === "dark"
              ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
              : "text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600"
          }`}
        >
          {t("home.hero.title")}
        </h1>

        {/* Subtitle */}
        <p
          className={`text-xl sm:text-2xl font-normal mb-6 ${
            theme === "dark" ? "text-cyan-400/80" : "text-cyan-600"
          }`}
        >
          {t("home.hero.subtitle")}
        </p>
      </header>

      {/* Main Content - consistent width container */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Platform Introduction */}
          <div
            className={`mb-8 p-4 sm:p-6 rounded-2xl text-left ${
              theme === "dark"
                ? "bg-slate-800/50 border border-slate-700/50"
                : "bg-white/70 border border-gray-200 shadow-sm"
            }`}
          >
            <p
              className={`text-sm sm:text-base leading-relaxed ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              {t("home.hero.platformIntro")}
            </p>
          </div>
          {/* Module Grid */}
          <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {MODULES.map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                theme={theme}
                cardRef={getCardRef(module.id)}
                iconRef={getIconRef(module.id)}
                onHoverStart={() => {
                  // setActiveModule(module.id as ModuleEffectType)
                }}
                onHoverEnd={() => {
                  // setActiveModule(null)
                }}
              />
            ))}
          </nav>
        </div>
      </main>
    </div>
  );
}

export default HomePage;
