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
            "glass-panel text-center py-16 rounded-[2rem] border border-dashed",
            theme === "dark" ? "border-slate-700/70" : "border-sky-200/70"
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
              "mb-2 text-lg text-[var(--paper-foreground)]"
            )}
          >
            {emptyMessage}
          </p>
          {emptyHint && (
            <p className="text-sm text-[var(--glass-text-muted)]">
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
            "glass-panel mt-8 rounded-[1.75rem] border p-6 text-center"
          )}
        >
          <h3
            className={cn(
              "mb-2 text-lg font-semibold text-[var(--paper-foreground)]"
            )}
          >
            {cta.title}
          </h3>
          <p className="mb-4 text-sm text-[var(--glass-text-muted)]">
            {cta.description}
          </p>
          <button
            onClick={cta.onButtonClick}
            className={cn(
              "glass-button glass-button-primary rounded-full px-6 py-2 font-medium"
            )}
          >
            {cta.buttonText}
          </button>
        </div>
      )}
    </>
  );
}
