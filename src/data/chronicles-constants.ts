/**
 * Chronicles Page Constants
 * 光的编年史 - 常量配置
 */

// Category labels for timeline events
export const CATEGORY_LABELS = {
  discovery: { en: 'Discovery', zh: '发现', color: 'blue' as const },
  theory: { en: 'Theory', zh: '理论', color: 'purple' as const },
  experiment: { en: 'Experiment', zh: '实验', color: 'green' as const },
  application: { en: 'Application', zh: '应用', color: 'orange' as const },
}

// Mapping from illustration types to demo/module routes
// 将事件的 illustrationType 映射到对应的演示模块
export const ILLUSTRATION_TO_DEMO_MAP: Record<string, { route: string; labelEn: string; labelZh: string }> = {
  // Direct demo mappings
  'polarizer': { route: '/demos/malus', labelEn: 'Malus\'s Law Demo', labelZh: '马吕斯定律演示' },
  'malus': { route: '/demos/malus', labelEn: 'Malus\'s Law Demo', labelZh: '马吕斯定律演示' },
  'birefringence': { route: '/demos/birefringence', labelEn: 'Birefringence Demo', labelZh: '双折射演示' },
  'calcite': { route: '/demos/birefringence', labelEn: 'Birefringence Demo', labelZh: '双折射演示' },
  'wave': { route: '/demos/light-wave', labelEn: 'Light Wave Demo', labelZh: '光波演示' },
  'transverse': { route: '/demos/polarization-state', labelEn: 'Polarization State', labelZh: '偏振态演示' },
  'prism': { route: '/demos/chromatic', labelEn: 'Chromatic Demo', labelZh: '色散演示' },
  'double-slit': { route: '/demos/fresnel', labelEn: 'Fresnel Demo', labelZh: '菲涅尔演示' },
  'reflection': { route: '/demos/brewster', labelEn: 'Brewster Angle Demo', labelZh: '布儒斯特角演示' },
  'rayleigh': { route: '/demos/rayleigh', labelEn: 'Rayleigh Scattering', labelZh: '瑞利散射演示' },
  'stokes': { route: '/demos/stokes', labelEn: 'Stokes Vector Demo', labelZh: '斯托克斯矢量演示' },
  'mueller': { route: '/demos/mueller', labelEn: 'Mueller Matrix Demo', labelZh: '穆勒矩阵演示' },
  'jones': { route: '/demos/jones', labelEn: 'Jones Matrix Demo', labelZh: '琼斯矩阵演示' },
  'poincare': { route: '/demos/polarization-state', labelEn: 'Polarization State', labelZh: '偏振态演示' },
  'nicol': { route: '/demos/birefringence', labelEn: 'Birefringence Demo', labelZh: '双折射演示' },
  'faraday': { route: '/demos/optical-rotation', labelEn: 'Optical Rotation Demo', labelZh: '旋光演示' },
  'opticalactivity': { route: '/demos/optical-rotation', labelEn: 'Optical Rotation Demo', labelZh: '旋光演示' },
  'chirality': { route: '/demos/optical-rotation', labelEn: 'Optical Rotation Demo', labelZh: '旋光演示' },
  'chromaticpol': { route: '/demos/chromatic', labelEn: 'Chromatic Polarization', labelZh: '色偏振演示' },
  'lcd': { route: '/demos/polarization-types', labelEn: 'Polarization Types', labelZh: '偏振类型演示' },
  'photoelectric': { route: '/demos/polarization-intro', labelEn: 'Polarization Intro', labelZh: '偏振入门' },
  'metasurface': { route: '/demos/waveplate', labelEn: 'Waveplate Demo', labelZh: '波片演示' },
  'quantum': { route: '/demos/polarization-calculator', labelEn: 'Polarization Calculator', labelZh: '偏振计算器' },
  'medical': { route: '/demos/anisotropy', labelEn: 'Anisotropy Demo', labelZh: '各向异性演示' },
  'snell': { route: '/demos/fresnel', labelEn: 'Fresnel Demo', labelZh: '菲涅尔演示' },
  'lightspeed': { route: '/demos/light-wave', labelEn: 'Light Wave Demo', labelZh: '光波演示' },
  'mantis': { route: '/demos/polarization-types', labelEn: 'Polarization Types', labelZh: '偏振类型演示' },
}

// Optical bench experiment mappings for "复现实验" button
// 用于"在实验室复现"按钮的光学工作台实验映射
export const ILLUSTRATION_TO_BENCH_MAP: Record<string, { route: string; labelEn: string; labelZh: string }> = {
  'polarizer': { route: '/bench?experiment=malus-law', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
  'malus': { route: '/bench?experiment=malus-law', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
  'birefringence': { route: '/bench?experiment=birefringence', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
  'calcite': { route: '/bench?experiment=birefringence', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
  'nicol': { route: '/bench?experiment=birefringence', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
  'chromaticpol': { route: '/bench?experiment=chromatic-polarization', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
  'faraday': { route: '/bench?experiment=faraday-rotation', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
  'opticalactivity': { route: '/bench?experiment=optical-rotation', labelEn: 'Recreate in Lab', labelZh: '在实验室复现' },
}
