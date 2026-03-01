import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PersistentHeader } from '@/components/shared/PersistentHeader'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/utils/classNames'
import { Puzzle, Box, WalletCards, Lock, ChevronRight } from 'lucide-react'

// 游戏卡片类型定义
interface GameCard {
  id: string
  titleKey: string
  descriptionKey: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  status: 'available' | 'development' | 'locked'
  colorTheme: {
    bg: string
    bgHover: string
    border: string
    borderHover: string
    iconBg: string
    iconColor: string
    glowColor: string
  }
}

// 4个游戏卡片配置
const GAME_CARDS: GameCard[] = [
  {
    id: 'escape',
    titleKey: 'games.escape.title',
    descriptionKey: 'games.escape.description',
    path: '/games/escape',
    icon: Puzzle,
    status: 'available',
    colorTheme: {
      bg: 'bg-purple-950/20 backdrop-blur-sm',
      bgHover: 'group-hover:bg-purple-900/40',
      border: 'border-purple-800/50',
      borderHover: 'group-hover:border-purple-400/80 group-hover:shadow-[0_0_20px_rgba(192,132,252,0.3)]',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-400',
      glowColor: 'rgba(192, 132, 252, 0.4)',
    },
  },
  {
    id: 'minecraft',
    titleKey: 'games.minecraft.title',
    descriptionKey: 'games.minecraft.description',
    path: '/games/minecraft',
    icon: Box,
    status: 'available',
    colorTheme: {
      bg: 'bg-amber-950/20 backdrop-blur-sm',
      bgHover: 'group-hover:bg-amber-900/40',
      border: 'border-amber-800/50',
      borderHover: 'group-hover:border-amber-400/80 group-hover:shadow-[0_0_20px_rgba(251,191,36,0.3)]',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
      glowColor: 'rgba(251, 191, 36, 0.4)',
    },
  },
  {
    id: 'card-battle',
    titleKey: 'games.cardBattle.title',
    descriptionKey: 'games.cardBattle.description',
    path: '',
    icon: WalletCards,
    status: 'development',
    colorTheme: {
      bg: 'bg-cyan-950/20 backdrop-blur-sm',
      bgHover: 'group-hover:bg-cyan-900/40',
      border: 'border-cyan-800/50',
      borderHover: 'group-hover:border-cyan-400/80 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]',
      iconBg: 'bg-cyan-500/10',
      iconColor: 'text-cyan-400',
      glowColor: 'rgba(34, 211, 238, 0.4)',
    },
  },
  {
    id: 'coming-soon',
    titleKey: 'games.comingSoon.title',
    descriptionKey: 'games.comingSoon.description',
    path: '',
    icon: Lock,
    status: 'locked',
    colorTheme: {
      bg: 'bg-slate-950/20 backdrop-blur-sm',
      bgHover: 'group-hover:bg-slate-900/40',
      border: 'border-slate-800/50',
      borderHover: 'group-hover:border-slate-600/50',
      iconBg: 'bg-slate-500/10',
      iconColor: 'text-slate-400',
      glowColor: 'rgba(148, 163, 184, 0.2)',
    },
  },
]

// 游戏卡片组件
function GameCard({ game }: { game: GameCard }) {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)
  const IconComponent = game.icon

  const isDisabled = game.status === 'locked'
  const isDevelopment = game.status === 'development'

  const cardContent = (
    <div
      className={cn(
        'group relative flex flex-col p-6 rounded-2xl border transition-all duration-500 overflow-hidden',
        game.colorTheme.bg,
        game.colorTheme.bgHover,
        game.colorTheme.border,
        game.colorTheme.borderHover,
        !isDisabled && 'hover:-translate-y-2 cursor-pointer',
        isDisabled && 'opacity-60 cursor-not-allowed',
      )}
      onMouseEnter={() => !isDisabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 状态标签 */}
      {(isDevelopment || isDisabled) && (
        <div className="absolute top-3 right-3 z-10">
          <span
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-full',
              isDevelopment
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
            )}
          >
            {t(isDevelopment ? 'games.status.development' : 'games.status.locked')}
          </span>
        </div>
      )}

      {/* 背景光效 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${game.colorTheme.glowColor} 0%, transparent 60%)`,
        }}
      />

      {/* 图标区域 */}
      <div
        className={cn(
          'relative w-16 h-16 rounded-xl flex items-center justify-center mb-4',
          game.colorTheme.iconBg,
          'transition-all duration-500',
          isHovered && !isDisabled ? 'scale-110 rotate-3' : 'scale-100 rotate-0',
        )}
      >
        <IconComponent className={cn(game.colorTheme.iconColor, 'w-10 h-10 transition-colors')} />
      </div>

      {/* 标题 */}
      <h3
        className={cn(
          'text-xl font-bold mb-2 text-white transition-all duration-300',
          isHovered && !isDisabled && 'translate-x-1',
        )}
      >
        {t(game.titleKey)}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">{t(game.descriptionKey)}</p>

      {/* 底部信息 */}
      <div className="flex items-center justify-between mt-auto">
        <span
          className={cn(
            'text-xs font-medium',
            isDevelopment ? 'text-amber-400' : isDisabled ? 'text-slate-500' : 'text-purple-400',
          )}
        >
          {t(`games.status.${game.status}`)}
        </span>
        {!isDisabled && (
          <ChevronRight
            className={cn(
              'w-5 h-5 transition-transform duration-300',
              game.colorTheme.iconColor,
              isHovered && 'translate-x-1',
            )}
          />
        )}
      </div>

      {/* 底部光条 */}
      <div
        className={cn(
          'absolute bottom-0 left-0 w-full h-1 transition-all duration-500 pointer-events-none',
          isHovered && !isDisabled ? 'opacity-60' : 'opacity-0',
        )}
        style={{
          background: `linear-gradient(90deg, transparent, ${game.colorTheme.glowColor}, transparent)`,
        }}
      />
    </div>
  )

  if (isDisabled || isDevelopment) {
    return <div className="h-full">{cardContent}</div>
  }

  return (
    <Link to={game.path} className="block h-full">
      {cardContent}
    </Link>
  )
}

// 主页面组件
export function GamesPage() {
  const { t } = useTranslation()
  const { isMobile } = useIsMobile()

  return (
    <div className="relative w-full min-h-screen bg-[#0a0a15]">
      {/* 顶部导航 */}
      <PersistentHeader
        moduleKey="game3d"
        moduleName={t('games.title')}
        variant="glass"
        showSettings={true}
        className="absolute top-0 left-0 right-0 z-50"
      />

      {/* 主内容区 */}
      <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-5xl mx-auto">
          {/* 页面标题 */}
          <header className="text-center mb-12">
            <h1
              className={cn(
                'text-3xl sm:text-4xl md:text-5xl font-bold mb-4',
                'text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400',
              )}
            >
              {t('games.hero.title')}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
              {t('games.hero.description')}
            </p>
          </header>

          {/* 游戏卡片网格 */}
          <div
            className={cn(
              'grid gap-6',
              // 移动端：单列
              isMobile ? 'grid-cols-1' : 'grid-cols-2',
            )}
          >
            {GAME_CARDS.map((game) => (
              <div key={game.id} className="h-full">
                <GameCard game={game} />
              </div>
            ))}
          </div>

          {/* 底部提示 */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">{t('games.footer.hint')}</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GamesPage
