/**
 * Secure Video Player Component
 * 安全视频播放器组件
 *
 * Features:
 * - Prevents right-click context menu
 * - Blocks common download keyboard shortcuts
 * - Uses custom controls to hide native controls
 * - Adds transparent overlay to prevent direct video access
 * - Disables drag-and-drop
 * - Prevents iframe embedding (via headers recommendation)
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/utils/classNames'
import { useTheme } from '@/contexts/ThemeContext'
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react'

interface SecureVideoPlayerProps {
  src: string
  poster?: string
  className?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  onEnded?: () => void
}

export function SecureVideoPlayer({
  src,
  poster,
  className,
  autoPlay = false,
  loop = true,
  muted = true,
  onEnded,
}: SecureVideoPlayerProps) {
  const { theme } = useTheme()
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  // Hide controls after inactivity
  useEffect(() => {
    if (!isPlaying) return

    const timer = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isPlaying, showControls])

  // Handle keyboard shortcuts prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common download shortcuts
      if (
        (e.ctrlKey && e.key === 's') ||
        (e.ctrlKey && e.shiftKey && e.key === 's') ||
        (e.key === 'F12')
      ) {
        e.preventDefault()
      }

      // Space to play/pause when focused on container
      if (e.code === 'Space' && document.activeElement === containerRef.current) {
        e.preventDefault()
        togglePlay()
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [])

  // Prevent context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }, [])

  // Prevent drag
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    return false
  }, [])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  // Handle progress update
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const progress = (video.currentTime / video.duration) * 100
    setProgress(progress)
  }, [])

  // Handle video loaded
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    setDuration(video.duration)
  }, [])

  // Handle seek
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    video.currentTime = percentage * video.duration
    setProgress(percentage * 100)
  }, [])

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  // Restart video
  const handleRestart = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = 0
    video.play()
    setIsPlaying(true)
  }, [])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative group rounded-lg overflow-hidden select-none',
        'bg-black',
        className
      )}
      onContextMenu={handleContextMenu}
      onMouseMove={() => setShowControls(true)}
      tabIndex={0}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Video element - hidden controls */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        loop={loop}
        muted={muted}
        playsInline
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onDragStart={handleDragStart}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        style={{
          pointerEvents: 'none',  // Prevent direct interaction
        }}
      />

      {/* Transparent overlay to prevent direct video access */}
      <div
        className="absolute inset-0 z-10"
        onClick={togglePlay}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />

      {/* Play/Pause big button overlay */}
      {!isPlaying && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-110',
            theme === 'dark' ? 'bg-white/20' : 'bg-black/30'
          )}>
            <Play className="w-8 h-8 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300',
          'bg-gradient-to-t from-black/80 to-transparent',
          'px-3 py-2',
          showControls ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Progress bar */}
        <div
          className="h-1 bg-white/30 rounded-full cursor-pointer mb-2 group/progress"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-pink-500 rounded-full relative transition-all"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Restart */}
            <button
              onClick={handleRestart}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label="Restart"
            >
              <RotateCcw className="w-4 h-4 text-white" />
            </button>

            {/* Mute */}
            <button
              onClick={toggleMute}
              className="p-1 hover:bg-white/20 rounded transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>

            {/* Time */}
            <span className="text-xs text-white/80 font-mono">
              {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Watermark overlay (optional) */}
      <div className="absolute top-2 right-2 z-20 pointer-events-none">
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full',
          theme === 'dark' ? 'bg-white/10 text-white/50' : 'bg-black/10 text-white/70'
        )}>
          PolarCraft
        </span>
      </div>
    </div>
  )
}

// Image viewer with protection
interface SecureImageViewerProps {
  src: string
  alt: string
  className?: string
  /** Image fit mode: 'cover' (default, may crop), 'contain' (full image, may have letterboxing) */
  objectFit?: 'cover' | 'contain'
  /** Show loading state */
  showLoading?: boolean
  /** Background color for contain mode letterboxing */
  bgColor?: string
}

export function SecureImageViewer({
  src,
  alt,
  className,
  objectFit = 'cover',
  showLoading = true,
  bgColor,
}: SecureImageViewerProps) {
  const { theme } = useTheme()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    return false
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    return false
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
  }, [])

  // Default background color based on theme and fit mode
  const defaultBgColor = objectFit === 'contain'
    ? (theme === 'dark' ? 'bg-slate-900' : 'bg-gray-100')
    : ''

  return (
    <div
      className={cn(
        'relative select-none overflow-hidden',
        bgColor || defaultBgColor,
        className
      )}
      onContextMenu={handleContextMenu}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {/* Loading skeleton */}
      {showLoading && isLoading && (
        <div className={cn(
          'absolute inset-0 animate-pulse',
          theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'
        )} />
      )}

      {/* Error state */}
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
          'w-full h-full transition-opacity duration-300',
          objectFit === 'contain' ? 'object-contain' : 'object-cover',
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
      {/* Transparent overlay */}
      <div
        className="absolute inset-0"
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      />
      {/* Watermark */}
      <div className="absolute bottom-2 right-2 pointer-events-none">
        <span className={cn(
          'text-[10px] px-2 py-0.5 rounded-full',
          theme === 'dark' ? 'bg-black/30 text-white/50' : 'bg-white/30 text-black/50'
        )}>
          PolarCraft
        </span>
      </div>
    </div>
  )
}
