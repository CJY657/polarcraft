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
import { PersistentHeader } from "@/components/shared";
import { WorksGrid } from "@/feature/gallery";
import { getPublicWorks } from "@/data/gallery";

export function ExperimentsPage() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Get public works
  const works = getPublicWorks();

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#f0f9ff]"
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
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            {t("works.title")}
          </h1>
          <p className={cn("text-lg", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
            {t("works.description")}
          </p>
        </div>

        {/* Works Grid */}
        <WorksGrid works={works} emptyMessage={t("works.noWorks")} from="gallery" />
      </main>
    </div>
  );
}

export default ExperimentsPage;
