// src/pages/DemosPage.tsx
// Demos Page Component - Interactive simulations and visualizations for polarization concepts

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";

// UI 组件导入
import {
  ArrowRight,
  // Gamepad2,
  // BookOpen,
  // Box,
  // BarChart2,
  Menu,
  X,
  // ChevronDown,
  // ChevronRight,
  // Lightbulb,
  // HelpCircle,
  // Search,
  // GraduationCap,
  ArrowLeft,
} from "lucide-react";

import { PersistentHeader } from "@/components/shared/PersistentHeader";
import { AuthThemeSwitcher } from "@/components/ui/AuthThemeSwitcher";

// 判断是否为移动设备的自定义 Hook
import { useIsMobile } from "@/hooks/useIsMobile";

// 错误边界组件导入
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

// 数学文本渲染组件导入
//import MathText from "@/components/shared/MathText";

// Unit 0  Optical Basics demos
import { PolarizationTypesDemo } from "@/feature/demos/unit0/PolarizationTypesDemo";
import { ElectromagneticWaveDemo } from "@/feature/demos/unit0/ElectromagneticWaveDemo";
import { BiRefringenceIcelandSparDemo } from "@/feature/demos/unit0/BiRefringenceIcelandSparDemo";
import { BrewsterAngleDemo } from "@/feature/demos/unit0/BrewsterAngleDemo";
import { ColorStateDemo } from "@/feature/demos/unit1/ColorStateDemo";
import { VisuPhyPolarizationEmbed } from "@/feature/demos/unit1/VisuPhyPolarizationEmbed";

// Unit 1 Demo components

interface DemoItem {
  id: string;
  titleKey: string;
  unit: number; // 0 = basics
  component: React.ComponentType;
  descriptionKey: string;
  visualType: "2D" | "3D";
}

// 演示列表：定义所有可用的演示项
const DEMOS: DemoItem[] = [
  // 单元0 - 电磁波在界面的相互作用
  // 电磁波演示
  {
    id: "em-wave",
    titleKey: "demos.theorySimulation.units.unit0.demos.lightWave.title",
    unit: 0,
    component: ElectromagneticWaveDemo,
    descriptionKey: "demos.theorySimulation.units.unit0.demos.lightWave.description",
    visualType: "2D",
  },
  // 偏振类型演示
  {
    id: "polarization-types",
    titleKey: "demos.theorySimulation.units.unit0.demos.polarizationTypes.title",
    unit: 0,
    component: PolarizationTypesDemo,
    descriptionKey: "demos.theorySimulation.units.unit0.demos.polarizationTypes.description",
    visualType: "2D",
  },
  // 布鲁斯特角演示
  {
    id: "brewster-angle",
    titleKey: "demos.theorySimulation.units.unit0.demos.brewsterAngle.title",
    unit: 0,
    component: BrewsterAngleDemo,
    descriptionKey: "demos.theorySimulation.units.unit0.demos.brewsterAngle.description",
    visualType: "2D",

  },
  {
    id: "birefringence-iceland-spar",
    titleKey: "demos.theorySimulation.units.unit0.demos.birefringenceIcelandSpar.title",
    unit: 0,
    component: BiRefringenceIcelandSparDemo,
    descriptionKey: "demos.theorySimulation.units.unit0.demos.birefringenceIcelandSpar.description",
    visualType: "3D",
  },
  // 单元0结束


  // 单元1 - 各向异性介质中的偏振演化
  //
  {
    id: "color-state",
    titleKey: "demos.theorySimulation.units.unit1.demos.colorState.title",
    unit: 1,
    component: ColorStateDemo,
    descriptionKey: "demos.theorySimulation.units.unit1.demos.colorState.description",
    visualType: "2D",
  },
  {
    id: "visuphy-polarization",
    titleKey: "demos.theorySimulation.units.unit1.demos.visuphyPolarization.title",
    unit: 1,
    component: VisuPhyPolarizationEmbed,
    descriptionKey: "demos.theorySimulation.units.unit1.demos.visuphyPolarization.description",
    visualType: "3D",
  },


  // 单元2 - 光散射与部分偏振形成机制
  //

  // 单元3 - 偏振态的数学表征与成像技术
  //
];

// 单元配置：定义所有理论模拟单元

const UNITS = [
  // 单元0: 光学基础
  {
    num: 0,
    titleKey: "demos.theorySimulation.units.unit0.title",
    color: "yellow",
  },
  // 单元1: 偏振
  {
    num: 1,
    titleKey: "demos.theorySimulation.units.unit1.title",
    color: "cyan",
  },
  // 单元2: 旋光
  {
    num: 2,
    titleKey: "demos.theorySimulation.units.unit2.title",
    color: "green",
  },
  // 单元3: 散射
  {
    num: 3,
    titleKey: "demos.theorySimulation.units.unit3.title",
    color: "blue",
  },
];

const DEMO_CARD_STYLES = [
  {
    card: "clay-card clay-card-ochre",
    title: "text-clay-ink",
    body: "text-clay-ink/75",
    badge: "bg-white/55 text-clay-ink",
    cta: "text-clay-ink",
  },
  {
    card: "clay-card clay-card-lavender",
    title: "text-clay-ink",
    body: "text-clay-ink/75",
    badge: "bg-white/55 text-clay-ink",
    cta: "text-clay-ink",
  },
  {
    card: "clay-card clay-card-peach",
    title: "text-clay-ink",
    body: "text-clay-ink/75",
    badge: "bg-white/55 text-clay-ink",
    cta: "text-clay-ink",
  },
  {
    card: "clay-card clay-card-teal",
    title: "text-white",
    body: "text-white/80",
    badge: "bg-white/14 text-white",
    cta: "text-white",
  },
  {
    card: "clay-card clay-card-mint",
    title: "text-clay-ink",
    body: "text-clay-ink/75",
    badge: "bg-white/55 text-clay-ink",
    cta: "text-clay-ink",
  },
];

// 简化的加载组件
const DemoLoading = () => {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center text-sm font-medium text-clay-muted">
      <div>Loading...</div>
    </div>
  );
};

// 视觉类型徽章
const VisualTypeBadge = ({ type }: { type: "2D" | "3D" }) => {
  return <span className="clay-badge px-2 py-1 text-xs">{type}</span>;
};

export function DemosPage() {
  const { t } = useTranslation();
  const { demoId: urlDemoId } = useParams<{ demoId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 响应式检测：判断是否为移动设备，移动设备使用紧凑布局
  const { isMobile: isCompact } = useIsMobile();

  // Determine initial demo from URL param or show museum homepage
  const getInitialDemo = (): string | null => {
    // First check path param (/demos/:demoId)
    if (urlDemoId && DEMOS.find((d) => d.id === urlDemoId)) {
      return urlDemoId;
    }
    // Fallback to query param for backwards compatibility
    const queryDemo = searchParams.get("demo");
    if (queryDemo && DEMOS.find((d) => d.id === queryDemo)) {
      return queryDemo;
    }
    // Return null to show museum homepage
    return null;
  };

  const [activeDemo, setActiveDemo] = useState<string | null>(getInitialDemo);
  const [showMuseumHomepage, setShowMuseumHomepage] = useState<boolean>(
    () => getInitialDemo() === null,
  );
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<number | null>(0);

  // Handle URL changes for deep linking
  useEffect(() => {
    // If using path param
    if (urlDemoId) {
      const targetDemo = DEMOS.find((d) => d.id === urlDemoId);
      if (targetDemo && activeDemo !== urlDemoId) {
        setActiveDemo(urlDemoId);
        setExpandedUnit(targetDemo.unit);
      }
    }
    // Legacy query param support - redirect to new URL format
    const queryDemo = searchParams.get("demo");
    if (queryDemo) {
      const targetDemo = DEMOS.find((d) => d.id === queryDemo);
      if (targetDemo) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("demo");
        const paramString = newParams.toString();
        navigate(`/demos/${queryDemo}${paramString ? `?${paramString}` : ""}`, { replace: true });
      }
    }
  }, [urlDemoId, searchParams, activeDemo, navigate]);

  const handleDemoChange = (demoId: string) => {
    setActiveDemo(demoId);
    setShowMuseumHomepage(false);

    const newParams = new URLSearchParams(searchParams);
    newParams.delete("unit");
    const paramString = newParams.toString();
    navigate(`/demos/${demoId}${paramString ? `?${paramString}` : ""}`, { replace: true });

    const demo = DEMOS.find((d) => d.id === demoId);
    if (demo) {
      setExpandedUnit(demo.unit);
    }
  };

  const handleShowMuseumHomepage = () => {
    setShowMuseumHomepage(true);
    setActiveDemo(null);
    navigate("/demos", { replace: true });
  };

  const currentDemo = activeDemo ? DEMOS.find((d) => d.id === activeDemo) : null;
  const DemoComponent = currentDemo?.component;
  const isWideEmbedDemo = currentDemo?.id === "visuphy-polarization";
  const isViewingDemo = Boolean(currentDemo && !showMuseumHomepage);

  return (
    <div className="clay-canvas min-h-screen">
      {/* Navigation Header with Persistent Logo 永久头部logo导航栏 */}
      <PersistentHeader
        moduleKey="demos"
        moduleName={t("page.demos.title")}
        variant="solid"
        className="fixed left-0 right-0 top-0 z-50"
        showSettings={false}
        rightContent={
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Back to Gallery button - only show when viewing a demo */}
            {isViewingDemo && (
              <button
                onClick={handleShowMuseumHomepage}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-clay-surface-strong bg-clay-canvas px-3 text-sm font-semibold text-clay-ink transition-transform hover:-translate-y-0.5"
                title={t("museum.backToGallery", "返回演示馆")}
              >
                <ArrowLeft className="w-4 h-4" />
                {!isCompact && <span>{t("museum.backToGallery", "返回演示馆")}</span>}
              </button>
            )}
            {/* Mobile menu button - only show when viewing a demo */}
            {isViewingDemo && isCompact && (
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-clay-surface-card text-clay-ink"
                aria-label={showMobileSidebar ? "关闭演示目录" : "打开演示目录"}
              >
                {showMobileSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <AuthThemeSwitcher compact />
          </div>
        }
      />

      {/* Main Container */}
      <div className={cn("flex", isViewingDemo ? "pt-[76px]" : isCompact ? "pt-[84px]" : "pt-[92px]")}>
        {/* Sidebar - 仅在查看演示时显示 */}
        {isViewingDemo && (
          <aside
            className={cn(
              "fixed top-0 z-40 overflow-y-auto border-r border-clay-surface-strong bg-clay-surface-soft transition-transform duration-300",
              isCompact
                ? cn(
                    "w-72 left-0 bottom-0",
                    showMobileSidebar ? "translate-x-0" : "-translate-x-full",
                    "pt-[76px]",
                  )
                : "w-64 left-0 top-[76px] bottom-0", // 为 footer 留出空间
            )}
          >
            <div className="p-4">
              {UNITS.map((unit) => {
                // 获取当前单元的演示列表
                const unitDemos = DEMOS.filter((d) => d.unit === unit.num);
                const isExpanded = !isCompact || expandedUnit === unit.num;

                return (
                  <div
                    key={unit.num}
                    className="mb-3"
                  >
                    {/* 单元标题按钮 */}
                    <button
                      onClick={() =>
                        isCompact && setExpandedUnit(expandedUnit === unit.num ? null : unit.num)
                      }
                      className="mb-2 flex w-full items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-clay-muted transition-colors"
                    >
                      <span className="text-clay-ochre">★</span>
                      <span className="flex-1 text-left">{t(unit.titleKey)}</span>
                    </button>
                    {/* 单元展开时显示演示列表 */}
                    {isExpanded && (
                      <ul className="space-y-0.5">
                        {unitDemos.length > 0 ? (
                          // 有演示项时显示列表
                          unitDemos.map((demo) => (
                            <li key={demo.id}>
                              <button
                                onClick={() => {
                                  handleDemoChange(demo.id);
                                  if (isCompact) setShowMobileSidebar(false);
                                }}
                                className={cn(
                                  "flex w-full flex-col gap-1 rounded-xl px-3 py-2 text-left text-sm transition-all duration-200 active:scale-[0.98]",
                                  activeDemo === demo.id
                                    ? "bg-clay-lavender text-clay-ink"
                                    : "text-clay-body hover:bg-clay-surface-card hover:text-clay-ink",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0",
                                      activeDemo === demo.id
                                        ? "bg-white/55 text-clay-ink"
                                        : "bg-clay-surface-card text-clay-muted",
                                    )}
                                  >
                                    {unitDemos.indexOf(demo) + 1}
                                  </span>
                                  <span className="truncate flex-1">{t(demo.titleKey)}</span>
                                  <VisualTypeBadge type={demo.visualType} />
                                </div>
                              </button>
                            </li>
                          ))
                        ) : (
                          // 无演示项时显示占位符
                          <li className="px-3 py-2 text-sm text-clay-muted">
                            {t("demos.theorySimulation.comingSoon", "即将推出")}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Mobile sidebar overlay - 仅在查看演示时显示 */}
        {isViewingDemo && isCompact && showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 min-w-0",
            isCompact
              ? isWideEmbedDemo ? "px-2 pb-2 pt-1" : "px-4 pb-4 pt-2"
              : isViewingDemo
                ? isWideEmbedDemo ? "ml-64 px-4 pb-4 pt-2" : "ml-64 px-8 pb-8 pt-3"
                : "p-6 sm:p-8",
          )}
        >
          {/* 理论模拟主标题 */}
          {(showMuseumHomepage || !currentDemo) && (
            <div className="mx-auto mb-8 max-w-4xl text-center">
              <span className="clay-caption">Computational Simulation</span>
              <h1 className="clay-display-lg mt-3">
                {t("demos.theorySimulation.title", "计算与模拟")}
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-clay-body sm:text-lg">
                {t("demos.theorySimulation.description", "光学基础、偏振、旋光与散射的交互演示")}
              </p>
            </div>
          )}

          {/* Show Gallery Hero when no demo is selected, otherwise show demo content */}
          {showMuseumHomepage || !currentDemo ? (
            <div className="mx-auto max-w-7xl space-y-8">
              {/* 演示卡片网格 */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {DEMOS.map((demo, index) => {
                  const cardStyle = DEMO_CARD_STYLES[index % DEMO_CARD_STYLES.length];

                  return (
                    <button
                      key={demo.id}
                      onClick={() => handleDemoChange(demo.id)}
                      className={cn(
                        "group flex min-h-[220px] flex-col text-left transition-transform duration-300 hover:-translate-y-1.5 active:scale-[0.98]",
                        cardStyle.card,
                      )}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", cardStyle.badge)}>
                          单元 {demo.unit}
                        </span>
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", cardStyle.badge)}>
                          {demo.visualType}
                        </span>
                      </div>
                      <h3
                        className={cn("text-2xl font-semibold", cardStyle.title)}
                        style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                      >
                        {t(demo.titleKey)}
                      </h3>
                      <p className={cn("mt-3 text-sm leading-6", cardStyle.body)}>
                        {t(demo.descriptionKey)}
                      </p>
                      <span className={cn("mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold tracking-wide", cardStyle.cta)}>
                        开始探索
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={cn("mx-auto", isWideEmbedDemo ? "max-w-none" : "max-w-[1400px]")}>
              {/* 标题和描述 */}
              <div className="mb-3 rounded-2xl bg-clay-surface-soft px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 sm:gap-x-2.5">
                  {/* 单元徽章 */}
                  <span className="clay-badge">
                    {currentDemo && UNITS.find((u) => u.num === currentDemo.unit)?.titleKey
                      ? t(UNITS.find((u) => u.num === currentDemo.unit)!.titleKey)
                      : t("demos.theorySimulation.title", "计算与模拟")}
                  </span>
                  <VisualTypeBadge type={currentDemo?.visualType || "2D"} />
                  <h1
                    className="w-full text-2xl font-semibold text-clay-ink sm:w-auto"
                    style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}
                  >
                    {t(currentDemo?.titleKey || "")}
                  </h1>
                </div>
                <p className="max-w-4xl text-sm leading-6 text-clay-body">
                  {t(currentDemo?.descriptionKey || "")}
                </p>
              </div>

              {/* Demo area */}
              <div
                className={cn(
                  "overflow-hidden rounded-[1.5rem] border border-clay-surface-strong bg-clay-surface-card",
                )}
              >
                <div
                  className={cn(
                    isWideEmbedDemo
                      ? "min-h-[560px] p-0 sm:min-h-[680px]"
                      : "p-3 min-h-[420px] sm:p-5 sm:min-h-[550px]",
                  )}
                >
                  <ErrorBoundary>
                    <Suspense fallback={<DemoLoading />}>
                      {DemoComponent && <DemoComponent />}
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default DemosPage;
