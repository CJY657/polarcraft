/**
 * Gallery Page - Student Works Showcase
 * 学生作品展示平台
 *
 * Features:
 * - 作品展示 - Community gallery and works showcase
 * - 详情页 - Work detail with records, discussion, media
 */

import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
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
  const { theme } = useTheme();
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
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0f9ff]",
      )}
    >
      {/* Header with Persistent Logo */}
      <PersistentHeader
        moduleKey="gallery"
        moduleNameKey={t("page.gallery.title")}
        variant="glass"
        className={cn("sticky top-0 z-40", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1
            className={cn(
              "text-3xl font-bold mb-2",
              theme === "dark" ? "text-white" : "text-gray-900",
            )}
          >
            {t("works.title")}
          </h1>
          <p className={cn("text-lg", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
            {t("works.description")}
          </p>
        </div>

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
