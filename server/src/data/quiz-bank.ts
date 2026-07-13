/**
 * Quiz Question Bank
 * 测验题库
 *
 * University-level polarization optics questions. Lives on the server only —
 * answers and explanations must never be bundled into the client build.
 * 面向大学生的偏振光学题库。仅存在于服务端 —— 答案与解析绝不打包进前端。
 *
 * answerIndex refers to the canonical option order below; options are
 * shuffled per attempt at delivery time.
 * answerIndex 对应下方选项的原始顺序；下发时会对每次作答重新打乱选项。
 */

import type { QuizQuestion } from '../types/quiz.types.js';

export const QUIZ_BANK: QuizQuestion[] = [
  // ============ 基础 basic ============
  {
    id: 'q-basic-001',
    topic: 'wave-nature',
    difficulty: 'basic',
    question: {
      zh: '光的偏振现象直接证明了光是什么性质的波？',
      en: 'The polarization of light directly proves that light is what kind of wave?',
    },
    options: [
      { zh: '横波', en: 'A transverse wave' },
      { zh: '纵波', en: 'A longitudinal wave' },
      { zh: '既是横波又是纵波', en: 'Both transverse and longitudinal' },
      { zh: '驻波', en: 'A standing wave' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '只有振动方向垂直于传播方向的横波才可能出现偏振；纵波（如声波）无法偏振。',
      en: 'Only transverse waves, whose oscillation is perpendicular to propagation, can be polarized; longitudinal waves such as sound cannot.',
    },
  },
  {
    id: 'q-basic-002',
    topic: 'malus-law',
    difficulty: 'basic',
    question: {
      zh: '强度为 I₀ 的线偏振光通过一个理想偏振片，透振方向与光的振动方向夹角为 θ，透射光强为？',
      en: 'Linearly polarized light of intensity I₀ passes an ideal polarizer whose axis makes angle θ with the light’s vibration direction. The transmitted intensity is?',
    },
    options: [
      { zh: 'I₀cos²θ', en: 'I₀cos²θ' },
      { zh: 'I₀cosθ', en: 'I₀cosθ' },
      { zh: 'I₀sin²θ', en: 'I₀sin²θ' },
      { zh: 'I₀/2', en: 'I₀/2' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '这是马吕斯定律：振幅按 cosθ 投影，光强正比于振幅平方，故 I = I₀cos²θ。',
      en: 'This is Malus’s law: the amplitude projects as cosθ and intensity goes as amplitude squared, so I = I₀cos²θ.',
    },
  },
  {
    id: 'q-basic-003',
    topic: 'malus-law',
    difficulty: 'basic',
    question: {
      zh: '强度为 I₀ 的自然光通过一个理想偏振片后，透射光强为？',
      en: 'Unpolarized light of intensity I₀ passes one ideal polarizer. The transmitted intensity is?',
    },
    options: [
      { zh: 'I₀/2', en: 'I₀/2' },
      { zh: 'I₀', en: 'I₀' },
      { zh: 'I₀/4', en: 'I₀/4' },
      { zh: '0', en: '0' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '自然光各振动方向等概率，cos²θ 对所有角度取平均为 1/2，故透射 I₀/2。',
      en: 'Unpolarized light has all vibration directions equally; the average of cos²θ over all angles is 1/2.',
    },
  },
  {
    id: 'q-basic-004',
    topic: 'malus-law',
    difficulty: 'basic',
    question: {
      zh: '两个理想偏振片的透振方向互相垂直（正交），自然光依次通过后透射光强为？',
      en: 'Two ideal polarizers are crossed (axes perpendicular). Unpolarized light passes both. The final intensity is?',
    },
    options: [
      { zh: '0', en: '0' },
      { zh: 'I₀/2', en: 'I₀/2' },
      { zh: 'I₀/4', en: 'I₀/4' },
      { zh: 'I₀/8', en: 'I₀/8' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '第一片后为线偏振光，第二片与其垂直，cos²90° = 0，完全消光。',
      en: 'After the first polarizer the light is linear; the second at 90° gives cos²90° = 0 — complete extinction.',
    },
  },
  {
    id: 'q-basic-005',
    topic: 'wave-nature',
    difficulty: 'basic',
    question: {
      zh: '下列哪种波不可能发生偏振？',
      en: 'Which of the following waves cannot be polarized?',
    },
    options: [
      { zh: '空气中的声波', en: 'Sound waves in air' },
      { zh: '可见光', en: 'Visible light' },
      { zh: '无线电波', en: 'Radio waves' },
      { zh: 'X 射线', en: 'X-rays' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '空气中的声波是纵波，质点沿传播方向振动，没有可选择的横向振动方向。',
      en: 'Sound in air is longitudinal — particles oscillate along the propagation direction, so there is no transverse direction to select.',
    },
  },
  {
    id: 'q-basic-006',
    topic: 'polarization-states',
    difficulty: 'basic',
    question: {
      zh: '通常所说“光的偏振方向”指的是哪个矢量的振动方向？',
      en: 'The "polarization direction" of light conventionally refers to the oscillation direction of which vector?',
    },
    options: [
      { zh: '电场强度 E', en: 'The electric field E' },
      { zh: '磁感应强度 B', en: 'The magnetic field B' },
      { zh: '波矢 k', en: 'The wave vector k' },
      { zh: '坡印廷矢量 S', en: 'The Poynting vector S' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '光与物质相互作用主要通过电场，因此约定以电矢量 E 的振动方向为偏振方向。',
      en: 'Light interacts with matter mainly via the electric field, so the E vector defines the polarization direction by convention.',
    },
  },
  {
    id: 'q-basic-007',
    topic: 'polarization-states',
    difficulty: 'basic',
    question: {
      zh: '按电矢量末端在垂直于传播方向平面内的轨迹分类，偏振态不包括以下哪种？',
      en: 'Classifying polarization by the trajectory of the E-vector tip in the transverse plane, which of these is NOT a polarization state?',
    },
    options: [
      { zh: '抛物线偏振', en: 'Parabolic polarization' },
      { zh: '线偏振', en: 'Linear polarization' },
      { zh: '圆偏振', en: 'Circular polarization' },
      { zh: '椭圆偏振', en: 'Elliptical polarization' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '两个正交简谐分量的合成轨迹只能是直线、圆或椭圆，不存在抛物线偏振。',
      en: 'Two orthogonal harmonic components can only trace a line, circle, or ellipse — never a parabola.',
    },
  },
  {
    id: 'q-basic-008',
    topic: 'brewster',
    difficulty: 'basic',
    question: {
      zh: '自然光以布儒斯特角入射到玻璃表面时，反射光的偏振状态是？',
      en: 'When unpolarized light hits glass at Brewster’s angle, the reflected light is?',
    },
    options: [
      {
        zh: '完全线偏振，振动方向垂直于入射面',
        en: 'Fully linearly polarized, perpendicular to the plane of incidence',
      },
      {
        zh: '完全线偏振，振动方向平行于入射面',
        en: 'Fully linearly polarized, parallel to the plane of incidence',
      },
      { zh: '仍为自然光', en: 'Still unpolarized' },
      { zh: '圆偏振光', en: 'Circularly polarized' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '布儒斯特角下 p 分量（平行入射面）反射率为零，反射光只剩垂直入射面的 s 分量。',
      en: 'At Brewster’s angle the p-component reflectance vanishes, leaving only the s-component (perpendicular to the plane of incidence).',
    },
  },
  {
    id: 'q-basic-009',
    topic: 'history',
    difficulty: 'basic',
    question: {
      zh: '1669 年首次报道冰洲石（方解石）双折射现象的科学家是？',
      en: 'Who first reported double refraction in Iceland spar (calcite) in 1669?',
    },
    options: [
      { zh: '巴多林（Bartholin）', en: 'Erasmus Bartholin' },
      { zh: '马吕斯（Malus）', en: 'Étienne-Louis Malus' },
      { zh: '惠更斯（Huygens）', en: 'Christiaan Huygens' },
      { zh: '布儒斯特（Brewster）', en: 'David Brewster' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '丹麦学者巴多林 1669 年发现透过冰洲石看物体成双像；惠更斯随后给出波动解释，马吕斯 1808 年发现反射偏振。',
      en: 'Bartholin observed the double image through Iceland spar in 1669; Huygens later explained it, and Malus found polarization by reflection in 1808.',
    },
  },
  {
    id: 'q-basic-010',
    topic: 'applications',
    difficulty: 'basic',
    question: {
      zh: '偏光太阳镜能有效削弱水面与路面眩光，主要因为这些眩光是？',
      en: 'Polarized sunglasses cut glare from water and roads mainly because that glare is?',
    },
    options: [
      {
        zh: '以水平振动为主的部分偏振光',
        en: 'Partially polarized with a dominant horizontal component',
      },
      { zh: '完全的自然光', en: 'Completely unpolarized' },
      { zh: '圆偏振光', en: 'Circularly polarized' },
      { zh: '强度特别高的紫外线', en: 'Mostly intense ultraviolet light' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '接近布儒斯特角的水平表面反射使眩光以水平（s）振动为主，镜片透振方向取竖直即可大幅吸收。',
      en: 'Reflection near Brewster’s angle off horizontal surfaces makes glare mostly horizontally polarized; a vertical transmission axis blocks it.',
    },
  },
  {
    id: 'q-basic-011',
    topic: 'applications',
    difficulty: 'basic',
    question: {
      zh: '液晶显示器（LCD）中，偏振片的数量与作用通常是？',
      en: 'In a typical LCD, how are polarizers used?',
    },
    options: [
      {
        zh: '两片，分别位于液晶层前后，液晶通过改变偏振方向控制亮暗',
        en: 'Two, sandwiching the liquid-crystal layer, which modulates brightness by rotating polarization',
      },
      { zh: '一片，仅用于防眩光', en: 'One, only as an anti-glare film' },
      { zh: '不需要偏振片', en: 'None — LCDs need no polarizers' },
      { zh: '两片，透振方向必须平行', en: 'Two, whose axes must be exactly parallel' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '液晶盒夹在两片（常为正交的）偏振片之间，电压改变液晶对偏振面的旋转，从而调节透过率。',
      en: 'The LC cell sits between two (usually crossed) polarizers; the applied voltage changes how the liquid crystal rotates polarization, modulating transmission.',
    },
  },
  {
    id: 'q-basic-012',
    topic: 'malus-law',
    difficulty: 'basic',
    question: {
      zh: '线偏振光垂直入射理想偏振片，透振方向与振动方向夹角 60°，透射光强与入射光强之比为？',
      en: 'Linearly polarized light meets an ideal polarizer at 60° to its vibration direction. The transmitted-to-incident intensity ratio is?',
    },
    options: [
      { zh: '1/4', en: '1/4' },
      { zh: '1/2', en: '1/2' },
      { zh: '3/4', en: '3/4' },
      { zh: '1/8', en: '1/8' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'I/I₀ = cos²60° = (1/2)² = 1/4。',
      en: 'I/I₀ = cos²60° = (1/2)² = 1/4.',
    },
  },
  {
    id: 'q-basic-013',
    topic: 'malus-law',
    difficulty: 'basic',
    question: {
      zh: '自然光 I₀ 依次通过两个透振方向成 45° 的理想偏振片，最终光强为？',
      en: 'Unpolarized light I₀ passes two ideal polarizers whose axes differ by 45°. The final intensity is?',
    },
    options: [
      { zh: 'I₀/4', en: 'I₀/4' },
      { zh: 'I₀/2', en: 'I₀/2' },
      { zh: 'I₀/8', en: 'I₀/8' },
      { zh: 'I₀/√2', en: 'I₀/√2' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '第一片后 I₀/2，第二片按马吕斯定律再乘 cos²45° = 1/2，共 I₀/4。',
      en: 'First polarizer: I₀/2; second: multiply by cos²45° = 1/2, giving I₀/4.',
    },
  },
  {
    id: 'q-basic-014',
    topic: 'waveplates',
    difficulty: 'basic',
    question: {
      zh: '线偏振光振动方向与四分之一波片（λ/4 波片）光轴成 45° 入射，出射光是？',
      en: 'Linear light enters a quarter-wave plate with its vibration at 45° to the fast axis. The output is?',
    },
    options: [
      { zh: '圆偏振光', en: 'Circularly polarized light' },
      { zh: '仍为同方向线偏振光', en: 'Linear light, unchanged direction' },
      { zh: '自然光', en: 'Unpolarized light' },
      { zh: '振动方向旋转 90° 的线偏振光', en: 'Linear light rotated by 90°' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '45° 时两个正交分量振幅相等，λ/4 波片引入 π/2 相位差，合成为圆偏振。',
      en: 'At 45° the two axis components have equal amplitude; a π/2 retardation combines them into circular polarization.',
    },
  },
  {
    id: 'q-basic-015',
    topic: 'waveplates',
    difficulty: 'basic',
    question: {
      zh: '线偏振光振动方向与半波片（λ/2 波片）光轴成 θ 角入射，出射后振动方向？',
      en: 'Linear light enters a half-wave plate at angle θ to its axis. The output vibration direction is?',
    },
    options: [
      { zh: '相对入射方向转过 2θ', en: 'Rotated by 2θ from the input direction' },
      { zh: '不变', en: 'Unchanged' },
      { zh: '转过 θ', en: 'Rotated by θ' },
      { zh: '变为圆偏振，无确定方向', en: 'Becomes circular, no definite direction' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '半波片引入 π 相位差，使振动方向以光轴为镜面翻转，相当于旋转 2θ，仍为线偏振。',
      en: 'A π retardation mirrors the vibration about the axis — equivalent to a 2θ rotation, still linear.',
    },
  },
  {
    id: 'q-basic-016',
    topic: 'scattering',
    difficulty: 'basic',
    question: {
      zh: '晴天天空的蓝光带有一定偏振，其根本原因是？',
      en: 'Blue skylight is partially polarized. The fundamental cause is?',
    },
    options: [
      { zh: '空气分子对阳光的瑞利散射', en: 'Rayleigh scattering of sunlight by air molecules' },
      { zh: '大气对阳光的折射', en: 'Atmospheric refraction of sunlight' },
      { zh: '云层的反射', en: 'Reflection from clouds' },
      { zh: '臭氧层的吸收', en: 'Absorption by the ozone layer' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '瑞利散射中，分子作为受迫振动的偶极子，横向辐射带有偏振；与太阳成 90° 方向的天空偏振度最高。',
      en: 'In Rayleigh scattering the molecules radiate as driven dipoles; light scattered at 90° from the sun is most strongly polarized.',
    },
  },
  {
    id: 'q-basic-017',
    topic: 'wave-nature',
    difficulty: 'basic',
    question: {
      zh: '在真空中传播的平面电磁波中，E、B、传播方向 k 三者的关系是？',
      en: 'For a plane EM wave in vacuum, the relation among E, B, and the propagation direction k is?',
    },
    options: [
      {
        zh: '三者两两垂直，E×B 沿传播方向',
        en: 'Mutually perpendicular, with E×B along the propagation direction',
      },
      { zh: 'E 与 B 平行，都垂直于 k', en: 'E parallel to B, both perpendicular to k' },
      { zh: 'E 沿传播方向，B 垂直于它', en: 'E along k, B perpendicular' },
      { zh: '三者方向任意', en: 'All directions are arbitrary' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '麦克斯韦方程要求平面波中 E ⊥ B ⊥ k，且 E×B 指向能流（坡印廷矢量）方向。',
      en: 'Maxwell’s equations require E ⊥ B ⊥ k, with E×B pointing along the energy flow.',
    },
  },
  {
    id: 'q-basic-018',
    topic: 'dichroism',
    difficulty: 'basic',
    question: {
      zh: '常用的 H 型偏振片（Polaroid）产生偏振光的物理机制是？',
      en: 'The physical mechanism of a common H-sheet Polaroid polarizer is?',
    },
    options: [
      {
        zh: '二向色性——对某一振动方向的强烈选择吸收',
        en: 'Dichroism — strong selective absorption of one vibration direction',
      },
      { zh: '双折射分离 o 光与 e 光', en: 'Birefringent separation of o- and e-rays' },
      { zh: '布儒斯特角反射', en: 'Brewster-angle reflection' },
      { zh: '衍射光栅分光', en: 'Diffraction-grating dispersion' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '拉伸取向的聚乙烯醇-碘链沿链方向强烈吸收电矢量分量，只让垂直分量通过，即二向色性。',
      en: 'Aligned iodine-doped PVA chains absorb the E-component along the chains, transmitting the perpendicular component — dichroism.',
    },
  },
  {
    id: 'q-basic-019',
    topic: 'birefringence',
    difficulty: 'basic',
    question: {
      zh: '一束自然光进入方解石晶体后分成两束，这两束光的偏振状态是？',
      en: 'Unpolarized light entering calcite splits into two beams. Their polarization states are?',
    },
    options: [
      {
        zh: '都是线偏振光，且振动方向互相垂直',
        en: 'Both linearly polarized, in mutually perpendicular directions',
      },
      { zh: '都仍是自然光', en: 'Both still unpolarized' },
      { zh: '一束线偏振，一束自然光', en: 'One linear, one unpolarized' },
      { zh: '都是圆偏振光', en: 'Both circularly polarized' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '双折射把入射光分解为振动方向互相垂直的 o 光和 e 光，两者都是线偏振光。',
      en: 'Double refraction resolves the light into o- and e-rays, both linearly polarized and mutually perpendicular.',
    },
  },
  {
    id: 'q-basic-020',
    topic: 'polarization-states',
    difficulty: 'basic',
    question: {
      zh: '完全非偏振（自然）光的特点是？',
      en: 'What characterizes completely unpolarized (natural) light?',
    },
    options: [
      {
        zh: '各横向振动方向出现的概率相同，且相位无关联',
        en: 'All transverse vibration directions occur with equal probability and uncorrelated phase',
      },
      { zh: '电矢量固定在一个方向振动', en: 'The E vector oscillates in one fixed direction' },
      { zh: '电矢量末端匀速画圆', en: 'The E-vector tip traces a uniform circle' },
      { zh: '不携带能量', en: 'It carries no energy' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '自然光是大量独立原子辐射的叠加，横向各方向等权且相位随机，宏观上无偏振取向。',
      en: 'Natural light superposes emissions from many independent atoms — random phases and equal weight in all transverse directions.',
    },
  },

  // ============ 进阶 intermediate ============
  {
    id: 'q-int-001',
    topic: 'malus-law',
    difficulty: 'intermediate',
    question: {
      zh: '自然光 I₀ 依次通过透振方向为 0°、45°、90° 的三个理想偏振片，最终光强为？',
      en: 'Unpolarized light I₀ passes three ideal polarizers at 0°, 45°, 90°. The final intensity is?',
    },
    options: [
      { zh: 'I₀/8', en: 'I₀/8' },
      { zh: '0', en: '0' },
      { zh: 'I₀/4', en: 'I₀/4' },
      { zh: 'I₀/16', en: 'I₀/16' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'I₀/2 × cos²45° × cos²45° = I₀/2 × 1/2 × 1/2 = I₀/8。中间的 45° 偏振片“接通”了正交的两片。',
      en: 'I₀/2 × cos²45° × cos²45° = I₀/8. The middle polarizer "bridges" the crossed pair.',
    },
  },
  {
    id: 'q-int-002',
    topic: 'brewster',
    difficulty: 'intermediate',
    question: {
      zh: '光从空气入射到折射率 n = 1.50 的玻璃，布儒斯特角约为？（tan56.3° ≈ 1.50）',
      en: 'For light from air onto glass with n = 1.50, Brewster’s angle is about? (tan 56.3° ≈ 1.50)',
    },
    options: [
      { zh: '56.3°', en: '56.3°' },
      { zh: '41.8°', en: '41.8°' },
      { zh: '48.8°', en: '48.8°' },
      { zh: '33.7°', en: '33.7°' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'tanθB = n₂/n₁ = 1.50，故 θB ≈ 56.3°。41.8° 是玻璃到空气的全反射临界角，注意区分。',
      en: 'tanθB = n₂/n₁ = 1.50 gives θB ≈ 56.3°. (41.8° is the critical angle for glass→air — a different concept.)',
    },
  },
  {
    id: 'q-int-003',
    topic: 'brewster',
    difficulty: 'intermediate',
    question: {
      zh: '以布儒斯特角入射时，反射光线与折射光线之间的夹角为？',
      en: 'At Brewster incidence, the angle between the reflected and refracted rays is?',
    },
    options: [
      { zh: '90°', en: '90°' },
      { zh: '180°', en: '180°' },
      { zh: '等于两倍布儒斯特角', en: 'Twice Brewster’s angle' },
      { zh: '45°', en: '45°' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '布儒斯特条件等价于 θB + θt = 90°，即反射光与折射光互相垂直——这正是 p 分量无法反射的几何原因。',
      en: 'The Brewster condition is equivalent to θB + θt = 90°: reflected and refracted rays are perpendicular, which is why the p-component cannot radiate into the reflection direction.',
    },
  },
  {
    id: 'q-int-004',
    topic: 'brewster',
    difficulty: 'intermediate',
    question: {
      zh: '水的折射率约 1.33，从空气观察平静水面，反射眩光偏振度最高时的入射角约为？（tan53° ≈ 1.33）',
      en: 'Water has n ≈ 1.33. Glare off a calm surface is most polarized at incidence of about? (tan 53° ≈ 1.33)',
    },
    options: [
      { zh: '53°', en: '53°' },
      { zh: '37°', en: '37°' },
      { zh: '49°', en: '49°' },
      { zh: '63°', en: '63°' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'θB = arctan(1.33) ≈ 53°，此时反射光近乎完全 s 偏振，偏光镜效果最佳。',
      en: 'θB = arctan(1.33) ≈ 53°; the reflection is then almost purely s-polarized.',
    },
  },
  {
    id: 'q-int-005',
    topic: 'birefringence',
    difficulty: 'intermediate',
    question: {
      zh: '在单轴晶体的双折射中，关于 o 光与 e 光，下列说法正确的是？',
      en: 'Regarding the o-ray and e-ray in a uniaxial crystal, which statement is correct?',
    },
    options: [
      {
        zh: 'o 光遵守折射定律，e 光一般不遵守',
        en: 'The o-ray obeys Snell’s law; the e-ray generally does not',
      },
      { zh: '两者都严格遵守折射定律', en: 'Both strictly obey Snell’s law' },
      { zh: '两者都不遵守折射定律', en: 'Neither obeys Snell’s law' },
      {
        zh: 'e 光遵守折射定律，o 光不遵守',
        en: 'The e-ray obeys Snell’s law; the o-ray does not',
      },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'o 光折射率与方向无关，服从普通折射定律；e 光的折射率随传播方向变化，其光线方向一般偏离折射定律预言。',
      en: 'The o-ray sees a direction-independent index and follows Snell’s law; the e-ray’s index depends on direction, so its ray generally deviates.',
    },
  },
  {
    id: 'q-int-006',
    topic: 'birefringence',
    difficulty: 'intermediate',
    question: {
      zh: '方解石是负单轴晶体，这意味着？',
      en: 'Calcite is a negative uniaxial crystal, meaning?',
    },
    options: [
      { zh: 'ne < no，e 光传播更快', en: 'ne < no, so the e-wave travels faster' },
      { zh: 'ne > no，e 光传播更慢', en: 'ne > no, so the e-wave travels slower' },
      { zh: 'ne = no，无双折射', en: 'ne = no — no birefringence' },
      { zh: '它对光有强烈吸收', en: 'It strongly absorbs light' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '负晶体定义为 ne < no（方解石 no ≈ 1.658，ne ≈ 1.486），折射率小意味着相速度大。',
      en: 'Negative uniaxial means ne < no (calcite: no ≈ 1.658, ne ≈ 1.486); smaller index = faster phase velocity.',
    },
  },
  {
    id: 'q-int-007',
    topic: 'waveplates',
    difficulty: 'intermediate',
    question: {
      zh: '厚度为 d、双折射率差为 |no − ne| 的晶片作为四分之一波片（最低阶），应满足？',
      en: 'A crystal plate of thickness d and birefringence |no − ne| acts as a zero-order quarter-wave plate when?',
    },
    options: [
      { zh: 'd·|no − ne| = λ/4', en: 'd·|no − ne| = λ/4' },
      { zh: 'd·|no − ne| = λ/2', en: 'd·|no − ne| = λ/2' },
      { zh: 'd = λ/4', en: 'd = λ/4' },
      { zh: 'd·(no + ne) = λ/4', en: 'd·(no + ne) = λ/4' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '两正交分量的光程差为 d|no−ne|，等于 λ/4 时相位差为 π/2，即四分之一波片。',
      en: 'The optical path difference d|no−ne| = λ/4 corresponds to a π/2 phase retardation.',
    },
  },
  {
    id: 'q-int-008',
    topic: 'waveplates',
    difficulty: 'intermediate',
    question: {
      zh: '半波片对沿快轴与慢轴的两个分量引入的相位差是？',
      en: 'The phase difference a half-wave plate introduces between fast- and slow-axis components is?',
    },
    options: [
      { zh: 'π', en: 'π' },
      { zh: 'π/2', en: 'π/2' },
      { zh: '2π', en: '2π' },
      { zh: 'π/4', en: 'π/4' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '“半波”即光程差 λ/2，对应相位差 2π × (1/2) = π。',
      en: '"Half-wave" means a λ/2 path difference, i.e. a phase shift of π.',
    },
  },
  {
    id: 'q-int-009',
    topic: 'polarization-states',
    difficulty: 'intermediate',
    question: {
      zh: '两个正交分量 Ex、Ey 合成圆偏振光的充要条件是？',
      en: 'Two orthogonal components Ex and Ey combine into circular polarization if and only if?',
    },
    options: [
      { zh: '振幅相等且相位差为 ±π/2', en: 'Equal amplitudes and a phase difference of ±π/2' },
      { zh: '振幅相等且相位差为 0', en: 'Equal amplitudes and zero phase difference' },
      { zh: '振幅任意且相位差为 π', en: 'Any amplitudes with phase difference π' },
      { zh: '振幅不等且相位差为 ±π/2', en: 'Unequal amplitudes with phase difference ±π/2' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '等幅、±π/2 相差时电矢量末端画圆；相差为 0 或 π 时为线偏振；其余情况为椭圆偏振。',
      en: 'Equal amplitude with ±π/2 phase gives a circle; 0 or π gives a line; anything else gives an ellipse.',
    },
  },
  {
    id: 'q-int-010',
    topic: 'polarization-degree',
    difficulty: 'intermediate',
    question: {
      zh: '旋转检偏器测得某光束透射光强最大值 Imax、最小值 Imin，偏振度 P 定义为？',
      en: 'Rotating an analyzer yields maximum Imax and minimum Imin. The degree of polarization P is?',
    },
    options: [
      { zh: '(Imax − Imin)/(Imax + Imin)', en: '(Imax − Imin)/(Imax + Imin)' },
      { zh: 'Imin/Imax', en: 'Imin/Imax' },
      { zh: '(Imax + Imin)/(Imax − Imin)', en: '(Imax + Imin)/(Imax − Imin)' },
      { zh: 'Imax − Imin', en: 'Imax − Imin' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'P = (Imax − Imin)/(Imax + Imin)：自然光 P = 0，完全线偏振光 P = 1。',
      en: 'P = (Imax − Imin)/(Imax + Imin): 0 for natural light, 1 for fully linear light.',
    },
  },
  {
    id: 'q-int-011',
    topic: 'polarization-degree',
    difficulty: 'intermediate',
    question: {
      zh: '部分偏振光经旋转检偏器测得 Imax = 3Imin，其偏振度为？',
      en: 'For partially polarized light with Imax = 3Imin, the degree of polarization is?',
    },
    options: [
      { zh: '0.5', en: '0.5' },
      { zh: '0.33', en: '0.33' },
      { zh: '0.67', en: '0.67' },
      { zh: '0.75', en: '0.75' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'P = (3Imin − Imin)/(3Imin + Imin) = 2/4 = 0.5。',
      en: 'P = (3Imin − Imin)/(3Imin + Imin) = 2/4 = 0.5.',
    },
  },
  {
    id: 'q-int-012',
    topic: 'malus-law',
    difficulty: 'intermediate',
    question: {
      zh: '正交偏振片之间插入第三片，透振方向与第一片成 θ。自然光 I₀ 入射时透射光强为 (I₀/2)cos²θ·sin²θ，θ 为多少时透射最强？',
      en: 'A third polarizer at angle θ is inserted between crossed polarizers. With unpolarized input I₀ the output is (I₀/2)cos²θ·sin²θ. Which θ maximizes it?',
    },
    options: [
      { zh: '45°，此时透射 I₀/8', en: '45°, giving I₀/8' },
      { zh: '30°，此时透射 I₀/8', en: '30°, giving I₀/8' },
      { zh: '60°，此时透射 I₀/4', en: '60°, giving I₀/4' },
      { zh: '任何角度透射均为零', en: 'Zero at every angle' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'cos²θsin²θ = (1/4)sin²2θ 在 θ = 45° 取最大 1/4，故 I = I₀/8。',
      en: 'cos²θ sin²θ = (1/4)sin²2θ peaks at θ = 45°, giving I₀/8.',
    },
  },
  {
    id: 'q-int-013',
    topic: 'birefringence',
    difficulty: 'intermediate',
    question: {
      zh: '光沿单轴晶体的光轴方向传播时会发生什么？',
      en: 'What happens when light propagates exactly along the optic axis of a uniaxial crystal?',
    },
    options: [
      {
        zh: '不发生双折射，o、e 光速度相同',
        en: 'No double refraction — o- and e-waves travel at the same speed',
      },
      { zh: '双折射最强', en: 'Double refraction is strongest' },
      { zh: '光被完全吸收', en: 'The light is fully absorbed' },
      { zh: '只允许 e 光通过', en: 'Only the e-ray is transmitted' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '光轴方向是晶体的对称方向，沿它传播时两本征偏振折射率相同（均为 no），双折射消失。',
      en: 'Along the optic axis both eigenpolarizations see the same index (no), so birefringence vanishes.',
    },
  },
  {
    id: 'q-int-014',
    topic: 'chromatic-polarization',
    difficulty: 'intermediate',
    question: {
      zh: '把透明胶带/应力塑料放在正交偏振片之间会看到彩色条纹（色偏振），颜色来源是？',
      en: 'Clear tape or stressed plastic between crossed polarizers shows colored fringes (chromatic polarization). The colors arise because?',
    },
    options: [
      {
        zh: '相位延迟随波长不同，各色光干涉相长/相消条件不同',
        en: 'The retardation varies with wavelength, so colors interfere constructively or destructively differently',
      },
      { zh: '材料对不同颜色选择吸收', en: 'The material selectively absorbs colors' },
      { zh: '光的衍射分光', en: 'Diffraction disperses the light' },
      { zh: '荧光效应', en: 'Fluorescence' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '双折射引入的相位差 δ = 2πd·Δn/λ 依赖波长；检偏后各波长透射率不同，白光即呈现干涉色。',
      en: 'The retardation δ = 2πd·Δn/λ is wavelength-dependent; after the analyzer each wavelength transmits differently, producing interference colors.',
    },
  },
  {
    id: 'q-int-015',
    topic: 'optical-activity',
    difficulty: 'intermediate',
    question: {
      zh: '糖溶液能使线偏振光的振动面旋转，旋转角 φ 与哪些量成正比？',
      en: 'A sugar solution rotates the plane of linear polarization. The rotation angle φ is proportional to?',
    },
    options: [
      { zh: '光程长度与溶液浓度', en: 'Path length and solution concentration' },
      { zh: '仅与浓度有关', en: 'Concentration only' },
      { zh: '仅与光强有关', en: 'Light intensity only' },
      { zh: '与入射偏振方向有关', en: 'The incident polarization direction' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '旋光角 φ = [α]·l·c（比旋光度 × 液柱长 × 浓度），糖量计正是据此测糖浓度。',
      en: 'φ = [α]·l·c (specific rotation × path length × concentration) — the principle of the saccharimeter.',
    },
  },
  {
    id: 'q-int-016',
    topic: 'scattering',
    difficulty: 'intermediate',
    question: {
      zh: '瑞利散射中，散射光偏振度最高的观察方向与入射光方向的夹角为？',
      en: 'In Rayleigh scattering, scattered light is most polarized when viewed at what angle to the incident beam?',
    },
    options: [
      { zh: '90°', en: '90°' },
      { zh: '0°', en: '0°' },
      { zh: '180°', en: '180°' },
      { zh: '45°', en: '45°' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '偶极子沿振动方向不辐射；侧向 90° 观察时只剩垂直于散射面的分量，偏振度最高。',
      en: 'A dipole does not radiate along its oscillation axis; at 90° only one transverse component survives, maximizing polarization.',
    },
  },
  {
    id: 'q-int-017',
    topic: 'malus-law',
    difficulty: 'intermediate',
    question: {
      zh: '检偏器以角速度 ω 匀速旋转，线偏振光通过后透射光强随时间的调制角频率为？',
      en: 'An analyzer rotates uniformly at angular velocity ω. For linear input, the transmitted intensity is modulated at angular frequency?',
    },
    options: [
      { zh: '2ω', en: '2ω' },
      { zh: 'ω', en: 'ω' },
      { zh: 'ω/2', en: 'ω/2' },
      { zh: '4ω', en: '4ω' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'I ∝ cos²ωt = (1 + cos2ωt)/2，故光强以 2ω 振荡——旋转一周出现两次极大、两次消光。',
      en: 'I ∝ cos²ωt = (1 + cos 2ωt)/2 — intensity oscillates at 2ω, giving two maxima and two nulls per revolution.',
    },
  },
  {
    id: 'q-int-018',
    topic: 'fresnel',
    difficulty: 'intermediate',
    question: {
      zh: '光正入射（垂直入射）到 n = 1.5 的玻璃表面，单个界面的反射率约为？',
      en: 'At normal incidence on glass with n = 1.5, the single-surface reflectance is about?',
    },
    options: [
      { zh: '4%', en: '4%' },
      { zh: '15%', en: '15%' },
      { zh: '50%', en: '50%' },
      { zh: '0.4%', en: '0.4%' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'R = ((n−1)/(n+1))² = (0.5/2.5)² = 0.04。正入射时 s、p 无区别，反射不改变偏振度。',
      en: 'R = ((n−1)/(n+1))² = (0.5/2.5)² = 4%. At normal incidence s and p are equivalent.',
    },
  },
  {
    id: 'q-int-019',
    topic: 'applications',
    difficulty: 'intermediate',
    question: {
      zh: '现代 3D 影院常用圆偏振而非线偏振来区分左右眼图像，主要优点是？',
      en: 'Modern 3D cinemas use circular rather than linear polarization to separate the two eyes’ images mainly because?',
    },
    options: [
      { zh: '观众头部倾斜时串扰不会明显增加', en: 'Head tilt does not significantly increase crosstalk' },
      { zh: '圆偏振光更亮', en: 'Circular light is brighter' },
      { zh: '圆偏振眼镜更便宜', en: 'Circular glasses are cheaper' },
      { zh: '线偏振无法被眼镜过滤', en: 'Linear polarization cannot be filtered by glasses' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '线偏振方案在头部倾斜时两镜片轴偏离，串扰剧增；左/右旋圆偏振对旋转不敏感。',
      en: 'With linear polarization, tilting the head misaligns the axes and causes crosstalk; handedness of circular polarization is rotation-invariant.',
    },
  },
  {
    id: 'q-int-020',
    topic: 'applications',
    difficulty: 'intermediate',
    question: {
      zh: '偏光显微镜正交偏光下观察，各向同性材料（如玻璃）视场表现为？',
      en: 'Under crossed polars in a polarizing microscope, an isotropic material such as glass appears?',
    },
    options: [
      { zh: '全暗（消光）', en: 'Completely dark (extinct)' },
      { zh: '全亮', en: 'Uniformly bright' },
      { zh: '出现干涉色', en: 'Showing interference colors' },
      { zh: '呈现双像', en: 'As a double image' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '各向同性材料不改变偏振态，光无法通过与起偏器正交的检偏器，视场保持消光；只有双折射材料才会亮起。',
      en: 'Isotropic media leave the polarization unchanged, so the crossed analyzer blocks everything; only birefringent samples light up.',
    },
  },
  {
    id: 'q-int-021',
    topic: 'waveplates',
    difficulty: 'intermediate',
    question: {
      zh: '线偏振光振动方向恰好沿波片的快轴（或慢轴）入射，出射光的偏振态？',
      en: 'Linear light enters a waveplate with its vibration exactly along the fast (or slow) axis. The output polarization is?',
    },
    options: [
      { zh: '保持原线偏振不变', en: 'Unchanged linear polarization' },
      { zh: '变为圆偏振', en: 'Circular' },
      { zh: '变为椭圆偏振', en: 'Elliptical' },
      { zh: '旋转 90° 的线偏振', en: 'Linear, rotated 90°' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '只激发一个本征分量时不存在两分量间的相位差问题，任何波片都不改变其偏振态。',
      en: 'Only one eigencomponent is excited, so there is no relative phase to accumulate — the state passes unchanged.',
    },
  },
  {
    id: 'q-int-022',
    topic: 'history',
    difficulty: 'intermediate',
    question: {
      zh: '1808 年马吕斯透过方解石观察卢森堡宫窗户反射的落日光时发现了什么？',
      en: 'In 1808, viewing sunset light reflected off the Luxembourg Palace windows through calcite, Malus discovered?',
    },
    options: [
      {
        zh: '反射光是（部分）偏振的——偏振可由反射产生',
        en: 'Reflected light is (partially) polarized — polarization can arise from reflection',
      },
      { zh: '光的干涉现象', en: 'Interference of light' },
      { zh: '光速的有限性', en: 'The finite speed of light' },
      { zh: '双折射现象', en: 'Double refraction' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '马吕斯旋转晶体时发现双像强度交替变化，证明反射光已被偏振，并由此提出“偏振”一词与马吕斯定律。',
      en: 'Rotating the crystal, Malus saw the two images alternate in brightness — reflected light was polarized. He coined the term "polarization" and later his law.',
    },
  },
  {
    id: 'q-int-023',
    topic: 'polarization-states',
    difficulty: 'intermediate',
    question: {
      zh: '仅用一个理想偏振片（可旋转）无法区分下列哪一对光？',
      en: 'Using only a single rotatable ideal polarizer, which pair of beams CANNOT be distinguished?',
    },
    options: [
      { zh: '自然光与圆偏振光', en: 'Unpolarized and circularly polarized light' },
      { zh: '自然光与线偏振光', en: 'Unpolarized and linearly polarized light' },
      { zh: '线偏振光与部分偏振光', en: 'Linear and partially polarized light' },
      { zh: '线偏振光与圆偏振光', en: 'Linear and circularly polarized light' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '两者旋转检偏器时透射强度都恒定不变；需先加四分之一波片把圆偏振变为线偏振才能区分。',
      en: 'Both give constant intensity under a rotating polarizer; a quarter-wave plate is needed first to convert circular into linear.',
    },
  },
  {
    id: 'q-int-024',
    topic: 'stress-birefringence',
    difficulty: 'intermediate',
    question: {
      zh: '光弹性（应力双折射）实验能显示透明构件内部应力分布，其物理基础是？',
      en: 'Photoelasticity reveals internal stress in transparent parts. Its physical basis is?',
    },
    options: [
      {
        zh: '应力使各向同性材料产生与应力大小相关的双折射',
        en: 'Stress induces birefringence in isotropic materials, proportional to the stress',
      },
      { zh: '应力改变材料颜色', en: 'Stress changes the material’s color' },
      { zh: '应力产生荧光', en: 'Stress causes fluorescence' },
      { zh: '应力使材料发光', en: 'Stress makes the material emit light' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '应力破坏了材料的各向同性（光弹效应），主应力差决定双折射量；正交偏光下呈现等色线条纹。',
      en: 'Stress breaks the material’s isotropy (the photoelastic effect); the principal-stress difference sets the birefringence, seen as isochromatic fringes under crossed polars.',
    },
  },

  // ============ 挑战 advanced ============
  {
    id: 'q-adv-001',
    topic: 'jones-stokes',
    difficulty: 'advanced',
    question: {
      zh: '归一化琼斯矢量 (1, i)/√2 描述的偏振态是？',
      en: 'The normalized Jones vector (1, i)/√2 describes which polarization state?',
    },
    options: [
      { zh: '一种圆偏振光', en: 'A circular polarization state' },
      { zh: '45° 线偏振光', en: 'Linear polarization at 45°' },
      { zh: '自然光', en: 'Unpolarized light' },
      { zh: '沿 x 的线偏振光', en: 'Linear polarization along x' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '两分量等幅、相位差 ±π/2（因子 i），是圆偏振的琼斯矢量；符号约定决定左旋或右旋。琼斯法只能描述完全偏振光，无法表示自然光。',
      en: 'Equal amplitudes with a ±π/2 phase (the factor i) is circular polarization; handedness depends on convention. Jones calculus cannot represent unpolarized light at all.',
    },
  },
  {
    id: 'q-adv-002',
    topic: 'jones-stokes',
    difficulty: 'advanced',
    question: {
      zh: '归一化斯托克斯矢量 (S₀,S₁,S₂,S₃) = (1, 1, 0, 0) 表示？',
      en: 'The normalized Stokes vector (S₀,S₁,S₂,S₃) = (1, 1, 0, 0) represents?',
    },
    options: [
      { zh: '沿水平方向的完全线偏振光', en: 'Fully linear polarization along horizontal' },
      { zh: '右旋圆偏振光', en: 'Right circular polarization' },
      { zh: '自然光', en: 'Unpolarized light' },
      { zh: '45° 线偏振光', en: 'Linear at 45°' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'S₁ = +1 表示水平线偏振占满全部强度；S₂ 对应 ±45° 线偏振，S₃ 对应圆偏振，自然光为 (1,0,0,0)。',
      en: 'S₁ = +1 means all intensity is horizontal linear; S₂ encodes ±45° linear, S₃ circular, and (1,0,0,0) is unpolarized.',
    },
  },
  {
    id: 'q-adv-003',
    topic: 'jones-stokes',
    difficulty: 'advanced',
    question: {
      zh: '由斯托克斯参量计算偏振度的公式是？',
      en: 'The degree of polarization in terms of Stokes parameters is?',
    },
    options: [
      { zh: 'P = √(S₁²+S₂²+S₃²)/S₀', en: 'P = √(S₁²+S₂²+S₃²)/S₀' },
      { zh: 'P = S₁/S₀', en: 'P = S₁/S₀' },
      { zh: 'P = (S₁+S₂+S₃)/S₀', en: 'P = (S₁+S₂+S₃)/S₀' },
      { zh: 'P = S₃/S₀', en: 'P = S₃/S₀' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '偏振部分的强度是庞加莱球上矢量 (S₁,S₂,S₃) 的模，除以总强度 S₀ 即偏振度。',
      en: 'The polarized intensity is the magnitude of (S₁,S₂,S₃) on the Poincaré sphere, normalized by total intensity S₀.',
    },
  },
  {
    id: 'q-adv-004',
    topic: 'waveplates',
    difficulty: 'advanced',
    question: {
      zh: '线偏振光振动方向与四分之一波片光轴成 30°（既非 0° 也非 45°），出射光为？',
      en: 'Linear light enters a quarter-wave plate at 30° to the axis (neither 0° nor 45°). The output is?',
    },
    options: [
      { zh: '椭圆偏振光', en: 'Elliptically polarized light' },
      { zh: '圆偏振光', en: 'Circularly polarized light' },
      { zh: '原方向线偏振光', en: 'Linear, unchanged' },
      { zh: '自然光', en: 'Unpolarized light' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '两分量相位差 π/2 但振幅不等（cos30° ≠ sin30°），合成为正椭圆偏振；仅 45° 时等幅才得圆偏振。',
      en: 'The π/2 retardation with unequal amplitudes (cos 30° ≠ sin 30°) yields an ellipse; only 45° gives a circle.',
    },
  },
  {
    id: 'q-adv-005',
    topic: 'waveplates',
    difficulty: 'advanced',
    question: {
      zh: '线偏振光经 45° 放置的 λ/4 波片变为圆偏振，被平面镜垂直反射后再次通过同一波片，出射光是？',
      en: 'Linear light passes a quarter-wave plate at 45° (becoming circular), reflects normally off a mirror, and passes the same plate again. The output is?',
    },
    options: [
      { zh: '与原方向垂直的线偏振光', en: 'Linear light perpendicular to the original direction' },
      { zh: '与原方向相同的线偏振光', en: 'Linear light in the original direction' },
      { zh: '仍为圆偏振光', en: 'Still circular' },
      { zh: '自然光', en: 'Unpolarized' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '反射使圆偏振旋向反转，二次通过波片再获 π/2 相差，总效果等于半波片：偏振面转 90°。这是光隔离器/防杂散反射的原理。',
      en: 'Reflection flips the circular handedness; the second pass adds another π/2, net π — the polarization rotates 90°. This is the optical-isolator principle.',
    },
  },
  {
    id: 'q-adv-006',
    topic: 'brewster',
    difficulty: 'advanced',
    question: {
      zh: '气体激光管两端常以布儒斯特角安装窗片，导致输出激光？',
      en: 'Gas-laser tubes often have windows mounted at Brewster’s angle, causing the output beam to be?',
    },
    options: [
      {
        zh: '呈 p 方向（平行入射面）的线偏振',
        en: 'Linearly polarized in the p-direction (parallel to the plane of incidence)',
      },
      { zh: '呈 s 方向（垂直入射面）的线偏振', en: 'Linearly polarized in the s-direction' },
      { zh: '完全自然光', en: 'Completely unpolarized' },
      { zh: '圆偏振', en: 'Circularly polarized' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'p 分量在布儒斯特窗上无反射损耗，往返增益占优先起振；s 分量每次通过都损耗而被抑制，故输出为 p 线偏振。',
      en: 'The p-component suffers no reflection loss at the windows and dominates lasing; the s-component is suppressed by per-pass loss.',
    },
  },
  {
    id: 'q-adv-007',
    topic: 'birefringence',
    difficulty: 'advanced',
    question: {
      zh: '波长 600 nm 的光垂直通过厚 0.02 mm、Δn = |no−ne| = 0.009 的晶片，o、e 光的光程差为？',
      en: 'Light of 600 nm passes a 0.02 mm plate with Δn = |no−ne| = 0.009. The o–e optical path difference is?',
    },
    options: [
      { zh: '180 nm，相当于 0.3λ', en: '180 nm, i.e. 0.3λ' },
      { zh: '18 nm，相当于 0.03λ', en: '18 nm, i.e. 0.03λ' },
      { zh: '1800 nm，相当于 3λ', en: '1800 nm, i.e. 3λ' },
      { zh: '90 nm，相当于 0.15λ', en: '90 nm, i.e. 0.15λ' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'Δ = d·Δn = 0.02×10⁻³ m × 0.009 = 1.8×10⁻⁷ m = 180 nm；180/600 = 0.3λ，对应相位差 0.6π。',
      en: 'Δ = d·Δn = 0.02×10⁻³ × 0.009 = 180 nm; 180/600 = 0.3λ, a phase of 0.6π.',
    },
  },
  {
    id: 'q-adv-008',
    topic: 'optical-activity',
    difficulty: 'advanced',
    question: {
      zh: '石英晶体沿光轴方向有旋光性，而熔融石英（石英玻璃）没有，原因是？',
      en: 'Crystalline quartz is optically active along its axis, but fused quartz is not. Why?',
    },
    options: [
      {
        zh: '旋光性源于晶格的螺旋结构，熔融后失去这种手性排列',
        en: 'Activity comes from the helical crystal structure; melting destroys the chiral arrangement',
      },
      { zh: '熔融石英吸收了旋转的光', en: 'Fused quartz absorbs the rotated light' },
      { zh: '熔融石英折射率太低', en: 'Its refractive index is too low' },
      { zh: '晶体石英含有杂质而熔融石英纯净', en: 'Crystal quartz contains impurities; fused quartz is pure' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'SiO₂ 分子本身无手性，石英的旋光来自原子在晶格中的左/右螺旋排列；非晶的熔融石英不存在这种长程手性。',
      en: 'The SiO₂ unit is achiral; quartz’s activity arises from the helical lattice. Amorphous fused silica lacks that long-range chirality.',
    },
  },
  {
    id: 'q-adv-009',
    topic: 'fresnel',
    difficulty: 'advanced',
    question: {
      zh: '菲涅耳菱体（Fresnel rhomb）利用什么机制把线偏振光变为圆偏振光？',
      en: 'A Fresnel rhomb converts linear to circular polarization using what mechanism?',
    },
    options: [
      {
        zh: '两次全反射，每次在 s、p 分量间引入 45° 相位差',
        en: 'Two total internal reflections, each adding a 45° s–p phase difference',
      },
      { zh: '晶体双折射', en: 'Crystal birefringence' },
      { zh: '二向色性吸收', en: 'Dichroic absorption' },
      { zh: '旋光效应', en: 'Optical activity' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '全内反射时 s、p 分量获得依赖入射角的相位差；设计角度下两次反射共 90°。相比波片，其相差几乎不随波长变化（消色差）。',
      en: 'Total internal reflection imparts an angle-dependent s–p phase shift; two bounces give 90° total, and unlike a waveplate it is nearly achromatic.',
    },
  },
  {
    id: 'q-adv-010',
    topic: 'jones-stokes',
    difficulty: 'advanced',
    question: {
      zh: '两块相同的四分之一波片光轴平行地叠放，整体等效于？',
      en: 'Two identical quarter-wave plates stacked with parallel axes act as?',
    },
    options: [
      { zh: '一块半波片', en: 'A single half-wave plate' },
      { zh: '一块四分之一波片', en: 'A quarter-wave plate' },
      { zh: '一块全波片', en: 'A full-wave plate' },
      { zh: '一个偏振片', en: 'A polarizer' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '相位延迟直接相加：π/2 + π/2 = π，即半波片。',
      en: 'Retardations add: π/2 + π/2 = π — a half-wave plate.',
    },
  },
  {
    id: 'q-adv-011',
    topic: 'stress-birefringence',
    difficulty: 'advanced',
    question: {
      zh: '光弹实验的正交偏光场中，“等倾线”（isoclinics，黑色条纹之一）代表？',
      en: 'In a crossed-polars photoelastic pattern, the isoclinic (dark) fringes mark points where?',
    },
    options: [
      {
        zh: '主应力方向与起偏器/检偏器透振方向一致的点',
        en: 'The principal-stress directions align with the polarizer/analyzer axes',
      },
      {
        zh: '主应力差为零或相位差为整数倍波长的点',
        en: 'The principal-stress difference is zero or retardation is a whole wavelength',
      },
      { zh: '材料即将断裂的点', en: 'The material is about to fracture' },
      { zh: '温度最高的点', en: 'Temperature is highest' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '主应力方向与偏振轴重合时样品不改变偏振态而消光——等倾线；等色线才对应主应力差引起的相位差条件。',
      en: 'Where principal axes align with the polarizer axes the sample leaves polarization unchanged, giving extinction (isoclinics); isochromatics instead track the stress-difference retardation.',
    },
  },
  {
    id: 'q-adv-012',
    topic: 'polarization-states',
    difficulty: 'advanced',
    question: {
      zh: '要判断一束“旋转检偏器下光强恒定”的光是自然光、圆偏振光还是二者混合，正确的方法是？',
      en: 'A beam shows constant intensity under a rotating analyzer. To decide if it is unpolarized, circular, or a mixture, one should?',
    },
    options: [
      {
        zh: '先加 λ/4 波片再旋转检偏器，观察是否出现强度变化及能否完全消光',
        en: 'Insert a quarter-wave plate before the rotating analyzer and check for intensity variation and full extinction',
      },
      { zh: '再多加一个偏振片继续旋转', en: 'Add a second polarizer and keep rotating' },
      { zh: '测量光的总强度', en: 'Measure the total intensity' },
      { zh: '用凸透镜聚焦观察', en: 'Focus the beam with a lens' },
    ],
    answerIndex: 0,
    explanation: {
      zh: 'λ/4 波片把圆偏振变为线偏振：纯圆偏振可完全消光；自然光仍无变化；混合光有极值但不消光。',
      en: 'The λ/4 plate converts circular into linear: pure circular then extinguishes fully, unpolarized stays constant, and a mixture varies without full extinction.',
    },
  },
  {
    id: 'q-adv-013',
    topic: 'malus-law',
    difficulty: 'advanced',
    question: {
      zh: 'N 个理想偏振片依次排列，相邻透振方向都相差 90°/N。线偏振光沿第一片方向入射，N 很大时透射率趋于？',
      en: 'N ideal polarizers are stacked, each rotated 90°/N from the previous. Linear light enters along the first axis. As N grows large, the transmission tends to?',
    },
    options: [
      { zh: '趋近 1（几乎全透过，偏振面被旋转 90°）', en: 'Approaches 1 — nearly full transmission with the plane rotated 90°' },
      { zh: '趋近 0', en: 'Approaches 0' },
      { zh: '恒为 1/2', en: 'Stays at 1/2' },
      { zh: '恒为 cos²90° = 0', en: 'Equals cos²90° = 0' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '透射率为 [cos²(90°/N)]^N → 1（N→∞）。多次小角度投影几乎无损地把偏振面“扭”过 90°，是量子 Zeno 效应的经典类比。',
      en: 'Transmission is [cos²(90°/N)]^N → 1 as N→∞: many small projections rotate the plane 90° almost losslessly — a classic analogue of the quantum Zeno effect.',
    },
  },
  {
    id: 'q-adv-014',
    topic: 'jones-stokes',
    difficulty: 'advanced',
    question: {
      zh: '理想线偏振片（透振沿水平）的琼斯矩阵是？',
      en: 'The Jones matrix of an ideal linear polarizer with a horizontal transmission axis is?',
    },
    options: [
      { zh: '[[1,0],[0,0]]', en: '[[1,0],[0,0]]' },
      { zh: '[[1,0],[0,1]]', en: '[[1,0],[0,1]]' },
      { zh: '[[0,0],[0,1]]', en: '[[0,0],[0,1]]' },
      { zh: '[[0,1],[1,0]]', en: '[[0,1],[1,0]]' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '水平偏振片保留 x 分量、消去 y 分量，故矩阵为 diag(1,0)；作用于 (Ex,Ey) 得 (Ex,0)。',
      en: 'A horizontal polarizer keeps the x-component and removes y, so the matrix is diag(1,0), mapping (Ex,Ey) to (Ex,0).',
    },
  },
  {
    id: 'q-adv-015',
    topic: 'scattering',
    difficulty: 'advanced',
    question: {
      zh: '许多昆虫（如蜜蜂）即使只见到一小片蓝天也能导航，依据的是？',
      en: 'Many insects (e.g. bees) can navigate from just a patch of blue sky because they sense?',
    },
    options: [
      {
        zh: '天空散射光的偏振方向图案，它与太阳位置相关',
        en: 'The polarization pattern of scattered skylight, which is tied to the sun’s position',
      },
      { zh: '天空的颜色梯度', en: 'The color gradient of the sky' },
      { zh: '地磁场方向', en: 'The geomagnetic field direction' },
      { zh: '紫外线强度的绝对值', en: 'The absolute UV intensity' },
    ],
    answerIndex: 0,
    explanation: {
      zh: '瑞利散射使天空偏振方向沿以太阳为中心的同心图案分布；昆虫复眼能探测偏振角，据此反推太阳方位导航。',
      en: 'Rayleigh scattering arranges skylight polarization in a pattern centered on the sun; insect eyes detect the polarization angle and infer the sun’s direction.',
    },
  },
];
