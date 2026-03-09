/**
 * Gallery Page - Student Works Showcase
 * 学生作品展示平台
 *
 * Features:
 * - 作品展示 - Community gallery and works showcase
 * - 详情页 - Work detail with records, discussion, media
 */

import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";
import { PersistentHeader, Tabs } from "@/components/shared";
import { WorksGrid } from "@/feature/gallery";
import { getPublicWorks } from "@/data/gallery";
import { Film, ImageIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CulturalShowcase } from "@/feature/gallery/CulturalShowcase";

type TabId = "gallery" | "showcase";
const VALID_TABS: TabId[] = ["gallery", "showcase"];

const SUB_MODULE_TABS = [
  {
    id: "gallery",
    label: { "zh-CN": "实验展示" },
    icon: <ImageIcon className="w-4 h-4" />,
  },
  { id: "showcase", label: { "zh-CN": "创意作品" }, icon: <Film className="w-4 h-4" /> },
];

export function ExperimentsPage() {
  const { t } = useTranslation();
  const { tabId } = useParams<{ tabId?: string }>();
  const navigate = useNavigate();

  // Get public works
  const works = getPublicWorks();

  const getActiveTab = (): TabId => {
    if (tabId && VALID_TABS.includes(tabId as TabId)) {
      return tabId as TabId;
    }
    return "gallery";
  };

  const [activeTab, setActiveTab] = useState<TabId>(getActiveTab());

  const handleTabChange = (newTabId: string) => {
    const tab = newTabId as TabId;
    setActiveTab(tab);
    navigate(`/gallery/${tab}`);
  };

  return (
    <div
      className={cn(
        "glass-page min-h-screen",
      )}
    >
      {/* Header with Persistent Logo */}
      <PersistentHeader
        moduleKey="gallery"
        moduleNameKey={t("page.gallery.title")}
        variant="glass"
        className="sticky top-0 z-40"
      />

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Page Header */}
        <section className="glass-panel-strong relative mb-8 overflow-hidden rounded-[2.1rem] px-6 py-7 sm:px-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--paper-accent) 5%, transparent), transparent 48%)",
            }}
          />
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="glass-chip rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-accent)]">
                Creative Archive
              </span>
              <span className="glass-chip rounded-full border px-3 py-1 text-[11px] font-medium text-[var(--glass-text-muted)]">
                {activeTab === "gallery" ? "实验展示" : "创意作品"}
              </span>
            </div>

            <h1 className={cn("mb-2 text-3xl font-bold text-[var(--paper-foreground)]")} style={{ fontFamily: "var(--font-ui-display)" }}>
              {t("works.title")}
            </h1>
            <p className="max-w-3xl text-lg text-[var(--glass-text-muted)]">
              {t("works.description")}
            </p>
          </div>
        </section>

        {/* Sub-module Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={SUB_MODULE_TABS}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>

        {/* Works Grid */}
        {activeTab === "gallery" && (
          <WorksGrid
            works={works}
            emptyMessage={t("works.noWorks")}
            from="gallery"
          />
        )}

        {activeTab === "showcase" && (
          <>
            <CulturalShowcase />
          </>
        )}
      </main>
    </div>
  );
}

export default ExperimentsPage;
