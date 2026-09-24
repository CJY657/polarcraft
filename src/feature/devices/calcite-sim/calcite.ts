// EXPORTS: ICalciteConstants, IShapePreset, IWavelengthPreset, IPolarizationPreset, ITheoryContent, CALCITE_CONSTANTS, SHAPE_PRESETS, WAVELENGTH_PRESETS, POLARIZATION_PRESETS, THEORY_CONTENT
/**
 * 方解石双折射物理常数
 */
export interface ICalciteConstants {
  /** 寻常光折射率 n_o（钠黄光 589nm） */
  nO: number
  /** 非常光折射率 n_e（钠黄光 589nm） */
  nE: number
  /** 双折射率 Δn = n_o - n_e */
  deltaN: number
  /** 波长参考 */
  wavelength: string
  /** 布儒斯特角参考值 */
  brewsterAngle: number
}

/**
 * 晶体形状预设
 */
export interface IShapePreset {
  id: string
  name: string
  description: string
  /** 对应 ISimulationConfig.crystalShape 的值 */
  shape: 'cuboid' | 'rhombohedron'
  /** 默认长宽高 */
  defaultDims: { width: number; height: number; depth: number }
}

/**
 * 光源波长预设（含色散后的折射率）
 */
export interface IWavelengthPreset {
  id: string
  label: string
  wavelengthNm: number
  /** 该波长下的寻常光折射率 */
  nO: number
  /** 该波长下的非常光折射率 */
  nE: number
  /** 光路显示颜色 */
  color: string
}

/**
 * 入射光偏振态预设
 */
export interface IPolarizationPreset {
  id: 'natural' | 'linear' | 'circular'
  name: string
  description: string
}

/**
 * 原理说明内容结构
 */
export interface ITheoryContent {
  title: string
  sections: {
    heading: string
    body: string
  }[]
}

// ========== Mock 数据 ==========

export const CALCITE_CONSTANTS: ICalciteConstants = {
  nO: 1.658,
  nE: 1.486,
  deltaN: 0.172,
  wavelength: '589nm（钠黄光）',
  brewsterAngle: 58.9
}

export const SHAPE_PRESETS: IShapePreset[] = [
  {
    id: 'cuboid',
    name: '长方体',
    description: '平行平面切面，出射光平行于入射光',
    shape: 'cuboid',
    defaultDims: { width: 2.6, height: 1.7, depth: 1.5 }
  },
  {
    id: 'rhombohedron',
    name: '菱面体',
    description: '方解石天然解理形状（冰洲石）',
    shape: 'rhombohedron',
    defaultDims: { width: 2.2, height: 2.4, depth: 2.2 }
  }
]

export const WAVELENGTH_PRESETS: IWavelengthPreset[] = [
  {
    id: '589nm',
    label: '钠黄光 589nm',
    wavelengthNm: 589,
    nO: 1.658,
    nE: 1.486,
    color: '#fbbf24'
  },
  {
    id: '550nm',
    label: '绿光 550nm',
    wavelengthNm: 550,
    nO: 1.662,
    nE: 1.488,
    color: '#4ade80'
  },
  {
    id: '400nm',
    label: '蓝光 400nm',
    wavelengthNm: 400,
    nO: 1.681,
    nE: 1.497,
    color: '#60a5fa'
  }
]

export const POLARIZATION_PRESETS: IPolarizationPreset[] = [
  {
    id: 'natural',
    name: '自然光',
    description: '含各方向偏振分量，o 光与 e 光等强度',
  },
  {
    id: 'linear',
    name: '线偏振光',
    description: '偏振方向相对主平面可调，决定 o / e 光强度分配',
  },
  {
    id: 'circular',
    name: '圆偏振光',
    description: '偏振方向随时间旋转，o 光与 e 光各得一半强度',
  }
]

export const THEORY_CONTENT: ITheoryContent = {
  title: '方解石双折射原理',
  sections: [
    {
      heading: '什么是双折射',
      body: '光束入射到各向异性晶体时分解为两束折射光，此现象即双折射。方解石（冰洲石）是典型单轴晶体。'
    },
    {
      heading: 'o光与e光',
      body: 'o光（寻常光）折射率恒为n_o=1.658，符合Snell定律。e光（非常光）折射率随传播方向与光轴夹角而变，n_e=1.486。'
    },
    {
      heading: '光轴',
      body: '单轴晶体中o光与e光传播速度相同的方向。沿光轴入射时无双折射，垂直时分离角最大。'
    }
  ]
}