import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";
import { FileText, Image, Video, File, Download } from "lucide-react";
import type { GalleryMedia, GalleryMediaType } from "@/data/gallery";

interface MediaGalleryProps {
  media: GalleryMedia[];
}

function getMediaTypeConfig(t: (key: string) => string): Record<
  GalleryMediaType,
  { icon: React.ReactNode; color: string; label: string }
> {
  return {
    image: { icon: <Image className="w-5 h-5" />, color: "bg-green-500", label: t("works.media.types.image") },
    video: { icon: <Video className="w-5 h-5" />, color: "bg-blue-500", label: t("works.media.types.video") },
    pdf: { icon: <FileText className="w-5 h-5" />, color: "bg-red-500", label: t("works.media.types.pdf") },
    pptx: { icon: <FileText className="w-5 h-5" />, color: "bg-orange-500", label: t("works.media.types.pptx") },
    docx: { icon: <FileText className="w-5 h-5" />, color: "bg-blue-600", label: t("works.media.types.docx") },
    markdown: { icon: <FileText className="w-5 h-5" />, color: "bg-gray-600", label: t("works.media.types.markdown") },
    matlab: { icon: <File className="w-5 h-5" />, color: "bg-yellow-600", label: t("works.media.types.matlab") },
    other: { icon: <File className="w-5 h-5" />, color: "bg-gray-500", label: t("works.media.types.other") },
  };
}

export function MediaGallery({ media }: MediaGalleryProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const mediaTypeConfig = getMediaTypeConfig(t);

  const handleDownload = async (mediaItem: GalleryMedia) => {
    try {
      // 从 URL 中提取文件名
      const fileName = mediaItem.url.split("/").pop() || "download";

      // 创建一个隐藏的 <a> 标签来触发下载
      const link = document.createElement("a");
      link.href = mediaItem.url;
      link.download = fileName;
      link.style.display = "none";

      // 对于跨域资源，尝试使用 fetch 下载
      try {
        const response = await fetch(mediaItem.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;

        document.body.appendChild(link);
        link.click();

        // 清理
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      } catch {
        // 如果 fetch 失败，回退到直接打开链接
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("下载失败:", error);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6",
        theme === "dark" ? "bg-slate-800/50" : "bg-white"
      )}
    >
      <h2
        className={cn(
          "text-xl font-bold mb-6",
          theme === "dark" ? "text-white" : "text-gray-900"
        )}
      >
        {t("works.media.title")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {media.map((mediaItem) => {
          const config = mediaTypeConfig[mediaItem.type];
          const title = mediaItem.title[i18n.language] || mediaItem.title["zh-CN"];
          const description =
            mediaItem.description?.[i18n.language] || mediaItem.description?.["zh-CN"];

          return (
            <div
              key={mediaItem.id}
              className={cn(
                "rounded-xl p-4 border-2 transition-all hover:shadow-lg",
                theme === "dark"
                  ? "bg-slate-700/30 border-slate-600 hover:border-slate-500"
                  : "bg-gray-50 border-gray-200 hover:border-purple-200"
              )}
            >
              {/* 媒体预览/图标 */}
              <div className="flex items-start gap-4">
                {/* 类型图标 */}
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0",
                    config.color
                  )}
                >
                  {config.icon}
                </div>

                {/* 信息 */}
                <div className="flex-1 min-w-0">
                  {/* 标题 */}
                  <h3
                    className={cn(
                      "font-semibold mb-1 truncate",
                      theme === "dark" ? "text-white" : "text-gray-900"
                    )}
                  >
                    {title}
                  </h3>

                  {/* 描述 */}
                  {description && (
                    <p
                      className={cn(
                        "text-sm mb-2 line-clamp-2",
                        theme === "dark" ? "text-gray-400" : "text-gray-600"
                      )}
                    >
                      {description}
                    </p>
                  )}

                  {/* 元数据 */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className={cn("px-2 py-1 rounded-full", config.color + " text-white")}>
                      {config.label}
                    </span>
                    {mediaItem.duration && <span>{formatDuration(mediaItem.duration)}</span>}
                    {mediaItem.fileSize && <span>{formatFileSize(mediaItem.fileSize)}</span>}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="mt-4 flex gap-2">
                {mediaItem.type === "image" ? (
                  <button
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                      "bg-purple-600 text-white hover:bg-purple-700"
                    )}
                    onClick={() => {
                      /* TODO: 打开图片查看器 */
                    }}
                  >
                    {t("works.media.viewImage")}
                  </button>
                ) : mediaItem.type === "video" ? (
                  <button
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                      "bg-purple-600 text-white hover:bg-purple-700"
                    )}
                    onClick={() => {
                      /* TODO: 播放视频 */
                    }}
                  >
                    {t("works.media.playVideo")}
                  </button>
                ) : (
                  <button
                    className={cn(
                      "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                      theme === "dark"
                        ? "bg-slate-600 text-white hover:bg-slate-500"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    )}
                    onClick={() => window.open(mediaItem.url, "_blank")}
                  >
                    {t("works.media.openFile")}
                  </button>
                )}
                <button
                  className={cn(
                    "py-2 px-4 rounded-lg text-sm transition-colors flex items-center gap-1",
                    theme === "dark"
                      ? "bg-slate-600 text-white hover:bg-slate-500"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  )}
                  onClick={() => handleDownload(mediaItem)}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
