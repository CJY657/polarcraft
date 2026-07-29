export const PROJECT_COVER_PLACEHOLDER =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f5f0e0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%236a6a6a" font-size="12" font-family="sans-serif"%3E暂无封面%3C/text%3E%3C/svg%3E';

interface ProjectCoverImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function ProjectCoverImage({ src, alt, className = "" }: ProjectCoverImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src || PROJECT_COVER_PLACEHOLDER}
        alt={alt}
        className="absolute inset-0 block h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={(event) => {
          if (event.currentTarget.dataset.fallbackApplied === "true") {
            return;
          }

          event.currentTarget.dataset.fallbackApplied = "true";
          event.currentTarget.src = PROJECT_COVER_PLACEHOLDER;
        }}
      />
    </div>
  );
}
