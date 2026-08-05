/**
 * Concept Network Data for Chronicles Page
 * 光学概念网络 - 知识图谱数据
 *
 * This file defines the nodes (concepts) and connections (relationships)
 * that form the knowledge graph of optical concepts evolution.
 */

// Era definitions for color-coding concepts by century
export type Era = '1600s' | '1700s' | '1800s' | '1900s' | 'modern'

// Concept status/type for visual differentiation
export type ConceptStatus = 'phenomenon' | 'theory' | 'law' | 'principle' | 'application'

// Connection types between concepts
export type ConnectionType =
  | 'evolution'    // One concept naturally evolved into another
  | 'foundation'   // One concept is the foundation for another
  | 'conflict'     // Competing or contradictory theories
  | 'synthesis'    // Multiple concepts merged into one
  | 'application'  // Theoretical concept led to practical application

// Concept node interface
export interface ConceptNode {
  id: string
  labelEn: string
  labelZh: string
  descriptionEn: string
  descriptionZh: string
  era: Era
  status: ConceptStatus
  relatedEventYears: number[]  // Links to timeline-events.ts by year
  icon?: string  // Optional emoji for visual representation
}

// Connection interface
export interface ConceptConnection {
  source: string
  target: string
  type: ConnectionType
  descriptionEn: string
  descriptionZh: string
  year?: number  // Optional: when this connection was established
}

// Connection type styles (similar to RELATION_STYLES in scientist-network.ts)
export const CONNECTION_STYLES: Record<ConnectionType, {
  color: string
  labelEn: string
  labelZh: string
  icon: string
  strokeStyle: 'solid' | 'dashed'
}> = {
  evolution: {
    color: '#22c55e',  // green
    labelEn: 'Evolution',
    labelZh: '演进',
    icon: '🌱',
    strokeStyle: 'solid'
  },
  foundation: {
    color: '#3b82f6',  // blue
    labelEn: 'Foundation',
    labelZh: '基础',
    icon: '🏛️',
    strokeStyle: 'solid'
  },
  conflict: {
    color: '#ef4444',  // red
    labelEn: 'Conflict',
    labelZh: '冲突',
    icon: '⚔️',
    strokeStyle: 'dashed'
  },
  synthesis: {
    color: '#a855f7',  // purple
    labelEn: 'Synthesis',
    labelZh: '综合',
    icon: '🔗',
    strokeStyle: 'solid'
  },
  application: {
    color: '#f59e0b',  // amber
    labelEn: 'Application',
    labelZh: '应用',
    icon: '⚙️',
    strokeStyle: 'dashed'
  }
}

// Status styles for node coloring
export const STATUS_STYLES: Record<ConceptStatus, {
  color: string
  labelEn: string
  labelZh: string
}> = {
  phenomenon: {
    color: '#06b6d4',  // cyan
    labelEn: 'Phenomenon',
    labelZh: '现象'
  },
  theory: {
    color: '#8b5cf6',  // violet
    labelEn: 'Theory',
    labelZh: '理论'
  },
  law: {
    color: '#22c55e',  // green
    labelEn: 'Law',
    labelZh: '定律'
  },
  principle: {
    color: '#f59e0b',  // amber
    labelEn: 'Principle',
    labelZh: '原理'
  },
  application: {
    color: '#ec4899',  // pink
    labelEn: 'Application',
    labelZh: '应用'
  }
}

// Concept nodes - key optical concepts
export const CONCEPT_NODES: ConceptNode[] = [
  // === Roots - Early Observations ===
  {
    id: 'iceland-spar',
    labelEn: 'Iceland Spar',
    labelZh: '冰洲石',
    descriptionEn: 'The curious crystal from Iceland that showed double images, sparking centuries of research into the nature of light.',
    descriptionZh: '来自冰岛的神奇晶体，能产生双重影像，引发了数世纪对光本质的研究。',
    era: '1600s',
    status: 'phenomenon',
    relatedEventYears: [1669],
    icon: '💎'
  },
  {
    id: 'double-refraction',
    labelEn: 'Double Refraction',
    labelZh: '双折射',
    descriptionEn: 'The splitting of light into two rays (ordinary and extraordinary) when passing through certain crystals.',
    descriptionZh: '光通过某些晶体时分裂为两束光线（寻常光和非寻常光）的现象。',
    era: '1600s',
    status: 'phenomenon',
    relatedEventYears: [1669, 1690],
    icon: '✨'
  },

  // === The Great Debate: Particle vs Wave ===
  {
    id: 'particle-theory',
    labelEn: 'Particle Theory',
    labelZh: '微粒说',
    descriptionEn: 'Newton\'s corpuscular theory: light consists of tiny particles (corpuscles) emitted by luminous bodies.',
    descriptionZh: '牛顿的微粒理论：光由发光体发射的微小粒子（微粒）组成。',
    era: '1700s',
    status: 'theory',
    relatedEventYears: [1665, 1704],
    icon: '⚫'
  },
  {
    id: 'wave-theory',
    labelEn: 'Wave Theory',
    labelZh: '波动说',
    descriptionEn: 'Huygens\' theory that light propagates as waves through a medium called the luminiferous ether.',
    descriptionZh: '惠更斯的理论：光以波的形式在称为"以太"的介质中传播。',
    era: '1700s',
    status: 'theory',
    relatedEventYears: [1690],
    icon: '🌊'
  },

  // === Polarization Discoveries ===
  {
    id: 'polarization',
    labelEn: 'Polarization',
    labelZh: '偏振',
    descriptionEn: 'The discovery that light waves oscillate in specific planes, not randomly in all directions.',
    descriptionZh: '发现光波在特定平面内振动，而非在所有方向随机振动。',
    era: '1800s',
    status: 'phenomenon',
    relatedEventYears: [1808, 1809],
    icon: '📐'
  },
  {
    id: 'malus-law',
    labelEn: "Malus's Law",
    labelZh: '马吕斯定律',
    descriptionEn: 'I = I₀cos²θ: The intensity of polarized light through a polarizer follows the cosine-squared relationship.',
    descriptionZh: 'I = I₀cos²θ：偏振光通过偏振片的强度遵循余弦平方关系。',
    era: '1800s',
    status: 'law',
    relatedEventYears: [1808, 1809],
    icon: '📊'
  },
  {
    id: 'brewster-angle',
    labelEn: "Brewster's Angle",
    labelZh: '布儒斯特角',
    descriptionEn: 'The angle of incidence at which light with a particular polarization is perfectly transmitted through a surface.',
    descriptionZh: '特定偏振光完全透过界面而无反射时的入射角。',
    era: '1800s',
    status: 'law',
    relatedEventYears: [1811, 1815],
    icon: '📐'
  },

  // === Wave Theory Triumphs ===
  {
    id: 'interference',
    labelEn: 'Interference',
    labelZh: '干涉',
    descriptionEn: 'Young\'s double-slit experiment proved light waves can constructively and destructively interfere.',
    descriptionZh: '杨氏双缝实验证明光波可以发生相长和相消干涉。',
    era: '1800s',
    status: 'phenomenon',
    relatedEventYears: [1801],
    icon: '🌈'
  },
  {
    id: 'transverse-waves',
    labelEn: 'Transverse Waves',
    labelZh: '横波',
    descriptionEn: 'Fresnel\'s revolutionary insight: light waves oscillate perpendicular to the direction of propagation.',
    descriptionZh: '菲涅尔的革命性洞见：光波的振动方向垂直于传播方向。',
    era: '1800s',
    status: 'theory',
    relatedEventYears: [1817, 1822],
    icon: '〰️'
  },
  {
    id: 'fresnel-theory',
    labelEn: 'Fresnel Wave Theory',
    labelZh: '菲涅尔波动理论',
    descriptionEn: 'Complete mathematical wave theory explaining diffraction, interference, and polarization phenomena.',
    descriptionZh: '完整的数学波动理论，解释了衍射、干涉和偏振现象。',
    era: '1800s',
    status: 'theory',
    relatedEventYears: [1815, 1817, 1822],
    icon: '🔬'
  },

  // === Electromagnetic Revolution ===
  {
    id: 'faraday-effect',
    labelEn: 'Faraday Effect',
    labelZh: '法拉第效应',
    descriptionEn: 'Magnetic fields can rotate the plane of polarization, linking light to electromagnetism.',
    descriptionZh: '磁场可以旋转偏振平面，将光与电磁学联系起来。',
    era: '1800s',
    status: 'phenomenon',
    relatedEventYears: [1845],
    icon: '🧲'
  },
  {
    id: 'electromagnetic-theory',
    labelEn: 'Electromagnetic Theory',
    labelZh: '电磁理论',
    descriptionEn: 'Maxwell\'s equations unified electricity, magnetism, and light as electromagnetic waves.',
    descriptionZh: '麦克斯韦方程组将电、磁和光统一为电磁波。',
    era: '1800s',
    status: 'theory',
    relatedEventYears: [1865],
    icon: '⚡'
  },
  {
    id: 'em-wave-verification',
    labelEn: 'EM Wave Verification',
    labelZh: '电磁波验证',
    descriptionEn: 'Hertz experimentally confirmed electromagnetic waves, validating Maxwell\'s theory.',
    descriptionZh: '赫兹通过实验证实了电磁波的存在，验证了麦克斯韦理论。',
    era: '1800s',
    status: 'phenomenon',
    relatedEventYears: [1888],
    icon: '📡'
  },

  // === Mathematical Formalism ===
  {
    id: 'stokes-parameters',
    labelEn: 'Stokes Parameters',
    labelZh: '斯托克斯参量',
    descriptionEn: 'Four parameters (I, Q, U, V) that completely describe the polarization state of light.',
    descriptionZh: '四个参量（I、Q、U、V）完整描述光的偏振态。',
    era: '1800s',
    status: 'principle',
    relatedEventYears: [1852],
    icon: '📈'
  },
  {
    id: 'jones-calculus',
    labelEn: 'Jones Calculus',
    labelZh: '琼斯矩阵',
    descriptionEn: 'Matrix formalism for describing fully polarized light and its transformation by optical elements.',
    descriptionZh: '描述完全偏振光及其经过光学元件变换的矩阵形式。',
    era: '1900s',
    status: 'principle',
    relatedEventYears: [1941],
    icon: '🔢'
  },
  {
    id: 'mueller-calculus',
    labelEn: 'Mueller Calculus',
    labelZh: '穆勒矩阵',
    descriptionEn: 'Matrix formalism for describing partially polarized light using Stokes vectors.',
    descriptionZh: '使用斯托克斯矢量描述部分偏振光的矩阵形式。',
    era: '1900s',
    status: 'principle',
    relatedEventYears: [1943],
    icon: '📋'
  },

  // === Modern Applications ===
  {
    id: 'polarimetry',
    labelEn: 'Polarimetry',
    labelZh: '偏振测量',
    descriptionEn: 'Techniques for measuring the polarization properties of light and materials.',
    descriptionZh: '测量光和材料偏振特性的技术。',
    era: 'modern',
    status: 'application',
    relatedEventYears: [1852, 1892],
    icon: '🔎'
  },
  {
    id: 'lcd-technology',
    labelEn: 'LCD Technology',
    labelZh: 'LCD技术',
    descriptionEn: 'Liquid crystal displays use polarization to control light transmission in modern screens.',
    descriptionZh: '液晶显示器利用偏振来控制现代屏幕中的光透射。',
    era: 'modern',
    status: 'application',
    relatedEventYears: [1971],
    icon: '📱'
  },
  {
    id: 'quantum-optics',
    labelEn: 'Quantum Optics',
    labelZh: '量子光学',
    descriptionEn: 'Modern understanding of light as quantized photons with inherent polarization properties.',
    descriptionZh: '现代对光作为具有固有偏振特性的量子化光子的理解。',
    era: 'modern',
    status: 'theory',
    relatedEventYears: [1905, 1982],
    icon: '🔮'
  }
]

// Concept connections - relationships between concepts
export const CONCEPT_CONNECTIONS: ConceptConnection[] = [
  // Iceland Spar → Double Refraction (foundation)
  {
    source: 'iceland-spar',
    target: 'double-refraction',
    type: 'foundation',
    descriptionEn: 'Bartholin\'s observation of Iceland Spar revealed the phenomenon of double refraction.',
    descriptionZh: '巴托林对冰洲石的观察揭示了双折射现象。',
    year: 1669
  },

  // Double Refraction inspires theories
  {
    source: 'double-refraction',
    target: 'wave-theory',
    type: 'foundation',
    descriptionEn: 'Huygens used double refraction to support his wave theory of light.',
    descriptionZh: '惠更斯用双折射来支持他的光波动理论。',
    year: 1690
  },
  {
    source: 'double-refraction',
    target: 'particle-theory',
    type: 'foundation',
    descriptionEn: 'Newton tried to explain double refraction using his particle theory.',
    descriptionZh: '牛顿试图用微粒说解释双折射。',
    year: 1704
  },

  // The Great Debate
  {
    source: 'particle-theory',
    target: 'wave-theory',
    type: 'conflict',
    descriptionEn: 'Newton\'s particle theory dominated for a century before wave theory triumphed.',
    descriptionZh: '牛顿的微粒说主导了一个世纪，直到波动说最终胜出。',
    year: 1801
  },

  // Polarization discoveries
  {
    source: 'double-refraction',
    target: 'polarization',
    type: 'evolution',
    descriptionEn: 'Study of double refraction led to the discovery of light polarization.',
    descriptionZh: '对双折射的研究导致了光偏振的发现。',
    year: 1808
  },
  {
    source: 'polarization',
    target: 'malus-law',
    type: 'evolution',
    descriptionEn: 'Malus quantified polarization effects with his cosine-squared law.',
    descriptionZh: '马吕斯用余弦平方定律量化了偏振效应。',
    year: 1809
  },
  {
    source: 'polarization',
    target: 'brewster-angle',
    type: 'evolution',
    descriptionEn: 'Brewster discovered the polarization angle for reflected light.',
    descriptionZh: '布儒斯特发现了反射光的偏振角。',
    year: 1815
  },

  // Wave theory triumphant
  {
    source: 'wave-theory',
    target: 'interference',
    type: 'foundation',
    descriptionEn: 'Young\'s interference experiment proved the wave nature of light.',
    descriptionZh: '杨氏干涉实验证明了光的波动性。',
    year: 1801
  },
  {
    source: 'interference',
    target: 'transverse-waves',
    type: 'evolution',
    descriptionEn: 'Interference patterns led Fresnel to conclude light waves are transverse.',
    descriptionZh: '干涉图样使菲涅尔得出光波是横波的结论。',
    year: 1817
  },
  {
    source: 'polarization',
    target: 'transverse-waves',
    type: 'foundation',
    descriptionEn: 'Polarization proved light is a transverse wave, not longitudinal.',
    descriptionZh: '偏振证明了光是横波而非纵波。',
    year: 1817
  },
  {
    source: 'transverse-waves',
    target: 'fresnel-theory',
    type: 'evolution',
    descriptionEn: 'Fresnel developed complete mathematical theory of transverse light waves.',
    descriptionZh: '菲涅尔发展了完整的横波光学数学理论。',
    year: 1822
  },

  // Electromagnetic revolution
  {
    source: 'polarization',
    target: 'faraday-effect',
    type: 'evolution',
    descriptionEn: 'Faraday discovered magnetic rotation of polarization plane.',
    descriptionZh: '法拉第发现了偏振面的磁旋转。',
    year: 1845
  },
  {
    source: 'faraday-effect',
    target: 'electromagnetic-theory',
    type: 'foundation',
    descriptionEn: 'Faraday effect suggested deep connection between light and electromagnetism.',
    descriptionZh: '法拉第效应暗示了光与电磁学之间的深层联系。',
    year: 1845
  },
  {
    source: 'fresnel-theory',
    target: 'electromagnetic-theory',
    type: 'synthesis',
    descriptionEn: 'Maxwell unified wave optics with electromagnetism.',
    descriptionZh: '麦克斯韦将波动光学与电磁学统一起来。',
    year: 1865
  },
  {
    source: 'electromagnetic-theory',
    target: 'em-wave-verification',
    type: 'evolution',
    descriptionEn: 'Hertz experimentally verified electromagnetic waves.',
    descriptionZh: '赫兹通过实验验证了电磁波。',
    year: 1888
  },

  // Mathematical formalism
  {
    source: 'polarization',
    target: 'stokes-parameters',
    type: 'evolution',
    descriptionEn: 'Stokes created mathematical framework for describing polarization states.',
    descriptionZh: '斯托克斯创建了描述偏振态的数学框架。',
    year: 1852
  },
  {
    source: 'stokes-parameters',
    target: 'jones-calculus',
    type: 'evolution',
    descriptionEn: 'Jones developed matrix methods for fully polarized light.',
    descriptionZh: '琼斯为完全偏振光发展了矩阵方法。',
    year: 1941
  },
  {
    source: 'stokes-parameters',
    target: 'mueller-calculus',
    type: 'evolution',
    descriptionEn: 'Mueller extended Stokes formalism to matrix calculations.',
    descriptionZh: '穆勒将斯托克斯形式扩展为矩阵计算。',
    year: 1943
  },
  {
    source: 'jones-calculus',
    target: 'mueller-calculus',
    type: 'synthesis',
    descriptionEn: 'Jones and Mueller calculus together provide complete polarization analysis.',
    descriptionZh: '琼斯和穆勒矩阵一起提供完整的偏振分析。',
    year: 1943
  },

  // Modern applications
  {
    source: 'stokes-parameters',
    target: 'polarimetry',
    type: 'application',
    descriptionEn: 'Stokes parameters enabled quantitative polarization measurements.',
    descriptionZh: '斯托克斯参量使定量偏振测量成为可能。',
    year: 1852
  },
  {
    source: 'mueller-calculus',
    target: 'polarimetry',
    type: 'application',
    descriptionEn: 'Mueller matrices are used in modern polarimetric instruments.',
    descriptionZh: '穆勒矩阵用于现代偏振测量仪器。'
  },
  {
    source: 'polarization',
    target: 'lcd-technology',
    type: 'application',
    descriptionEn: 'LCD displays use polarizers and liquid crystals to control light.',
    descriptionZh: 'LCD显示器使用偏振片和液晶来控制光。',
    year: 1971
  },
  {
    source: 'electromagnetic-theory',
    target: 'quantum-optics',
    type: 'evolution',
    descriptionEn: 'Quantum mechanics revealed the photon nature of electromagnetic waves.',
    descriptionZh: '量子力学揭示了电磁波的光子本质。',
    year: 1905
  }
]

// Pre-computed node positions for layout
// Arranged chronologically left to right, with branches for different threads
export const CONCEPT_POSITIONS: Record<string, { x: number; y: number }> = {
  // Left side: 1600s origins (x: 5-20)
  'iceland-spar': { x: 8, y: 20 },
  'double-refraction': { x: 15, y: 35 },

  // Early theories (x: 20-35)
  'particle-theory': { x: 25, y: 15 },
  'wave-theory': { x: 25, y: 50 },

  // 1800s polarization branch (x: 35-50)
  'polarization': { x: 38, y: 35 },
  'malus-law': { x: 42, y: 18 },
  'brewster-angle': { x: 48, y: 25 },

  // Wave theory development (x: 35-55)
  'interference': { x: 35, y: 65 },
  'transverse-waves': { x: 48, y: 50 },
  'fresnel-theory': { x: 55, y: 65 },

  // Electromagnetic era (x: 55-75)
  'faraday-effect': { x: 58, y: 35 },
  'electromagnetic-theory': { x: 68, y: 50 },
  'em-wave-verification': { x: 78, y: 50 },

  // Mathematical formalism (x: 60-80)
  'stokes-parameters': { x: 60, y: 20 },
  'jones-calculus': { x: 75, y: 12 },
  'mueller-calculus': { x: 75, y: 28 },

  // Modern applications (x: 85-95)
  'polarimetry': { x: 88, y: 20 },
  'lcd-technology': { x: 88, y: 40 },
  'quantum-optics': { x: 88, y: 60 }
}

export function getConceptById(id: string): ConceptNode | undefined {
  return CONCEPT_NODES.find(c => c.id === id)
}

export function getConceptConnections(conceptId: string): ConceptConnection[] {
  return CONCEPT_CONNECTIONS.filter(
    c => c.source === conceptId || c.target === conceptId
  )
}
