/**
 * PolarCraft - 偏振光体素游戏类型定义
 */

// 光的传播方向（6个离散方向）
export type Direction = 'north' | 'south' | 'east' | 'west' | 'up' | 'down';

// 偏振角度（离散化为4个基础态）
export type PolarizationAngle = 0 | 45 | 90 | 135;

// 相位（用于干涉计算）
export type Phase = 1 | -1;

// 光数据包 - 光的基本粒子
export interface LightPacket {
  direction: Direction;
  intensity: number;        // 0-15
  polarization: PolarizationAngle;
  phase: Phase;
}

/**
 * 方块类型 - 扩展版
 *
 * ⚠️ SCIENTIFIC NOTE: This game uses SIMPLIFIED physics models for some components.
 * For scientifically accurate simulations, use the Jones Calculus engine in WaveOptics.ts.
 *
 * Key simplifications in the game engine (LightPhysics.ts):
 * - quarterWave: Acts as 45° rotator, NOT true QWP (no circular polarization)
 * - halfWave: Acts as 90° rotator, NOT true HWP (no fast-axis dependent rotation)
 * - splitter: 90° separation like PBS/Wollaston, NOT natural calcite (~6° walk-off)
 * - Phase: Binary (±1) only, NOT continuous (0-2π radians)
 */
export type BlockType =
  | 'air'
  | 'solid'
  | 'emitter'        // 光源 - 发射偏振光
  | 'polarizer'      // 偏振片 - 马吕斯定律过滤
  | 'rotator'        // 波片（旋光器）- 旋转偏振角度
  | 'splitter'       // ⚠️ 偏振分束器(PBS) - 90°分束 (非天然方解石~6°)
  | 'sensor'         // 光感应器 - 检测光强
  | 'mirror'         // 反射镜 - 反射光线
  | 'prism'          // 棱镜 - 折射并分散光线（色散效果）
  | 'lens'           // 透镜 - 聚焦或发散光线
  | 'beamSplitter'   // 分束器 - 50/50分光
  | 'quarterWave'    // ⚠️ 简化模型：45°旋转器 (非真正QWP，无圆偏振)
  | 'halfWave'       // ⚠️ 简化模型：90°旋转器 (非真正HWP)
  | 'absorber'       // 吸收器 - 部分吸收光强
  | 'phaseShifter'   // 相位调制器 - 改变相位
  | 'portal';        // 传送门 - 传送光线到另一位置

// 方块状态 - 扩展版
export interface BlockState {
  type: BlockType;
  rotation: number;              // 方块朝向（0, 90, 180, 270度）
  polarizationAngle: PolarizationAngle;  // 对于偏振片/光源：偏振角度
  rotationAmount: number;        // 对于波片：旋转量（45或90度）
  activated: boolean;            // 对于感应器：是否被激活
  requiredIntensity: number;     // 对于感应器：所需强度阈值
  facing: Direction;             // 方块面向的方向
  // 新增属性
  absorptionRate: number;        // 对于吸收器：吸收率 (0-1)
  phaseShift: number;            // 对于相位调制器：相位偏移 (0, 90, 180, 270)
  linkedPortalId: string | null; // 对于传送门：链接的传送门ID
  splitRatio: number;            // 对于分束器：分光比例 (0-1，默认0.5)
  focalLength: number;           // 对于透镜：焦距（正数聚焦，负数发散）
  dispersive: boolean;           // 对于棱镜：是否产生色散效果
}

// 方块在世界中的位置
export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

// 世界中的方块
export interface WorldBlock {
  position: BlockPosition;
  state: BlockState;
}

// 光线在某个方块中的状态
export interface LightState {
  packets: LightPacket[];     // 该方块中存在的光包
}

// 三维向量
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// 方向向量映射
export const DIRECTION_VECTORS: Record<Direction, Vec3> = {
  north: { x: 0, y: 0, z: -1 },
  south: { x: 0, y: 0, z: 1 },
  east: { x: 1, y: 0, z: 0 },
  west: { x: -1, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
  down: { x: 0, y: -1, z: 0 }
};

// 反方向映射
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  north: 'south',
  south: 'north',
  east: 'west',
  west: 'east',
  up: 'down',
  down: 'up'
};

// 偏振角度对应的颜色（用于可视化）
export const POLARIZATION_COLORS: Record<PolarizationAngle, number> = {
  0: 0xff4444,    // 红色 - 水平
  45: 0xffaa00,   // 橙黄色 - 45度
  90: 0x44ff44,   // 绿色 - 垂直
  135: 0x4444ff   // 蓝色 - 135度
};

// 默认方块状态
export function createDefaultBlockState(type: BlockType): BlockState {
  const baseState: BlockState = {
    type,
    rotation: 0,
    polarizationAngle: 0,
    rotationAmount: 45,
    activated: false,
    requiredIntensity: 8,
    facing: 'north',
    // 新增属性默认值
    absorptionRate: 0.5,
    phaseShift: 0,
    linkedPortalId: null,
    splitRatio: 0.5,
    focalLength: 2,
    dispersive: false,
  };

  // 根据类型设置特定默认值
  switch (type) {
    case 'quarterWave':
      baseState.rotationAmount = 90;
      break;
    case 'halfWave':
      baseState.rotationAmount = 180;
      break;
    case 'prism':
      baseState.dispersive = true;
      break;
    case 'absorber':
      baseState.absorptionRate = 0.3;
      break;
    case 'phaseShifter':
      baseState.phaseShift = 90;
      break;
  }

  return baseState;
}

// 游戏配置
export interface GameConfig {
  worldSize: number;
  chunkSize: number;
  maxLightIntensity: number;
  lightDecayPerBlock: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  worldSize: 32,
  chunkSize: 16,
  maxLightIntensity: 15,
  lightDecayPerBlock: 0  // 光在空气中不衰减
};
