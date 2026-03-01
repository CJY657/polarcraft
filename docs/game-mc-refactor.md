# Minecraft 模块重构计划

把components改成了feature，里面的组件也改成了模块化的结构，并且在原来的基础上加一个文件夹minecraft，把所有和Minecraft相关的组件都放在里面，形成一个独立的模块。这样可以更好地组织代码，方便维护和扩展。

原项目路径:"D:\30856\polarisationcourse"
新项目路径:"D:\30856\polar-craft"

## 原文件项目结构

```
src/components/game/
├── index.ts                    # 导出主组件
├── GameCanvas.tsx              # R3F Canvas 包装器
├── Scene.tsx                   # 主场景，控制，光照
├── Blocks.tsx                  # 方块网格渲染
├── LightBeams.tsx              # 光束可视化
├── SelectionBox.tsx            # 方块选择指示器
└── block-helpers/              # 辅助组件
    ├── index.ts
    ├── helpers.tsx             # 偏振指示器、螺旋装饰等
    └── types.ts                # 共享类型定义
```

## 原项目依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                    src/components/game/                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GameCanvas.tsx ──────► Scene.tsx ──────────────────────┐       │
│                         │                               │       │
│                         ├──► Blocks.tsx ─────┐           │      │
│                         │                    │           │      │
│                         ├──► LightBeams.tsx  │           │      │
│                         │                    │           │      │
│                         └──► SelectionBox.tsx│           │      │
│                                              │           │      │
│                              block-helpers/◄─┘           │      │
│                                ├── helpers.tsx           │      │
│                                └── types.ts              │      │
│                                                          │      │
└───────────────────────────────────────────────────────── ┼──────┘
                                                           │
                    ┌──────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      项目内其他依赖                              │
├─────────────────────────────────────────────────────────────────┤
│  @/core/types.ts         ← PolarizationAngle, BlockPosition     │
│  @/core/World.ts         ← Block data, Light propagation        │
│  @/stores/gameStore.ts   ← Game state, actions, VisionMode      │
└─────────────────────────────────────────────────────────────────┘
```

## World.ts 重构计划

### 原来的结构

```
World.ts (1038 lines)
├── Core physics engine (lines 87-947)
├── LevelData interface (lines 964-978)
└── TUTORIAL_LEVELS[] constant (lines 981-1038)

gameStore.ts
├── Imports: World, TUTORIAL_LEVELS, LevelData from '@/core/World'
└── TUTORIAL_HINTS record (lines 66-88)

LevelSelector.tsx
└── Imports TUTORIAL_LEVELS from '@/core/World'
```

### 重构后的结构

```
src/
├── core/
│   ├── World.ts           # Pure physics engine (~900 lines)
│   ├── types.ts           # Core types (BlockType, LightPacket, etc.)
│   └── LightPhysics.ts    # Physics calculations (unchanged)
│
├── levels/
│   ├── types.ts           # Level-related types
│   ├── tutorialLevels.ts  # Tutorial level definitions
│   └── index.ts           # Barrel export
│
└── stores/
    └── gameStore.ts       # Import levels from @/levels
```
