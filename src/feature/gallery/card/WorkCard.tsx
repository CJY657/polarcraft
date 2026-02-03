import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";
import { Eye, Heart, Users } from "lucide-react";
import type { GalleryWork } from "@/data/gallery";

interface WorkCardProps {
  work: GalleryWork;
  onClick: () => void;
}

export function WorkCard({ work, onClick }: WorkCardProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1",
        theme === "dark"
          ? "bg-slate-800/50 border-2 border-slate-700 hover:border-slate-500 hover:shadow-xl hover:shadow-purple-500/10"
          : "bg-white shadow-sm hover:shadow-lg border-2 border-transparent hover:border-purple-200"
      )}
    >
      {/* 封面图 */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={work.coverImage}
          alt={work.title[i18n.language] || work.title["zh-CN"]}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // 使用占位符如果图片加载失败
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23cbd5e1' width='400' height='300'/%3E%3Ctext fill='%2364748b' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle'%3E暂无封面%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      {/* 内容 */}
      <div className="p-5">
        {/* 标题 */}
        <h3
          className={cn(
            "text-lg font-bold mb-2 line-clamp-2",
            theme === "dark" ? "text-white" : "text-gray-900"
          )}
        >
          {work.title[i18n.language] || work.title["zh-CN"]}
        </h3>

        {/* 副标题/团队 */}
        {work.subtitle && (
          <p
            className={cn(
              "text-xs mb-2",
              theme === "dark" ? "text-gray-500" : "text-gray-400"
            )}
          >
            {work.subtitle[i18n.language] || work.subtitle["zh-CN"]}
          </p>
        )}

        {/* 描述 */}
        <p
          className={cn(
            "text-sm mb-4 line-clamp-2",
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          )}
        >
          {work.description[i18n.language] || work.description["zh-CN"]}
        </p>

        {/* 作者 */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-gray-500" />
          <span
            className={cn(
              "text-xs",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            {work.authors.map((a) => a.name[i18n.language] || a.name["zh-CN"]).join(", ")}
          </span>
        </div>

        {/* 统计 */}
        <div className="flex items-center gap-4 text-xs">
          <div
            className={cn(
              "flex items-center gap-1",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{work.views}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1",
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{work.likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
