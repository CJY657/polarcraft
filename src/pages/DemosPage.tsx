// src/pages/DemosPage.tsx
// Demos Page Component - Interactive simulations and visualizations for polarization concepts

import { useState, useEffect, useRef, Suspense } from "react";
import { Link, useSearchParams, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";

import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  X,
} from "lucide-react";

import { PersistentHeader } from "@/components/shared/PersistentHeader";
import { AuthThemeSwitcher } from "@/components/ui/AuthThemeSwitcher";
import { useTheme } from "@/contexts/ThemeContext";

// 判断是否为移动设备的自定义 Hook
import { useIsMobile } from "@/hooks/useIsMobile";

// 错误边界组件导入
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

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
  const { theme } = useTheme();
  const { demoId: urlDemoId } = useParams<{ demoId?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { screenWidth } = useIsMobile();
  const isCompact = screenWidth < 1280;
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  const drawerRef = useRef<HTMLDialogElement>(null);

  const activeDemoId = urlDemoId || searchParams.get("demo");
  const currentDemo = DEMOS.find((demo) => demo.id === activeDemoId);
  const DemoComponent = currentDemo?.component;
  const isViewingDemo = Boolean(currentDemo);
  const isWideEmbedDemo = currentDemo?.id === "visuphy-polarization";
  const currentUnit = UNITS.find((unit) => unit.num === currentDemo?.unit);
  const directoryLabel = t("demos.directory", "演示目录");

  // Preserve legacy links while keeping the selected demo in sync with browser navigation.
  useEffect(() => {
    const queryDemo = searchParams.get("demo");
    if (!urlDemoId && queryDemo && DEMOS.some((demo) => demo.id === queryDemo)) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("demo");
      const paramString = newParams.toString();
      navigate(`/demos/${queryDemo}${paramString ? `?${paramString}` : ""}`, { replace: true });
    }
  }, [urlDemoId, searchParams, navigate]);

  useEffect(() => {
    setShowMobileSidebar(false);
  }, [urlDemoId]);

  // Native dialog supplies focus containment, Escape handling and focus restoration.
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || !showMobileSidebar || !isCompact || !isViewingDemo) return;

    const previousOverflow = document.body.style.overflow;
    drawer.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      drawer.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [showMobileSidebar, isCompact, isViewingDemo]);

  const handleDemoChange = (demoId: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("demo");
    newParams.delete("unit");
    const paramString = newParams.toString();
    navigate(`/demos/${demoId}${paramString ? `?${paramString}` : ""}`);
    setShowMobileSidebar(false);
  };

  const demoNavigation = (
    <nav aria-label={directoryLabel} className="space-y-6">
      {UNITS.filter((unit) => DEMOS.some((demo) => demo.unit === unit.num)).map((unit) => (
        <div key={unit.num}>
          <h2 className="mb-2 flex items-start gap-2 px-3 text-xs font-semibold leading-5 text-clay-muted">
            <span className="font-mono text-clay-muted/70">{String(unit.num).padStart(2, "0")}</span>
            {t(unit.titleKey)}
          </h2>
          <ul className="space-y-1">
            {DEMOS.filter((demo) => demo.unit === unit.num).map((demo) => (
              <li key={demo.id}>
                <button
                  type="button"
                  onClick={() => handleDemoChange(demo.id)}
                  aria-current={currentDemo?.id === demo.id ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm leading-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-ink",
                    currentDemo?.id === demo.id
                      ? theme === "dark"
                        ? "bg-clay-lavender/20 font-semibold text-clay-ink"
                        : "bg-clay-lavender font-semibold text-clay-ink"
                      : "text-clay-body hover:bg-clay-surface-card hover:text-clay-ink",
                  )}
                >
                  <span className="min-w-0 flex-1">{t(demo.titleKey)}</span>
                  <span className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                    currentDemo?.id === demo.id
                      ? theme === "dark" ? "bg-white/10 text-clay-ink" : "bg-white/40 text-clay-ink"
                      : "bg-clay-surface-card text-clay-muted",
                  )}>
                    {demo.visualType}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className={cn(
      "clay-canvas min-h-screen",
      isViewingDemo && theme === "dark" && [
        "[--clay-canvas:#0b1220] [--clay-ink:#f1f5f9] [--clay-surface-card:#1e293b]",
        "[--color-clay-canvas:#0b1220] [--color-clay-surface-soft:#111c30]",
        "[--color-clay-surface-card:#1e293b] [--color-clay-surface-strong:#334155]",
        "[--color-clay-ink:#f1f5f9] [--color-clay-body:#cbd5e1] [--color-clay-muted:#94a3b8]",
      ],
    )}>
      <PersistentHeader
        moduleKey="demos"
        moduleName={t("page.demos.title")}
        variant="solid"
        compact={isViewingDemo}
        showBreadcrumb={false}
        className="sticky top-0 z-50"
        showSettings={false}
        rightContent={<AuthThemeSwitcher compact />}
      />

      <div className={cn(
        "mx-auto flex w-full max-w-[1680px] items-start gap-6 px-3 pb-10 pt-4 sm:px-6 sm:pt-6 2xl:px-8",
        !isViewingDemo && "pb-12 sm:pt-10",
      )}>
        {isViewingDemo && !isCompact && showDesktopSidebar && (
          <aside
            id="demo-sidebar"
            className="sticky top-[88px] max-h-[calc(100dvh-112px)] w-52 shrink-0 overflow-y-auto overscroll-contain pr-3"
          >
            <div className="mb-5 flex items-center justify-between px-3 pt-1">
              <p className="text-sm font-semibold text-clay-ink">{directoryLabel}</p>
              <span className="font-mono text-xs text-clay-muted">{String(DEMOS.length).padStart(2, "0")}</span>
            </div>
            {demoNavigation}
          </aside>
        )}

        <main className="min-w-0 flex-1">
          {!currentDemo ? (
            <>
              <div className="mx-auto mb-8 max-w-4xl text-center">
                <span className="clay-caption">Computational Simulation</span>
                <h1 className="clay-display-lg mt-3">
                  {t("demos.theorySimulation.title", "计算与模拟")}
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-clay-body sm:text-lg">
                  {t("demos.theorySimulation.description", "光学基础、偏振、旋光与散射的交互演示")}
                </p>
              </div>
              <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                {DEMOS.map((demo, index) => {
                  const cardStyle = DEMO_CARD_STYLES[index % DEMO_CARD_STYLES.length];
                  return (
                    <button
                      type="button"
                      key={demo.id}
                      onClick={() => handleDemoChange(demo.id)}
                      className={cn(
                        "group flex min-h-[220px] min-w-0 flex-col text-left transition-transform duration-200 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay-ink motion-reduce:transform-none motion-reduce:transition-none",
                        cardStyle.card,
                      )}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", cardStyle.badge)}>
                          {t("demos.unitLabel", "单元 {{unit}}", { unit: demo.unit })}
                        </span>
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", cardStyle.badge)}>
                          {demo.visualType}
                        </span>
                      </div>
                      <h2 className={cn("text-2xl font-semibold", cardStyle.title)} style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.015em" }}>
                        {t(demo.titleKey)}
                      </h2>
                      <p className={cn("mt-3 text-sm leading-6", cardStyle.body)}>
                        {t(demo.descriptionKey)}
                      </p>
                      <span className={cn("mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold", cardStyle.cta)}>
                        {t("demos.startExploring", "开始探索")}
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="min-w-0">
              <div className="mb-5 flex items-start justify-between gap-3 border-b border-clay-surface-strong pb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-5 text-clay-muted">
                    <Link to="/demos" className="inline-flex items-center gap-1.5 rounded hover:text-clay-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay-ink">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      {t("museum.backToGallery", "返回演示馆")}
                    </Link>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    {currentUnit && <span>{t(currentUnit.titleKey)}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <h1 className="text-2xl font-semibold leading-tight text-clay-ink sm:text-[1.75rem]" style={{ fontFamily: "var(--font-ui-display)", letterSpacing: "-0.025em" }}>
                      {t(currentDemo.titleKey)}
                    </h1>
                    <VisualTypeBadge type={currentDemo.visualType} />
                  </div>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-clay-body">
                    {t(currentDemo.descriptionKey)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => isCompact ? setShowMobileSidebar(true) : setShowDesktopSidebar((visible) => !visible)}
                  aria-expanded={isCompact ? showMobileSidebar : showDesktopSidebar}
                  aria-controls={isCompact ? "demo-directory-drawer" : "demo-sidebar"}
                  aria-label={!isCompact && showDesktopSidebar ? t("demos.hideDirectory", "收起演示目录") : directoryLabel}
                  title={!isCompact && showDesktopSidebar ? t("demos.hideDirectory", "收起演示目录") : directoryLabel}
                  className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-clay-surface-strong bg-clay-surface-soft px-3 text-xs font-medium text-clay-body transition-colors hover:bg-clay-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
                >
                  {!isCompact && showDesktopSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                  <span className="hidden sm:inline">{directoryLabel}</span>
                </button>
              </div>

              <div className={cn("min-w-0", isWideEmbedDemo && "overflow-hidden rounded-2xl border border-clay-surface-strong")}>
                <ErrorBoundary key={currentDemo.id}>
                  <Suspense fallback={<DemoLoading />}>
                    {DemoComponent && <DemoComponent />}
                  </Suspense>
                </ErrorBoundary>
              </div>
            </div>
          )}
        </main>
      </div>

      <dialog
        id="demo-directory-drawer"
        ref={drawerRef}
        aria-labelledby="demo-directory-title"
        onClose={() => setShowMobileSidebar(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setShowMobileSidebar(false);
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(22rem,calc(100vw-2rem))] max-w-none border-0 border-r border-clay-surface-strong bg-clay-canvas p-0 text-clay-ink shadow-xl backdrop:bg-slate-950/40"
      >
        <div className="flex min-h-full flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-clay-surface-strong bg-clay-canvas px-5 py-4">
            <h2 id="demo-directory-title" className="text-base font-semibold">{directoryLabel}</h2>
            <button
              type="button"
              onClick={() => setShowMobileSidebar(false)}
              aria-label={t("demos.closeDirectory", "关闭演示目录")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-surface-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">{demoNavigation}</div>
        </div>
      </dialog>
    </div>
  );
}

export default DemosPage;
