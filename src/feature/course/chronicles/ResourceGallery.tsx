/**
 * ResourceGallery - 可展开的资源画廊
 * 展示与时间线事件相关的实验图片和视频
 * 设计重点：丝滑的展开/收起动画，友好的用户交互
 */

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/utils/classNames'
import { Image, Film, ChevronLeft, ChevronRight, Camera, Beaker, Play, X, Sparkles, Maximize2 } from 'lucide-react'
import { getResourceById, type PolarizationResource } from '@/data/resource-gallery'
import type { TimelineEvent } from '@/data/timeline-events'

export interface ResourceGalleryProps {
  resources: TimelineEvent['experimentalResources']
  isZh: boolean
  theme: 'dark' | 'light'
  compact?: boolean // 紧凑模式用于卡片内展示
}

export function ResourceGallery({ resources, isZh, theme, compact = false }: ResourceGalleryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number>(0)
  const [selectedVideo, setSelectedVideo] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'images' | 'video'>('images')
  const [isHovered, setIsHovered] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Spring animation for smooth interactions
  const scale = useSpring(1, { stiffness: 400, damping: 30 })
  const glow = useSpring(0, { stiffness: 300, damping: 25 })

  useEffect(() => {
    scale.set(isHovered && !isExpanded ? 1.02 : 1)
    glow.set(isHovered ? 1 : 0)
  }, [isHovered, isExpanded, scale, glow])

  if (!resources) return null

  // 获取关联的资源数据
  const linkedResources = resources.resourceIds
    ?.map(id => getResourceById(id))
    .filter((r): r is PolarizationResource => r !== undefined) || []

  // 图片类型定义
  type ImageItem = {
    url: string
    caption: string | undefined
    type: 'featured' | 'sequence' | 'linked'
  }

  // 合并特色图片和资源库图片
  const featuredImgs: ImageItem[] = (resources.featuredImages || []).map(img => ({
    url: img.url,
    caption: isZh ? img.captionZh : img.caption,
    type: 'featured' as const
  }))

  const linkedImgs: ImageItem[] = linkedResources
    .filter(r => r.type === 'image' || r.type === 'sequence')
    .reduce<ImageItem[]>((acc, r) => {
      if (r.type === 'sequence' && r.frames) {
        const sequenceItems: ImageItem[] = r.frames.map(f => ({
          url: f.url,
          caption: isZh ? f.labelZh : f.label,
          type: 'sequence' as const
        }))
        return [...acc, ...sequenceItems]
      }
      return [...acc, {
        url: r.url,
        caption: isZh ? r.titleZh : r.title,
        type: 'linked' as const
      }]
    }, [])

  const allImages: ImageItem[] = [...featuredImgs, ...linkedImgs]

  // 获取视频资源 - 支持多个视频
  type VideoItem = {
    url: string
    title: string | undefined
  }

  // 合并所有视频来源：featuredVideos, featuredVideo, 以及 linkedResources 中的视频
  const allVideos: VideoItem[] = []

  // 优先使用 featuredVideos（多视频数组）
  if (resources.featuredVideos && resources.featuredVideos.length > 0) {
    resources.featuredVideos.forEach(v => {
      allVideos.push({
        url: v.url,
        title: isZh ? v.titleZh : v.title
      })
    })
  } else if (resources.featuredVideo) {
    // 向后兼容：如果没有 featuredVideos，使用单个 featuredVideo
    allVideos.push({
      url: resources.featuredVideo.url,
      title: isZh ? resources.featuredVideo.titleZh : resources.featuredVideo.title
    })
  }

  // 添加 linkedResources 中的视频
  linkedResources.filter(r => r.type === 'video').forEach(r => {
    if (!allVideos.some(v => v.url === r.url)) {
      allVideos.push({
        url: r.url,
        title: isZh ? r.titleZh : r.title
      })
    }
  })

  // 添加 linkedResources 中带有 videoUrl 的资源
  linkedResources.forEach(r => {
    if (r.metadata?.videoUrl && !allVideos.some(v => v.url === r.metadata.videoUrl)) {
      allVideos.push({
        url: r.metadata.videoUrl,
        title: isZh ? r.titleZh : r.title
      })
    }
  })

  const hasVideos = allVideos.length > 0
  const currentVideo = allVideos[selectedVideo] || allVideos[0]
  const videoUrl = currentVideo?.url
  const videoTitle = currentVideo?.title

  const hasContent = allImages.length > 0 || hasVideos

  if (!hasContent) return null

  // 获取预览图（用于折叠状态）
  const previewImage = allImages[0]?.url
  const thumbnails = allImages.slice(0, 4)

  // 紧凑模式 - 用于时间线卡片展开时的内嵌展示
  if (compact) {
    return (
      <motion.div
        ref={containerRef}
        className={cn(
          'mt-3 rounded-xl overflow-hidden border relative',
          theme === 'dark'
            ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-purple-950/40 border-cyan-700/40'
            : 'bg-gradient-to-br from-cyan-50/80 via-white to-purple-50/80 border-cyan-200/80',
          'shadow-lg'
        )}
        style={{ scale }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        layout
      >
        {/* Glow effect */}
        <motion.div
          className={cn(
            'absolute inset-0 rounded-xl pointer-events-none',
            theme === 'dark'
              ? 'bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10'
              : 'bg-gradient-to-r from-cyan-400/5 via-transparent to-purple-400/5'
          )}
          style={{ opacity: useTransform(glow, [0, 1], [0, 1]) }}
        />

        {/* 收起状态的预览卡片 */}
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.stopPropagation()
                setIsExpanded(true)
              }}
              className="w-full text-left relative"
            >
              {/* 预览缩略图区域 */}
              <div className="relative">
                {/* 背景缩略图 */}
                {previewImage && (
                  <div className="relative h-24 overflow-hidden">
                    <motion.img
                      src={previewImage}
                      alt=""
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.1 }}
                      whileHover={{ scale: 1.15 }}
                      transition={{ duration: 0.4 }}
                    />
                    {/* 渐变遮罩 */}
                    <div className={cn(
                      'absolute inset-0',
                      theme === 'dark'
                        ? 'bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent'
                        : 'bg-gradient-to-t from-white via-white/70 to-transparent'
                    )} />

                    {/* 多图预览小方块 */}
                    {thumbnails.length > 1 && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        {thumbnails.slice(1, 4).map((img, i) => (
                          <motion.div
                            key={i}
                            className={cn(
                              'w-8 h-6 rounded overflow-hidden border',
                              theme === 'dark' ? 'border-white/20' : 'border-black/10'
                            )}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                          </motion.div>
                        ))}
                        {allImages.length > 4 && (
                          <motion.div
                            className={cn(
                              'w-8 h-6 rounded flex items-center justify-center text-xs font-medium',
                              theme === 'dark'
                                ? 'bg-black/50 text-white border border-white/20'
                                : 'bg-white/80 text-gray-700 border border-black/10'
                            )}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            +{allImages.length - 4}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* 视频指示器 */}
                    {hasVideos && (
                      <motion.div
                        className={cn(
                          'absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                          theme === 'dark'
                            ? 'bg-purple-500/80 text-white'
                            : 'bg-purple-500 text-white'
                        )}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Play className="w-3 h-3" fill="currentColor" />
                        {allVideos.length > 1
                          ? `${allVideos.length} ${isZh ? '视频' : 'Videos'}`
                          : isZh ? '视频' : 'Video'
                        }
                      </motion.div>
                    )}
                  </div>
                )}

                {/* 底部信息栏 */}
                <div className={cn(
                  'flex items-center justify-between px-3 py-2.5',
                  !previewImage && 'pt-3'
                )}>
                  <div className="flex items-center gap-2">
                    <motion.div
                      className={cn(
                        'p-1.5 rounded-lg',
                        theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-100'
                      )}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Camera className={cn(
                        'w-4 h-4',
                        theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
                      )} />
                    </motion.div>
                    <div>
                      <span className={cn(
                        'text-sm font-medium',
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      )}>
                        {isZh ? '实验资源' : 'Experimental Resources'}
                      </span>
                      <span className={cn(
                        'ml-2 text-xs',
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      )}>
                        {allImages.length} {isZh ? '图' : 'images'}{hasVideos ? ` · ${allVideos.length} ${isZh ? '视频' : allVideos.length > 1 ? 'videos' : 'video'}` : ''}
                      </span>
                    </div>
                  </div>
                  <motion.div
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      theme === 'dark'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-cyan-100 text-cyan-600'
                    )}
                    whileHover={{ scale: 1.05 }}
                    animate={{
                      boxShadow: isHovered
                        ? theme === 'dark'
                          ? '0 0 12px rgba(34, 211, 238, 0.3)'
                          : '0 0 12px rgba(8, 145, 178, 0.2)'
                        : '0 0 0 rgba(0, 0, 0, 0)'
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {isZh ? '点击展开' : 'Click to expand'}
                  </motion.div>
                </div>
              </div>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.4, 0, 0.2, 1],
                height: { duration: 0.35 }
              }}
              className="overflow-hidden"
            >
              {/* 展开的标题栏 */}
              <div className={cn(
                'flex items-center justify-between px-3 py-2 border-b',
                theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
              )}>
                <div className="flex items-center gap-2">
                  <motion.div
                    className={cn(
                      'p-1.5 rounded-lg',
                      theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-100'
                    )}
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Camera className={cn(
                      'w-4 h-4',
                      theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
                    )} />
                  </motion.div>
                  <span className={cn(
                    'text-sm font-medium',
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  )}>
                    {isZh ? '实验资源' : 'Experimental Resources'}
                  </span>
                </div>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(false)
                  }}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors',
                    theme === 'dark'
                      ? 'hover:bg-slate-700 text-gray-400 hover:text-white'
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="px-3 py-3">
                {/* Tab 切换 */}
                {hasVideos && allImages.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveTab('images')
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        activeTab === 'images'
                          ? theme === 'dark'
                            ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10'
                            : 'bg-cyan-100 text-cyan-700 shadow-md shadow-cyan-500/10'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-slate-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Image className="w-3.5 h-3.5" />
                      {isZh ? '图片' : 'Images'} ({allImages.length})
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActiveTab('video')
                      }}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        activeTab === 'video'
                          ? theme === 'dark'
                            ? 'bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/10'
                            : 'bg-purple-100 text-purple-700 shadow-md shadow-purple-500/10'
                          : theme === 'dark'
                            ? 'text-gray-400 hover:text-gray-300 hover:bg-slate-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Film className="w-3.5 h-3.5" />
                      {isZh ? '视频' : 'Videos'} ({allVideos.length})
                    </motion.button>
                  </div>
                )}

                {/* 图片展示 */}
                <AnimatePresence mode="wait">
                  {(activeTab === 'images' || !videoUrl) && allImages.length > 0 && (
                    <motion.div
                      key="images"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* 主图 - 自适应原始比例 */}
                      <motion.div
                        className={cn(
                          'relative rounded-lg overflow-hidden mb-2 cursor-pointer group',
                          'flex items-center justify-center',
                          theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowLightbox(true)
                        }}
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <motion.img
                          key={selectedImage}
                          src={allImages[selectedImage].url}
                          alt={allImages[selectedImage].caption || ''}
                          className="max-w-full max-h-[50vh] w-auto h-auto object-contain"
                          initial={{ opacity: 0, scale: 1.05 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                        {/* 放大按钮 */}
                        <motion.div
                          className={cn(
                            'absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity',
                            theme === 'dark'
                              ? 'bg-black/60 text-white'
                              : 'bg-white/80 text-gray-700'
                          )}
                        >
                          <Maximize2 className="w-4 h-4" />
                        </motion.div>
                        {/* 图片说明 */}
                        {allImages[selectedImage].caption && (
                          <motion.div
                            className={cn(
                              'absolute bottom-0 left-0 right-0 px-3 py-2 text-xs',
                              theme === 'dark'
                                ? 'bg-gradient-to-t from-black/90 via-black/70 to-transparent text-gray-200'
                                : 'bg-gradient-to-t from-white/95 via-white/80 to-transparent text-gray-700'
                            )}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                          >
                            {allImages[selectedImage].caption}
                          </motion.div>
                        )}
                        {/* 导航按钮 */}
                        {allImages.length > 1 && (
                          <>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage(i => (i - 1 + allImages.length) % allImages.length)
                              }}
                              className={cn(
                                'absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                                theme === 'dark'
                                  ? 'bg-black/60 text-white hover:bg-black/80'
                                  : 'bg-white/80 text-gray-700 hover:bg-white'
                              )}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage(i => (i + 1) % allImages.length)
                              }}
                              className={cn(
                                'absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
                                theme === 'dark'
                                  ? 'bg-black/60 text-white hover:bg-black/80'
                                  : 'bg-white/80 text-gray-700 hover:bg-white'
                              )}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.button>
                          </>
                        )}
                        {/* 图片计数 */}
                        <div className={cn(
                          'absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium',
                          theme === 'dark'
                            ? 'bg-black/60 text-white'
                            : 'bg-white/80 text-gray-700'
                        )}>
                          {selectedImage + 1} / {allImages.length}
                        </div>
                      </motion.div>

                      {/* 缩略图轮播 */}
                      {allImages.length > 1 && (
                        <motion.div
                          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {allImages.map((img, i) => (
                            <motion.button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedImage(i)
                              }}
                              className={cn(
                                'flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all',
                                selectedImage === i
                                  ? theme === 'dark'
                                    ? 'border-cyan-400 shadow-md shadow-cyan-500/20'
                                    : 'border-cyan-500 shadow-md shadow-cyan-500/20'
                                  : 'border-transparent opacity-60 hover:opacity-100'
                              )}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* 视频展示 - 支持多视频 */}
                  {activeTab === 'video' && hasVideos && (
                    <motion.div
                      key="video"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {/* 视频播放器 - 自适应原始比例 */}
                      <div className={cn(
                        'relative rounded-lg overflow-hidden group flex items-center justify-center',
                        theme === 'dark' ? 'bg-slate-800' : 'bg-gray-900'
                      )}>
                        <video
                          key={videoUrl}
                          src={videoUrl}
                          className="max-w-full max-h-[50vh] w-auto h-auto"
                          controls
                          preload="metadata"
                          onClick={(e) => e.stopPropagation()}
                        />
                        {/* 视频导航按钮 */}
                        {allVideos.length > 1 && (
                          <>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVideo(i => (i - 1 + allVideos.length) % allVideos.length)
                              }}
                              className={cn(
                                'absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10',
                                theme === 'dark'
                                  ? 'bg-black/60 text-white hover:bg-black/80'
                                  : 'bg-white/80 text-gray-700 hover:bg-white'
                              )}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVideo(i => (i + 1) % allVideos.length)
                              }}
                              className={cn(
                                'absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10',
                                theme === 'dark'
                                  ? 'bg-black/60 text-white hover:bg-black/80'
                                  : 'bg-white/80 text-gray-700 hover:bg-white'
                              )}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.button>
                          </>
                        )}
                        {/* 视频计数 */}
                        {allVideos.length > 1 && (
                          <div className={cn(
                            'absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium z-10',
                            theme === 'dark'
                              ? 'bg-black/60 text-white'
                              : 'bg-white/80 text-gray-700'
                          )}>
                            {selectedVideo + 1} / {allVideos.length}
                          </div>
                        )}
                      </div>
                      {/* 视频标题 */}
                      {videoTitle && (
                        <div className={cn(
                          'mt-2 px-3 py-2 text-xs flex items-center gap-2 rounded-lg',
                          theme === 'dark'
                            ? 'bg-slate-800/90 text-gray-200'
                            : 'bg-gray-100 text-gray-700'
                        )}>
                          <Film className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span className="line-clamp-2">{videoTitle}</span>
                        </div>
                      )}
                      {/* 视频缩略图列表 */}
                      {allVideos.length > 1 && (
                        <motion.div
                          className="flex gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          {allVideos.map((_, i) => (
                            <motion.button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedVideo(i)
                              }}
                              className={cn(
                                'flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium border transition-all',
                                selectedVideo === i
                                  ? theme === 'dark'
                                    ? 'border-purple-400 bg-purple-500/20 text-purple-300 shadow-md shadow-purple-500/20'
                                    : 'border-purple-500 bg-purple-100 text-purple-700 shadow-md shadow-purple-500/20'
                                  : theme === 'dark'
                                    ? 'border-slate-600 text-gray-400 hover:text-gray-300 hover:border-slate-500'
                                    : 'border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Film className="w-3 h-3 inline mr-1" />
                              {i + 1}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 全屏 Lightbox */}
        <AnimatePresence>
          {showLightbox && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLightbox(false)}
            >
              <motion.button
                className="absolute top-4 right-4 p-2 text-white hover:text-gray-300"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6" />
              </motion.button>
              <motion.img
                src={allImages[selectedImage].url}
                alt={allImages[selectedImage].caption || ''}
                className="max-w-[90vw] max-h-[90vh] object-contain"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
              {allImages.length > 1 && (
                <>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage(i => (i - 1 + allImages.length) % allImages.length)
                    }}
                    className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedImage(i => (i + 1) % allImages.length)
                    }}
                    className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </motion.button>
                </>
              )}
              {allImages[selectedImage].caption && (
                <motion.div
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/70 rounded-lg text-white text-sm max-w-lg text-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {allImages[selectedImage].caption}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // 完整模式 - 用于 StoryModal 中的展示
  return (
    <div className={cn(
      'rounded-xl border overflow-hidden',
      theme === 'dark'
        ? 'bg-gradient-to-br from-cyan-900/20 via-slate-800/50 to-purple-900/20 border-cyan-800/50'
        : 'bg-gradient-to-br from-cyan-50 via-white to-purple-50 border-cyan-200'
    )}>
      {/* 标题栏 */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3 border-b',
        theme === 'dark'
          ? 'border-cyan-800/50 bg-black/20'
          : 'border-cyan-200 bg-white/50'
      )}>
        <div className={cn(
          'p-2 rounded-lg',
          theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-100'
        )}>
          <Beaker className={cn(
            'w-5 h-5',
            theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'
          )} />
        </div>
        <div>
          <h4 className={cn(
            'text-sm font-semibold',
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          )}>
            {isZh ? '实验资源画廊' : 'Experimental Resources Gallery'}
          </h4>
          <p className={cn(
            'text-xs',
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          )}>
            {isZh
              ? `${allImages.length} 张图片${hasVideos ? `，${allVideos.length} 个视频` : ''}`
              : `${allImages.length} images${hasVideos ? `, ${allVideos.length} videos` : ''}`
            }
          </p>
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-4">
        {/* Tab 切换 */}
        {hasVideos && allImages.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('images')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'images'
                  ? theme === 'dark'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Image className="w-4 h-4" />
              {isZh ? '实验图片' : 'Experiment Photos'} ({allImages.length})
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'video'
                  ? theme === 'dark'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-purple-100 text-purple-700 border border-purple-300'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <Film className="w-4 h-4" />
              {isZh ? '实验视频' : 'Experiment Videos'} ({allVideos.length})
            </button>
          </div>
        )}

        {/* 图片画廊 */}
        {(activeTab === 'images' || !hasVideos) && allImages.length > 0 && (
          <div>
            {/* 主图展示 - 自适应原始比例 */}
            <div className={cn(
              'relative rounded-xl overflow-hidden mb-4 flex items-center justify-center min-h-[200px]',
              theme === 'dark' ? 'bg-slate-800' : 'bg-white shadow-md'
            )}>
              <motion.img
                key={selectedImage}
                src={allImages[selectedImage].url}
                alt={allImages[selectedImage].caption || ''}
                className="max-w-full max-h-[60vh] w-auto h-auto object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              {allImages[selectedImage].caption && (
                <div className={cn(
                  'absolute bottom-0 left-0 right-0 px-4 py-3',
                  theme === 'dark'
                    ? 'bg-gradient-to-t from-black/80 to-transparent'
                    : 'bg-gradient-to-t from-black/60 to-transparent'
                )}>
                  <p className="text-sm text-white">
                    {allImages[selectedImage].caption}
                  </p>
                </div>
              )}
              {/* 导航按钮 */}
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => (i - 1 + allImages.length) % allImages.length)}
                    className={cn(
                      'absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full',
                      'bg-black/50 hover:bg-black/70 text-white transition-colors'
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => (i + 1) % allImages.length)}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full',
                      'bg-black/50 hover:bg-black/70 text-white transition-colors'
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {/* 图片计数 */}
              <div className={cn(
                'absolute top-3 right-3 px-2 py-1 rounded-full text-xs',
                'bg-black/50 text-white'
              )}>
                {selectedImage + 1} / {allImages.length}
              </div>
            </div>

            {/* 缩略图网格 */}
            <div className="grid grid-cols-6 gap-2">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    'aspect-video rounded-lg overflow-hidden border-2 transition-all',
                    selectedImage === i
                      ? theme === 'dark'
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                        : 'border-cyan-500 ring-2 ring-cyan-500/30'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 视频播放 - 支持多视频 */}
        {activeTab === 'video' && hasVideos && (
          <div>
            {/* 视频播放器 - 自适应原始比例 */}
            <div className={cn(
              'relative rounded-xl overflow-hidden group flex items-center justify-center min-h-[200px]',
              theme === 'dark' ? 'bg-slate-800' : 'bg-gray-900'
            )}>
              <video
                key={videoUrl}
                src={videoUrl}
                className="max-w-full max-h-[60vh] w-auto h-auto"
                controls
                preload="metadata"
              />
              {/* 视频导航按钮 */}
              {allVideos.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedVideo(i => (i - 1 + allVideos.length) % allVideos.length)}
                    className={cn(
                      'absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10',
                      'bg-black/50 hover:bg-black/70 text-white'
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedVideo(i => (i + 1) % allVideos.length)}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10',
                      'bg-black/50 hover:bg-black/70 text-white'
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {/* 视频计数 */}
              {allVideos.length > 1 && (
                <div className={cn(
                  'absolute top-3 left-3 px-2 py-1 rounded-full text-xs z-10',
                  'bg-black/50 text-white'
                )}>
                  {selectedVideo + 1} / {allVideos.length}
                </div>
              )}
            </div>
            {/* 视频标题 */}
            {videoTitle && (
              <div className={cn(
                'mt-2 px-4 py-2 text-sm flex items-center gap-2 rounded-lg',
                theme === 'dark' ? 'bg-slate-800 text-gray-300' : 'bg-gray-100 text-gray-700'
              )}>
                <Film className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span className="line-clamp-2">{videoTitle}</span>
              </div>
            )}
            {/* 视频选择网格 */}
            {allVideos.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mt-4">
                {allVideos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVideo(i)}
                    className={cn(
                      'p-2 rounded-lg border-2 transition-all text-center',
                      selectedVideo === i
                        ? theme === 'dark'
                          ? 'border-purple-400 bg-purple-500/20 ring-2 ring-purple-400/30'
                          : 'border-purple-500 bg-purple-100 ring-2 ring-purple-500/30'
                        : theme === 'dark'
                          ? 'border-slate-600 hover:border-slate-500 opacity-60 hover:opacity-100'
                          : 'border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100'
                    )}
                  >
                    <Film className={cn(
                      'w-5 h-5 mx-auto mb-1',
                      selectedVideo === i
                        ? 'text-purple-400'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    )} />
                    <span className={cn(
                      'text-xs font-medium',
                      selectedVideo === i
                        ? theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                        : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    )}>
                      {isZh ? `视频 ${i + 1}` : `Video ${i + 1}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 相关模块链接 */}
        {resources.relatedModules && resources.relatedModules.length > 0 && (
          <div className={cn(
            'mt-4 pt-4 border-t',
            theme === 'dark' ? 'border-slate-700' : 'border-gray-200'
          )}>
            <p className={cn(
              'text-xs mb-2',
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            )}>
              {isZh ? '相关学习模块：' : 'Related Learning Modules:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {resources.relatedModules.map((module, i) => (
                <span
                  key={i}
                  className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    theme === 'dark'
                      ? 'bg-slate-700 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {module}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
