import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGameStore } from '@/stores/gameStore'
import { GameCanvas } from '@/components/game'
import {
  BlockSelector,
  InfoBar,
  VisionModeIndicator,
  CameraModeIndicator,
  LevelGoal,
  TutorialHint,
  HelpPanel,
  LevelSelector,
  Crosshair,
  ControlHints,
} from '@/components/hud'
import { PersistentHeader, MiniLogo } from '@/components/shared/PersistentHeader'
import { AuthThemeSwitcher } from '@/components/ui/AuthThemeSwitcher'
import { Home, Menu, X, Info, BookOpen } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { cn } from '@/utils/classNames'
