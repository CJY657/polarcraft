import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { ChevronLeft, Eye, Heart, Share2, Calendar } from "lucide-react";
import { getWorkById } from "@/data/gallery";
import { RecordSection } from "../record/RecordSection";
import { MediaGallery } from "../media/MediaGallery";
import { PersistentHeader } from "@/components/shared";

type DetailTab = "overview" | "record" | "media";

export function WorkDetailPage() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [liked, setLiked] = useState(false);

  const work = workId ? getWorkById(workId) : null;

  // Determine back route based on navigation state or work status
  const from =
    (location.state as { from?: "gallery" | "lab" })?.from ??
    (work?.status === "public" ? "gallery" : "lab");
  const backRoute = from === "lab" ? "/lab" : "/gallery";

  if (!work) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className={cn(
            "text-center p-8 rounded-2xl",
            theme === "dark" ? "bg-slate-800/50" : "bg-white",
          )}
        >
          <p className={cn("text-lg mb-4", theme === "dark" ? "text-gray-300" : "text-gray-600")}>
            {t("works.noWorks")}
          </p>
          <button
            onClick={() => navigate(backRoute)}
            className={cn("px-6 py-2 rounded-lg", "bg-purple-600 text-white hover:bg-purple-700")}
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  // 动态生成标签页
  const tabs = [
    { id: "overview" as const, label: { "zh-CN": t("works.tabs.overview") } },
    ...(work.recordEntries?.length
      ? [
          {
            id: "record" as const,
            label: { "zh-CN": t("works.tabs.recordCount", { count: work.recordEntries.length }) },
          },
        ]
      : []),
    ...(work.mediaResources?.length
      ? [
          {
            id: "media" as const,
            label: { "zh-CN": t("works.tabs.mediaCount", { count: work.mediaResources.length }) },
          },
        ]
      : []),
  ];

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: work.title[i18n.language] || work.title["zh-CN"],
        text: work.description[i18n.language] || work.description["zh-CN"],
        url: window.location.href,
      });
    }
  };

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]",
      )}
    >
      <PersistentHeader
        className={cn("sticky top-0 z-50", theme === "dark" ? "bg-slate-900/80" : "bg-white/80")}
      />

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 backdrop-blur-lg border-b">
        <div
          className={cn(
            theme === "dark" ? "bg-slate-900/80 border-slate-700" : "bg-white/80 border-gray-200",
          )}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* 返回按钮 */}
            <button
              onClick={() => navigate(backRoute)}
              className={cn(
                "inline-flex items-center gap-2 mb-4 text-sm transition-colors",
                theme === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{t("works.back")}</span>
            </button>

            {/* 作品头部信息 */}
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* 封面图 */}
              <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={work.coverImage}
                  alt={work.title[i18n.language] || work.title["zh-CN"]}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='192'%3E%3Crect fill='%23cbd5e1' width='256' height='192'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='16' x='50%25' y='50%25' text-anchor='middle'%3E暂无封面%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>

              {/* 作品信息 */}
              <div className="flex-1">
                {/* 标题和副标题 */}
                <h1
                  className={cn(
                    "text-2xl md:text-3xl font-bold mb-2",
                    theme === "dark" ? "text-white" : "text-gray-900",
                  )}
                >
                  {work.title[i18n.language] || work.title["zh-CN"]}
                </h1>

                {work.subtitle && (
                  <p
                    className={cn(
                      "text-sm mb-3",
                      theme === "dark" ? "text-gray-400" : "text-gray-500",
                    )}
                  >
                    {work.subtitle[i18n.language] || work.subtitle["zh-CN"]}
                  </p>
                )}

                {/* 作者信息 */}
                <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn(theme === "dark" ? "text-gray-400" : "text-gray-500")}>
                      {t("works.authors")}:
                    </span>
                    <span className={cn(theme === "dark" ? "text-gray-300" : "text-gray-700")}>
                      {work.authors.map((a) => a.name[i18n.language] || a.name["zh-CN"]).join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={cn(theme === "dark" ? "text-gray-400" : "text-gray-500")}>
                      {new Date(work.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLike}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
                      liked
                        ? "bg-red-100 text-red-600 hover:bg-red-200"
                        : theme === "dark"
                          ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                    <span>{liked ? work.likes + 1 : work.likes}</span>
                  </button>

                  <button
                    onClick={handleShare}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
                      theme === "dark"
                        ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                    )}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{t("works.actions.share")}</span>
                  </button>

                  <div
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                      theme === "dark" ? "bg-slate-700 text-gray-400" : "bg-gray-100 text-gray-500",
                    )}
                  >
                    <Eye className="w-4 h-4" />
                    <span>{t("works.actions.viewCount", { count: work.views })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 标签页 */}
            <div className="max-w-7xl mx-auto px-0 pb-4 mt-6">
              <div
                className={cn(
                  "flex gap-1 p-1 rounded-lg overflow-x-auto",
                  theme === "dark" ? "bg-slate-800" : "bg-gray-100",
                )}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                      activeTab === tab.id
                        ? theme === "dark"
                          ? "bg-slate-700 text-white"
                          : "bg-white text-gray-900 shadow-sm"
                        : theme === "dark"
                          ? "text-gray-400 hover:text-gray-300"
                          : "text-gray-600 hover:text-gray-900",
                    )}
                  >
                    {(tab.label as Record<string, string>)[i18n.language] || tab.label["zh-CN"]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div className={cn("rounded-2xl p-6", theme === "dark" ? "bg-slate-800/50" : "bg-white")}>
            <h2
              className={cn(
                "text-xl font-bold mb-4",
                theme === "dark" ? "text-white" : "text-gray-900",
              )}
            >
              {t("works.overview.title")}
            </h2>
            <p
              className={cn(
                "mb-6 leading-relaxed whitespace-pre-line",
                theme === "dark" ? "text-gray-300" : "text-gray-700",
              )}
            >
              {work.description[i18n.language] || work.description["zh-CN"]}
            </p>

            {/* 画廊预览 */}
            {work.gallery && work.gallery.length > 0 && (
              <div>
                <h3
                  className={cn(
                    "text-lg font-semibold mb-4",
                    theme === "dark" ? "text-white" : "text-gray-900",
                  )}
                >
                  {t("works.overview.projectShowcase")}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {work.gallery.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="rounded-lg object-contain w-full aspect-auto hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => {
                        /* TODO: 打开图片查看器 */
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "record" && work.recordEntries && (
          <RecordSection entries={work.recordEntries} />
        )}

        {activeTab === "media" && work.mediaResources && (
          <MediaGallery media={work.mediaResources} />
        )}
      </main>
    </div>
  );
}
