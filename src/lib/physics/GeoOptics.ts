/**
 * 几何光学物理模块 | Geometric Optics Physics Module
 * 斯涅尔定律、反射、折射和双折射计算 | Snell's law, reflection, refraction, and birefringence calculations
 */

import * as THREE from "three";

// ============================================================================
// 常见材料折射率 | REFRACTIVE INDICES FOR COMMON MATERIALS
// ============================================================================

/**
 * 各种材料在589nm（钠D线）处的折射率 | Refractive indices for various materials at 589nm (sodium D line)
 */
export const REFRACTIVE_INDICES = {
  // 真空/空气 | Vacuum/Air
  air: 1.0003,
  vacuum: 1.0,

  // 玻璃 | Glasses
  water: 1.333,
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

// ============================================================================
// 斯涅尔定律 | SNELL'S LAW
// ============================================================================

/**
 * 斯涅尔定律计算参数 | Parameters for Snell's law calculation
 */
export interface SnellParams {
  incidentAngle: number; // 入射角（度） | Angle of incidence in degrees
  n1: number; // 入射介质折射率 | Refractive index of incident medium
  n2: number; // 折射介质折射率 | Refractive index of refractive medium
}

/**
 * 使用斯涅尔定律计算折射角 | Calculate refraction angle using Snell's law
 * n1 * sin(θ1) = n2 * sin(θ2)
 * @param params - 斯涅尔定律参数 | Snell's law parameters
 * @returns 折射角（度），发生全反射时返回null | Refraction angle in degrees, or null if total internal reflection occurs
 */
export function calculateRefractionAngle(params: SnellParams): number | null {
  const { incidentAngle, n1, n2 } = params;
  const theta1 = (incidentAngle * Math.PI) / 180;

  // 检查全反射 | Check for total internal reflection
  const criticalAngle = Math.asin(n2 / n1);
  if (theta1 > criticalAngle && n1 > n2) {
    return null; // 全反射 | Total internal reflection
  }

  const sinTheta2 = (n1 * Math.sin(theta1)) / n2;
  const theta2 = Math.asin(Math.min(1, Math.max(-1, sinTheta2)));

  return (theta2 * 180) / Math.PI;
}

/**
 * 计算全反射临界角 | Calculate critical angle for total internal reflection
 * @param n1 - 较密介质折射率 | Refractive index of denser medium
 * @param n2 - 较疏介质折射率 | Refractive index of rarer medium
 * @returns 临界角（度），若无全反射则返回null | Critical angle in degrees, or null if no total internal reflection possible
 */
export function calculateCriticalAngle(n1: number, n2: number): number | null {
  if (n1 <= n2) return null; // 不可能发生全反射 | No total internal reflection possible
  return (Math.asin(n2 / n1) * 180) / Math.PI;
}

// ============================================================================
// 布鲁斯特角 | BREWSTER'S ANGLE
// ============================================================================

/**
 * 计算布鲁斯特角 | Calculate Brewster's angle
 * tan(θ_B) = n2/n1
 * @param n1 - 入射介质折射率 | Refractive index of incident medium
 * @param n2 - 折射介质折射率 | Refractive index of refractive medium
 * @returns 布鲁斯特角（度） | Brewster angle in degrees
 */
export function calculateBrewsterAngle(n1: number, n2: number): number {
  return (Math.atan(n2 / n1) * 180) / Math.PI;
}

// ============================================================================
// 双折射 | BIREFRINGENCE (DOUBLE REFRACTION)
// ============================================================================

/**
 * 双折射计算参数 | Parameters for birefringence calculations
 */
export interface BirefringenceParams {
  incidentAngle: number; // 入射角（度） | Angle of incidence in degrees
  crystalRotation: number; // 晶体旋转角（度，光轴取向） | Crystal rotation angle in degrees (optical axis orientation)
  n_o?: number; // 寻常光折射率（默认方解石：1.658） | Ordinary refractive index (default calcite: 1.658)
  n_e?: number; // 非寻常光折射率（默认方解石：1.486） | Extraordinary refractive index (default calcite: 1.486)
}

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
 * 计算有效非寻常光折射率 | Calculate the effective extraordinary refractive index
 * 基于传播方向与光轴之间的夹角 | Based on the angle between propagation direction and optical axis
 * @param n_o - 寻常光折射率 | Ordinary refractive index
 * @param n_e - 非寻常光折射率 | Extraordinary refractive index
 * @param theta - 与光轴的夹角（弧度） | Angle from optical axis in radians
 * @returns e光的有效折射率 | Effective refractive index for e-ray
 */
export function calculateEffectiveNe(n_o: number, n_e: number, theta: number): number {
  // 椭球方程: 1/ne² = cos²θ/no² + sin²θ/ne² | Ellipsoid equation: 1/ne² = cos²θ/no² + sin²θ/ne²
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);

  const oneOverNeSquared = (cosTheta * cosTheta) / (n_o * n_o) +
                          (sinTheta * sinTheta) / (n_e * n_e);

  return 1 / Math.sqrt(oneOverNeSquared);
}

/**
 * 计算寻常光和非寻常光之间的走离角 | Calculate the walk-off angle between ordinary and extraordinary rays
 * @param params - 双折射参数 | Birefringence parameters
 * @returns 走离角（度） | Walk-off angle in degrees
 */
export function calculateWalkOffAngle(params: BirefringenceParams): number {
  const {
    incidentAngle,
    n_o = BIREFRINGENT_MATERIALS.calcite.n_o,
    n_e = BIREFRINGENT_MATERIALS.calcite.n_e,
  } = params;

  const theta_i = (incidentAngle * Math.PI) / 180;

  // o光严格遵循斯涅尔定律 | O-ray follows Snell's law exactly
  const sinTheta_o = Math.sin(theta_i) / n_o;
  const theta_o = Math.asin(Math.min(1, Math.max(-1, sinTheta_o)));

  // 计算波矢量与光学轴的夹角 | Calculate angle between wave vector and optical axis
  // 光学轴沿法线（Y轴）方向 | Optical axis is along normal (Y-axis)
  const thetaFromOpticalAxis = theta_o;

  // e光有效折射率 | E-ray effective refractive index
  const effective_n_e = calculateEffectiveNe(n_o, n_e, thetaFromOpticalAxis);

  const sinTheta_e = Math.sin(theta_i) / effective_n_e;
  const theta_e = Math.asin(Math.min(1, Math.max(-1, sinTheta_e)));

  return Math.abs(((theta_e - theta_o) * 180) / Math.PI);
}

/**
 * 计算光线通过双折射晶体的路径 | Calculate ray paths through a birefringent crystal
 * 返回用于光线追踪可视化的3D坐标 | Returns 3D coordinates for ray tracing visualization
 * @param params - 双折射参数 | Birefringence parameters
 * @param rayLength - 用于可视化的光线长度 | Length of rays for visualization
 * @returns 包含光线路径的对象（THREE.Vector3数组） | Object containing ray paths as THREE.Vector3 arrays
 */
export function calculateBirefringenceRayPaths(
  params: BirefringenceParams,
  rayLength: number = 3
): {
  incidentStart: THREE.Vector3; // 入射光起点 | Incident ray start
  incidentEnd: THREE.Vector3; // 入射光终点（晶体中心）| Incident ray end (crystal center)
  oRayEnd: THREE.Vector3; // o光终点 | O-ray end point
  eRayEnd: THREE.Vector3; // e光终点 | E-ray end point
  theta_o: number; // o光折射角（弧度）| O-ray refraction angle in radians
  theta_e: number; // e光折射角（弧度）| E-ray refraction angle in radians
  walkOffAngle: number; // 走离角（度）| Walk-off angle in degrees
} {
  const {
    incidentAngle,
    crystalRotation: _crystalRotation, // Unused: optical axis is vertical, rotation around Y doesn't change physics
    n_o = BIREFRINGENT_MATERIALS.calcite.n_o,
    n_e = BIREFRINGENT_MATERIALS.calcite.n_e,
  } = params;

  const theta_i = (incidentAngle * Math.PI) / 180;

  // 入射光（从空气到晶体中心）| Incident ray (from air to crystal center)
  const incidentStart = new THREE.Vector3(
    -rayLength * Math.sin(theta_i),
    rayLength * Math.cos(theta_i),
    0
  );
  const incidentEnd = new THREE.Vector3(0, 0, 0);

  // o光路径（严格遵循斯涅尔定律）| O-ray path (follows Snell's law exactly)
  const sinTheta_o = Math.sin(theta_i) / n_o;
  const theta_o = Math.asin(Math.min(1, Math.max(-1, sinTheta_o)));
  const oRayEnd = new THREE.Vector3(
    rayLength * Math.sin(theta_o),
    -rayLength * Math.cos(theta_o),
    0
  );

  // e光路径（根据晶体取向偏转）| E-ray path (deviates based on crystal orientation)
  // 注意：光学轴在场景中是垂直的（Y轴），晶体绕Y轴旋转
  // 因此 optical axis 与传播方向的夹角主要由 incidentAngle 决定，而不是 crystalRotation
  // Note: Optical axis is vertical (Y-axis) in the scene, crystal rotates around Y
  // So the angle between optical axis and propagation direction depends mainly on incidentAngle, not crystalRotation

  // 计算波矢量与光学轴的夹角 | Calculate angle between wave vector and optical axis
  // 光学轴沿Y轴（法线方向），入射光与法线夹角为theta_i
  // Optical axis is along Y (normal direction), incident angle from normal is theta_i
  // 考虑折射后，o-ray的角度为theta_o | After refraction, o-ray angle is theta_o
  // 对于负单轴晶体（方解石），当光线接近垂直入射时，θ ≈ theta_o
  // For negative uniaxial crystal (calcite), at near-normal incidence, θ ≈ theta_o

  // 使用o-ray的折射角作为波矢量与光学轴的夹角
  // Use o-ray refraction angle as the angle between wave vector and optical axis
  // 添加晶体旋转对角度的影响（如果光学轴不在法线方向）
  // Add effect of crystal rotation (if optical axis is not along normal)
  // 这里简化处理：假设光学轴沿法线（Y轴），晶体绕Y轴旋转不影响光学轴方向
  // Simplified: optical axis along normal (Y), rotation around Y doesn't change optical axis direction
  const thetaFromOpticalAxis = theta_o;

  const effective_n_e = calculateEffectiveNe(n_o, n_e, thetaFromOpticalAxis);

  const sinTheta_e = Math.sin(theta_i) / effective_n_e;
  const theta_e = Math.asin(Math.min(1, Math.max(-1, sinTheta_e)));

  // e光有横向走离分量 | E-ray has lateral walk-off component
  // 走离角取决于传播方向与光学轴的夹角 | Walk-off angle depends on angle between propagation and optical axis
  // 对于方解石，最大走离约6° | For calcite, max walk-off is about 6°
  // 简化计算：使用固定的走离比例用于可视化
  // Simplified: use fixed walk-off ratio for visualization
  // 方解石的走离角约为 arctan((n_o² - n_e²) / (2 * n_o * n_e)) ≈ 6°
  // Calcite walk-off angle ≈ arctan((n_o² - n_e²) / (2 * n_o * n_e)) ≈ 6°
  const maxWalkOffAngle = 6 * Math.PI / 180; // 6度 in radians
  const walkOffFactor = Math.sin(2 * thetaFromOpticalAxis); // 最大在45° | Max at 45°
  const walkOffMagnitude = rayLength * Math.tan(maxWalkOffAngle) * walkOffFactor;

  const eRayEnd = new THREE.Vector3(
    rayLength * Math.sin(theta_e) + walkOffMagnitude,
    -rayLength * Math.cos(theta_e),
    walkOffMagnitude * 0.3  // 稍微添加Z方向偏移用于3D效果 | Add small Z offset for 3D effect
  );

  const walkOffAngle = Math.abs(((theta_e - theta_o) * 180) / Math.PI);

  return {
    incidentStart,
    incidentEnd,
    oRayEnd,
    eRayEnd,
    theta_o,
    theta_e,
    walkOffAngle,
  };
}

/**
 * 计算通过双折射晶体观看文字时的双像偏移 | Calculate double image offset for text viewed through birefringent crystal
 * @param params - 双折射参数 | Birefringence parameters
 * @param distance - 文字距离晶体的距离（默认1单位）| Distance of text from crystal (default 1 unit)
 * @returns o光和e光像的偏移位置 | Offset positions for o-ray and e-ray images
 */
export function calculateDoubleImageOffset(
  params: BirefringenceParams,
  distance: number = 1
): {
  oRayOffset: number; // o光像偏移 | O-ray image offset
  eRayOffset: number; // e光像偏移 | E-ray image offset
} {
  const { crystalRotation } = params;

  // 偏移量随晶体旋转变化 | Offset varies with crystal rotation
  // o光偏移（一个方向）| O-ray offset (one direction)
  const oRayOffset = 0.4 + 0.1 * Math.sin((crystalRotation * Math.PI) / 180);

  // e光偏移（另一个方向）| E-ray offset (other direction)
  const eRayOffset = -0.3 - 0.1 * Math.cos((crystalRotation * Math.PI) / 180);

  return {
    oRayOffset: oRayOffset * distance,
    eRayOffset: eRayOffset * distance,
  };
}

/**
 * 根据名称获取双折射材料 | Get birefringence material by name
 * @param name - 材料名称 | Material name
 * @returns 材料属性，默认为方解石 | Material properties or default calcite
 */
export function getBirefringenceMaterial(name: string): BirefringenceMaterial {
  return BIREFRINGENT_MATERIALS[name] || BIREFRINGENT_MATERIALS.calcite;
}

/**
 * 格式化光线路径数据用于可视化 | Format ray path data for visualization
 * 将THREE.Vector3转换为简单的[x, y, z]数组，便于在组件中使用 | Converts THREE.Vector3 to simple [x, y, z] arrays for easier use in components
 * @param params - 双折射参数 | Birefringence parameters
 * @param rayLength - 用于可视化的光线长度 | Length of rays for visualization
 * @returns 格式化的光线路径数据 | Formatted ray path data
 */
export function getFormattedRayPaths(
  params: BirefringenceParams,
  rayLength: number = 3
): {
  incidentRay: [number, number, number][]; // 入射光路径 | Incident ray path
  oRay: [number, number, number][]; // o光路径 | O-ray path
  eRay: [number, number, number][]; // e光路径 | E-ray path
  walkOffAngle: number; // 走离角（度）| Walk-off angle in degrees
} {
  const paths = calculateBirefringenceRayPaths(params, rayLength);

  return {
    incidentRay: [
      [paths.incidentStart.x, paths.incidentStart.y, paths.incidentStart.z],
      [paths.incidentEnd.x, paths.incidentEnd.y, paths.incidentEnd.z],
    ],
    oRay: [
      [paths.incidentEnd.x, paths.incidentEnd.y, paths.incidentEnd.z],
      [paths.oRayEnd.x, paths.oRayEnd.y, paths.oRayEnd.z],
    ],
    eRay: [
      [paths.incidentEnd.x, paths.incidentEnd.y, paths.incidentEnd.z],
      [paths.eRayEnd.x, paths.eRayEnd.y, paths.eRayEnd.z],
    ],
    walkOffAngle: paths.walkOffAngle,
  };
}
