# Minecraft Structure Overview

GamePage  // 现在是MinecraftPage
├── GameCanvas (全屏 3D 画布)
└── HUD Overlay (绝对定位 UI 层)
    ├── 移动端布局 (isMobile/isTablet)
    │   ├── 顶部栏 (Logo + 菜单 + 关卡选择)
    │   ├── 移动端菜单下拉
    │   └── 移动端信息面板
    └── 桌面端布局
        ├── PersistentHeader (导航头)
        ├── 左侧: InfoBar + LevelSelector
        ├── 右侧: 视觉/相机指示器 + LevelGoal
        ├── 中心: Crosshair (准星)
        └── 底部: TutorialHint + ControlHints + BlockSelector
