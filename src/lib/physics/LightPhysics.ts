/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LIGHT PHYSICS ENGINE | 光物理引擎
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 职责范围 | Scope:
 * - PolarCraft 游戏引擎核心 | Core game engine for PolarCraft
 * - 偏振光物理规则实现 | Polarized light physics implementation
 * - 方块与光交互逻辑 | Block-light interaction logic
 * - 马吕斯定律 | Malus's Law
 * - 偏振分束 | Polarizing beam splitting
 * - 干涉叠加 | Interference superposition
 *
 * 双模型支持 | Dual Model Support:
 * 1. LEGACY SCALAR (LightPacket) - 游戏兼容模式
 * 2. WAVE OPTICS (WaveLight/Jones) - 精确物理模式
 *
 * 使用场景 | Use Cases:
 * - 体素世界光传播 (World.ts)
 * - 游戏方块物理处理
 * - 光传播模拟
 *
 * 与其他模块的区别 | Differentiation:
 * - GeometricOptics: 几何光学演示（3D射线追踪）
 * - WaveOptics: 波动光学底层（琼斯矩阵计算）
 * - LightPhysics: 游戏引擎封装（调用 WaveOptics + 游戏逻辑）
 *
 * ⚠️ 注意: 本模块专注于游戏逻辑，精确物理计算委托给 WaveOptics
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
  LightPacket,
  Direction,
  PolarizationAngle,
  Phase,
  BlockState,
  OPPOSITE_DIRECTION
} from '@/lib/types';
import { logger } from '@/lib/logger';

import {
  JonesVector,
  JonesMatrix,
  superposeLights,
  waveLightToLightPacket,
  lightPacketToWaveLight
} from './WaveOptics';
import type { WaveLight } from './WaveOptics';

/**
 * 光物理引擎 - 实现偏振光的核心物理规则
 */
export class LightPhysics {

  /**
   * 公理一：正交不干涉 (Orthogonality)
   * 检查两个偏振角度是否正交（相差90度）
   */
  static isOrthogonal(angle1: PolarizationAngle, angle2: PolarizationAngle): boolean {
    const diff = Math.abs(angle1 - angle2);
    return diff === 90;
  }

  /**
   * 公理二：马吕斯定律 (Malus Law)
   * 计算光通过偏振片后的强度
   * I = I₀ × cos²(θ)
   *
   * NOTE: This is the game engine version that returns discrete intensity values.
   * For continuous float values, use getMalusTransmission() from '@/lib/opticsPhysics'.
   *
   * @param inputIntensity 输入光强度 (0-15 for game, 0-100 for simulation)
   * @param inputAngle 输入光偏振角
   * @param filterAngle 偏振片角度
   * @returns 输出强度（向下取整）
   * @see {@link getMalusTransmission} for continuous transmission calculation
   */
  static applyMalusLaw(
    inputIntensity: number,
    inputAngle: PolarizationAngle,
    filterAngle: PolarizationAngle
  ): number {
    // Use canonical transmission calculation
    // Core formula: I = I₀ × cos²(θ) where θ is the angle difference
    const angleDiff = Math.abs(inputAngle - filterAngle) % 180;
    const normalizedDiff = angleDiff > 90 ? 180 - angleDiff : angleDiff;
    const radians = (normalizedDiff * Math.PI) / 180;
    const transmissionFactor = Math.cos(radians) ** 2;

    // Game engine uses discrete intensities
    return Math.floor(inputIntensity * transmissionFactor);
  }

  /**
   * 公理三：偏振分束 (Polarizing Beam Splitting)
   * 将一束光分解为两束正交偏振的光
   *
   * ⚠️ SCIENTIFIC NOTE: This model represents a POLARIZING BEAM SPLITTER (PBS)
   * or WOLLASTON PRISM, which separates orthogonal polarizations by ~90°.
   *
   * Natural birefringent crystals like CALCITE have much smaller walk-off angles:
   * - Calcite walk-off angle: ~6° (not 90°!)
   * - This model uses 90° separation for game visualization clarity
   *
   * The naming in UI should be "Polarizing Beam Splitter (PBS)" or "Wollaston Prism"
   * rather than "Calcite" to be scientifically accurate.
   *
   * @param input 输入光包
   * @param crystalFacing 分束器朝向（决定e光/反射光方向）
   * @returns 两个光包：p光（直射，水平偏振）和s光（偏折，垂直偏振）
   */
  static splitLight(input: LightPacket, crystalFacing: Direction): [LightPacket, LightPacket] {
    // 将输入光分解为0度和90度两个分量
    // 使用向量分解：分量强度与cos²和sin²成正比
    const radians = (input.polarization * Math.PI) / 180;

    // p光 (transmitted) 强度（与cos²成正比）- 水平偏振分量
    const pIntensity = Math.floor(input.intensity * Math.pow(Math.cos(radians), 2));
    // s光 (reflected/deflected) 强度（与sin²成正比）- 垂直偏振分量
    const sIntensity = Math.floor(input.intensity * Math.pow(Math.sin(radians), 2));

    // p光：0度偏振（水平），继续原方向
    const pLight: LightPacket = {
      direction: input.direction,
      intensity: pIntensity,
      polarization: 0,
      phase: input.phase
    };

    // s光：90度偏振（垂直），偏折方向（基于分束器朝向）
    const sLight: LightPacket = {
      direction: this.getRefractedDirection(input.direction, crystalFacing),
      intensity: sIntensity,
      polarization: 90,
      phase: input.phase
    };

    return [pLight, sLight];
  }

  /**
   * 公理四：干涉叠加 (Interference) - SIMPLIFIED BINARY MODEL
   * 计算两束光的干涉结果
   * 同相叠加，反相抵消
   *
   * ⚠️ SCIENTIFIC NOTE: This is a SIMPLIFIED BINARY interference model.
   * Real interference follows a continuous formula:
   *   I = I₁ + I₂ + 2√(I₁I₂)cos(δ)
   * where δ is the phase difference (can be any value from 0 to 2π).
   *
   * This simplified model only supports phase = +1 (0°) or -1 (180°):
   * - Same phase (+1, +1) → Constructive: I = I₁ + I₂
   * - Opposite phase (+1, -1) → Destructive: I = |I₁ - I₂|
   *
   * For accurate continuous interference with arbitrary phase differences,
   * use the Wave Optics engine (calculateInterferenceWave / superposeLights).
   *
   * @param lights 同一位置的光包数组
   * @returns 干涉后的光包数组
   */
  static calculateInterference(lights: LightPacket[]): LightPacket[] {
    if (!lights || lights.length === 0) return [];
    if (lights.length === 1) return lights;

    // 按方向和偏振角分组
    const groups = new Map<string, LightPacket[]>();

    for (const light of lights) {
      // Validate light packet has required properties
      if (!light || typeof light.direction !== 'string' || typeof light.polarization !== 'number') {
        logger.error('Invalid light packet in interference calculation:', light);
        continue;
      }

      // 正交的光不干涉，所以我们按(方向, 偏振角)分组
      const key = `${light.direction}_${light.polarization}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(light);
    }

    const result: LightPacket[] = [];

    for (const [, groupLights] of groups) {
      // Skip empty groups (shouldn't happen, but be safe)
      if (!groupLights || groupLights.length === 0) {
        continue;
      }

      if (groupLights.length === 1) {
        result.push(groupLights[0]);
        continue;
      }

      // 计算干涉 (Binary model: phase is +1 or -1)
      // 正相(+1)和正相(+1) = 强度相加 (constructive)
      // 正相(+1)和反相(-1) = 强度相减 (destructive)
      let positiveSum = 0;
      let negativeSum = 0;

      for (const light of groupLights) {
        // Validate intensity is a valid number
        const intensity = typeof light.intensity === 'number' && !isNaN(light.intensity)
          ? light.intensity
          : 0;

        if (light.phase === 1) {
          positiveSum += intensity;
        } else {
          negativeSum += intensity;
        }
      }

      const netIntensity = Math.abs(positiveSum - negativeSum);
      const resultPhase: Phase = positiveSum >= negativeSum ? 1 : -1;

      if (netIntensity > 0) {
        result.push({
          direction: groupLights[0].direction,
          intensity: Math.min(netIntensity, 15), // 最大强度15
          polarization: groupLights[0].polarization,
          phase: resultPhase
        });
      }
    }

    return result;
  }

  /**
   * 计算连续相位干涉强度 (Continuous Interference)
   * Uses the proper interference formula: I = I₁ + I₂ + 2√(I₁I₂)cos(δ)
   *
   * @param intensity1 First beam intensity (0-1 scale)
   * @param intensity2 Second beam intensity (0-1 scale)
   * @param phaseDifferenceRadians Phase difference δ in radians
   * @returns Resulting intensity (0-1 scale, can exceed 1 for constructive)
   */
  static calculateContinuousInterference(
    intensity1: number,
    intensity2: number,
    phaseDifferenceRadians: number
  ): number {
    // Interference formula: I = I₁ + I₂ + 2√(I₁I₂)cos(δ)
    const interferenceterm = 2 * Math.sqrt(intensity1 * intensity2) * Math.cos(phaseDifferenceRadians);
    return Math.max(0, intensity1 + intensity2 + interferenceterm);
  }

  /**
   * 处理光通过偏振片
   */
  static processPolarizerBlock(input: LightPacket, blockState: BlockState): LightPacket | null {
    const filterAngle = blockState.polarizationAngle;
    const newIntensity = this.applyMalusLaw(input.intensity, input.polarization, filterAngle);

    if (newIntensity <= 0) {
      return null; // 光被完全吸收
    }

    return {
      direction: input.direction,
      intensity: newIntensity,
      polarization: filterAngle, // 光的偏振角变为偏振片角度
      phase: input.phase
    };
  }

  /**
   * 处理光通过波片（旋光器）
   */
  static processRotatorBlock(input: LightPacket, blockState: BlockState): LightPacket {
    const rotationAmount = blockState.rotationAmount;
    let newAngle = (input.polarization + rotationAmount) % 180;

    // 确保角度是有效的PolarizationAngle
    newAngle = this.normalizeAngle(newAngle);

    return {
      direction: input.direction,
      intensity: input.intensity, // 波片不损失强度
      polarization: newAngle as PolarizationAngle,
      phase: input.phase
    };
  }

  /**
   * 处理光通过偏振分束器 (PBS/Wollaston Prism)
   *
   * ⚠️ SCIENTIFIC NOTE: See splitLight() documentation for accuracy notes.
   * This block represents a PBS or Wollaston Prism with 90° beam separation,
   * NOT a natural calcite crystal (~6° walk-off).
   */
  static processSplitterBlock(input: LightPacket, blockState: BlockState): LightPacket[] {
    const [pLight, sLight] = this.splitLight(input, blockState.facing);
    const result: LightPacket[] = [];

    if (pLight.intensity > 0) result.push(pLight);
    if (sLight.intensity > 0) result.push(sLight);

    return result;
  }

  /**
   * 处理光通过反射镜
   */
  static processMirrorBlock(input: LightPacket, blockState: BlockState): LightPacket | null {
    // 反射镜只反射从正面来的光
    const mirrorFacing = blockState.facing;
    const inputFrom = OPPOSITE_DIRECTION[input.direction];

    // 检查光是否从镜子正面来
    if (!this.isLightHittingMirror(inputFrom, mirrorFacing)) {
      return null; // 光从背面穿过，不反射
    }

    // 计算反射方向
    const reflectedDirection = this.getReflectedDirection(input.direction, mirrorFacing);

    return {
      direction: reflectedDirection,
      intensity: input.intensity, // 镜面反射不损失强度
      polarization: input.polarization,
      phase: input.phase
    };
  }

  /**
   * 检查光是否击中镜子正面
   */
  private static isLightHittingMirror(lightFrom: Direction, mirrorFacing: Direction): boolean {
    // 简化：镜子面向的方向和光来的方向相同时才反射
    return lightFrom === mirrorFacing;
  }

  /**
   * 计算反射方向
   */
  private static getReflectedDirection(inputDirection: Direction, _mirrorFacing: Direction): Direction {
    // 简化的反射逻辑：根据镜子朝向决定反射方向
    // 镜子面向north，光从south来（向north走），反射后向south走
    // 对于简单的轴对齐镜子，反射方向是入射方向的反方向
    // 更复杂的45度镜子可以稍后实现
    return OPPOSITE_DIRECTION[inputDirection];
  }

  /**
   * 计算折射方向（用于双折射晶体）
   */
  private static getRefractedDirection(inputDirection: Direction, crystalFacing: Direction): Direction {
    // 简化：e光向晶体面向方向的垂直方向折射
    // 实际实现会更复杂，这里用简单的规则
    const horizontalDirs: Direction[] = ['north', 'south', 'east', 'west'];

    if (horizontalDirs.includes(inputDirection)) {
      // 水平入射，e光向右折射（相对于入射方向）
      return this.getPerpendicularDirection(inputDirection);
    } else {
      // 垂直入射，e光向任一水平方向折射
      return crystalFacing;
    }
  }

  /**
   * 获取垂直方向（右手法则）
   */
  private static getPerpendicularDirection(dir: Direction): Direction {
    const perpMap: Record<Direction, Direction> = {
      north: 'east',
      east: 'south',
      south: 'west',
      west: 'north',
      up: 'north',
      down: 'south'
    };
    return perpMap[dir];
  }

  /**
   * 将角度标准化到有效的偏振角度
   */
  private static normalizeAngle(angle: number): PolarizationAngle {
    // Validate input is a valid number
    if (isNaN(angle) || !isFinite(angle)) {
      logger.error(`Invalid angle value: ${angle}. Defaulting to 0.`);
      return 0;
    }

    // 将角度限制在0-180范围内
    angle = ((angle % 180) + 180) % 180;

    // 找到最接近的有效角度
    const validAngles: PolarizationAngle[] = [0, 45, 90, 135];

    // Safety check - validAngles should never be empty, but validate anyway
    if (validAngles.length === 0) {
      logger.error('No valid polarization angles defined. Defaulting to 0.');
      return 0;
    }

    let closest = validAngles[0];
    let minDiff = Math.abs(angle - validAngles[0]);

    for (const valid of validAngles) {
      const diff = Math.abs(angle - valid);
      if (diff < minDiff) {
        minDiff = diff;
        closest = valid;
      }
    }

    return closest;
  }

  /**
   * 根据方块旋转获取实际朝向
   */
  static getActualFacing(baseFacing: Direction, rotation: number): Direction {
    if (baseFacing === 'up' || baseFacing === 'down') {
      return baseFacing; // 垂直方向不受水平旋转影响
    }

    const horizontalOrder: Direction[] = ['north', 'east', 'south', 'west'];
    const baseIndex = horizontalOrder.indexOf(baseFacing);

    // Validate baseFacing is a valid horizontal direction
    if (baseIndex === -1) {
      logger.error(`Invalid base facing direction: "${baseFacing}". Defaulting to "north".`);
      return 'north';
    }

    // Validate rotation is a valid number
    if (isNaN(rotation) || !isFinite(rotation)) {
      logger.error(`Invalid rotation value: ${rotation}. Defaulting to 0.`);
      return baseFacing;
    }

    const rotationSteps = Math.floor(rotation / 90) % 4;
    const newIndex = (baseIndex + rotationSteps + 4) % 4; // Add 4 to handle negative modulo

    return horizontalOrder[newIndex];
  }

  /**
   * 计算光强度对应的颜色亮度
   */
  static getIntensityBrightness(intensity: number): number {
    return intensity / 15;
  }

  // ============== 高级方块物理处理 ==============

  /**
   * 处理光通过吸收器
   * 吸收器按比例降低光强度
   */
  static processAbsorberBlock(input: LightPacket, blockState: BlockState): LightPacket | null {
    const absorptionRate = blockState.absorptionRate ?? 0.5;
    const transmittedIntensity = Math.floor(input.intensity * (1 - absorptionRate));

    if (transmittedIntensity <= 0) {
      return null;
    }

    return {
      direction: input.direction,
      intensity: transmittedIntensity,
      polarization: input.polarization,
      phase: input.phase
    };
  }

  /**
   * 处理光通过相位调制器
   * 改变光的相位（用于干涉）
   */
  static processPhaseShifterBlock(input: LightPacket, blockState: BlockState): LightPacket {
    const phaseShift = blockState.phaseShift ?? 0;

    // 相位偏移：0° = 无变化，180° = 反相
    // 简化模型：90°和270°暂时不改变相位（更精确的模型需要复数表示）
    let newPhase = input.phase;
    if (phaseShift === 180) {
      newPhase = input.phase === 1 ? -1 : 1;
    }

    return {
      direction: input.direction,
      intensity: input.intensity,
      polarization: input.polarization,
      phase: newPhase
    };
  }

  /**
   * 处理光通过分束器
   * 将光分成两束：一束透射，一束反射
   */
  static processBeamSplitterBlock(
    input: LightPacket,
    blockState: BlockState
  ): LightPacket[] {
    const splitRatio = blockState.splitRatio ?? 0.5;

    // 透射光（继续原方向）
    const transmittedIntensity = Math.floor(input.intensity * splitRatio);
    // 反射光（垂直方向）
    const reflectedIntensity = Math.floor(input.intensity * (1 - splitRatio));

    const result: LightPacket[] = [];

    if (transmittedIntensity > 0) {
      result.push({
        direction: input.direction,
        intensity: transmittedIntensity,
        polarization: input.polarization,
        phase: input.phase
      });
    }

    if (reflectedIntensity > 0) {
      // 反射光方向：垂直于入射方向
      const reflectedDirection = this.getPerpendicularDirection(input.direction);
      result.push({
        direction: reflectedDirection,
        intensity: reflectedIntensity,
        polarization: input.polarization,
        phase: input.phase
      });
    }

    return result;
  }

  /**
   * 处理光通过光学旋转器 (45°)
   *
   * ⚠️ SCIENTIFIC NOTE: This is a SIMPLIFIED MODEL for game compatibility.
   * A real Quarter-Wave Plate (QWP) introduces a π/2 phase retardation between
   * orthogonal polarization components, converting linear → circular polarization.
   *
   * This game engine block functions as a 45° OPTICAL ROTATOR, NOT a true QWP:
   * - True QWP: Linear (45°) + QWP → Circular polarization (requires complex Jones vector)
   * - This model: Linear (θ) + "QWP" → Linear (θ + 45°) (simplified scalar rotation)
   *
   * For accurate QWP simulation, use the Jones Calculus engine (processQuarterWaveWave).
   * The UI should label this as "Rotator (45°)" to avoid misleading students.
   */
  static processQuarterWaveBlock(input: LightPacket, _blockState: BlockState): LightPacket {
    // Simplified model: rotate polarization angle by 45°
    // This is physically equivalent to an optical rotator, NOT a quarter-wave plate
    const newAngle = this.normalizeAngle(input.polarization + 45);

    return {
      direction: input.direction,
      intensity: input.intensity,
      polarization: newAngle as PolarizationAngle,
      phase: input.phase
    };
  }

  /**
   * 处理光通过光学旋转器 (90°)
   *
   * ⚠️ SCIENTIFIC NOTE: This is a SIMPLIFIED MODEL for game compatibility.
   * A real Half-Wave Plate (HWP) introduces a π phase retardation and rotates
   * the polarization direction by 2θ (where θ is the angle between input
   * polarization and the fast axis).
   *
   * This game engine block functions as a 90° OPTICAL ROTATOR:
   * - True HWP: Rotates polarization by 2 × (fast_axis_angle - input_angle)
   * - This model: Linear (θ) + "HWP" → Linear (θ + 90°) (simplified scalar rotation)
   *
   * For accurate HWP simulation, use the Jones Calculus engine (processHalfWaveWave).
   * The UI should label this as "Rotator (90°)" to avoid misleading students.
   */
  static processHalfWaveBlock(input: LightPacket, _blockState: BlockState): LightPacket {
    // Simplified model: rotate polarization angle by 90°
    // This is physically equivalent to an optical rotator, NOT a half-wave plate
    const newAngle = this.normalizeAngle(input.polarization + 90);

    return {
      direction: input.direction,
      intensity: input.intensity,
      polarization: newAngle as PolarizationAngle,
      phase: input.phase
    };
  }

  /**
   * 处理光通过棱镜
   * 折射并可选择性地产生色散效果
   * 简化模型：改变光的方向（向facing方向偏折）
   */
  static processPrismBlock(input: LightPacket, blockState: BlockState): LightPacket {
    // 棱镜折射：光线向棱镜朝向方向偏折
    const prismFacing = blockState.facing;
    let newDirection = input.direction;

    // 如果光线与棱镜朝向垂直，则偏折
    if (this.areDirectionsPerpendicular(input.direction, prismFacing)) {
      newDirection = prismFacing;
    }

    return {
      direction: newDirection,
      intensity: input.intensity,
      polarization: input.polarization,
      phase: input.phase
    };
  }

  /**
   * 处理光通过透镜
   * 聚焦（正焦距）或发散（负焦距）光线
   * 简化模型：正焦距保持方向，负焦距可能发散
   */
  static processLensBlock(input: LightPacket, blockState: BlockState): LightPacket[] {
    const focalLength = blockState.focalLength ?? 2;
    const isConverging = focalLength > 0;

    if (isConverging) {
      // 聚焦透镜：光继续原方向（简化模型）
      return [{
        direction: input.direction,
        intensity: input.intensity,
        polarization: input.polarization,
        phase: input.phase
      }];
    } else {
      // 发散透镜：光分成多个方向（简化为两束）
      const intensity1 = Math.floor(input.intensity * 0.5);
      const intensity2 = input.intensity - intensity1;

      const result: LightPacket[] = [];

      if (intensity1 > 0) {
        result.push({
          direction: input.direction,
          intensity: intensity1,
          polarization: input.polarization,
          phase: input.phase
        });
      }

      if (intensity2 > 0) {
        result.push({
          direction: this.getPerpendicularDirection(input.direction),
          intensity: intensity2,
          polarization: input.polarization,
          phase: input.phase
        });
      }

      return result;
    }
  }

  /**
   * 检查两个方向是否垂直
   */
  private static areDirectionsPerpendicular(dir1: Direction, dir2: Direction): boolean {
    const horizontal: Direction[] = ['north', 'south', 'east', 'west'];
    const vertical: Direction[] = ['up', 'down'];

    // 水平和垂直方向互相垂直
    if ((horizontal.includes(dir1) && vertical.includes(dir2)) ||
        (vertical.includes(dir1) && horizontal.includes(dir2))) {
      return true;
    }

    // 水平方向中的垂直关系
    const perpPairs: [Direction, Direction][] = [
      ['north', 'east'], ['north', 'west'],
      ['south', 'east'], ['south', 'west']
    ];

    for (const [a, b] of perpPairs) {
      if ((dir1 === a && dir2 === b) || (dir1 === b && dir2 === a)) {
        return true;
      }
    }

    return false;
  }

  // ============================================================
  // Jones Calculus Wave Optics Methods (科学精确波动光学)
  // ============================================================

  /**
   * Energy threshold for light propagation termination
   * Light below this intensity will not propagate further
   */
  static readonly ENERGY_THRESHOLD = 0.01;

  /**
   * Create Jones Matrix for a linear polarizer at given angle
   * 偏振片的Jones矩阵
   */
  static getPolarizerMatrix(angleDegrees: number): JonesMatrix {
    return JonesMatrix.linearPolarizerDegrees(angleDegrees);
  }

  /**
   * Create Jones Matrix for a wave plate (retarder)
   * 波片的Jones矩阵
   * @param retardationDegrees Phase retardation in degrees (90 for λ/4, 180 for λ/2)
   * @param fastAxisDegrees Angle of fast axis in degrees
   */
  static getWaveplateMatrix(retardationDegrees: number, fastAxisDegrees: number): JonesMatrix {
    const retardationRadians = retardationDegrees * Math.PI / 180;
    const fastAxisRadians = fastAxisDegrees * Math.PI / 180;
    return JonesMatrix.waveplate(retardationRadians, fastAxisRadians);
  }

  /**
   * Create Jones Matrix for a quarter-wave plate
   * 四分之一波片的Jones矩阵
   */
  static getQuarterWavePlateMatrix(fastAxisDegrees: number = 45): JonesMatrix {
    return JonesMatrix.quarterWavePlateDegrees(fastAxisDegrees);
  }

  /**
   * Create Jones Matrix for a half-wave plate
   * 二分之一波片的Jones矩阵
   */
  static getHalfWavePlateMatrix(fastAxisDegrees: number = 45): JonesMatrix {
    return JonesMatrix.halfWavePlateDegrees(fastAxisDegrees);
  }

  /**
   * Create Jones Matrix for an optical rotator
   * 旋光器的Jones矩阵
   */
  static getRotatorMatrix(rotationDegrees: number): JonesMatrix {
    return JonesMatrix.rotatorDegrees(rotationDegrees);
  }

  /**
   * Create Jones Matrix for an attenuator/absorber
   * 吸收器的Jones矩阵
   * @param absorptionRate Rate of absorption (0 = full transmission, 1 = full absorption)
   */
  static getAbsorberMatrix(absorptionRate: number): JonesMatrix {
    const transmittance = 1 - Math.max(0, Math.min(1, absorptionRate));
    return JonesMatrix.attenuator(transmittance);
  }

  /**
   * Create Jones Matrix for a phase shifter
   * 相位调制器的Jones矩阵
   */
  static getPhaseShifterMatrix(phaseShiftDegrees: number): JonesMatrix {
    return JonesMatrix.phaseShifter(phaseShiftDegrees * Math.PI / 180);
  }

  /**
   * Process WaveLight through a polarizer block using Jones Calculus
   * 使用Jones矩阵处理光通过偏振片
   */
  static processPolarizerWave(input: WaveLight, blockState: BlockState): WaveLight | null {
    const matrix = this.getPolarizerMatrix(blockState.polarizationAngle);
    const outputJones = matrix.apply(input.jones);

    if (outputJones.intensity < this.ENERGY_THRESHOLD) {
      return null;
    }

    return {
      jones: outputJones,
      direction: input.direction,
      globalPhase: input.globalPhase,
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through a rotator block using Jones Calculus
   * 使用Jones矩阵处理光通过旋光器
   */
  static processRotatorWave(input: WaveLight, blockState: BlockState): WaveLight {
    const matrix = this.getRotatorMatrix(blockState.rotationAmount);
    const outputJones = matrix.apply(input.jones);

    return {
      jones: outputJones,
      direction: input.direction,
      globalPhase: input.globalPhase,
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through a beam splitter (birefringent crystal)
   * 使用Jones矩阵处理光通过双折射晶体
   * Returns [o-ray, e-ray] both as WaveLight
   */
  static processSplitterWave(input: WaveLight, blockState: BlockState): WaveLight[] {
    // Horizontal polarizer for o-ray (extracts horizontal component)
    const oMatrix = JonesMatrix.horizontalPolarizer();
    // Vertical polarizer for e-ray (extracts vertical component)
    const eMatrix = JonesMatrix.verticalPolarizer();

    const oJones = oMatrix.apply(input.jones);
    const eJones = eMatrix.apply(input.jones);

    const results: WaveLight[] = [];

    // o-ray continues in original direction
    if (oJones.intensity >= this.ENERGY_THRESHOLD) {
      results.push({
        jones: oJones,
        direction: input.direction,
        globalPhase: input.globalPhase,
        sourceId: input.sourceId,
        pathLength: input.pathLength
      });
    }

    // e-ray is refracted (direction depends on crystal facing)
    if (eJones.intensity >= this.ENERGY_THRESHOLD) {
      results.push({
        jones: eJones,
        direction: this.getRefractedDirection(input.direction, blockState.facing),
        globalPhase: input.globalPhase,
        sourceId: input.sourceId,
        pathLength: input.pathLength
      });
    }

    return results;
  }

  /**
   * Process WaveLight through a mirror block
   * 处理光通过反射镜
   */
  static processMirrorWave(input: WaveLight, blockState: BlockState): WaveLight | null {
    const mirrorFacing = blockState.facing;
    const inputFrom = OPPOSITE_DIRECTION[input.direction];

    if (!this.isLightHittingMirror(inputFrom, mirrorFacing)) {
      return null;
    }

    // Mirror reflection can introduce phase shift (simplified model)
    const mirrorMatrix = JonesMatrix.mirror();
    const outputJones = mirrorMatrix.apply(input.jones);

    return {
      jones: outputJones,
      direction: this.getReflectedDirection(input.direction, mirrorFacing),
      globalPhase: input.globalPhase + Math.PI, // π phase shift on reflection
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through an absorber block
   * 处理光通过吸收器
   */
  static processAbsorberWave(input: WaveLight, blockState: BlockState): WaveLight | null {
    const matrix = this.getAbsorberMatrix(blockState.absorptionRate ?? 0.5);
    const outputJones = matrix.apply(input.jones);

    if (outputJones.intensity < this.ENERGY_THRESHOLD) {
      return null;
    }

    return {
      jones: outputJones,
      direction: input.direction,
      globalPhase: input.globalPhase,
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through a phase shifter block
   * 处理光通过相位调制器
   */
  static processPhaseShifterWave(input: WaveLight, blockState: BlockState): WaveLight {
    const matrix = this.getPhaseShifterMatrix(blockState.phaseShift ?? 0);
    const outputJones = matrix.apply(input.jones);

    return {
      jones: outputJones,
      direction: input.direction,
      globalPhase: input.globalPhase + (blockState.phaseShift ?? 0) * Math.PI / 180,
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through a beam splitter (non-polarizing)
   * 处理光通过分束器
   */
  static processBeamSplitterWave(input: WaveLight, blockState: BlockState): WaveLight[] {
    const splitRatio = blockState.splitRatio ?? 0.5;

    const results: WaveLight[] = [];

    // Transmitted beam
    const transmittedAmplitude = Math.sqrt(splitRatio);
    if (transmittedAmplitude > Math.sqrt(this.ENERGY_THRESHOLD)) {
      results.push({
        jones: input.jones.scale(transmittedAmplitude),
        direction: input.direction,
        globalPhase: input.globalPhase,
        sourceId: input.sourceId,
        pathLength: input.pathLength
      });
    }

    // Reflected beam (with π/2 phase shift)
    const reflectedAmplitude = Math.sqrt(1 - splitRatio);
    if (reflectedAmplitude > Math.sqrt(this.ENERGY_THRESHOLD)) {
      results.push({
        jones: input.jones.scale(reflectedAmplitude),
        direction: this.getPerpendicularDirection(input.direction),
        globalPhase: input.globalPhase + Math.PI / 2,
        sourceId: input.sourceId,
        pathLength: input.pathLength
      });
    }

    return results;
  }

  /**
   * Process WaveLight through a quarter-wave plate
   * 处理光通过四分之一波片
   */
  static processQuarterWaveWave(input: WaveLight, blockState: BlockState): WaveLight {
    // Default fast axis at 45° converts linear to circular
    const fastAxis = blockState.rotationAmount ?? 45;
    const matrix = this.getQuarterWavePlateMatrix(fastAxis);
    const outputJones = matrix.apply(input.jones);

    return {
      jones: outputJones,
      direction: input.direction,
      globalPhase: input.globalPhase,
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through a half-wave plate
   * 处理光通过二分之一波片
   */
  static processHalfWaveWave(input: WaveLight, blockState: BlockState): WaveLight {
    // Default fast axis at 45° rotates polarization by 90°
    const fastAxis = blockState.rotationAmount ?? 45;
    const matrix = this.getHalfWavePlateMatrix(fastAxis / 2); // HWP rotates by 2θ
    const outputJones = matrix.apply(input.jones);

    return {
      jones: outputJones,
      direction: input.direction,
      globalPhase: input.globalPhase,
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through a prism
   * 处理光通过棱镜
   */
  static processPrismWave(input: WaveLight, blockState: BlockState): WaveLight {
    const prismFacing = blockState.facing;
    let newDirection = input.direction;

    if (this.areDirectionsPerpendicular(input.direction, prismFacing)) {
      newDirection = prismFacing;
    }

    return {
      jones: input.jones,
      direction: newDirection,
      globalPhase: input.globalPhase,
      sourceId: input.sourceId,
      pathLength: input.pathLength
    };
  }

  /**
   * Process WaveLight through a lens
   * 处理光通过透镜
   */
  static processLensWave(input: WaveLight, blockState: BlockState): WaveLight[] {
    const focalLength = blockState.focalLength ?? 2;
    const isConverging = focalLength > 0;

    if (isConverging) {
      return [{
        jones: input.jones,
        direction: input.direction,
        globalPhase: input.globalPhase,
        sourceId: input.sourceId,
        pathLength: input.pathLength
      }];
    } else {
      // Diverging lens splits into two beams
      const amplitude = Math.sqrt(0.5);
      const results: WaveLight[] = [];

      if (input.jones.intensity * 0.5 >= this.ENERGY_THRESHOLD) {
        results.push({
          jones: input.jones.scale(amplitude),
          direction: input.direction,
          globalPhase: input.globalPhase,
          sourceId: input.sourceId,
          pathLength: input.pathLength
        });

        results.push({
          jones: input.jones.scale(amplitude),
          direction: this.getPerpendicularDirection(input.direction),
          globalPhase: input.globalPhase,
          sourceId: input.sourceId,
          pathLength: input.pathLength
        });
      }

      return results;
    }
  }

  /**
   * Calculate coherent interference of multiple WaveLights
   * 计算多束光的相干叠加
   */
  static calculateInterferenceWave(lights: WaveLight[]): WaveLight[] {
    return superposeLights(lights);
  }

  /**
   * Convert legacy LightPacket to WaveLight
   * 将传统光包转换为波动光学表示
   */
  static toWaveLight(packet: LightPacket, sourceId: string = 'legacy'): WaveLight {
    return lightPacketToWaveLight(packet, sourceId);
  }

  /**
   * Convert WaveLight to legacy LightPacket
   * 将波动光学表示转换为传统光包
   */
  static toLightPacket(light: WaveLight): LightPacket {
    return waveLightToLightPacket(light);
  }

  /**
   * Check if light intensity is above propagation threshold
   * 检查光强是否高于传播阈值
   */
  static isAboveThreshold(light: WaveLight): boolean {
    return light.jones.intensity >= this.ENERGY_THRESHOLD;
  }

  /**
   * Create initial WaveLight from emitter block
   * 从发射器方块创建初始波动光
   */
  static createEmitterWave(blockState: BlockState, sourceId: string): WaveLight {
    const direction = this.getActualFacing(blockState.facing, blockState.rotation);
    return {
      jones: JonesVector.linearPolarizationDegrees(blockState.polarizationAngle, 1),
      direction,
      globalPhase: 0,
      sourceId,
      pathLength: 0
    };
  }

  /**
   * Advance WaveLight by one block (adds to path length)
   * 将波动光前进一个方块
   */
  static advanceWaveLight(light: WaveLight): WaveLight {
    return {
      ...light,
      pathLength: light.pathLength + 1,
      // Add phase from path length (simplified: assume wavelength = 1 block)
      globalPhase: light.globalPhase + 2 * Math.PI
    };
  }
}

// Re-export wave optics types for convenience
export { JonesVector, JonesMatrix, superposeLights } from './WaveOptics';
export type { Complex, WaveLight } from './WaveOptics';
