// src/pages/DemosPage.tsx
// Demos Page Component - Interactive simulations and visualizations for polarization concepts

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";

// UI 组件导入
import {
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

// 简化的加载组件
const DemoLoading = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <div>Loading...</div>
    </div>
  );
};

// 视觉类型徽章
const VisualTypeBadge = ({ type }: { type: "2D" | "3D" }) => {
  return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800">{type}</span>;
};

export function DemosPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();
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

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark" ? "bg-[#0a0a0f] text-gray-200" : "bg-[#f8fafc] text-gray-800",
      )}
    >
      {/* Navigation Header with Persistent Logo 永久头部logo导航栏 */}
      <PersistentHeader
        moduleKey="demos"
        moduleName={t("page.demos.title")}
        variant="glass"
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          isCompact ? "px-3 py-2" : "px-6 py-3",
          theme === "dark"
            ? "bg-slate-900/95 border-b border-cyan-400/20"
            : "bg-white/95 border-b border-cyan-500/20",
        )}
        showSettings={false}
        rightContent={
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Back to Gallery button - only show when viewing a demo */}
            {currentDemo && !showMuseumHomepage && (
              <button
                onClick={handleShowMuseumHomepage}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200",
                  "text-sm font-medium",
                  theme === "dark"
                    ? "text-cyan-400 hover:bg-cyan-400/15 border border-cyan-400/30 hover:border-cyan-400/50"
                    : "text-cyan-600 hover:bg-cyan-100 border border-cyan-500/30 hover:border-cyan-500/50",
                )}
                title={t("museum.backToGallery", "返回演示馆")}
              >
                <ArrowLeft className="w-4 h-4" />
                {!isCompact && <span>{t("museum.backToGallery", "返回演示馆")}</span>}
              </button>
            )}
            {/* Mobile menu button - only show when viewing a demo */}
            {currentDemo && !showMuseumHomepage && isCompact && (
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  theme === "dark"
                    ? "text-cyan-400 hover:bg-cyan-400/10"
                    : "text-cyan-600 hover:bg-cyan-100",
                )}
              >
                {showMobileSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <AuthThemeSwitcher compact />
          </div>
        }
      />

      {/* Main Container */}
      <div className={cn("flex", isCompact ? "pt-[52px]" : "pt-[60px]")}>
        {/* Sidebar - 仅在查看演示时显示 */}
        {currentDemo && !showMuseumHomepage && (
          <aside
            className={cn(
              "fixed top-0 border-r overflow-y-auto transition-transform duration-300 z-40",
              isCompact
                ? cn(
                    "w-72 left-0 bottom-0",
                    showMobileSidebar ? "translate-x-0" : "-translate-x-full",
                    "pt-14",
                  )
                : "w-64 left-0 top-[60px] bottom-0", // 为 footer 留出空间
              theme === "dark"
                ? "bg-slate-900/95 border-cyan-400/10"
                : "bg-white/95 border-cyan-200",
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
                      className={cn(
                        "w-full text-[10px] uppercase tracking-wider mb-2 px-2 font-semibold flex items-center gap-2",
                        theme === "dark" ? "text-gray-500" : "text-gray-500",
                        "transition-colors",
                      )}
                    >
                      <span className="text-yellow-400">★</span>
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
                                  "w-full flex flex-col gap-1 px-3 py-2 rounded-lg text-sm text-left transition-all duration-200",
                                  "hover:translate-x-1 active:scale-[0.98]",
                                  activeDemo === demo.id
                                    ? theme === "dark"
                                      ? "bg-gradient-to-r from-cyan-400/20 to-blue-400/10 text-cyan-400 border-l-2 border-cyan-400"
                                      : "bg-gradient-to-r from-cyan-100 to-blue-50 text-cyan-700 border-l-2 border-cyan-500"
                                    : theme === "dark"
                                      ? "text-gray-400 hover:bg-slate-800/50 hover:text-white"
                                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0",
                                      activeDemo === demo.id
                                        ? theme === "dark"
                                          ? "bg-cyan-400 text-black"
                                          : "bg-cyan-500 text-white"
                                        : theme === "dark"
                                          ? "bg-slate-700 text-gray-400"
                                          : "bg-gray-200 text-gray-500",
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
                          <li
                            className={cn(
                              "px-3 py-2 text-sm",
                              theme === "dark" ? "text-gray-500" : "text-gray-400",
                            )}
                          >
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
        {currentDemo && !showMuseumHomepage && isCompact && showMobileSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Main Content */}
        <main
          className={cn(
            "flex-1",
            isCompact ? "p-3" : currentDemo && !showMuseumHomepage ? "ml-64 p-6" : "p-6",
          )}
        >
          {/* 理论模拟主标题 */}
          <div className="mb-6 text-center">
            <h1
              className={cn(
                "text-5xl font-bold",
                theme === "dark" ? "text-white" : "text-gray-900",
              )}
            >
              {t("demos.theorySimulation.title", "理论模拟")}
            </h1>
            <p className={cn("text-xl mt-2", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
              {t("demos.theorySimulation.description", "光学基础、偏振、旋光与散射的交互演示")}
            </p>
          </div>

          {/* Show Gallery Hero when no demo is selected, otherwise show demo content */}
          {showMuseumHomepage || !currentDemo ? (
            <div className="max-w-[1400px] mx-auto space-y-8">
              {/* 演示卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {DEMOS.map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => handleDemoChange(demo.id)}
                    className={cn(
                      "p-6 rounded-xl border text-left transition-all duration-200 hover:shadow-lg",
                      "hover:-translate-y-1 active:scale-[0.98]",
                      theme === "dark"
                        ? "bg-slate-800 text-white border-slate-700 hover:border-cyan-400"
                        : "bg-white text-gray-800 border-gray-200 hover:border-cyan-500",
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold">{t(demo.titleKey)}</h3>
                      <VisualTypeBadge type={demo.visualType} />
                    </div>
                    <p
                      className={cn(
                        "text-sm",
                        theme === "dark" ? "text-gray-400" : "text-gray-600",
                      )}
                    >
                      {t(demo.descriptionKey)}
                    </p>
                    <div
                      className={cn(
                        "mt-4 text-sm font-medium",
                        theme === "dark" ? "text-cyan-400" : "text-cyan-600",
                      )}
                    >
                      开始探索 →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-[1400px] mx-auto">
              {/* 标题和描述 */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                  {/* 单元徽章 */}
                  <span
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-lg border",
                      theme === "dark"
                        ? "bg-gradient-to-r from-cyan-400/20 to-blue-400/20 text-cyan-400 border-cyan-400/30"
                        : "bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700 border-cyan-300",
                    )}
                  >
                    {currentDemo && UNITS.find((u) => u.num === currentDemo.unit)?.titleKey
                      ? t(UNITS.find((u) => u.num === currentDemo.unit)!.titleKey)
                      : t("demos.theorySimulation.title", "理论模拟")}
                  </span>
                  <VisualTypeBadge type={currentDemo?.visualType || "2D"} />
                  <h1
                    className={cn(
                      "text-2xl font-bold",
                      theme === "dark" ? "text-white" : "text-gray-900",
                    )}
                  >
                    {t(currentDemo?.titleKey || "")}
                  </h1>
                </div>
                <p
                  className={cn(
                    theme === "dark" ? "text-gray-400 text-sm" : "text-gray-700 text-sm",
                  )}
                >
                  {t(currentDemo?.descriptionKey || "")}
                </p>
              </div>

              {/* Demo area */}
              <div
                className={cn(
                  "rounded-2xl border overflow-hidden",
                  theme === "dark"
                    ? "bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-cyan-400/20"
                    : "bg-gradient-to-br from-white to-gray-50 border-cyan-200",
                )}
              >
                <div className="p-5 min-h-[550px]">
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
