/**
 * P-SRT Curriculum: 偏振光下新世界
 * A New World Under Polarized Light
 *
 * 深圳零一学院颠覆创新挑战营课程
 *
 * 这个文件定义了P-SRT课程的完整结构，包括：
 * 1. 课程单元与章节
 * 2. 与历史时间线事件的关联（光学编年史左侧）
 * 3. 与演示模块的关联（光学展示馆右侧）
 * 4. 学习路径和难度层级
 */

// 课程章节定义
export interface CourseSection {
  id: string
  titleEn: string
  titleZh: string
  descriptionEn: string
  descriptionZh: string
  // 关键概念
  keyConcepts: {
    en: string[]
    zh: string[]
  }
  // 实验步骤
  experiments?: {
    titleEn: string
    titleZh: string
    steps: {
      en: string
      zh: string
      observation?: {
        en: string
        zh: string
      }
    }[]
  }[]
  // 思考问题
  thinkingQuestions?: {
    en: string
    zh: string
    hint?: {
      en: string
      zh: string
    }
  }[]
  // 公式（如有）
  formulas?: {
    latex: string
    descriptionEn: string
    descriptionZh: string
  }[]
  // 关联的演示模块
  relatedDemos: string[]
  // 关联的历史事件
  relatedEvents: {
    year: number
    track: 'optics' | 'polarization'
    relevance: 'primary' | 'secondary'
  }[]
  // 难度级别
  difficulty: 'foundation' | 'application' | 'research'
}

// 课程单元定义
export interface CourseUnit {
  id: string
  unitNumber: number
  titleEn: string
  titleZh: string
  subtitleEn: string
  subtitleZh: string
  descriptionEn: string
  descriptionZh: string
  color: string
  icon: string // Lucide icon name
  sections: CourseSection[]
  // 学习目标
  learningObjectives: {
    en: string[]
    zh: string[]
  }
  // 应用领域
  applications: {
    en: string[]
    zh: string[]
  }
  // 家庭实验（可选）
  homeExperiments?: {
    titleEn: string
    titleZh: string
    materials: {
      en: string[]
      zh: string[]
    }
    steps: {
      en: string[]
      zh: string[]
    }
    observation: {
      en: string
      zh: string
    }
  }[]
}

// P-SRT 完整课程定义
export const PSRT_CURRICULUM: CourseUnit[] = [
  // ========================================
  // 第一单元：光的偏振态及其调制和测量
  // ========================================
  {
    id: 'unit1',
    unitNumber: 1,
    titleEn: 'Light Polarization States: Modulation and Measurement',
    titleZh: '光的偏振态及其调制和测量',
    subtitleEn: 'From Iceland Spar to Modern Polarimetry',
    subtitleZh: '从冰洲石到现代偏振测量',
    descriptionEn: 'Starting from the historic Iceland spar experiment, we explore the fundamental concepts of light polarization, birefringence, and the quantitative measurement of polarization states using Malus\'s Law.',
    descriptionZh: '从历史性的冰洲石实验出发，探索光偏振的基本概念、双折射现象，以及使用马吕斯定律进行偏振态的定量测量。',
    color: '#C9A227',
    icon: 'Lightbulb',
    learningObjectives: {
      en: [
        'Understand the concept of transverse waves and light refraction',
        'Explain birefringence and the refractive index ellipsoid',
        'Use polarizers for polarization generation and analysis',
        'Apply Malus\'s Law for quantitative polarization measurement'
      ],
      zh: [
        '理解横波概念和光的折射',
        '解释双折射和折射率椭球',
        '使用偏振片进行起偏和检偏',
        '应用马吕斯定律进行定量偏振测量'
      ]
    },
    applications: {
      en: ['LCD displays', 'Polarized sunglasses', 'Optical instruments', '3D cinema'],
      zh: ['液晶显示', '偏光太阳镜', '光学仪器', '3D电影']
    },
    sections: [
      {
        id: '1.1',
        titleEn: 'Fundamentals: Basic Characteristics of Light',
        titleZh: '基础知识：光的基本特征',
        descriptionEn: 'Introduction to transverse waves and light refraction, understanding the four fundamental characteristics of light waves.',
        descriptionZh: '介绍横波概念和光的折射，理解光波的四个基本特征。',
        keyConcepts: {
          en: [
            'Transverse waves vs. longitudinal waves',
            'Light wave characteristics: amplitude, wavelength, phase, and polarization',
            'Refraction at interfaces'
          ],
          zh: [
            '横波与纵波的区别',
            '光波特征：幅度、波长、相位和偏振',
            '界面处的折射'
          ]
        },
        experiments: [
          {
            titleEn: 'Wave Demonstration',
            titleZh: '波动演示',
            steps: [
              {
                en: 'Use a vibrating rope to demonstrate mechanical wave propagation',
                zh: '使用振动绳索演示机械波传播',
                observation: {
                  en: 'Observe the perpendicular relationship between vibration and propagation direction',
                  zh: '观察振动方向与传播方向的垂直关系'
                }
              },
              {
                en: 'Place a polarizer in front of a computer screen and rotate it',
                zh: '在电脑屏幕前放置偏振片并旋转',
                observation: {
                  en: 'Observe the brightness variation of the screen',
                  zh: '观察屏幕亮度的变化'
                }
              }
            ]
          }
        ],
        thinkingQuestions: [
          {
            en: 'What is the difference between transverse and longitudinal waves?',
            zh: '什么是横波、什么是纵波？',
            hint: {
              en: 'Consider the direction of particle vibration relative to wave propagation',
              zh: '考虑质点振动方向与波传播方向的关系'
            }
          },
          {
            en: 'Which waves in daily life are transverse and which are longitudinal?',
            zh: '生活中有哪些是横波哪些是纵波？'
          }
        ],
        relatedDemos: ['light-wave', 'polarization-intro'],
        relatedEvents: [
          { year: 1817, track: 'optics', relevance: 'primary' }, // Fresnel transverse wave theory
          { year: 1621, track: 'optics', relevance: 'secondary' } // Snell's Law
        ],
        difficulty: 'foundation'
      },
      {
        id: '1.2',
        titleEn: 'Iceland Spar Experiment and Birefringence',
        titleZh: '冰洲石实验和双折射',
        descriptionEn: 'From the historic double image experiment with Iceland spar, we explore light polarization and the different refractive indices for different polarization states.',
        descriptionZh: '从冰洲石双像实验出发，介绍光的偏振和对应不同偏振的折射率，以及折射率椭球。',
        keyConcepts: {
          en: [
            'Ordinary ray (o-ray): follows Snell\'s law',
            'Extraordinary ray (e-ray): does not follow Snell\'s law',
            'Refractive index ellipsoid',
            'Iceland spar parameters: Δn = 0.172, Ne = 1.4864, No = 1.6584 (at λ = 589nm)'
          ],
          zh: [
            '寻常光 (o光)：遵守斯涅尔折射定律',
            '非寻常光 (e光)：不遵守斯涅尔折射定律',
            '折射率椭球',
            '冰洲石参数：Δn = 0.172, Ne = 1.4864, No = 1.6584 (λ = 589nm)'
          ]
        },
        experiments: [
          {
            titleEn: 'Iceland Spar Double Image Experiment',
            titleZh: '冰洲石双像实验',
            steps: [
              {
                en: 'Place Iceland spar crystal on text and observe',
                zh: '将冰洲石放置在文本上观察',
                observation: {
                  en: 'See two images of the text',
                  zh: '看到两个像'
                }
              },
              {
                en: 'Rotate the crystal while observing',
                zh: '旋转放置在文本上的冰洲石',
                observation: {
                  en: 'One image stays fixed, the other rotates around it',
                  zh: '一个像不动，另一个像绕着旋转'
                }
              },
              {
                en: 'Place a polarizer on top and rotate it',
                zh: '在冰洲石上放置偏振片并旋转',
                observation: {
                  en: 'The two images alternate in brightness',
                  zh: '两个像交替明暗变化'
                }
              },
              {
                en: 'Stack a second Iceland spar crystal and rotate',
                zh: '在原有冰洲石上放置另一块冰洲石并旋转',
                observation: {
                  en: 'Four images or two images depending on the angle',
                  zh: '四个像或两个像，取决于角度'
                }
              }
            ]
          }
        ],
        thinkingQuestions: [
          {
            en: 'Describe the phenomena you observed in detail',
            zh: '描述你看到的相关现象',
            hint: {
              en: 'Compare your observations with Bartholin\'s 1669 discovery',
              zh: '将你的观察与1669年巴多林的发现进行比较'
            }
          },
          {
            en: 'When shining a green laser into calcite, why does it appear red inside? Why are there 4 beams instead of 2?',
            zh: '将绿色激光打入方解石中，为什么是红色？为什么不是2条而是4条光束？'
          }
        ],
        formulas: [
          {
            latex: 'n_e(\\theta) = \\frac{n_o n_e}{\\sqrt{n_o^2 \\cos^2\\theta + n_e^2 \\sin^2\\theta}}',
            descriptionEn: 'Refractive index of e-ray as function of angle to optical axis',
            descriptionZh: 'e光折射率随光轴夹角变化的公式'
          }
        ],
        relatedDemos: ['birefringence', 'polarization-state'],
        relatedEvents: [
          { year: 1669, track: 'polarization', relevance: 'primary' }, // Bartholin discovers birefringence
          { year: 1690, track: 'polarization', relevance: 'secondary' }, // Huygens wave theory
          { year: 1828, track: 'polarization', relevance: 'secondary' } // Nicol prism
        ],
        difficulty: 'application'
      },
      {
        id: '1.3',
        titleEn: 'Polarizing Devices and Polarization Measurement',
        titleZh: '偏振器件与偏振测量',
        descriptionEn: 'From Iceland spar and the refractive index ellipsoid, we introduce polarizers, analyzers, and waveplates, and learn Malus\'s Law for polarization measurement.',
        descriptionZh: '从冰洲石和折射率椭球出发，介绍起偏/检偏和波片等偏振器件，及其对偏振态的调制，进而介绍马吕斯定律和偏振态测量。',
        keyConcepts: {
          en: [
            'Polarizer: generates polarized light',
            'Analyzer: detects polarization state',
            'Waveplate: modifies polarization state',
            'Malus\'s Law: I = I₀ cos²θ'
          ],
          zh: [
            '起偏器：产生偏振光',
            '检偏器：检测偏振态',
            '波片：调制偏振态',
            '马吕斯定律：I = I₀ cos²θ'
          ]
        },
        experiments: [
          {
            titleEn: 'Malus\'s Law Verification',
            titleZh: '马吕斯定律验证',
            steps: [
              {
                en: 'Set up two polarizers with a light source',
                zh: '用光源和两片偏振片搭建实验系统',
                observation: {
                  en: 'Establish baseline with parallel polarizers',
                  zh: '平行偏振片建立基准'
                }
              },
              {
                en: 'Rotate the analyzer and measure transmitted intensity',
                zh: '旋转检偏器并测量透射强度',
                observation: {
                  en: 'Intensity follows cos²θ relationship',
                  zh: '强度遵循cos²θ关系'
                }
              },
              {
                en: 'Set polarizers at 90° (crossed)',
                zh: '将偏振片设置为90°（正交）',
                observation: {
                  en: 'Complete extinction of light',
                  zh: '光完全消失'
                }
              }
            ]
          }
        ],
        formulas: [
          {
            latex: 'I = I_0 \\cos^2(\\theta)',
            descriptionEn: 'Malus\'s Law: transmitted intensity depends on angle between polarizer axes',
            descriptionZh: '马吕斯定律：透射强度取决于偏振片轴之间的夹角'
          }
        ],
        relatedDemos: ['malus', 'waveplate', 'optical-bench'],
        relatedEvents: [
          { year: 1808, track: 'polarization', relevance: 'primary' }, // Malus discovers polarization
          { year: 1809, track: 'polarization', relevance: 'primary' }, // Malus's Law
          { year: 1929, track: 'polarization', relevance: 'secondary' } // Polaroid invention
        ],
        difficulty: 'application'
      }
    ],
    homeExperiments: [
      {
        titleEn: 'Screen Polarizer Experiment',
        titleZh: '屏幕偏振片实验',
        materials: {
          en: ['Computer or phone screen', 'Polarizer film (or 3D glasses lens)'],
          zh: ['电脑或手机屏幕', '偏振片（或3D眼镜镜片）']
        },
        steps: {
          en: [
            'Hold the polarizer in front of your computer/phone screen',
            'Slowly rotate the polarizer while watching the screen',
            'Notice how the screen appears to brighten and darken',
            'Try at different angles and record your observations'
          ],
          zh: [
            '将偏振片放在电脑/手机屏幕前',
            '慢慢旋转偏振片同时观察屏幕',
            '注意屏幕如何变亮和变暗',
            '尝试不同角度并记录你的观察'
          ]
        },
        observation: {
          en: 'The screen brightness varies with polarizer angle because LCD screens emit polarized light!',
          zh: '屏幕亮度随偏振片角度变化，因为液晶屏发出的是偏振光！'
        }
      }
    ]
  },

  // ========================================
  // 第二单元：界面反射的偏振特征
  // ========================================
  {
    id: 'unit2',
    unitNumber: 2,
    titleEn: 'Polarization Characteristics of Interface Reflection',
    titleZh: '界面反射的偏振特征',
    subtitleEn: 'Fresnel Equations and Brewster\'s Angle',
    subtitleZh: '菲涅尔方程与布儒斯特角',
    descriptionEn: 'Explore the polarization characteristics of light reflected at interfaces, including quantitative calculations using Fresnel equations and the practical applications of Brewster\'s angle.',
    descriptionZh: '探索界面反射光的偏振特征，包括使用菲涅尔方程进行定量计算以及布儒斯特角的实际应用。',
    color: '#6366F1',
    icon: 'Zap',
    learningObjectives: {
      en: [
        'Calculate reflection intensities using Fresnel equations',
        'Understand the relationship between incidence angle and polarization',
        'Apply Brewster\'s angle in practical scenarios',
        'Design polarization-based optical systems'
      ],
      zh: [
        '使用菲涅尔方程计算反射强度',
        '理解入射角与偏振之间的关系',
        '在实际场景中应用布儒斯特角',
        '设计基于偏振的光学系统'
      ]
    },
    applications: {
      en: ['Anti-glare coatings', 'Polarized photography', 'Laser windows', 'Optical sensors'],
      zh: ['防眩光涂层', '偏振摄影', '激光窗口', '光学传感器']
    },
    sections: [
      {
        id: '2.1',
        titleEn: 'Fresnel Equations',
        titleZh: '菲涅尔公式',
        descriptionEn: 'Quantitative formulas for calculating reflection intensities of s-polarized and p-polarized light at interfaces.',
        descriptionZh: '计算界面处s偏振光和p偏振光反射强度的定量公式。',
        keyConcepts: {
          en: [
            's-polarization: perpendicular to plane of incidence',
            'p-polarization: parallel to plane of incidence',
            'Reflection coefficients depend on incidence angle and refractive indices',
            'Total internal reflection occurs above critical angle'
          ],
          zh: [
            's偏振：垂直于入射面',
            'p偏振：平行于入射面',
            '反射系数取决于入射角和折射率',
            '超过临界角发生全内反射'
          ]
        },
        formulas: [
          {
            latex: 'r_s = \\frac{n_1 \\cos\\theta_i - n_2 \\cos\\theta_t}{n_1 \\cos\\theta_i + n_2 \\cos\\theta_t}',
            descriptionEn: 'Fresnel reflection coefficient for s-polarization',
            descriptionZh: 's偏振的菲涅尔反射系数'
          },
          {
            latex: 'r_p = \\frac{n_2 \\cos\\theta_i - n_1 \\cos\\theta_t}{n_2 \\cos\\theta_i + n_1 \\cos\\theta_t}',
            descriptionEn: 'Fresnel reflection coefficient for p-polarization',
            descriptionZh: 'p偏振的菲涅尔反射系数'
          }
        ],
        relatedDemos: ['fresnel'],
        relatedEvents: [
          { year: 1817, track: 'optics', relevance: 'primary' }, // Fresnel equations
          { year: 1621, track: 'optics', relevance: 'secondary' } // Snell's Law foundation
        ],
        difficulty: 'research'
      },
      {
        id: '2.2',
        titleEn: 'Brewster\'s Angle',
        titleZh: '布儒斯特角',
        descriptionEn: 'The special angle at which p-polarized light has zero reflection, and its practical applications.',
        descriptionZh: '平行入射面光反射为零的特殊角度及其实际应用。',
        keyConcepts: {
          en: [
            'At Brewster\'s angle, p-polarized reflection is zero',
            'tan(θ_B) = n₂/n₁',
            'Reflected light is completely s-polarized',
            'Used in polarizing beam splitters and laser windows'
          ],
          zh: [
            '在布儒斯特角，p偏振反射为零',
            'tan(θ_B) = n₂/n₁',
            '反射光完全为s偏振',
            '用于偏振分束器和激光窗口'
          ]
        },
        experiments: [
          {
            titleEn: 'Brewster Angle Measurement',
            titleZh: '布儒斯特角测量',
            steps: [
              {
                en: 'Mount glass plate on rotating platform, shine laser at it',
                zh: '将玻璃板放入旋转平台上，用激光照射',
                observation: {
                  en: 'Observe reflected light intensity variation with angle',
                  zh: '观察反射光强度随角度变化'
                }
              },
              {
                en: 'Place polarizer in front of observation screen',
                zh: '在观察屏前放置偏振片',
                observation: {
                  en: 'Observe polarization-dependent intensity changes',
                  zh: '观察偏振相关的强度变化'
                }
              },
              {
                en: 'Change material (glass → water → acrylic)',
                zh: '更换不同材料（玻璃→水面→亚克力）',
                observation: {
                  en: 'Compare Brewster angles for different materials',
                  zh: '比较不同材料的布儒斯特角'
                }
              }
            ]
          }
        ],
        formulas: [
          {
            latex: '\\tan(\\theta_B) = \\frac{n_2}{n_1}',
            descriptionEn: 'Brewster\'s Law: relationship between Brewster angle and refractive indices',
            descriptionZh: '布儒斯特定律：布儒斯特角与折射率的关系'
          }
        ],
        relatedDemos: ['brewster'],
        relatedEvents: [
          { year: 1812, track: 'polarization', relevance: 'primary' }, // Brewster's angle discovery
          { year: 1808, track: 'polarization', relevance: 'secondary' } // Malus reflection polarization
        ],
        difficulty: 'application'
      }
    ]
  },

  // ========================================
  // 第三单元：透明介质的偏振特征
  // ========================================
  {
    id: 'unit3',
    unitNumber: 3,
    titleEn: 'Polarization Characteristics of Transparent Media',
    titleZh: '透明介质的偏振特征',
    subtitleEn: 'Chromatic Polarization and Optical Rotation',
    subtitleZh: '色偏振与旋光',
    descriptionEn: 'Explore how polarized light interacts with transparent media, including stress-induced birefringence (chromatic polarization) and the rotation of polarization plane in optically active materials.',
    descriptionZh: '探索偏振光与透明介质的相互作用，包括应力诱导双折射（色偏振）和光学活性材料中的偏振面旋转。',
    color: '#0891B2',
    icon: 'Sparkles',
    learningObjectives: {
      en: [
        'Set up polarizer-analyzer systems for material analysis',
        'Understand sources of birefringence in materials',
        'Calculate polarization state changes quantitatively',
        'Explain the origin of colors in chromatic polarization'
      ],
      zh: [
        '搭建起偏-检偏系统进行材料分析',
        '理解材料中双折射的来源',
        '定量计算偏振态变化',
        '解释色偏振中颜色的来源'
      ]
    },
    applications: {
      en: ['Stress analysis', 'Sugar concentration measurement', 'Quality control', 'Art and decoration'],
      zh: ['应力分析', '糖浓度测量', '质量控制', '艺术装饰']
    },
    sections: [
      {
        id: '3.1',
        titleEn: 'Chromatic Polarization',
        titleZh: '色偏振',
        descriptionEn: 'The beautiful color patterns that appear when birefringent materials are placed between crossed polarizers.',
        descriptionZh: '将双折射材料置于正交偏振片之间时出现的美丽色彩图案。',
        keyConcepts: {
          en: [
            'Crossed polarizers create dark field',
            'Birefringent materials introduce phase difference',
            'Different wavelengths experience different retardation',
            'Resulting colors depend on material thickness and stress'
          ],
          zh: [
            '正交偏振片产生暗视野',
            '双折射材料引入相位差',
            '不同波长经历不同的延迟',
            '产生的颜色取决于材料厚度和应力'
          ]
        },
        experiments: [
          {
            titleEn: 'Stress Birefringence Observation',
            titleZh: '应力双折射观察',
            steps: [
              {
                en: 'Set up crossed polarizers (dark field)',
                zh: '设置正交偏振片（暗视野）',
                observation: {
                  en: 'Confirm dark background',
                  zh: '确认黑暗背景'
                }
              },
              {
                en: 'Insert plain glass between polarizers',
                zh: '在偏振片之间放入普通玻璃',
                observation: {
                  en: 'No change in light intensity',
                  zh: '光强没有变化'
                }
              },
              {
                en: 'Heat a corner of the glass with lighter, then insert',
                zh: '用打火机加热玻璃一角后再放入',
                observation: {
                  en: 'Bright fringes radiate from heated area',
                  zh: '从加热部位向外辐射的亮条纹'
                }
              },
              {
                en: 'Replace with tempered glass',
                zh: '换成钢化玻璃',
                observation: {
                  en: 'Visible bright-dark stripe patterns',
                  zh: '可见亮暗条纹图案'
                }
              },
              {
                en: 'Insert plastic items (bags, tape, cling wrap)',
                zh: '放入塑料制品（塑料袋、透明胶、保鲜膜）',
                observation: {
                  en: 'Color patterns appear',
                  zh: '出现彩色图案'
                }
              }
            ]
          }
        ],
        thinkingQuestions: [
          {
            en: 'Why does heating the glass corner create visible fringes?',
            zh: '为什么加热玻璃角落会产生可见条纹？',
            hint: {
              en: 'Think about thermal stress and its effect on refractive index',
              zh: '考虑热应力及其对折射率的影响'
            }
          },
          {
            en: 'How can you tell the difference between regular and tempered glass?',
            zh: '如何区分普通玻璃和钢化玻璃？'
          }
        ],
        relatedDemos: ['anisotropy', 'chromatic'],
        relatedEvents: [
          { year: 1811, track: 'polarization', relevance: 'primary' }, // Chromatic polarization discovery
          { year: 1669, track: 'polarization', relevance: 'secondary' } // Birefringence foundation
        ],
        difficulty: 'application'
      },
      {
        id: '3.2',
        titleEn: 'Optical Rotation',
        titleZh: '旋光',
        descriptionEn: 'The rotation of the polarization plane when light passes through optically active materials like sugar solutions.',
        descriptionZh: '光通过光学活性材料（如糖溶液）时偏振面的旋转。',
        keyConcepts: {
          en: [
            'Optical activity arises from molecular chirality',
            'Rotation angle proportional to concentration and path length',
            'Different wavelengths rotate by different amounts',
            'Faraday effect: magnetic field induced rotation'
          ],
          zh: [
            '旋光性源于分子手性',
            '旋转角与浓度和路径长度成正比',
            '不同波长旋转不同角度',
            '法拉第效应：磁场诱导的旋转'
          ]
        },
        experiments: [
          {
            titleEn: 'Sugar Solution Rotation',
            titleZh: '糖溶液旋光实验',
            steps: [
              {
                en: 'Set up: light source → polarizer → sugar solution jar → polarizer → screen',
                zh: '搭建：光源→偏振片→装糖水的玻璃罐→偏振片→观察屏',
                observation: {
                  en: 'System ready for observation',
                  zh: '系统准备就绪'
                }
              },
              {
                en: 'Rotate the first polarizer',
                zh: '旋转第一片偏振片',
                observation: {
                  en: 'Rainbow colors rotate inside the jar',
                  zh: '玻璃罐内彩虹颜色旋转'
                }
              },
              {
                en: 'Rotate the second polarizer instead',
                zh: '旋转第二片偏振片',
                observation: {
                  en: 'Colorful output light on the screen',
                  zh: '屏幕上五颜六色的出光'
                }
              },
              {
                en: 'Replace white light with colored lasers',
                zh: '将白光换成不同颜色的激光',
                observation: {
                  en: 'Dark points appear at different viewing angles for each color',
                  zh: '不同颜色在不同视角出现暗点'
                }
              }
            ]
          }
        ],
        formulas: [
          {
            latex: '\\alpha = [\\alpha]_\\lambda^T \\cdot l \\cdot c',
            descriptionEn: 'Optical rotation depends on specific rotation, path length, and concentration',
            descriptionZh: '旋光角取决于比旋光度、路径长度和浓度'
          }
        ],
        relatedDemos: ['optical-rotation'],
        relatedEvents: [
          { year: 1815, track: 'polarization', relevance: 'primary' }, // Biot discovers optical rotation
          { year: 1845, track: 'polarization', relevance: 'primary' }, // Faraday effect
          { year: 1848, track: 'polarization', relevance: 'primary' } // Pasteur molecular chirality
        ],
        difficulty: 'application'
      }
    ],
    homeExperiments: [
      {
        titleEn: 'Sugar Rainbow Experiment',
        titleZh: '糖水彩虹实验',
        materials: {
          en: ['White computer screen', 'Clear glass with concentrated sugar water', 'Polarizer (or 3D glasses lens)'],
          zh: ['白色电脑屏幕', '装有浓糖水的透明玻璃杯', '偏振片（或3D眼镜镜片）']
        },
        steps: {
          en: [
            'Set computer screen to pure white',
            'Place glass with concentrated sugar water in front of screen',
            'Look through the polarizer at the glass',
            'Rotate the polarizer and observe color changes'
          ],
          zh: [
            '将电脑屏幕设置为纯白色',
            '将装有浓糖水的玻璃杯放在屏幕前',
            '透过偏振片观察玻璃杯',
            '旋转偏振片，观察颜色变化'
          ]
        },
        observation: {
          en: 'The sugar water displays beautiful rainbow colors! Different colors appear at different heights in the glass.',
          zh: '糖水呈现出美丽的彩虹色！玻璃杯不同高度处呈现不同颜色。'
        }
      },
      {
        titleEn: 'Tape Art',
        titleZh: '胶带艺术',
        materials: {
          en: ['Two polarizers', 'Clear tape', 'Glass or plastic plate', 'Light source'],
          zh: ['两片偏振片', '透明胶带', '玻璃或塑料板', '光源']
        },
        steps: {
          en: [
            'Create layers of tape at different angles on the plate',
            'Place the plate between crossed polarizers',
            'Observe the colorful pattern created',
            'Experiment with different thicknesses and angles'
          ],
          zh: [
            '在板上以不同角度创建胶带层',
            '将板放在正交偏振片之间',
            '观察产生的彩色图案',
            '尝试不同厚度和角度'
          ]
        },
        observation: {
          en: 'Create beautiful stained-glass-like art using the principles of chromatic polarization!',
          zh: '利用色偏振原理创作美丽的彩色玻璃般的艺术品！'
        }
      }
    ]
  },

  // ========================================
  // 第四单元：浑浊介质的偏振特征
  // ========================================
  {
    id: 'unit4',
    unitNumber: 4,
    titleEn: 'Polarization Characteristics of Turbid Media',
    titleZh: '浑浊介质的偏振特征',
    subtitleEn: 'Scattering, Spectra, and Sky Colors',
    subtitleZh: '散射、光谱与天空的颜色',
    descriptionEn: 'Understand how particles scatter light differently based on their size, and how this explains phenomena from blue skies to white clouds.',
    descriptionZh: '理解不同尺寸的颗粒如何以不同方式散射光，以及这如何解释从蓝天到白云的各种现象。',
    color: '#F59E0B',
    icon: 'Target',
    learningObjectives: {
      en: [
        'Explain Rayleigh and Mie scattering regimes',
        'Relate particle size to scattering characteristics',
        'Understand polarization of scattered light',
        'Apply Monte Carlo methods for scattering simulation'
      ],
      zh: [
        '解释瑞利散射和米氏散射机制',
        '将颗粒尺寸与散射特性联系起来',
        '理解散射光的偏振',
        '应用蒙特卡洛方法进行散射模拟'
      ]
    },
    applications: {
      en: ['Atmospheric sensing', 'Particle sizing', 'Medical diagnostics', 'Ocean optics'],
      zh: ['大气遥感', '颗粒测量', '医学诊断', '海洋光学']
    },
    sections: [
      {
        id: '4.1',
        titleEn: 'Spectral Characteristics of Particle Scattering',
        titleZh: '颗粒物散射的光谱特征',
        descriptionEn: 'How particle size affects both the angular and spectral distribution of scattered light.',
        descriptionZh: '颗粒尺寸如何影响散射光的角度分布和光谱分布。',
        keyConcepts: {
          en: [
            'Rayleigh scattering (particle << λ): I ∝ 1/λ⁴',
            'Mie scattering (particle ~ λ): complex angular dependence',
            'Large particles: forward scattering dominates',
            'Explains blue sky, red sunset, white clouds'
          ],
          zh: [
            '瑞利散射（颗粒 << λ）：I ∝ 1/λ⁴',
            '米氏散射（颗粒 ~ λ）：复杂的角度依赖',
            '大颗粒：前向散射为主',
            '解释蓝天、红色日落、白云'
          ]
        },
        experiments: [
          {
            titleEn: 'Simulate Sky Colors',
            titleZh: '模拟天空颜色',
            steps: [
              {
                en: 'Prepare solutions with different particle sizes (60nm, 80nm, 300nm, 3μm, milk)',
                zh: '准备不同粒径微球溶液（60nm、80nm、300nm、3μm、牛奶）',
                observation: {
                  en: 'Ready for experiment',
                  zh: '准备就绪'
                }
              },
              {
                en: 'Shine white light from bottom of vertical tubes',
                zh: '从竖直管底部照射白光',
                observation: {
                  en: 'Different colors for different particle sizes',
                  zh: '不同粒径显示不同颜色'
                }
              },
              {
                en: 'Observe from the side with polarizer',
                zh: '从侧面透过偏振片观察',
                observation: {
                  en: 'Small particles show high polarization',
                  zh: '小颗粒显示高偏振度'
                }
              }
            ]
          }
        ],
        thinkingQuestions: [
          {
            en: 'Which tube simulates blue sky? Red sunset? White clouds?',
            zh: '哪个管模拟蓝天？红色日落？白云？'
          },
          {
            en: 'What is the difference between rainbow and secondary rainbow?',
            zh: '虹和霓的差别是什么？',
            hint: {
              en: 'Pay attention to the color order',
              zh: '注意颜色顺序'
            }
          }
        ],
        formulas: [
          {
            latex: 'I \\propto \\frac{1}{\\lambda^4}',
            descriptionEn: 'Rayleigh scattering intensity inversely proportional to fourth power of wavelength',
            descriptionZh: '瑞利散射强度与波长四次方成反比'
          }
        ],
        relatedDemos: ['rayleigh', 'mie-scattering'],
        relatedEvents: [
          { year: 1871, track: 'polarization', relevance: 'primary' } // Rayleigh scattering theory
        ],
        difficulty: 'foundation'
      },
      {
        id: '4.2',
        titleEn: 'Polarization Characteristics of Particle Scattering',
        titleZh: '颗粒物散射的偏振特征',
        descriptionEn: 'How the polarization state of scattered light depends on particle properties and scattering geometry.',
        descriptionZh: '散射光的偏振态如何取决于颗粒特性和散射几何。',
        keyConcepts: {
          en: [
            'Scattering polarization depends on particle size, shape, refractive index',
            '90° scattering gives maximum polarization for small particles',
            'Mueller matrix describes complete polarization transformation',
            'Monte Carlo simulation for multiple scattering'
          ],
          zh: [
            '散射偏振取决于颗粒尺寸、形状和折射率',
            '90°散射时小颗粒偏振度最大',
            '穆勒矩阵描述完整的偏振变换',
            '蒙特卡洛模拟多次散射'
          ]
        },
        relatedDemos: ['monte-carlo-scattering'],
        relatedEvents: [
          { year: 1871, track: 'polarization', relevance: 'primary' }
        ],
        difficulty: 'research'
      }
    ]
  },

  // ========================================
  // 第五单元：全偏振光学技术
  // ========================================
  {
    id: 'unit5',
    unitNumber: 5,
    titleEn: 'Full Polarimetry: Quantitative Characterization of Complex Media',
    titleZh: '偏振光学技术和复杂结构介质物性的定量表征',
    subtitleEn: 'Stokes Vectors, Mueller Matrices, and Advanced Imaging',
    subtitleZh: '斯托克斯矢量、穆勒矩阵与高级成像',
    descriptionEn: 'Master the complete mathematical framework for describing polarization and apply it to advanced imaging and detection techniques.',
    descriptionZh: '掌握描述偏振的完整数学框架，并将其应用于高级成像和检测技术。',
    color: '#8B5CF6',
    icon: 'Telescope',
    learningObjectives: {
      en: [
        'Represent any polarization state using Stokes vectors',
        'Calculate optical system effects using Mueller matrices',
        'Understand polarimetric imaging principles',
        'Apply polarimetry to real-world detection problems'
      ],
      zh: [
        '使用斯托克斯矢量表示任意偏振态',
        '使用穆勒矩阵计算光学系统效应',
        '理解偏振成像原理',
        '将偏振测量应用于实际检测问题'
      ]
    },
    applications: {
      en: ['Medical imaging', 'Ocean sensing', 'Autonomous driving', 'Industrial inspection', 'Atmospheric monitoring'],
      zh: ['医学成像', '海洋遥感', '自动驾驶', '工业检测', '大气监测']
    },
    sections: [
      {
        id: '5.1',
        titleEn: 'Stokes Vectors and Mueller Matrices',
        titleZh: '光和介质偏振性质的表征',
        descriptionEn: 'The complete mathematical framework for describing polarization states and their transformations.',
        descriptionZh: '描述偏振态及其变换的完整数学框架。',
        keyConcepts: {
          en: [
            'Stokes vector: [S₀, S₁, S₂, S₃] describes any polarization state',
            'S₀: total intensity, S₁: horizontal vs vertical, S₂: ±45°, S₃: circular',
            'Mueller matrix: 4×4 matrix describing optical element',
            'S\' = M · S transformation equation'
          ],
          zh: [
            '斯托克斯矢量：[S₀, S₁, S₂, S₃] 描述任意偏振态',
            'S₀：总强度，S₁：水平/垂直，S₂：±45°，S₃：圆偏振',
            '穆勒矩阵：4×4矩阵描述光学元件',
            'S\' = M · S 变换方程'
          ]
        },
        formulas: [
          {
            latex: '\\mathbf{S} = \\begin{pmatrix} S_0 \\\\ S_1 \\\\ S_2 \\\\ S_3 \\end{pmatrix} = \\begin{pmatrix} I_H + I_V \\\\ I_H - I_V \\\\ I_{+45} - I_{-45} \\\\ I_R - I_L \\end{pmatrix}',
            descriptionEn: 'Stokes vector components in terms of measured intensities',
            descriptionZh: '斯托克斯矢量分量的强度测量表示'
          },
          {
            latex: '\\mathbf{S\'}= \\mathbf{M} \\cdot \\mathbf{S}',
            descriptionEn: 'Mueller matrix transforms input Stokes vector to output',
            descriptionZh: '穆勒矩阵将输入斯托克斯矢量变换为输出'
          }
        ],
        relatedDemos: ['stokes', 'mueller', 'jones', 'calculator'],
        relatedEvents: [
          { year: 1852, track: 'polarization', relevance: 'primary' }, // Stokes parameters
          { year: 1943, track: 'polarization', relevance: 'primary' }, // Mueller matrices
          { year: 1941, track: 'polarization', relevance: 'secondary' }, // Jones calculus
          { year: 1892, track: 'polarization', relevance: 'secondary' } // Poincaré sphere
        ],
        difficulty: 'research'
      },
      {
        id: '5.2',
        titleEn: 'Full Polarization Scattering for Particle Detection',
        titleZh: '全偏振散射实现颗粒物原位探测',
        descriptionEn: 'Using polarimetric fluorometry for real-time particle detection, identification, and classification.',
        descriptionZh: '使用偏振荧光仪进行实时颗粒物检测、识别和分类。',
        keyConcepts: {
          en: [
            'Polarization-sensitive fluorometry',
            'Multi-angle scattering detection',
            'Particle classification algorithms',
            'In-situ real-time monitoring'
          ],
          zh: [
            '偏振敏感荧光测量',
            '多角度散射探测',
            '颗粒分类算法',
            '原位实时监测'
          ]
        },
        relatedDemos: ['monte-carlo-scattering'],
        relatedEvents: [
          { year: 2018, track: 'polarization', relevance: 'primary' }
        ],
        difficulty: 'research'
      },
      {
        id: '5.3',
        titleEn: 'Full Polarimetric Microscopy',
        titleZh: '全偏振显微成像',
        descriptionEn: 'Mueller microscopy for detailed imaging of complex biological and material samples.',
        descriptionZh: '穆勒显微术用于复杂生物和材料样品的详细成像。',
        keyConcepts: {
          en: [
            'Polarization state generator (PSG) for illumination',
            'Polarization state analyzer (PSA) for detection',
            '16 Mueller matrix elements per pixel',
            'Decomposition into diattenuation, retardance, depolarization'
          ],
          zh: [
            '偏振态发生模块（PSG）用于照明',
            '偏振态分析模块（PSA）用于探测',
            '每像素16个穆勒矩阵元',
            '分解为二向色性、延迟、退偏振度'
          ]
        },
        relatedDemos: ['polarimetric-microscopy'],
        relatedEvents: [
          { year: 2018, track: 'polarization', relevance: 'primary' }
        ],
        difficulty: 'research'
      },
      {
        id: '5.4',
        titleEn: 'Full Polarimetric Imaging',
        titleZh: '全偏振成像',
        descriptionEn: 'Mueller cameras for atmospheric, underwater, and industrial imaging applications.',
        descriptionZh: '穆勒相机用于大气、水下和工业成像应用。',
        keyConcepts: {
          en: [
            'Real-time Mueller imaging systems',
            'Lu-Chipman polar decomposition',
            'Machine learning classification',
            'Applications in remote sensing and autonomous systems'
          ],
          zh: [
            '实时穆勒成像系统',
            'Lu-Chipman极分解',
            '机器学习分类',
            '遥感和自主系统应用'
          ]
        },
        relatedDemos: ['polarimetric-microscopy'],
        relatedEvents: [
          { year: 2018, track: 'polarization', relevance: 'primary' }
        ],
        difficulty: 'research'
      }
    ]
  }
]

// ========================================
// 课程单元与时间线事件的映射
// ========================================
export interface PSRTEventMapping {
  unitId: string
  sectionId: string
  eventYear: number
  eventTrack: 'optics' | 'polarization'
  relevance: 'primary' | 'secondary'
  connectionDescriptionEn: string
  connectionDescriptionZh: string
}

export const PSRT_EVENT_MAPPINGS: PSRTEventMapping[] = [
  // Unit 1 mappings
  {
    unitId: 'unit1',
    sectionId: '1.1',
    eventYear: 1817,
    eventTrack: 'optics',
    relevance: 'primary',
    connectionDescriptionEn: 'Fresnel\'s transverse wave theory explains why light can be polarized',
    connectionDescriptionZh: '菲涅尔横波理论解释了光为何能被偏振'
  },
  {
    unitId: 'unit1',
    sectionId: '1.2',
    eventYear: 1669,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Bartholin\'s discovery of birefringence in Iceland spar',
    connectionDescriptionZh: '巴多林发现冰洲石的双折射现象'
  },
  {
    unitId: 'unit1',
    sectionId: '1.2',
    eventYear: 1828,
    eventTrack: 'polarization',
    relevance: 'secondary',
    connectionDescriptionEn: 'Nicol prism uses calcite for polarization',
    connectionDescriptionZh: '尼科尔棱镜使用方解石进行偏振'
  },
  {
    unitId: 'unit1',
    sectionId: '1.3',
    eventYear: 1808,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Malus discovers polarization through reflection',
    connectionDescriptionZh: '马吕斯通过反射发现偏振'
  },
  {
    unitId: 'unit1',
    sectionId: '1.3',
    eventYear: 1809,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Malus formulates the cos² law',
    connectionDescriptionZh: '马吕斯提出cos²定律'
  },

  // Unit 2 mappings
  {
    unitId: 'unit2',
    sectionId: '2.1',
    eventYear: 1817,
    eventTrack: 'optics',
    relevance: 'primary',
    connectionDescriptionEn: 'Fresnel derives the reflection equations',
    connectionDescriptionZh: '菲涅尔推导反射方程'
  },
  {
    unitId: 'unit2',
    sectionId: '2.2',
    eventYear: 1812,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Brewster discovers the polarization angle',
    connectionDescriptionZh: '布儒斯特发现偏振角'
  },

  // Unit 3 mappings
  {
    unitId: 'unit3',
    sectionId: '3.1',
    eventYear: 1811,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Arago discovers chromatic polarization',
    connectionDescriptionZh: '阿拉戈发现色偏振'
  },
  {
    unitId: 'unit3',
    sectionId: '3.2',
    eventYear: 1815,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Biot discovers optical rotation',
    connectionDescriptionZh: '毕奥发现旋光现象'
  },
  {
    unitId: 'unit3',
    sectionId: '3.2',
    eventYear: 1845,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Faraday discovers magneto-optical rotation',
    connectionDescriptionZh: '法拉第发现磁光旋转'
  },
  {
    unitId: 'unit3',
    sectionId: '3.2',
    eventYear: 1848,
    eventTrack: 'polarization',
    relevance: 'secondary',
    connectionDescriptionEn: 'Pasteur links optical activity to molecular chirality',
    connectionDescriptionZh: '巴斯德将旋光性与分子手性联系起来'
  },

  // Unit 4 mappings
  {
    unitId: 'unit4',
    sectionId: '4.1',
    eventYear: 1871,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Rayleigh explains sky color and scattering',
    connectionDescriptionZh: '瑞利解释天空颜色和散射'
  },

  // Unit 5 mappings
  {
    unitId: 'unit5',
    sectionId: '5.1',
    eventYear: 1852,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Stokes introduces polarization parameters',
    connectionDescriptionZh: '斯托克斯引入偏振参数'
  },
  {
    unitId: 'unit5',
    sectionId: '5.1',
    eventYear: 1892,
    eventTrack: 'polarization',
    relevance: 'secondary',
    connectionDescriptionEn: 'Poincaré sphere for visualizing polarization',
    connectionDescriptionZh: '庞加莱球用于可视化偏振'
  },
  {
    unitId: 'unit5',
    sectionId: '5.1',
    eventYear: 1943,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Mueller develops matrix formalism',
    connectionDescriptionZh: '穆勒发展矩阵形式化方法'
  },
  {
    unitId: 'unit5',
    sectionId: '5.3',
    eventYear: 2018,
    eventTrack: 'polarization',
    relevance: 'primary',
    connectionDescriptionEn: 'Modern polarimetric imaging in medicine',
    connectionDescriptionZh: '现代偏振成像在医学中的应用'
  }
]

// ========================================
// 辅助函数
// ========================================

/**
 * 获取单元的所有关联演示
 */
export function getDemosForUnit(unitId: string): string[] {
  const unit = PSRT_CURRICULUM.find(u => u.id === unitId)
  if (!unit) return []
  const demos = new Set<string>()
  unit.sections.forEach(section => {
    section.relatedDemos.forEach(demo => demos.add(demo))
  })
  return Array.from(demos)
}

/**
 * 获取章节的难度级别颜色
 */
export function getDifficultyColor(difficulty: 'foundation' | 'application' | 'research'): string {
  switch (difficulty) {
    case 'foundation': return '#22c55e' // green
    case 'application': return '#06b6d4' // cyan
    case 'research': return '#a855f7' // purple
  }
}

/**
 * 获取章节的难度级别图标
 */
export function getDifficultyIcon(difficulty: 'foundation' | 'application' | 'research'): string {
  switch (difficulty) {
    case 'foundation': return '🌱'
    case 'application': return '🔬'
    case 'research': return '🚀'
  }
}
