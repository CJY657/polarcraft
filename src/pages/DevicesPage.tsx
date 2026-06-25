import { Link } from "react-router-dom";
import { ArrowRight, Compass, Gem, Sparkles } from "lucide-react";

import { PersistentHeader } from "@/components/shared";

export default function DevicesPage() {
  return (
    <div className="clay-canvas min-h-screen">
      <PersistentHeader
        moduleKey="devices"
        moduleName="偏振挑战"
        variant="solid"
        className="sticky top-0 z-40"
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className="clay-caption text-clay-muted">Polarization Challenge</p>
            <h1 className="clay-display-lg mt-3">偏振挑战</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-clay-body sm:text-lg">
              从冰洲石双影开始，把观察、证据和模型串成一场可玩的光学推理。进入案件后，你会用真实实验素材解锁双折射、偏振片检偏与 o/e 光模型。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/devices/calcite-case"
                className="clay-button-primary"
              >
                开始挑战
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/"
                className="clay-button-secondary"
              >
                返回首页
              </Link>
            </div>
          </div>

          <figure className="overflow-hidden rounded-[1.5rem] border border-clay-surface-strong bg-clay-surface-card p-2">
            <img
              src="/images/calcite/双折射成像.jpg"
              alt="冰洲石双折射成像"
              className="aspect-[16/10] w-full rounded-[1.1rem] object-cover"
            />
          </figure>
        </section>

        <section aria-label="偏振挑战列表" className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <Link
            to="/devices/calcite-case"
            className="group clay-card clay-card-teal flex min-h-[260px] flex-col justify-between text-left transition-transform hover:-translate-y-1"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                <Gem className="h-6 w-6" />
              </div>
              <p className="clay-caption mt-6 text-white/70">Playable Case</p>
              <h2
                className="mt-2 text-2xl font-semibold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                冰洲石双影迷案：寻找光的隐藏维度
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                8 张证据卡与一份结案报告，带你从普通玻璃对照一路推理到折射率椭球。进度保存在本机浏览器中。
              </p>
            </div>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
              进入案件
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          <div className="grid gap-5">
            <div className="clay-card clay-card-cream">
              <Compass className="h-6 w-6 text-clay-ink" />
              <h3
                className="mt-4 text-xl font-semibold text-clay-ink"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                证据驱动
              </h3>
              <p className="mt-3 text-sm leading-6 text-clay-body">
                先预测，再观察，最后用证据排除错误解释。
              </p>
            </div>
            <div className="clay-card clay-card-lavender">
              <Sparkles className="h-6 w-6 text-clay-ink" />
              <h3
                className="mt-4 text-xl font-semibold text-clay-ink"
                style={{ fontFamily: "var(--font-ui-display)" }}
              >
                真实素材
              </h3>
              <p className="mt-3 text-sm leading-6 text-clay-ink/80">
                案件直接调用平台已有的冰洲石实验视频与图片。
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
