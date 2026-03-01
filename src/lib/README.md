# 光学库模块说明

`src/lib/physics/` 目录包含光学相关的核心模块。

## 模块职责

| 模块 | 职责 | 使用场景 |
|------|------|----------|
| `GeometricOptics` | 几何光学演示（斯涅尔定律、双折射、3D射线追踪） | 教育演示组件、光学实验室模拟 |
| `LightPhysics` | 游戏引擎核心（偏振物理、方块处理） | PolarCraft 体素世界、游戏逻辑 |
| `WaveOptics` | 波动光学底层（琼斯矩阵计算） | 精确物理计算（被 LightPhysics 调用） |
| `OpticsConstants` | 共享光学常量数据 | 所有光学模块 |
