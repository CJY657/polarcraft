/**
 * Minecraft体素游戏
 *  
*/ 

import { useEffect, useState } from 'react' 
//useEffect: 用于初始化游戏世界和加载关卡
//useState: 管理 UI 状态（移动端菜单、信息面板

import { Link } from 'react-router-dom' // 路由链接组件
import { useTranslation } from 'react-i18next' // 国际化支持

import { useIsMobile } from '@/hooks/useIsMobile' // 判断是否移动端的自定义 Hook
import { cn } from '@/utils/classNames' // 条件类名工具函数
// import { Box, ChevronRight } from 'lucide-react' // 图标组件
import { useGameStore } from '@/stores/game/gameStore' // 游戏状态管理（假设使用 Zustand）
import { GameCanvas } from '@/feature/games/Minecraft'

import {
  BlockSelector,      // 方块类型选择器
  InfoBar,            // 关卡信息栏
  VisionModeIndicator, // 视觉模式指示器（偏振光/普通）
  CameraModeIndicator, // 相机模式指示器（第一人称/等轴测/俯视）
  LevelGoal,          // 传感器激活进度
  TutorialHint,       // 教程提示
  HelpPanel,          // 帮助面板（Dialog）
  LevelSelector,      // 关卡选择器
  Crosshair,          // FPS 准星
  ControlHints,       // 屏幕按键提示
} from '@/assets/hud'

// 共享 UI 组件
import { PersistentHeader, MiniLogo } from '@/components/shared/PersistentHeader'
import { AuthThemeSwitcher } from '@/components/ui/AuthThemeSwitcher'
import { Home, Menu, X, Info, BookOpen } from 'lucide-react'


export function GamePage() {
  const { t } = useTranslation()
  const { initWorld, loadLevel, world } = useGameStore()
  const { isMobile, isTablet } = useIsMobile()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMobileInfo, setShowMobileInfo] = useState(false)

  const isCompact = isMobile || isTablet

  // Initialize world on mount
  useEffect(() => {
    if (!world) {
      initWorld(32)
    }
  }, [initWorld, world])

  // Load first level after world is ready
  useEffect(() => {
    if (world) {
      loadLevel(0)
    }
  }, [world, loadLevel])

  return (
    <div className="relative w-full h-dvh min-h-screen overflow-hidden bg-[#0a0a15]">
      {/* 3D Canvas */}
      <GameCanvas />

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Mobile Header - Compact Navigation */}
          {isCompact ? (
            <>
              {/* Mobile top bar with Logo */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                {/* Left: Logo + Menu */}
                <div className="flex items-center gap-1">
                  <MiniLogo size={28} className="p-1 bg-black/70 rounded-lg border border-cyan-400/30" />
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="p-2 rounded-lg bg-black/70 border border-cyan-400/30 text-cyan-400"
                  >
                    {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>

                {/* Center - Level info */}
                <div className="flex-1 mx-2">
                  <div className="bg-black/70 px-3 py-1.5 rounded-lg border border-cyan-400/30 text-center">
                    <LevelSelector compact />
                  </div>
                </div>

                {/* Right side buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowMobileInfo(!showMobileInfo)}
                    className={cn(
                      "p-2 rounded-lg border transition-all",
                      showMobileInfo
                        ? "bg-cyan-400/20 border-cyan-400/50 text-cyan-400"
                        : "bg-black/70 border-cyan-400/30 text-cyan-400"
                    )}
                  >
                    <Info className="w-5 h-5" />
                  </button>
                  <AuthThemeSwitcher compact />
                </div>
              </div>

              {/* Mobile menu dropdown */}
              {showMobileMenu && (
                <div className="absolute top-14 left-2 bg-black/90 rounded-lg border border-cyan-400/30 p-3 space-y-2 z-50">
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-cyan-400 hover:bg-cyan-400/20 transition-all"
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-sm">{t('common.home')}</span>
                  </Link>
                  <Link
                    to="/demos"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-cyan-400 hover:bg-cyan-400/20 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">{t('common.course')}</span>
                  </Link>
                  <div className="border-t border-cyan-400/20 pt-2 mt-2">
                    <VisionModeIndicator />
                    <CameraModeIndicator />
                  </div>
                </div>
              )}

              {/* Mobile info panel */}
              {showMobileInfo && (
                <div className="absolute top-14 right-2 max-w-[280px] z-50">
                  <InfoBar />
                  <div className="mt-2">
                    <LevelGoal />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Desktop Layout with Persistent Header */}
              {/* Persistent Header with Logo */}
              <PersistentHeader
                moduleKey="polarquest"
                moduleName={t('modules.polarquest.title')}
                variant="transparent"
                showSettings={false}
                className="absolute top-0 left-0 right-0"
                rightContent={
                  <Link
                    to="/demos"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/50 border border-cyan-400/30
                              text-cyan-400 hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all text-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>{t('common.course')}</span>
                  </Link>
                }
              />

              {/* Left side - Info bar with level selector */}
              <div className="absolute top-14 left-5 space-y-3">
                <InfoBar />
                <div className="bg-black/70 p-3 rounded-lg border border-cyan-400/30">
                  <LevelSelector />
                </div>
              </div>

              {/* Top right - Mode indicators and settings */}
              <div className="absolute top-14 right-5 space-y-2">
                <VisionModeIndicator />
                <CameraModeIndicator />
                <LevelGoal />
              </div>
            </>
          )}

          {/* Center */}
          <Crosshair />

          {/* Bottom center - Block selector and hints */}
          <TutorialHint />
          <ControlHints />
          <BlockSelector />
        </div>
      </div>

      {/* Help Panel (Dialog) */}
      <HelpPanel />
    </div>
  )
}

export default GamePage