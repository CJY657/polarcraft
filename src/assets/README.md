# HUD 文件夹依赖分析

`src/assets/hud/` 文件夹包含 10 个组件，负责 3D 游戏的抬头显示 (Heads-Up Display)。

## 📦 外部依赖

| 依赖 | 用途 | 使用组件 |
|------|------|----------|
| react | React 核心 (hooks) | 所有组件 |
| react-i18next | 国际化翻译 | LevelSelector, BlockSelector, ControlHints, InfoBar, HelpPanel, CameraModeIndicator, VisionModeIndicator, LevelGoal |
| lucide-react | UI 图标库 | ChevronLeft/Right, ChevronUp/Down, Camera, Gamepad2, Grid3X3 |

## 🔧 内部依赖

| 依赖路径 | 用途 | 使用组件 |
|----------|------|----------|
| `@/stores/gameStore` | 游戏状态管理 (Zustand) | 全部组件 |
| `@/core/types` | 类型定义 (BlockType, Direction 等) | BlockSelector |
| `@/lib/utils` | 工具函数 (cn() classnames) | ControlHints, BlockSelector, TutorialHint, LevelGoal, VisionModeIndicator, CameraModeIndicator |
| `@/hooks/useIsMobile` | 移动端检测 Hook | ControlHints, BlockSelector |
| `@/levels` | 关卡数据 (TUTORIAL_LEVELS) | LevelSelector |
| `@/components/ui/dialog` | 弹窗 UI 组件 | HelpPanel |

## 📋 组件功能对照表

| 组件 | 主要功能 |
|------|----------|
| `BlockSelector.tsx` | 方块类型选择器 (基础 7 种 + 高级 8 种) |
| `LevelSelector.tsx` | 关卡切换 (桌面显示全部，移动端紧凑模式) |
| `ControlHints.tsx` | 根据相机模式和设备类型显示控制提示 |
| `InfoBar.tsx` | 关卡信息 + 真实场景 SVG 图解 |
| `LevelGoal.tsx` | 传感器激活状态和进度条 |
| `TutorialHint.tsx` | 教程提示自动播放（8秒切换） |
| `HelpPanel.tsx` | 游戏指南弹窗 (控制、方块、四公理) |
| `Crosshair.tsx` | FPS 十字准星 (仅第一人称模式) |
| `CameraModeIndicator.tsx` | 相机模式指示器 (第一人称/等轴测/俯视) |
| `VisionModeIndicator.tsx` | 视觉模式切换按钮 (普通/偏振) |
