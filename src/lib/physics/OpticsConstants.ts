/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OPTICS CONSTANTS | 光学常量
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 共享的光学物理常量数据 | Shared optical physics constants
 * 被多个模块使用：几何光学、波动光学、游戏引擎
 *
 * 使用模块 | Used by:
 * - GeometricOptics: 几何光学演示计算
 * - LightPhysics: 游戏引擎方块物理
 * - WaveOptics: 波动光学精确计算
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/**
 * 各种材料在589nm（钠D线）处的折射率
 * Refractive indices for various materials at 589nm (sodium D line)
 *
 * 数据来源 | Data sources:
 * - Refractive Index Database: https://refractiveindex.info
 * - Handbook of Chemistry and Physics
 * - CRC Handbook of Optical Materials
 */
export const REFRACTIVE_INDICES = {
  // 真空/空气 | Vacuum/Air
  air: 1.0003,
  vacuum: 1.0,

  // 液体 | Liquids
  water: 1.333,
  ethanol: 1.361,

  // 玻璃 | Glasses
  crown_glass: 1.52,
  flint_glass: 1.62,
  diamond: 2.417,

  // 晶体 | Crystals
  quartz: 1.544,
  calcite_no: 1.658, // 寻常光折射率 | Ordinary ray refractive index
  calcite_ne: 1.486, // 非寻常光折射率 | Extraordinary ray refractive index
  ice: 1.31,

  // 塑料 | Plastics
  acrylic: 1.49,
  polycarbonate: 1.58,
} as const;

/**
 * 双折射材料属性 | Birefringence material properties
 */
export interface BirefringenceMaterial {
  name: string; // 材料名称 | Material name
  n_o: number; // 寻常光折射率 | Ordinary refractive index
  n_e: number; // 非寻常光折射率 | Extraordinary refractive index
  deltaN: number; // 双折射率 Δn = n_o - n_e | Birefringence Δn = n_o - n_e
}

/**
 * 常见双折射材料 | Common birefringent materials
 */
export const BIREFRINGENT_MATERIALS: Record<string, BirefringenceMaterial> = {
  calcite: {
    name: "方解石 (冰洲石) | Calcite (Iceland Spar)",
    n_o: 1.658,
    n_e: 1.486,
    deltaN: 0.172,
  },
  quartz: {
    name: "石英 | Quartz",
    n_o: 1.544,
    n_e: 1.553,
    deltaN: 0.009,
  },
  sodium_nitrate: {
    name: "硝酸钠 | Sodium Nitrate",
    n_o: 1.587,
    n_e: 1.336,
    deltaN: 0.251,
  },
  ice: {
    name: "冰 | Ice",
    n_o: 1.309,
    n_e: 1.313,
    deltaN: 0.004,
  },
};

/**
 * 光速 | Speed of light
 * c = 299,792,458 m/s
 */
export const SPEED_OF_LIGHT = 299_792_458; // m/s

/**
 * 普朗克常数 | Planck constant
 * h = 6.626 × 10⁻³⁴ J·s
 */
export const PLANCK_CONSTANT = 6.62607015e-34; // J·s

/**
 * 真空介电常数 | Vacuum permittivity
 * ε₀ = 8.854 × 10⁻¹² F/m
 */
export const VACUUM_PERMITTIVITY = 8.8541878128e-12; // F/m

/**
 * 真空磁导率 | Vacuum permeability
 * μ₀ = 4π × 10⁻⁷ H/m
 */
export const VACUUM_PERMEABILITY = 4 * Math.PI * 1e-7; // H/m

/**
 * 常见激光波长（nm）| Common laser wavelengths
 */
export const LASER_WAVELENGTHS = {
  he_ne: 632.8, // 氦氖激光 | He-Ne laser (red)
  argon: 514.5, // 氩离子激光 | Argon ion (green)
  nd_yag: 1064, // Nd:YAG激光 (infrared)
  blue_diode: 450, // 蓝光二极管 | Blue diode laser
} as const;

/**
 * 可见光波长范围（nm）| Visible light wavelength range
 */
export const VISIBLE_LIGHT_RANGE = {
  min: 380, // 紫光 | Violet
  max: 700, // 红光 | Red
} as const;

/**
 * 根据名称获取双折射材料 | Get birefringence material by name
 * @param name - 材料名称 | Material name
 * @returns 材料属性，默认为方解石 | Material properties or default calcite
 */
export function getBirefringenceMaterial(name: string): BirefringenceMaterial {
  return BIREFRINGENT_MATERIALS[name] || BIREFRINGENT_MATERIALS.calcite;
}
