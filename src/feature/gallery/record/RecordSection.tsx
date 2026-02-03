import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";
import { Calendar } from "lucide-react";
import type { RecordEntry } from "@/data/gallery";

interface RecordSectionProps {
  entries: RecordEntry[];
}

export function RecordSection({ entries }: RecordSectionProps) {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();

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
        {t("works.record.title")}
      </h2>

      <div className="relative">
        {/* 时间线 */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500" />

        <div className="space-y-8">
          {entries.map((entry, index) => (
            <div key={entry.id} className="relative pl-12">
              {/* 时间点 */}
              <div
                className={cn(
                  "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  "bg-purple-600 text-white"
                )}
              >
                {index + 1}
              </div>

              {/* 记录内容 */}
              <div
                className={cn(
                  "rounded-xl p-5",
                  theme === "dark" ? "bg-slate-700/50" : "bg-gray-50"
                )}
              >
                {/* 日期 */}
                <div className="flex items-center gap-2 text-sm mb-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span
                    className={cn(
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    )}
                  >
                    {entry.date}
                  </span>
                </div>

                {/* 标题 */}
                <h3
                  className={cn(
                    "text-lg font-semibold mb-3",
                    theme === "dark" ? "text-white" : "text-gray-900"
                  )}
                >
                  {entry.title[i18n.language] || entry.title["zh-CN"]}
                </h3>

                {/* 内容 */}
                <p
                  className={cn(
                    "mb-4 leading-relaxed whitespace-pre-line",
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  )}
                >
                  {entry.content}
                </p>

                {/* 图片 */}
                {entry.images && entry.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {entry.images.map((img, idx) => (
                      <div key={idx} className="group">
                        <img
                          src={img.url}
                          alt={img.caption?.[i18n.language] || img.caption?.["zh-CN"] || `Record ${idx + 1}`}
                          className="rounded-lg object-contain w-full aspect-auto hover:scale-105 transition-transform cursor-pointer"
                        />
                        {img.caption && (
                          <p
                            className={cn(
                              "text-xs mt-1.5 text-center",
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            )}
                          >
                            {img.caption[i18n.language] || img.caption["zh-CN"]}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
