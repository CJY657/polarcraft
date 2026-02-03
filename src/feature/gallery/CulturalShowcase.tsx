/**
 * Cultural Showcase Component (文创展示组件)
 * Displays cultural creative polarization art with secure video playback
 */

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { SecureImageViewer } from "@/components/shared";
import {
  CULTURAL_SERIES,
  getMediaBySeries,
  getFeaturedMedia,
  type CulturalMedia,
  type CulturalSeries,
} from "@/data/cultural-creations";
import {
  Play,
  Image as ImageIcon,
  Video,
  X,
  Palette,
  Star,
  Grid3X3,
  List,
} from "lucide-react";

// ===== Series Card Component =====
interface SeriesCardProps {
  series: CulturalSeries;
  onClick: () => void;
}

function SeriesCard({ series, onClick }: SeriesCardProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const description = series.description[lang] || series.description["zh-CN"];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
        "hover:scale-[1.02] hover:-translate-y-1",
        theme === "dark"
          ? "bg-slate-800/50 border border-slate-700 hover:border-pink-500/50 hover:shadow-[0_10px_40px_rgba(236,72,153,0.2)]"
          : "bg-white border border-gray-200 hover:border-pink-400 hover:shadow-xl",
      )}
    >
      {/* Thumbnail - 4:3 aspect ratio for larger preview */}
      <div
        className={cn(
          "aspect-[4/3] relative overflow-hidden",
          theme === "dark" ? "bg-slate-900" : "bg-gray-100",
        )}
      >
        <SecureImageViewer
          src={series.thumbnail}
          alt={series.name[lang] || series.name["zh-CN"]}
          className="w-full h-full"
          objectFit="cover"
          showLoading={true}
        />
        {/* Overlay gradient */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          )}
        />
        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-300",
              "bg-pink-500/90 backdrop-blur-sm shadow-lg",
            )}
          >
            <Play
              className="w-7 h-7 text-white ml-0.5"
              fill="white"
            />
          </div>
        </div>
        {/* Media count badge */}
        <div
          className={cn(
            "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium",
            "bg-black/60 text-white backdrop-blur-sm",
          )}
        >
          {series.mediaCount} {lang === "zh-CN" ? "个媒体" : "items"}
        </div>
      </div>

      {/* Info - improved text display */}
      <div className="p-4">
        <h3
          className={cn(
            "font-semibold text-base mb-2 group-hover:text-pink-500 transition-colors",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
        >
          {series.name[lang] || series.name["zh-CN"]}
        </h3>
        {/* Description with tooltip for long text */}
        <p
          className={cn(
            "text-sm line-clamp-3",
            theme === "dark" ? "text-gray-400" : "text-gray-600",
          )}
          title={description}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

// ===== Media Item Card =====
interface MediaCardProps {
  media: CulturalMedia;
  onClick: () => void;
  viewMode?: "grid" | "list";
}

function MediaCard({ media, onClick, viewMode = "grid" }: MediaCardProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const isVideo = media.type === "video";

  if (viewMode === "list") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors",
          theme === "dark" ? "hover:bg-slate-700/50" : "hover:bg-gray-100",
        )}
      >
        {/* Thumbnail - 16:9 aspect ratio to match source images */}
        <div className="w-28 aspect-video rounded-lg overflow-hidden flex-shrink-0 relative bg-slate-800">
          <SecureImageViewer
            src={isVideo ? media.thumbnail || "/images/video-placeholder.jpg" : media.path}
            alt={media.name[lang] || media.name["zh-CN"]}
            className="w-full h-full"
            objectFit="cover"
            showLoading={true}
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play
                className="w-6 h-6 text-white"
                fill="white"
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4
            className={cn(
              "font-medium truncate",
              theme === "dark" ? "text-white" : "text-gray-900",
            )}
          >
            {media.name[lang] || media.name["zh-CN"]}
          </h4>
          <p
            className={cn("text-sm truncate", theme === "dark" ? "text-gray-400" : "text-gray-600")}
          >
            {media.description[lang] || media.description["zh-CN"]}
          </p>
        </div>

        {/* Type badge */}
        <div
          className={cn(
            "px-2 py-1 rounded-full text-xs font-medium flex-shrink-0",
            isVideo
              ? theme === "dark"
                ? "bg-pink-500/20 text-pink-400"
                : "bg-pink-100 text-pink-700"
              : theme === "dark"
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-cyan-100 text-cyan-700",
          )}
        >
          {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
        </div>
      </div>
    );
  }

  const name = media.name[lang] || media.name["zh-CN"];
  const description = media.description[lang] || media.description["zh-CN"];

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg",
        theme === "dark"
          ? "bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/50"
          : "bg-white border border-gray-200 hover:border-pink-300 hover:shadow-pink-100",
      )}
    >
      {/* Thumbnail - 4:3 aspect ratio for larger preview */}
      <div
        className={cn(
          "aspect-[4/3] relative overflow-hidden",
          theme === "dark" ? "bg-slate-900" : "bg-gray-100",
        )}
      >
        <SecureImageViewer
          src={isVideo ? media.thumbnail || "/images/video-placeholder.jpg" : media.path}
          alt={name}
          className="w-full h-full"
          objectFit="cover"
          showLoading={true}
        />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors duration-300">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-transform duration-300",
                "bg-white/90 group-hover:scale-110 shadow-lg",
              )}
            >
              <Play
                className="w-6 h-6 text-pink-500 ml-0.5"
                fill="currentColor"
              />
            </div>
          </div>
        )}
        {/* Featured badge */}
        {media.featured && (
          <div className="absolute top-2 left-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow" />
          </div>
        )}
        {/* Type badge */}
        <div
          className={cn(
            "absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium",
            "bg-black/60 text-white backdrop-blur-sm",
          )}
        >
          {isVideo ? "VIDEO" : "IMG"}
        </div>
      </div>

      {/* Info - improved text display with title tooltip */}
      <div className="p-3">
        <h4
          className={cn(
            "text-sm font-medium mb-1",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
          title={name}
        >
          <span className="line-clamp-2">{name}</span>
        </h4>
        {/* Description shown on hover or as subtitle */}
        {description && (
          <p
            className={cn(
              "text-xs line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity",
              theme === "dark" ? "text-gray-400" : "text-gray-500",
            )}
            title={description}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

// ===== Media Modal =====
interface MediaModalProps {
  media: CulturalMedia | null;
  onClose: () => void;
  seriesMedia?: CulturalMedia[];
  onNavigate?: (media: CulturalMedia) => void;
}

function MediaModal({ media, onClose, seriesMedia, onNavigate }: MediaModalProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  if (!media) return null;

  const isVideo = media.type === "video";
  const currentIndex = seriesMedia?.findIndex((m) => m.id === media.id) ?? -1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = seriesMedia && currentIndex < seriesMedia.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Close button - 移到外层 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <X className="w-5 h-5" />
      </button>

      {/* 导航按钮 - 左右两侧 */}
      {canGoPrev && onNavigate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(seriesMedia![currentIndex - 1]);
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}
      {canGoNext && onNavigate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(seriesMedia![currentIndex + 1]);
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* 主内容区 - 自适应尺寸，无黑框 */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-center p-4 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Media content - 完全自适应 */}
        <div className="flex-1 flex items-center justify-center min-h-0 w-full">
          {isVideo ? (
            <video
              src={media.path}
              poster={media.thumbnail}
              className="max-w-full max-h-[calc(100vh-200px)] w-auto h-auto rounded-lg shadow-2xl"
              autoPlay
              loop
              muted
              playsInline
              controls
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <img
              src={media.path}
              alt={media.name[lang] || media.name["zh-CN"]}
              className="max-w-full max-h-[calc(100vh-200px)] w-auto h-auto object-contain rounded-lg shadow-2xl"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          )}
        </div>

        {/* Info panel - 底部信息栏 */}
        <div className="w-full max-w-2xl mt-4 p-4 bg-slate-900/90 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {media.name[lang] || media.name["zh-CN"]}
              </h3>
              <p className="text-sm mt-1 text-gray-300">
                {media.description[lang] || media.description["zh-CN"]}
              </p>
            </div>
            <div
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0",
                media.polarizationSystem === "crossed"
                  ? "bg-purple-500/20 text-purple-300"
                  : media.polarizationSystem === "parallel"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "bg-gray-500/20 text-gray-300",
              )}
            >
              {media.polarizationSystem === "crossed"
                ? lang === "zh-CN"
                  ? "正交偏振"
                  : "Crossed"
                : media.polarizationSystem === "parallel"
                  ? lang === "zh-CN"
                    ? "平行偏振"
                    : "Parallel"
                  : lang === "zh-CN"
                    ? "正视图"
                    : "Front View"}
            </div>
          </div>

          {/* Navigation indicator */}
          {seriesMedia && seriesMedia.length > 1 && (
            <div className="flex items-center justify-center mt-3 pt-3 border-t border-slate-700/50">
              <span className="text-sm text-gray-400">
                {currentIndex + 1} / {seriesMedia.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Series Detail View =====
interface SeriesDetailProps {
  series: CulturalSeries;
  onBack: () => void;
}

function SeriesDetail({ series, onBack }: SeriesDetailProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [selectedMedia, setSelectedMedia] = useState<CulturalMedia | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<"all" | "image" | "video">("all");

  const media = useMemo(() => {
    const seriesMedia = getMediaBySeries(series.id);
    if (filterType === "all") return seriesMedia;
    return seriesMedia.filter((m) => m.type === filterType);
  }, [series.id, filterType]);

  const allSeriesMedia = useMemo(() => getMediaBySeries(series.id), [series.id]);

  return (
    <>
      {/* Back button & header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            theme === "dark"
              ? "bg-slate-800 text-gray-300 hover:bg-slate-700 hover:text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900",
          )}
        >
          ← {lang === "zh-CN" ? "返回" : "Back"}
        </button>
        <div className="flex-1">
          <h2
            className={cn("text-xl font-bold", theme === "dark" ? "text-white" : "text-gray-900")}
          >
            {series.name[lang] || series.name["zh-CN"]}
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Type filter */}
        <div className="flex items-center gap-2">
          {(["all", "image", "video"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                filterType === type
                  ? theme === "dark"
                    ? "bg-pink-500/20 text-pink-400 border border-pink-500/50"
                    : "bg-pink-100 text-pink-700 border border-pink-300"
                  : theme === "dark"
                    ? "bg-slate-800 text-gray-400 hover:text-gray-200"
                    : "bg-gray-100 text-gray-600 hover:text-gray-900",
              )}
            >
              {type === "all" && <>{lang === "zh-CN" ? "全部" : "All"}</>}
              {type === "image" && (
                <>
                  <ImageIcon className="w-3.5 h-3.5" />
                  {lang === "zh-CN" ? "图片" : "Images"}
                </>
              )}
              {type === "video" && (
                <>
                  <Video className="w-3.5 h-3.5" />
                  {lang === "zh-CN" ? "视频" : "Videos"}
                </>
              )}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "grid"
                ? theme === "dark"
                  ? "bg-slate-700 text-white"
                  : "bg-gray-200 text-gray-900"
                : theme === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900",
            )}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "list"
                ? theme === "dark"
                  ? "bg-slate-700 text-white"
                  : "bg-gray-200 text-gray-900"
                : theme === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-500 hover:text-gray-900",
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Media grid/list */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onClick={() => setSelectedMedia(item)}
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            "rounded-xl border divide-y",
            theme === "dark"
              ? "bg-slate-800/50 border-slate-700 divide-slate-700"
              : "bg-white border-gray-200 divide-gray-200",
          )}
        >
          {media.map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onClick={() => setSelectedMedia(item)}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* Media modal */}
      <MediaModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        seriesMedia={allSeriesMedia}
        onNavigate={setSelectedMedia}
      />
    </>
  );
}

// ===== Main Cultural Showcase Component =====
export function CulturalShowcase() {
  const { theme } = useTheme();
  const { i18n } = useTranslation();
  const lang = i18n.language;

  const [selectedSeries, setSelectedSeries] = useState<CulturalSeries | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<CulturalMedia | null>(null);

  const featuredMedia = useMemo(() => getFeaturedMedia(), []);

  // If a series is selected, show its detail view
  if (selectedSeries) {
    return (
      <SeriesDetail
        series={selectedSeries}
        onBack={() => setSelectedSeries(null)}
      />
    );
  }

  return (
    <>
      {/* Featured Media Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Star
            className={cn("w-5 h-5", theme === "dark" ? "text-yellow-400" : "text-yellow-500")}
          />
          <h3
            className={cn(
              "text-lg font-semibold",
              theme === "dark" ? "text-white" : "text-gray-900",
            )}
          >
            {lang === "zh-CN" ? "精选作品" : "Featured Works"}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featuredMedia.slice(0, 8).map((item) => (
            <MediaCard
              key={item.id}
              media={item}
              onClick={() => setSelectedMedia(item)}
              viewMode="grid"
            />
          ))}
        </div>
      </div>

      {/* Series Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Palette
            className={cn("w-5 h-5", theme === "dark" ? "text-pink-400" : "text-pink-500")}
          />
          <h3
            className={cn(
              "text-lg font-semibold",
              theme === "dark" ? "text-white" : "text-gray-900",
            )}
          >
            {lang === "zh-CN" ? "作品系列" : "Art Series"}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CULTURAL_SERIES.map((series) => (
            <SeriesCard
              key={series.id}
              series={series}
              onClick={() => setSelectedSeries(series)}
            />
          ))}
        </div>
      </div>

      {/* Media Modal */}
      <MediaModal
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
      />
    </>
  );
}
