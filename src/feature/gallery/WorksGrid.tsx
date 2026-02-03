/**
 * WorksGrid - Shared component for displaying work cards
 * 作品网格 - 共享组件，用于展示作品卡片
 */

import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { WorkCard } from "./card";
import type { GalleryWork } from "@/data/gallery";
import { ImageIcon } from "lucide-react";

interface WorksGridProps {
  works: GalleryWork[];
  emptyMessage?: string;
  emptyHint?: string;
  showCta?: boolean;
  from?: "gallery" | "lab";
  cta?: {
    title: string;
    description: string;
    buttonText: string;
    onButtonClick: () => void;
  };
}

export function WorksGrid({
  works,
  emptyMessage,
  emptyHint,
  showCta = false,
  from = "gallery",
  cta,
}: WorksGridProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleCardClick = (workId: string) => {
    navigate(`/gallery/work/${workId}`, { state: { from } });
  };

  return (
    <>
      {works.length === 0 ? (
        <div
          className={cn(
            "text-center py-16 rounded-2xl border-2 border-dashed",
            theme === "dark"
              ? "bg-slate-800/30 border-slate-700"
              : "bg-gray-50 border-gray-300"
          )}
        >
          <ImageIcon
            className={cn(
              "w-16 h-16 mx-auto mb-4",
              theme === "dark" ? "text-gray-600" : "text-gray-300"
            )}
          />
          <p
            className={cn(
              "text-lg mb-2",
              theme === "dark" ? "text-gray-400" : "text-gray-500"
            )}
          >
            {emptyMessage}
          </p>
          {emptyHint && (
            <p
              className={cn("text-sm", theme === "dark" ? "text-gray-500" : "text-gray-400")}
            >
              {emptyHint}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {works.map((work) => (
            <WorkCard
              key={work.id}
              work={work}
              onClick={() => handleCardClick(work.id)}
            />
          ))}
        </div>
      )}

      {/* CTA Card */}
      {showCta && cta && works.length === 0 && (
        <div
          className={cn(
            "mt-8 p-6 rounded-xl text-center",
            theme === "dark"
              ? "bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-2 border-purple-500/30"
              : "bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200"
          )}
        >
          <h3
            className={cn(
              "text-lg font-semibold mb-2",
              theme === "dark" ? "text-white" : "text-gray-900"
            )}
          >
            {cta.title}
          </h3>
          <p className={cn("text-sm mb-4", theme === "dark" ? "text-gray-400" : "text-gray-600")}>
            {cta.description}
          </p>
          <button
            onClick={cta.onButtonClick}
            className={cn(
              "px-6 py-2 rounded-lg font-medium transition-colors",
              "bg-purple-600 text-white hover:bg-purple-700"
            )}
          >
            {cta.buttonText}
          </button>
        </div>
      )}
    </>
  );
}
