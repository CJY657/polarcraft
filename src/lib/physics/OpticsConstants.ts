/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * OPTICS CONSTANTS | 光学常量
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 共享的光学物理常量数据 | Shared optical physics constants
 *
 * 使用模块 | Used by:
 * - GeometricOptics: 几何光学演示计算
 * ═══════════════════════════════════════════════════════════════════════════════
 */

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
