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
import { courseApi, type Course } from "@/lib/course.service";
import {
  GALLERY_RESULT_LABELS,
  GALLERY_RESULT_TAGS,
  isGalleryResultCourse,
  mapCourseToGalleryWork,
  type GalleryResultTag,
} from "@/feature/gallery/courseResults";
import { FileText, Film, FolderKanban, ImageIcon, Loader2, Presentation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CulturalShowcase } from "@/feature/gallery/CulturalShowcase";
import type { GalleryWork } from "@/data/gallery";

type TabId = "gallery" | GalleryResultTag | "showcase";
const VALID_TABS: TabId[] = ["gallery", ...GALLERY_RESULT_TAGS, "showcase"];

const SUB_MODULE_TABS = [
  {
    id: "gallery",
    label: { "zh-CN": "全部成果" },
    icon: <ImageIcon className="w-4 h-4" />,
  },
  {
    id: "student_ppt",
    label: GALLERY_RESULT_LABELS.student_ppt,
    icon: <Presentation className="w-4 h-4" />,
  },
  {
    id: "student_poster",
    label: GALLERY_RESULT_LABELS.student_poster,
    icon: <FileText className="w-4 h-4" />,
  },
  {
    id: "student_project",
    label: GALLERY_RESULT_LABELS.student_project,
    icon: <FolderKanban className="w-4 h-4" />,
  },
  { id: "showcase", label: { "zh-CN": "创意作品" }, icon: <Film className="w-4 h-4" /> },
];

export function ExperimentsPage() {
  const { t } = useTranslation();
  const { tabId } = useParams<{ tabId?: string }>();
  const navigate = useNavigate();
  const [resultCourses, setResultCourses] = useState<Course[]>([]);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState<string | null>(null);

  // Get public works
  const works = getPublicWorks();
  const resultWorks = useMemo(
    () =>
      resultCourses
        .filter(isGalleryResultCourse)
        .sort(
          (left, right) =>
            (left.sortOrder ?? 0) - (right.sortOrder ?? 0) ||
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
        )
        .map(mapCourseToGalleryWork),
    [resultCourses],
  );

  const getActiveTab = (): TabId => {
    if (tabId && VALID_TABS.includes(tabId as TabId)) {
      return tabId as TabId;
    }
    return "gallery";
  };

  const [activeTab, setActiveTab] = useState<TabId>(getActiveTab());

  useEffect(() => {
    let isCancelled = false;

    setIsResultsLoading(true);
    setResultsError(null);

    courseApi
      .getPublicCourses()
      .then((courses) => {
        if (isCancelled) {
          return;
        }

        setResultCourses(courses);
        setIsResultsLoading(false);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setResultCourses([]);
        setResultsError(error instanceof Error ? error.message : "成果加载失败");
        setIsResultsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleTabChange = (newTabId: string) => {
    const tab = newTabId as TabId;
    setActiveTab(tab);
    navigate(`/gallery/${tab}`);
  };

  const getVisibleWorks = (): GalleryWork[] => {
    if (activeTab === "gallery") {
      return [...resultWorks, ...works];
    }

    if (activeTab === "student_project") {
      return [
        ...resultWorks.filter((work) => work.id.startsWith("course:student_project:")),
        ...works,
      ];
    }

    if (activeTab === "student_ppt" || activeTab === "student_poster") {
      return resultWorks.filter((work) => work.id.startsWith(`course:${activeTab}:`));
    }

    return [];
  };

  const handleWorkClick = (work: GalleryWork) => {
    navigate(`/gallery/work/${work.id}`, { state: { from: "gallery", work } });
  };

  const visibleWorks = getVisibleWorks();

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

        {activeTab !== "showcase" && (
          <div className="space-y-4">
            {isResultsLoading && (
              <div className="glass-panel flex items-center gap-2 rounded-[1.5rem] px-4 py-3 text-sm text-[var(--glass-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                成果加载中
              </div>
            )}
            {resultsError && (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {resultsError}
              </div>
            )}
            <WorksGrid
              works={visibleWorks}
              emptyMessage={t("works.noWorks")}
              from="gallery"
              onWorkClick={handleWorkClick}
            />
          </div>
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
