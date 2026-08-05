/**
 * Course-Event Mapping - 课程与历史事件的多对多关系映射
 *
 * 设计原则：
 * 1. 课程演示(Demo)与历史事件(TimelineEvent)是多对多关系
 * 2. 支持双向查询：通过Demo找Event，通过Event找Demo
 * 3. 区分关联强度：primary(核心关联) vs secondary(相关联系)
 */

// 课程演示信息结构
export interface CourseDemo {
  id: string
  titleEn: string
  titleZh: string
  unit: number
  route: string
  difficulty: 'foundation' | 'application' | 'research'
}

// 多对多映射关系
export interface CourseEventMapping {
  demoId: string                          // 课程演示ID
  eventYear: number                       // 事件年份
  eventTrack: 'optics' | 'polarization'   // 事件轨道
  relevance: 'primary' | 'secondary'      // 关联强度
}

// Demo查找结果（用于UI展示）
export interface DemoSearchResult {
  id: string
  titleEn: string
  titleZh: string
  unit: number
  route: string
  relevance: 'primary' | 'secondary'
}

// =====================================
// 课程演示完整列表
// =====================================
export const COURSE_DEMOS: CourseDemo[] = [
  // Unit 0 - Optical Basics
  { id: 'light-wave', titleEn: 'Light Wave', titleZh: '光波演示', unit: 0, route: '/demos/light-wave', difficulty: 'foundation' },
  { id: 'polarization-intro', titleEn: 'Polarization Introduction', titleZh: '偏振入门', unit: 0, route: '/demos/polarization-intro', difficulty: 'foundation' },
  { id: 'polarization-types', titleEn: 'Polarization Types', titleZh: '偏振类型', unit: 0, route: '/demos/polarization-types', difficulty: 'application' },
  { id: 'optical-bench', titleEn: 'Interactive Optical Bench', titleZh: '交互式光学工作台', unit: 0, route: '/demos/optical-bench', difficulty: 'application' },

  // Unit 1 - Polarization Fundamentals
  { id: 'polarization-state', titleEn: 'Polarization State', titleZh: '偏振态', unit: 1, route: '/demos/polarization-state', difficulty: 'foundation' },
  { id: 'malus', titleEn: "Malus's Law", titleZh: '马吕斯定律', unit: 1, route: '/demos/malus', difficulty: 'application' },
  { id: 'birefringence', titleEn: 'Birefringence', titleZh: '双折射', unit: 1, route: '/demos/birefringence', difficulty: 'application' },
  { id: 'waveplate', titleEn: 'Waveplate', titleZh: '波片', unit: 1, route: '/demos/waveplate', difficulty: 'research' },

  // Unit 2 - Interface Reflection
  { id: 'fresnel', titleEn: 'Fresnel Equations', titleZh: '菲涅尔方程', unit: 2, route: '/demos/fresnel', difficulty: 'research' },
  { id: 'brewster', titleEn: "Brewster's Angle", titleZh: '布儒斯特角', unit: 2, route: '/demos/brewster', difficulty: 'application' },

  // Unit 3 - Transparent Media
  { id: 'anisotropy', titleEn: 'Anisotropy', titleZh: '各向异性', unit: 3, route: '/demos/anisotropy', difficulty: 'foundation' },
  { id: 'chromatic', titleEn: 'Chromatic Polarization', titleZh: '色偏振', unit: 3, route: '/demos/chromatic', difficulty: 'application' },
  { id: 'optical-rotation', titleEn: 'Optical Rotation', titleZh: '旋光', unit: 3, route: '/demos/optical-rotation', difficulty: 'application' },

  // Unit 4 - Scattering
  { id: 'mie-scattering', titleEn: 'Mie Scattering', titleZh: '米氏散射', unit: 4, route: '/demos/mie-scattering', difficulty: 'research' },
  { id: 'rayleigh', titleEn: 'Rayleigh Scattering', titleZh: '瑞利散射', unit: 4, route: '/demos/rayleigh', difficulty: 'foundation' },
  { id: 'monte-carlo-scattering', titleEn: 'Monte Carlo Scattering', titleZh: '蒙特卡洛散射', unit: 4, route: '/demos/monte-carlo-scattering', difficulty: 'research' },

  // Unit 5 - Full Polarimetry
  { id: 'stokes', titleEn: 'Stokes Vector', titleZh: '斯托克斯矢量', unit: 5, route: '/demos/stokes', difficulty: 'research' },
  { id: 'mueller', titleEn: 'Mueller Matrix', titleZh: '穆勒矩阵', unit: 5, route: '/demos/mueller', difficulty: 'research' },
  { id: 'jones', titleEn: 'Jones Matrix', titleZh: '琼斯矩阵', unit: 5, route: '/demos/jones', difficulty: 'research' },
  { id: 'calculator', titleEn: 'Polarization Calculator', titleZh: '偏振计算器', unit: 5, route: '/demos/calculator', difficulty: 'application' },
  { id: 'polarimetric-microscopy', titleEn: 'Polarimetric Microscopy', titleZh: '偏振显微成像', unit: 5, route: '/demos/polarimetric-microscopy', difficulty: 'research' },
]

// =====================================
// 多对多关系映射表
// =====================================
export const COURSE_EVENT_MAPPINGS: CourseEventMapping[] = [
  // === Unit 0: Optical Basics ===
  // light-wave: 光波基础概念
  { demoId: 'light-wave', eventYear: 1676, eventTrack: 'optics', relevance: 'secondary' },      // 光速测量
  { demoId: 'light-wave', eventYear: 1801, eventTrack: 'optics', relevance: 'primary' },        // 杨氏双缝 - 波动性证据
  { demoId: 'light-wave', eventYear: 1865, eventTrack: 'optics', relevance: 'primary' },        // 麦克斯韦电磁波
  { demoId: 'light-wave', eventYear: 1817, eventTrack: 'optics', relevance: 'secondary' },      // 菲涅尔横波理论

  // polarization-intro: 偏振入门
  { demoId: 'polarization-intro', eventYear: 1808, eventTrack: 'polarization', relevance: 'primary' },  // 马吕斯发现偏振
  { demoId: 'polarization-intro', eventYear: 1817, eventTrack: 'optics', relevance: 'secondary' },      // 横波理论解释偏振

  // polarization-types: 三种偏振态
  { demoId: 'polarization-types', eventYear: 1892, eventTrack: 'polarization', relevance: 'primary' },  // 庞加莱球表示
  { demoId: 'polarization-types', eventYear: 1941, eventTrack: 'polarization', relevance: 'secondary' }, // 琼斯矢量
  { demoId: 'polarization-types', eventYear: 1929, eventTrack: 'polarization', relevance: 'secondary' }, // 宝丽来偏振片

  // optical-bench: 交互式光学工作台
  { demoId: 'optical-bench', eventYear: 1809, eventTrack: 'polarization', relevance: 'primary' },  // 马吕斯定律验证
  { demoId: 'optical-bench', eventYear: 1669, eventTrack: 'polarization', relevance: 'secondary' }, // 双折射实验

  // === Unit 1: Polarization Fundamentals ===
  // polarization-state: 偏振态3D可视化
  { demoId: 'polarization-state', eventYear: 1817, eventTrack: 'optics', relevance: 'primary' },       // 横波理论
  { demoId: 'polarization-state', eventYear: 1892, eventTrack: 'polarization', relevance: 'primary' }, // 庞加莱球
  { demoId: 'polarization-state', eventYear: 1852, eventTrack: 'polarization', relevance: 'secondary' }, // 斯托克斯参数

  // malus: 马吕斯定律
  { demoId: 'malus', eventYear: 1808, eventTrack: 'polarization', relevance: 'primary' },   // 偏振发现
  { demoId: 'malus', eventYear: 1809, eventTrack: 'polarization', relevance: 'primary' },   // 马吕斯定律
  { demoId: 'malus', eventYear: 1929, eventTrack: 'polarization', relevance: 'secondary' }, // 宝丽来偏振片

  // birefringence: 双折射
  { demoId: 'birefringence', eventYear: 1669, eventTrack: 'polarization', relevance: 'primary' },   // 双折射发现
  { demoId: 'birefringence', eventYear: 1690, eventTrack: 'polarization', relevance: 'secondary' }, // 惠更斯波动理论
  { demoId: 'birefringence', eventYear: 1828, eventTrack: 'polarization', relevance: 'primary' },   // 尼科尔棱镜

  // waveplate: 波片
  { demoId: 'waveplate', eventYear: 1828, eventTrack: 'polarization', relevance: 'secondary' },   // 尼科尔棱镜
  { demoId: 'waveplate', eventYear: 1941, eventTrack: 'polarization', relevance: 'primary' },     // 琼斯矢量
  { demoId: 'waveplate', eventYear: 1956, eventTrack: 'polarization', relevance: 'secondary' },   // 潘查拉特南几何相位

  // === Unit 2: Interface Reflection ===
  // fresnel: 菲涅尔方程
  { demoId: 'fresnel', eventYear: 1621, eventTrack: 'optics', relevance: 'primary' },        // 斯涅尔折射定律
  { demoId: 'fresnel', eventYear: 1817, eventTrack: 'optics', relevance: 'primary' },        // 菲涅尔方程
  { demoId: 'fresnel', eventYear: 1850, eventTrack: 'polarization', relevance: 'secondary' }, // 傅科实验

  // brewster: 布儒斯特角
  { demoId: 'brewster', eventYear: 1812, eventTrack: 'polarization', relevance: 'primary' },   // 布儒斯特角
  { demoId: 'brewster', eventYear: 1808, eventTrack: 'polarization', relevance: 'secondary' }, // 反射偏振发现

  // === Unit 3: Transparent Media ===
  // anisotropy: 各向异性/应力偏振
  { demoId: 'anisotropy', eventYear: 1669, eventTrack: 'polarization', relevance: 'primary' }, // 双折射
  { demoId: 'anisotropy', eventYear: 1811, eventTrack: 'polarization', relevance: 'secondary' }, // 色偏振

  // chromatic: 色偏振
  { demoId: 'chromatic', eventYear: 1665, eventTrack: 'optics', relevance: 'secondary' },        // 牛顿棱镜实验（色散）
  { demoId: 'chromatic', eventYear: 1811, eventTrack: 'polarization', relevance: 'primary' },     // 色偏振发现
  { demoId: 'chromatic', eventYear: 1817, eventTrack: 'optics', relevance: 'secondary' },         // 菲涅尔理论

  // optical-rotation: 旋光
  { demoId: 'optical-rotation', eventYear: 1815, eventTrack: 'polarization', relevance: 'primary' }, // 旋光性发现
  { demoId: 'optical-rotation', eventYear: 1845, eventTrack: 'polarization', relevance: 'primary' }, // 法拉第效应
  { demoId: 'optical-rotation', eventYear: 1848, eventTrack: 'polarization', relevance: 'primary' }, // 分子手性

  // === Unit 4: Scattering ===
  // rayleigh: 瑞利散射
  { demoId: 'rayleigh', eventYear: 1871, eventTrack: 'polarization', relevance: 'primary' }, // 瑞利散射

  // mie-scattering: 米氏散射
  { demoId: 'mie-scattering', eventYear: 1871, eventTrack: 'polarization', relevance: 'secondary' }, // 瑞利散射（基础）

  // monte-carlo-scattering: 蒙特卡洛散射
  { demoId: 'monte-carlo-scattering', eventYear: 1871, eventTrack: 'polarization', relevance: 'secondary' }, // 散射理论

  // === Unit 5: Full Polarimetry ===
  // stokes: 斯托克斯矢量
  { demoId: 'stokes', eventYear: 1852, eventTrack: 'polarization', relevance: 'primary' },   // 斯托克斯参数
  { demoId: 'stokes', eventYear: 1892, eventTrack: 'polarization', relevance: 'primary' },   // 庞加莱球

  // mueller: 穆勒矩阵
  { demoId: 'mueller', eventYear: 1943, eventTrack: 'polarization', relevance: 'primary' },  // 穆勒矩阵
  { demoId: 'mueller', eventYear: 2018, eventTrack: 'polarization', relevance: 'secondary' }, // 偏振医学成像

  // jones: 琼斯矩阵
  { demoId: 'jones', eventYear: 1941, eventTrack: 'polarization', relevance: 'primary' }, // 琼斯矢量

  // calculator: 偏振计算器
  { demoId: 'calculator', eventYear: 1852, eventTrack: 'polarization', relevance: 'primary' },   // 斯托克斯
  { demoId: 'calculator', eventYear: 1941, eventTrack: 'polarization', relevance: 'primary' },   // 琼斯
  { demoId: 'calculator', eventYear: 1943, eventTrack: 'polarization', relevance: 'primary' },   // 穆勒

  // polarimetric-microscopy: 偏振显微成像
  { demoId: 'polarimetric-microscopy', eventYear: 1943, eventTrack: 'polarization', relevance: 'primary' },  // 穆勒矩阵
  { demoId: 'polarimetric-microscopy', eventYear: 2018, eventTrack: 'polarization', relevance: 'primary' },  // 偏振医学成像
]

// =====================================
// 工具函数：双向查询
// =====================================

/**
 * 根据事件年份和轨道获取关联的课程演示
 * @param year 事件年份
 * @param track 事件轨道
 * @returns 关联演示列表，带有关联强度标记
 */
export function getDemosByEvent(
  year: number,
  track: 'optics' | 'polarization'
): DemoSearchResult[] {
  const mappings = COURSE_EVENT_MAPPINGS.filter(
    m => m.eventYear === year && m.eventTrack === track
  )

  return mappings.map(m => {
    const demo = COURSE_DEMOS.find(d => d.id === m.demoId)
    if (!demo) return null
    return {
      id: demo.id,
      titleEn: demo.titleEn,
      titleZh: demo.titleZh,
      unit: demo.unit,
      route: demo.route,
      relevance: m.relevance,
    }
  }).filter((d): d is DemoSearchResult => d !== null)
}

/**
 * 获取演示关联的所有事件（包含完整事件信息）
 * @param demoId 演示ID
 * @returns 关联的事件映射列表
 */
export function getEventMappingsByDemo(demoId: string): CourseEventMapping[] {
  return COURSE_EVENT_MAPPINGS.filter(m => m.demoId === demoId)
}

/**
 * 单元标题映射
 */
export const UNIT_INFO = [
  { id: 0, titleEn: 'Optical Basics', titleZh: '光学基础', color: '#C9A227' },
  { id: 1, titleEn: 'Polarization Fundamentals', titleZh: '偏振基础', color: '#6366F1' },
  { id: 2, titleEn: 'Interface Reflection', titleZh: '界面反射', color: '#0891B2' },
  { id: 3, titleEn: 'Transparent Media', titleZh: '透明介质', color: '#059669' },
  { id: 4, titleEn: 'Scattering', titleZh: '散射', color: '#F59E0B' },
  { id: 5, titleEn: 'Full Polarimetry', titleZh: '完全偏振测量', color: '#8B5CF6' },
]
