import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// Real-world scene SVG diagrams for each level
function LevelRealWorldScene({ levelIndex }: { levelIndex: number }) {
  const { t } = useTranslation()

  const getDiagram = (index: number) => {
    switch (index) {
      case 0:
        return (
          <svg viewBox="0 0 160 80" className="w-full h-auto">
            {/* Sun */}
            <circle cx="20" cy="15" r="10" fill="#fbbf24" />
            <line x1="20" y1="28" x2="60" y2="50" stroke="#fbbf24" strokeWidth="2" />
            {/* Water surface */}
            <rect x="50" y="50" width="60" height="8" fill="#0ea5e9" opacity="0.5" />
            <line x1="50" y1="50" x2="110" y2="50" stroke="#38bdf8" strokeWidth="2" />
            {/* Reflected light */}
            <line x1="70" y1="50" x2="90" y2="25" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3" />
            {/* Sunglasses */}
            <ellipse cx="120" cy="25" rx="15" ry="10" fill="none" stroke="#a78bfa" strokeWidth="2" />
            <line x1="105" y1="25" x2="135" y2="25" stroke="#a78bfa" strokeWidth="1" />
            {/* Eye */}
            <circle cx="145" cy="25" r="5" fill="#334155" />
            <circle cx="145" cy="25" r="2" fill="#fff" />
            {/* Block line */}
            <line x1="118" y1="20" x2="122" y2="30" stroke="#ef4444" strokeWidth="2" />
            <text x="80" y="75" fontSize="8" fill="#94a3b8" textAnchor="middle">{t('game.realWorld.0.caption')}</text>
          </svg>
        )
      case 1:
        return (
          <svg viewBox="0 0 160 80" className="w-full h-auto">
            {/* Backlight */}
            <rect x="10" y="20" width="15" height="40" fill="#fbbf24" opacity="0.8" />
            <text x="17" y="45" fontSize="6" fill="#000" textAnchor="middle">{t('game.realWorld.1.backlight')}</text>
            {/* Polarizer 1 */}
            <rect x="30" y="15" width="5" height="50" fill="#22d3ee" />
            <line x1="32" y1="20" x2="32" y2="60" stroke="#fff" strokeWidth="1" />
            {/* Liquid crystal layer */}
            <rect x="40" y="18" width="20" height="44" fill="#1e293b" />
            <path d="M45,25 Q55,40 45,55" stroke="#a78bfa" strokeWidth="1" fill="none" />
            <text x="50" y="45" fontSize="5" fill="#a78bfa" textAnchor="middle">{t('game.realWorld.1.liquidCrystal')}</text>
            {/* Polarizer 2 */}
            <rect x="65" y="15" width="5" height="50" fill="#22d3ee" />
            <line x1="67" y1="20" x2="67" y2="60" stroke="#fff" strokeWidth="1" strokeDasharray="2" />
            {/* Light output */}
            <line x1="75" y1="40" x2="100" y2="40" stroke="#4ade80" strokeWidth="3" />
            <polygon points="100,40 95,35 95,45" fill="#4ade80" />
            {/* Display */}
            <rect x="105" y="15" width="45" height="50" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1" />
            <rect x="110" y="20" width="35" height="35" fill="#0ea5e9" opacity="0.3" />
            <text x="127" y="70" fontSize="6" fill="#94a3b8" textAnchor="middle">{t('game.realWorld.1.screen')}</text>
          </svg>
        )
      case 2:
        return (
          <svg viewBox="0 0 160 80" className="w-full h-auto">
            {/* Sky and clouds */}
            <rect x="0" y="0" width="60" height="40" fill="#0ea5e9" opacity="0.3" />
            <ellipse cx="20" cy="15" rx="15" ry="8" fill="#fff" opacity="0.8" />
            <ellipse cx="45" cy="20" rx="12" ry="6" fill="#fff" opacity="0.6" />
            {/* Glass reflection */}
            <rect x="10" y="45" width="40" height="25" fill="#64748b" />
            <line x1="15" y1="50" x2="45" y2="65" stroke="#fff" strokeWidth="1" opacity="0.5" />
            {/* Camera */}
            <rect x="70" y="25" width="30" height="25" rx="3" fill="#1e293b" stroke="#475569" />
            <circle cx="85" cy="37" r="10" fill="#334155" stroke="#64748b" />
            <circle cx="85" cy="37" r="6" fill="#0ea5e9" opacity="0.5" />
            {/* Polarizing filter */}
            <circle cx="62" cy="37" r="12" fill="none" stroke="#a78bfa" strokeWidth="3" />
            <line x1="54" y1="37" x2="70" y2="37" stroke="#a78bfa" strokeWidth="1" />
            {/* Rotation arrow */}
            <path d="M62,23 A14,14 0 0,1 76,37" fill="none" stroke="#fbbf24" strokeWidth="1" />
            <polygon points="76,37 73,33 79,35" fill="#fbbf24" />
            {/* Effect comparison */}
            <rect x="110" y="10" width="40" height="30" fill="#0ea5e9" opacity="0.6" />
            <text x="130" y="45" fontSize="6" fill="#4ade80" textAnchor="middle">{t('game.realWorld.2.blueSky')}</text>
            <rect x="110" y="48" width="40" height="22" fill="#64748b" />
            <text x="130" y="75" fontSize="6" fill="#4ade80" textAnchor="middle">{t('game.realWorld.2.noReflection')}</text>
          </svg>
        )
      case 3:
        return (
          <svg viewBox="0 0 160 80" className="w-full h-auto">
            {/* Screen */}
            <rect x="10" y="10" width="50" height="35" fill="#1e293b" stroke="#475569" />
            <text x="35" y="30" fontSize="8" fill="#64748b" textAnchor="middle">{t('game.realWorld.3.screen3d')}</text>
            {/* Left eye light */}
            <line x1="40" y1="25" x2="80" y2="35" stroke="#ef4444" strokeWidth="2" />
            <circle cx="75" cy="33" r="3" fill="none" stroke="#ef4444" strokeWidth="1" />
            {/* Right eye light */}
            <line x1="40" y1="30" x2="80" y2="45" stroke="#22d3ee" strokeWidth="2" />
            <circle cx="75" cy="43" r="3" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2" />
            {/* 3D glasses */}
            <ellipse cx="100" cy="35" rx="12" ry="8" fill="none" stroke="#ef4444" strokeWidth="2" />
            <ellipse cx="125" cy="35" rx="12" ry="8" fill="none" stroke="#22d3ee" strokeWidth="2" />
            <line x1="112" y1="35" x2="113" y2="35" stroke="#475569" strokeWidth="2" />
            <line x1="88" y1="35" x2="85" y2="30" stroke="#475569" strokeWidth="2" />
            <line x1="137" y1="35" x2="140" y2="30" stroke="#475569" strokeWidth="2" />
            {/* Eyes */}
            <circle cx="100" cy="55" r="4" fill="#334155" />
            <circle cx="125" cy="55" r="4" fill="#334155" />
            <text x="112" y="75" fontSize="7" fill="#94a3b8" textAnchor="middle">{t('game.realWorld.3.caption')}</text>
          </svg>
        )
      case 4:
        return (
          <svg viewBox="0 0 160 80" className="w-full h-auto">
            {/* Light source */}
            <circle cx="15" cy="40" r="8" fill="#fbbf24" />
            <line x1="25" y1="40" x2="35" y2="40" stroke="#fbbf24" strokeWidth="2" />
            {/* Polarizer */}
            <rect x="38" y="28" width="6" height="24" fill="#22d3ee" />
            <line x1="41" y1="30" x2="41" y2="50" stroke="#fff" strokeWidth="1" />
            {/* Sample with stress */}
            <rect x="50" y="25" width="30" height="30" rx="3" fill="#1e293b" stroke="#a78bfa" />
            <path d="M55,35 Q65,40 55,45 Q65,50 55,55" stroke="#a78bfa" strokeWidth="1" fill="none" />
            <text x="65" y="60" fontSize="5" fill="#a78bfa" textAnchor="middle">{t('game.realWorld.4.stressZone')}</text>
            {/* Analyzer */}
            <rect x="85" y="28" width="6" height="24" fill="#22d3ee" />
            <line x1="88" y1="30" x2="88" y2="50" stroke="#fff" strokeWidth="1" strokeDasharray="2" />
            {/* Interference pattern */}
            <circle cx="115" cy="40" r="15" fill="none" stroke="#4ade80" strokeWidth="1" />
            <circle cx="115" cy="40" r="10" fill="none" stroke="#f472b6" strokeWidth="1" />
            <circle cx="115" cy="40" r="5" fill="none" stroke="#22d3ee" strokeWidth="1" />
            {/* Camera */}
            <rect x="135" y="30" width="15" height="20" rx="2" fill="#334155" stroke="#475569" />
            <circle cx="142" cy="40" r="5" fill="#475569" />
            <text x="115" y="70" fontSize="6" fill="#94a3b8" textAnchor="middle">{t('game.realWorld.4.caption')}</text>
          </svg>
        )
      default:
        return null
    }
  }

  const diagram = getDiagram(levelIndex)
  if (!diagram) return null

  return (
    <div className="mt-3 p-2 bg-slate-800/50 rounded-lg border border-cyan-400/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-cyan-400 font-medium">{t('game.realWorldApp')}:</span>
        <span className="text-[10px] text-white font-medium">{t(`game.realWorld.${levelIndex}.title`)}</span>
      </div>
      <div className="bg-slate-900/50 rounded p-2">
        {diagram}
      </div>
      <p className="text-[10px] text-gray-500 mt-1">{t(`game.realWorld.${levelIndex}.description`)}</p>
    </div>
  )
}

export function InfoBar() {
  const { t } = useTranslation()
  const { currentLevel, currentLevelIndex } = useGameStore()
  const [showRealWorld, setShowRealWorld] = useState(true)

  return (
    <div className="bg-black/70 p-4 rounded-lg border border-cyan-400/30 max-w-xs">
      <h2 className="text-sm text-cyan-400 mb-2 flex items-center gap-2">
        <span>⟡</span>
        <span>PolarCraft</span>
        {currentLevel && (
          <span className="text-gray-500 ml-2">
            {t('game.level')} {currentLevelIndex + 1}: {t(`game.tutorials.${currentLevelIndex}.name`)}
          </span>
        )}
      </h2>
      <p className="text-xs text-gray-400 leading-relaxed">
        {currentLevel ? t(`game.tutorials.${currentLevelIndex}.description`) : t('game.defaultControls')}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {t('game.shortControls')}
      </p>

      {/* Real-world scene toggle button */}
      {currentLevel && (
        <button
          onClick={() => setShowRealWorld(!showRealWorld)}
          className="mt-2 flex items-center gap-1 text-[10px] text-cyan-400/70 hover:text-cyan-400 transition-colors"
        >
          {showRealWorld ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{showRealWorld ? t('game.hideRealWorld') : t('game.showRealWorld')}</span>
        </button>
      )}

      {/* Real-world scene diagram */}
      {showRealWorld && currentLevel && (
        <LevelRealWorldScene levelIndex={currentLevelIndex} />
      )}
    </div>
  )
}
