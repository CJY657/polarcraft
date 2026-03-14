import { BookOpenText, Clock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";

const SECTION_ITEMS = [
  {
    id: "experiments",
    path: "/experiments",
    label: { "zh-CN": "实验内容", "en-US": "Experiments" },
    icon: BookOpenText,
  },
  {
    id: "timeline",
    path: "/chronicles",
    label: { "zh-CN": "历史时间线", "en-US": "Timeline" },
    icon: Clock,
  },
];

function isSectionActive(currentPath: string, targetPath: string) {
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export function LearningSectionNav({ className }: { className?: string }) {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const isZh = i18n.language !== "en-US";

  return (
    <div
      className={cn(
        "inline-flex w-fit flex-wrap gap-2 rounded-full border p-1.5",
        theme === "dark"
          ? "border-slate-800 bg-slate-900"
          : "border-slate-200 bg-slate-50",
        className,
      )}
    >
      {SECTION_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isSectionActive(location.pathname, item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-[#1d4ed8] text-white"
                : theme === "dark"
                  ? "text-slate-300 hover:bg-slate-800"
                  : "text-slate-600 hover:bg-white",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label[isZh ? "zh-CN" : "en-US"]}</span>
          </Link>
        );
      })}
    </div>
  );
}
