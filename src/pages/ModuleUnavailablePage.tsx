import { Link } from "react-router-dom";
import { ArrowLeft, Compass, LockKeyhole, Sparkles } from "lucide-react";

import { PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";

interface ModuleUnavailablePageProps {
  accent: string;
  moduleName: string;
  moduleEyebrow: string;
  title: string;
  description: string;
  note: string;
}

export function ModuleUnavailablePage({
  accent,
  moduleName,
  moduleEyebrow,
  title,
  description,
  note,
}: ModuleUnavailablePageProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const heroStyle = {
    borderColor: isDark ? `${accent}46` : `${accent}22`,
    background: isDark
      ? `linear-gradient(145deg, color-mix(in srgb, ${accent} 16%, rgba(10, 18, 28, 0.96)) 0%, rgba(8, 14, 20, 0.96) 52%, color-mix(in srgb, ${accent} 9%, rgba(12, 20, 26, 0.96)) 100%)`
      : `linear-gradient(145deg, color-mix(in srgb, ${accent} 10%, rgba(255, 255, 255, 0.98)) 0%, rgba(255, 255, 255, 0.98) 48%, color-mix(in srgb, ${accent} 6%, rgba(247, 251, 252, 0.98)) 100%)`,
    boxShadow: isDark
      ? `0 34px 72px -54px color-mix(in srgb, ${accent} 54%, transparent), inset 0 1px 0 rgba(255,255,255,0.04)`
      : `0 26px 60px -50px color-mix(in srgb, ${accent} 28%, transparent), inset 0 1px 0 rgba(255,255,255,0.82)`,
  } as const;

  return (
    <div className="glass-page min-h-screen text-[var(--paper-foreground)]">
      <PersistentHeader
        variant="solid"
        showBreadcrumb={false}
        moduleName={moduleName}
      />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-[2.6rem] border px-6 py-8 sm:px-8 sm:py-10 lg:px-10"
          style={heroStyle}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -right-16 top-6 h-40 w-40 rounded-full blur-3xl"
              style={{ background: `color-mix(in srgb, ${accent} 18%, transparent)` }}
            />
            <div
              className="absolute bottom-0 left-1/4 h-36 w-36 rounded-full blur-3xl"
              style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
            />
            <div
              className="absolute inset-x-10 top-6 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${accent} 34%, rgba(255,255,255,0.38)), transparent)`,
              }}
            />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_320px] lg:items-start">
            <div className="max-w-3xl">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]"
                style={{
                  color: accent,
                  borderColor: isDark ? `${accent}50` : `${accent}30`,
                  background: isDark ? `${accent}18` : `${accent}12`,
                }}
              >
                <Compass className="h-3.5 w-3.5" />
                {moduleEyebrow}
              </div>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--paper-border)] bg-[var(--paper-surface-strong)]/88 px-4 py-2 text-sm font-semibold text-[var(--paper-foreground)] shadow-[0_16px_32px_-28px_rgba(36,59,83,0.45)] backdrop-blur">
                <LockKeyhole
                  className="h-4 w-4"
                  style={{ color: accent }}
                />
                暂不开放
              </div>

              <h1
                className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                {title}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--glass-text-muted)] sm:text-lg">
                {description}
              </p>

              <div
                className="mt-6 rounded-[1.8rem] border px-5 py-5"
                style={{
                  borderColor: isDark ? `${accent}36` : `${accent}1e`,
                  background: isDark ? `${accent}12` : `${accent}0d`,
                }}
              >
                <p className="text-sm font-semibold text-[var(--paper-foreground)]">当前说明</p>
                <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">{note}</p>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="glass-button glass-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white"
                >
                  <ArrowLeft className="h-4 w-4" />
                  返回首页
                </Link>
                <Link
                  to="/experiments"
                  className="glass-button inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-[var(--paper-link)]"
                >
                  先看实验内容
                </Link>
              </div>
            </div>

            <aside className="grid gap-4">
              {[
                {
                  title: "入口状态",
                  text: "首页与模块地图中的对应入口已经关闭，学生不会再点进未完成页面。",
                },
                {
                  title: "当前原因",
                  text: "内容、交互或稳定性仍在优化中，先以明确状态替代报错体验。",
                },
                {
                  title: "建议路径",
                  text: "可先从实验内容、交互模拟和成果展示继续学习，不影响主线使用。",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.8rem] border px-5 py-5"
                  style={{
                    borderColor: isDark ? `${accent}28` : `${accent}18`,
                    background: isDark ? "rgba(7, 13, 18, 0.64)" : "rgba(255, 255, 255, 0.78)",
                  }}
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--paper-border)] bg-[var(--paper-surface-strong)]/85">
                    <Sparkles
                      className="h-4 w-4"
                      style={{ color: accent }}
                    />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-[var(--paper-foreground)]">{item.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--glass-text-muted)]">{item.text}</p>
                </div>
              ))}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ModuleUnavailablePage;
