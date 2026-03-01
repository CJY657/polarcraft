import {
  Flame, Layers, Hexagon, Glasses, Beaker, Sun, RotateCcw, Camera, Compass, Sparkles
} from 'lucide-react'
import type { ResourceCategory } from '@/data/resource-gallery'

export interface CategoryConfig {
  labelEn: string
  labelZh: string
  icon: React.ReactNode
  color: string
  descriptionEn: string
  descriptionZh: string
  explorationQuestionEn: string
  explorationQuestionZh: string
}

export interface ExplorationPath {
  id: string
  titleEn: string
  titleZh: string
  descriptionEn: string
  descriptionZh: string
  categories: ResourceCategory[]
  icon: React.ReactNode
  color: string
}

// Category configuration
export const CATEGORY_CONFIG: Record<ResourceCategory, CategoryConfig> = {
  stress: {
    labelEn: 'Stress Analysis',
    labelZh: '应力分析',
    icon: <Flame className="w-5 h-5" />,
    color: 'orange',
    descriptionEn: 'See the invisible forces inside materials',
    descriptionZh: '看见材料内部的隐形力量',
    explorationQuestionEn: 'What patterns appear in stressed plastic?',
    explorationQuestionZh: '受力的塑料会呈现什么图案？'
  },
  interference: {
    labelEn: 'Interference Effects',
    labelZh: '干涉效应',
    icon: <Layers className="w-5 h-5" />,
    color: 'cyan',
    descriptionEn: 'When light waves dance together',
    descriptionZh: '当光波共舞时',
    explorationQuestionEn: 'Why do soap bubbles show rainbow colors?',
    explorationQuestionZh: '为什么肥皂泡会呈现彩虹色？'
  },
  birefringence: {
    labelEn: 'Birefringence',
    labelZh: '双折射',
    icon: <Hexagon className="w-5 h-5" />,
    color: 'purple',
    descriptionEn: 'One ray becomes two',
    descriptionZh: '一束光变成两束',
    explorationQuestionEn: 'How does calcite create double images?',
    explorationQuestionZh: '方解石如何创造出双重影像？'
  },
  daily: {
    labelEn: 'Daily Objects',
    labelZh: '日常物品',
    icon: <Glasses className="w-5 h-5" />,
    color: 'green',
    descriptionEn: 'Polarization hidden in everyday life',
    descriptionZh: '藏在日常生活中的偏振',
    explorationQuestionEn: 'What do LCD screens and sunglasses have in common?',
    explorationQuestionZh: 'LCD屏幕和太阳镜有什么共同点？'
  },
  brewster: {
    labelEn: "Brewster's Angle",
    labelZh: '布儒斯特角',
    icon: <Sun className="w-5 h-5" />,
    color: 'yellow',
    descriptionEn: 'The magic angle of perfect polarization',
    descriptionZh: '完美偏振的神奇角度',
    explorationQuestionEn: 'At what angle does glass become a perfect polarizer?',
    explorationQuestionZh: '玻璃在什么角度会变成完美的偏振器？'
  },
  rotation: {
    labelEn: 'Optical Rotation',
    labelZh: '旋光性',
    icon: <RotateCcw className="w-5 h-5" />,
    color: 'pink',
    descriptionEn: 'Light that twists as it travels',
    descriptionZh: '边走边转的光',
    explorationQuestionEn: 'How can sugar solutions rotate polarized light?',
    explorationQuestionZh: '糖溶液如何让偏振光旋转？'
  },
  scattering: {
    labelEn: 'Scattering',
    labelZh: '散射',
    icon: <Sun className="w-5 h-5" />,
    color: 'blue',
    descriptionEn: 'Why the sky is blue and sunsets are red',
    descriptionZh: '天空为何蔚蓝，夕阳为何火红',
    explorationQuestionEn: 'Is the light from the blue sky polarized?',
    explorationQuestionZh: '蓝天的光是偏振的吗？'
  },
  art: {
    labelEn: 'Polarization Art',
    labelZh: '偏振艺术',
    icon: <Camera className="w-5 h-5" />,
    color: 'rose',
    descriptionEn: 'Beauty created by polarized light',
    descriptionZh: '偏振光创造的美',
    explorationQuestionEn: 'How can you paint with polarized light?',
    explorationQuestionZh: '如何用偏振光作画？'
  }
}

// Exploration paths configuration
export const EXPLORATION_PATHS: ExplorationPath[] = [
  {
    id: 'hidden-forces',
    titleEn: 'Hidden Forces',
    titleZh: '隐形力量',
    descriptionEn: 'Discover how polarized light reveals invisible stress patterns',
    descriptionZh: '探索偏振光如何揭示看不见的应力图案',
    categories: ['stress', 'interference'] as ResourceCategory[],
    icon: <Compass className="w-6 h-6" />,
    color: 'orange'
  },
  {
    id: 'crystal-magic',
    titleEn: 'Crystal Magic',
    titleZh: '晶体魔法',
    descriptionEn: 'Explore how crystals split and twist light',
    descriptionZh: '探索晶体如何分离和扭转光',
    categories: ['birefringence', 'rotation'] as ResourceCategory[],
    icon: <Sparkles className="w-6 h-6" />,
    color: 'purple'
  },
  {
    id: 'everyday-polarization',
    titleEn: 'Polarization Around Us',
    titleZh: '身边的偏振',
    descriptionEn: 'Find polarization in daily life',
    descriptionZh: '发现日常生活中的偏振',
    categories: ['daily', 'brewster', 'scattering'] as ResourceCategory[],
    icon: <Glasses className="w-6 h-6" />,
    color: 'green'
  },
  {
    id: 'light-art',
    titleEn: 'Art of Light',
    titleZh: '光的艺术',
    descriptionEn: 'Create beauty with polarized light',
    descriptionZh: '用偏振光创造美',
    categories: ['art', 'interference'] as ResourceCategory[],
    icon: <Camera className="w-6 h-6" />,
    color: 'rose'
  }
]

// Color utilities
export interface ColorClasses {
  active: string
  inactive: string
  bg: string
  border: string
}

export function getColorClasses(color: string, theme: 'dark' | 'light', isActive: boolean): ColorClasses {
  const colorMap: Record<string, ColorClasses> = {
    orange: {
      active: theme === 'dark' ? 'bg-orange-500/20 text-orange-400 border-orange-500/50' : 'bg-orange-100 text-orange-700 border-orange-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10' : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50',
      bg: theme === 'dark' ? 'bg-orange-500/10' : 'bg-orange-50',
      border: theme === 'dark' ? 'border-orange-500/30' : 'border-orange-200'
    },
    cyan: {
      active: theme === 'dark' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' : 'bg-cyan-100 text-cyan-700 border-cyan-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10' : 'text-gray-500 hover:text-cyan-600 hover:bg-cyan-50',
      bg: theme === 'dark' ? 'bg-cyan-500/10' : 'bg-cyan-50',
      border: theme === 'dark' ? 'border-cyan-500/30' : 'border-cyan-200'
    },
    purple: {
      active: theme === 'dark' ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-purple-100 text-purple-700 border-purple-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-purple-400 hover:bg-purple-500/10' : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50',
      bg: theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-50',
      border: theme === 'dark' ? 'border-purple-500/30' : 'border-purple-200'
    },
    green: {
      active: theme === 'dark' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-green-100 text-green-700 border-green-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-green-400 hover:bg-green-500/10' : 'text-gray-500 hover:text-green-600 hover:bg-green-50',
      bg: theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50',
      border: theme === 'dark' ? 'border-green-500/30' : 'border-green-200'
    },
    yellow: {
      active: theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-yellow-100 text-yellow-700 border-yellow-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10' : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50',
      bg: theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-50',
      border: theme === 'dark' ? 'border-yellow-500/30' : 'border-yellow-200'
    },
    pink: {
      active: theme === 'dark' ? 'bg-pink-500/20 text-pink-400 border-pink-500/50' : 'bg-pink-100 text-pink-700 border-pink-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10' : 'text-gray-500 hover:text-pink-600 hover:bg-pink-50',
      bg: theme === 'dark' ? 'bg-pink-500/10' : 'bg-pink-50',
      border: theme === 'dark' ? 'border-pink-500/30' : 'border-pink-200'
    },
    blue: {
      active: theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-blue-100 text-blue-700 border-blue-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50',
      bg: theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-50',
      border: theme === 'dark' ? 'border-blue-500/30' : 'border-blue-200'
    },
    rose: {
      active: theme === 'dark' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-rose-100 text-rose-700 border-rose-300',
      inactive: theme === 'dark' ? 'text-gray-400 hover:text-rose-400 hover:bg-rose-500/10' : 'text-gray-500 hover:text-rose-600 hover:bg-rose-50',
      bg: theme === 'dark' ? 'bg-rose-500/10' : 'bg-rose-50',
      border: theme === 'dark' ? 'border-rose-500/30' : 'border-rose-200'
    }
  }
  return colorMap[color] || colorMap.cyan
}
