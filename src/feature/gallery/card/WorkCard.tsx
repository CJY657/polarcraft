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
        "glass-panel-strong group cursor-pointer overflow-hidden rounded-[1.9rem] border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_64px_-34px_rgba(14,42,74,0.3)]",
        theme === "dark" ? "hover:border-sky-300/35" : "hover:border-sky-400/45"
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
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(7,18,34,0.5)] via-transparent to-transparent opacity-80" />
      </div>

      {/* 内容 */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="glass-chip rounded-full border px-3 py-1 text-[11px] font-medium text-[var(--glass-text-muted)]">
            Gallery Item
          </span>
          <span className="text-xs font-medium text-[var(--paper-accent)]">
            {work.views} views
          </span>
        </div>

        {/* 标题 */}
        <h3
          className={cn(
            "mb-2 line-clamp-2 text-lg font-bold text-[var(--paper-foreground)]"
          )}
        >
          {work.title[i18n.language] || work.title["zh-CN"]}
        </h3>

        {/* 副标题/团队 */}
        {work.subtitle && (
          <p
            className={cn(
              "mb-2 text-xs text-[var(--glass-text-muted)]"
            )}
          >
            {work.subtitle[i18n.language] || work.subtitle["zh-CN"]}
          </p>
        )}

        {/* 描述 */}
        <p
          className={cn(
            "mb-4 line-clamp-2 text-sm text-[var(--glass-text-muted)]"
          )}
        >
          {work.description[i18n.language] || work.description["zh-CN"]}
        </p>

        {/* 作者 */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-[var(--glass-text-muted)]" />
          <span
            className={cn(
              "text-xs text-[var(--glass-text-muted)]"
            )}
          >
            {work.authors.map((a) => a.name[i18n.language] || a.name["zh-CN"]).join(", ")}
          </span>
        </div>

        {/* 统计 */}
        <div className="flex items-center gap-4 text-xs">
          <div className="glass-chip flex items-center gap-1 rounded-full border px-3 py-1 text-[var(--glass-text-muted)]">
            <Eye className="w-3.5 h-3.5" />
            <span>{work.views}</span>
          </div>
          <div className="glass-chip flex items-center gap-1 rounded-full border px-3 py-1 text-[var(--glass-text-muted)]">
            <Heart className="w-3.5 h-3.5" />
            <span>{work.likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
