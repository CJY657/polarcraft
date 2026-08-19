import { useState } from 'react'
import { cn } from '@/utils/classNames'
import { useTheme } from '@/contexts/ThemeContext'

interface SecureImageViewerProps {
  src: string
  alt: string
  className?: string
}

export function SecureImageViewer({ src, alt, className }: SecureImageViewerProps) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault()
    return false
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  return (
    <div
      className={cn('relative select-none overflow-hidden', className)}
      onContextMenu={handleContextMenu}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {isLoading && (
        <div className={cn(
          'absolute inset-0 animate-pulse',
          theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
        )} />
      )}

      {hasError && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          theme === 'dark' ? 'bg-slate-800 text-gray-500' : 'bg-gray-100 text-gray-400'
        )}>
          <span className="text-sm">Failed to load image</span>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        className={cn(
          'absolute inset-0 block h-full w-full transition-opacity duration-300',
          'object-cover',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
        onLoad={handleLoad}
        onError={handleError}
        draggable={false}
        loading="lazy"
        decoding="async"
        style={{ pointerEvents: 'none' }}
      />
      <div
        className="absolute inset-0"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full',
          theme === 'dark' ? 'bg-black/30 text-white/50' : 'bg-white/30 text-black/50'
        )}>
          PolariScope
        </span>
      </div>
    </div>
  )
}
