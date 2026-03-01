/**
 * Example Research Projects for Virtual Research Group System
 * 虚拟课题组系统示例课题
 *
 * Pre-configured research projects to demonstrate the system's capabilities
 * 预配置的研究课题，用于展示系统功能
 */

import { Node, Edge } from "reactflow";

// ============================================================
// Types - 类型定义
// ============================================================

export interface ExampleProject {
  id: string;
  title: { "zh-CN": string; zh?: string; en?: string };
  description: { "zh-CN": string; zh?: string; en?: string };
  coverImage?: string;
  nodes: Node[];
  edges: Edge[];
}

// ============================================================
// Example Project 1: Bubble Polarization Experiment
// 示例课题1：洗手液气泡偏振实验
// ============================================================

export const BUBBLE_POLARIZATION_PROJECT: ExampleProject = {
  id: "bubble-polarization",
  title: {
    "zh-CN": "洗手液气泡在偏振光下的条纹成因探究",
    zh: "洗手液气泡在偏振光下的条纹成因探究",
  },
  description: {
    "zh-CN":
      "基于菲涅尔公式和球体的空间几何对称性，通过搭建正交偏振系统，探究洗手液泡泡表面彩色条纹和明暗色块的成因。",
    zh: "基于菲涅尔公式和球体的空间几何对称性，通过搭建正交偏振系统，探究洗手液泡泡表面彩色条纹和明暗色块的成因。",
  },
  coverImage: "/gallery/bubble/IMG_7523.png",
  nodes: [
    {
      id: "problem-1769635846091",
      type: "problem",
      position: {
        x: 1390.9471542129002,
        y: -582.018584661087,
      },
      data: {
        title: {
          "zh-CN": "气泡在偏振片后出现明暗图样",
          zh: "气泡在偏振片后出现明暗图样",
          en: "气泡在偏振片后出现明暗图样",
        },
        createdAt: "2026-01-28T21:30:46.091Z",
        updatedAt: "2026-01-28T21:30:46.091Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "",
          zh: "",
        },
        status: "open",
        priority: "high",
      },
      width: 336,
      height: 78,
      selected: false,
      dragging: false,
      positionAbsolute: {
        x: 1390.9471542129002,
        y: -582.018584661087,
      },
    },
    {
      id: "problem-1769635855107",
      type: "problem",
      position: {
        x: 952.8001174338724,
        y: -92.68135118352455,
      },
      data: {
        title: {
          "zh-CN": "气泡表面出现彩色条纹",
          zh: "气泡表面出现彩色条纹",
          en: "气泡表面出现彩色条纹",
        },
        createdAt: "2026-01-28T21:30:55.107Z",
        updatedAt: "2026-01-28T21:30:55.107Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "",
          zh: "",
        },
        status: "open",
        priority: "low",
      },
      width: 294,
      height: 78,
      selected: false,
      positionAbsolute: {
        x: 952.8001174338724,
        y: -92.68135118352455,
      },
      dragging: false,
    },
    {
      id: "experiment-1769635887474",
      type: "experiment",
      position: {
        x: 747.2070053424188,
        y: 136.08841048545148,
      },
      data: {
        title: {
          "zh-CN": "探究彩色条纹的原因",
          zh: "探究彩色条纹的原因",
          en: "探究彩色条纹的原因",
        },
        createdAt: "2026-01-28T21:31:27.474Z",
        updatedAt: "2026-01-28T21:31:27.474Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "猜想1：彩色条纹的出现源于光的色偏振     \n  \n猜想2：彩色条纹的出现源于光的干涉        ",
          zh: "猜想1：彩色条纹的出现源于光的色偏振     \n  \n猜想2：彩色条纹的出现源于光的干涉        ",
          en: "猜想1：彩色条纹的出现源于光的色偏振     \n  \n猜想2：彩色条纹的出现源于光的干涉        ",
        },
        status: "pending",
      },
      width: 246,
      height: 100,
      selected: false,
      positionAbsolute: {
        x: 747.2070053424188,
        y: 136.08841048545148,
      },
      dragging: false,
    },
    {
      id: "experiment-1769635946873",
      type: "experiment",
      position: {
        x: 1797.4547148006434,
        y: -395.1033826868728,
      },
      data: {
        title: {
          "zh-CN": "探究明暗图样出现的原因",
          zh: "探究明暗图样出现的原因",
          en: "探究明暗图样出现的原因",
        },
        createdAt: "2026-01-28T21:32:26.874Z",
        updatedAt: "2026-01-28T21:32:26.874Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "猜想1：偏振光照射下出现的明暗纹样是气泡膜上应力的表现  \n猜想2：明暗纹样是气泡膜表面分子排布具有各向异性的体现  \n猜想3：明暗纹样源于球形曲面的几何特性与线偏振光之间的相互作用\n",
          zh: "猜想1：偏振光照射下出现的明暗纹样是气泡膜上应力的表现  \n猜想2：明暗纹样是气泡膜表面分子排布具有各向异性的体现  \n猜想3：明暗纹样源于球形曲面的几何特性与线偏振光之间的相互作用\n",
          en: "猜想1：偏振光照射下出现的明暗纹样是气泡膜上应力的表现  \n猜想2：明暗纹样是气泡膜表面分子排布具有各向异性的体现  \n猜想3：明暗纹样源于球形曲面的几何特性与线偏振光之间的相互作用\n",
        },
        status: "pending",
      },
      width: 404,
      height: 112,
      selected: false,
      positionAbsolute: {
        x: 1797.4547148006434,
        y: -395.1033826868728,
      },
      dragging: false,
    },
    {
      id: "media-1769636047340",
      type: "media",
      position: {
        x: 638.8958814684257,
        y: 306.23013796705584,
      },
      data: {
        title: {
          "zh-CN": "有正交偏振片",
          zh: "有正交偏振片",
          en: "有正交偏振片",
        },
        createdAt: "2026-01-28T21:34:07.340Z",
        updatedAt: "2026-01-28T21:34:07.340Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image3.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
          en: "",
        },
      },
      width: 192,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 638.8958814684257,
        y: 306.23013796705584,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769636060573",
      type: "conclusion",
      position: {
        x: 558.8813489375839,
        y: 594.6569560426536,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T21:34:20.573Z",
        updatedAt: "2026-01-28T21:34:20.573Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "实验现象：移去偏振片彩色条纹不变\n实验结论：彩色条纹的出现源于光的干涉，与光的色偏振无关\n",
          zh: "实验现象：移去偏振片彩色条纹不变\n实验结论：彩色条纹的出现源于光的干涉，与光的色偏振无关\n",
          en: "实验现象：移去偏振片彩色条纹不变\n实验结论：彩色条纹的出现源于光的干涉，与光的色偏振无关\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 1,
        evidenceIds: [],
      },
      width: 555,
      height: 126,
      selected: false,
      positionAbsolute: {
        x: 558.8813489375839,
        y: 594.6569560426536,
      },
      dragging: false,
    },
    {
      id: "media-1769636190073",
      type: "media",
      position: {
        x: 885.0328525472746,
        y: 310.1325376157414,
      },
      data: {
        title: {
          "zh-CN": "移去前面偏振片",
          zh: "移去前面偏振片",
          en: "移去前面偏振片",
        },
        createdAt: "2026-01-28T21:36:30.073Z",
        updatedAt: "2026-01-28T21:36:30.073Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image4.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 206,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 885.0328525472746,
        y: 310.1325376157414,
      },
      dragging: false,
    },
    {
      id: "experiment-1769636340907",
      type: "experiment",
      position: {
        x: 1322.135981693068,
        y: 267.1409217304135,
      },
      data: {
        title: {
          "zh-CN": "实验1：球形泡泡",
          zh: "实验1：球形泡泡",
          en: "实验1：球形泡泡",
        },
        createdAt: "2026-01-28T21:39:00.907Z",
        updatedAt: "2026-01-28T21:39:00.907Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "猜想一",
          zh: "猜想一",
          en: "猜想一",
        },
        status: "pending",
      },
      width: 220,
      height: 80,
      selected: false,
      positionAbsolute: {
        x: 1322.135981693068,
        y: 267.1409217304135,
      },
      dragging: false,
    },
    {
      id: "media-1769636384673",
      type: "media",
      position: {
        x: 1223.4211826082935,
        y: 451.60656734361896,
      },
      data: {
        title: {
          "zh-CN": "气泡应力分布仿真图",
          zh: "气泡应力分布仿真图",
          en: "气泡应力分布仿真图",
        },
        createdAt: "2026-01-28T21:39:44.673Z",
        updatedAt: "2026-01-28T21:39:44.673Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image5.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 234,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 1223.4211826082935,
        y: 451.60656734361896,
      },
      dragging: false,
    },
    {
      id: "media-1769636388606",
      type: "media",
      position: {
        x: 1478.682427392953,
        y: 452.29585768855105,
      },
      data: {
        title: {
          "zh-CN": "有正交偏振片",
          zh: "有正交偏振片",
          en: "有正交偏振片",
        },
        createdAt: "2026-01-28T21:39:48.607Z",
        updatedAt: "2026-01-28T21:39:48.607Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image6.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 192,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 1478.682427392953,
        y: 452.29585768855105,
      },
      dragging: false,
    },
    {
      id: "media-1769636397023",
      type: "media",
      position: {
        x: 1691.7665551762352,
        y: 453.17856839318756,
      },
      data: {
        title: {
          "zh-CN": "移去前面偏振片",
          zh: "移去前面偏振片",
          en: "移去前面偏振片",
        },
        createdAt: "2026-01-28T21:39:57.023Z",
        updatedAt: "2026-01-28T21:39:57.023Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image7.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 206,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 1691.7665551762352,
        y: 453.17856839318756,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769636521590",
      type: "conclusion",
      position: {
        x: 1096.8014553554178,
        y: 763.4936063389797,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T21:42:01.590Z",
        updatedAt: "2026-01-28T21:42:01.590Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "应力分布：泡泡顶部最薄的区域，表面张力需要支撑下方大部分液体的重量，因此这里的应力最大；相反，在底部最厚的区域，应力最小。\n\n初步分析：应力分布上下不对称，图样上下对称，故初步排除明暗纹样是气泡膜上应力的表现\n",
          zh: "应力分布：泡泡顶部最薄的区域，表面张力需要支撑下方大部分液体的重量，因此这里的应力最大；相反，在底部最厚的区域，应力最小。\n\n初步分析：应力分布上下不对称，图样上下对称，故初步排除明暗纹样是气泡膜上应力的表现\n",
          en: "应力分布：泡泡顶部最薄的区域，表面张力需要支撑下方大部分液体的重量，因此这里的应力最大；相反，在底部最厚的区域，应力最小。\n\n初步分析：应力分布上下不对称，图样上下对称，故初步排除明暗纹样是气泡膜上应力的表现\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 0,
        evidenceIds: [],
      },
      width: 768,
      height: 146,
      selected: false,
      positionAbsolute: {
        x: 1096.8014553554178,
        y: 763.4936063389797,
      },
      dragging: false,
    },
    {
      id: "experiment-1769636571207",
      type: "experiment",
      position: {
        x: 2044.523728330896,
        y: 282.22068073096,
      },
      data: {
        title: {
          "zh-CN": "实验：不同浓度溶液泡泡",
          zh: "实验：不同浓度溶液泡泡",
          en: "实验：不同浓度溶液泡泡",
        },
        createdAt: "2026-01-28T21:42:51.207Z",
        updatedAt: "2026-01-28T21:42:51.207Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "猜想二",
          zh: "猜想二",
          en: "猜想二",
        },
        status: "pending",
      },
      width: 242,
      height: 80,
      selected: false,
      positionAbsolute: {
        x: 2044.523728330896,
        y: 282.22068073096,
      },
      dragging: false,
    },
    {
      id: "media-1769636594006",
      type: "media",
      position: {
        x: 1967.7604182435336,
        y: 466.6735462592011,
      },
      data: {
        title: {
          "zh-CN": "低浓度",
          zh: "低浓度",
          en: "低浓度",
        },
        createdAt: "2026-01-28T21:43:14.006Z",
        updatedAt: "2026-01-28T21:43:14.006Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image8.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 190,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 1967.7604182435336,
        y: 466.6735462592011,
      },
      dragging: false,
    },
    {
      id: "media-1769636594707",
      type: "media",
      position: {
        x: 2180.049246149771,
        y: 464.01764910529766,
      },
      data: {
        title: {
          "zh-CN": "低高浓度",
          zh: "低高浓度",
          en: "低高浓度",
        },
        createdAt: "2026-01-28T21:43:14.707Z",
        updatedAt: "2026-01-28T21:43:14.707Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image9.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 196,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 2180.049246149771,
        y: 464.01764910529766,
      },
      dragging: false,
    },
    {
      id: "media-1769636670390",
      type: "media",
      position: {
        x: 2397.187008209894,
        y: 459.70646991250595,
      },
      data: {
        title: {
          "zh-CN": "模拟",
          zh: "模拟",
          en: "模拟",
        },
        createdAt: "2026-01-28T21:44:30.390Z",
        updatedAt: "2026-01-28T21:44:30.390Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image10.png",
        mediaType: "image",
        description: {
          "zh-CN": "SSIM值：0.72，形状大体相似",
          zh: "SSIM值：0.72，形状大体相似",
          en: "SSIM值：0.72，形状大体相似",
        },
      },
      width: 237,
      height: 232,
      selected: false,
      positionAbsolute: {
        x: 2397.187008209894,
        y: 459.70646991250595,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769636706023",
      type: "conclusion",
      position: {
        x: 1971.4634389370144,
        y: 748.2147137646143,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T21:45:06.023Z",
        updatedAt: "2026-01-28T21:45:06.023Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "改变溶液浓度，泡泡明暗图样无变化现象，故初步排除猜想2。\n",
          zh: "改变溶液浓度，泡泡明暗图样无变化现象，故初步排除猜想2。\n",
          en: "改变溶液浓度，泡泡明暗图样无变化现象，故初步排除猜想2。\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 0,
        evidenceIds: [],
      },
      width: 367,
      height: 126,
      selected: false,
      positionAbsolute: {
        x: 1971.4634389370144,
        y: 748.2147137646143,
      },
      dragging: false,
    },
    {
      id: "experiment-1769637504373",
      type: "experiment",
      position: {
        x: 2475.3118127217685,
        y: -224.39660850349094,
      },
      data: {
        title: {
          "zh-CN": "实验1：球形泡泡",
          zh: "实验1：球形泡泡",
          en: "实验1：球形泡泡",
        },
        createdAt: "2026-01-28T21:58:24.373Z",
        updatedAt: "2026-01-28T21:58:24.373Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "",
          zh: "",
          en: "",
        },
        status: "pending",
      },
      width: 220,
      height: 56,
      selected: false,
      positionAbsolute: {
        x: 2475.3118127217685,
        y: -224.39660850349094,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769637564490",
      type: "conclusion",
      position: {
        x: 2329.108758836333,
        y: 182.6905899621785,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T21:59:24.490Z",
        updatedAt: "2026-01-28T21:59:24.490Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "实验分析：\n根据菲涅尔定律，当入射面与入射光偏振方向平行时，投射光的偏振方向与原偏振光偏振方向一致。  \n球体经面和纬面处所有法向量和入射偏振光向量分别组成两个正交平面，与入射平行光共面，所以折射光的偏振方向未发生改变，在检偏器下仍呈现暗色，向四周渐变扩散；  \n根据球体的中心对称性，折射偏振光的偏振方向关于入射偏振光偏振方向的改变量关于球体几何中心对称，在检偏器下观测的图像也呈中心对称图案，印证泡泡球体由于几何特性出现各向异性。\n",
          zh: "实验分析：\n根据菲涅尔定律，当入射面与入射光偏振方向平行时，投射光的偏振方向与原偏振光偏振方向一致。  \n球体经面和纬面处所有法向量和入射偏振光向量分别组成两个正交平面，与入射平行光共面，所以折射光的偏振方向未发生改变，在检偏器下仍呈现暗色，向四周渐变扩散；  \n根据球体的中心对称性，折射偏振光的偏振方向关于入射偏振光偏振方向的改变量关于球体几何中心对称，在检偏器下观测的图像也呈中心对称图案，印证泡泡球体由于几何特性出现各向异性。\n",
          en: "实验分析：\n根据菲涅尔定律，当入射面与入射光偏振方向平行时，投射光的偏振方向与原偏振光偏振方向一致。  \n球体经面和纬面处所有法向量和入射偏振光向量分别组成两个正交平面，与入射平行光共面，所以折射光的偏振方向未发生改变，在检偏器下仍呈现暗色，向四周渐变扩散；  \n根据球体的中心对称性，折射偏振光的偏振方向关于入射偏振光偏振方向的改变量关于球体几何中心对称，在检偏器下观测的图像也呈中心对称图案，印证泡泡球体由于几何特性出现各向异性。\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 1,
        evidenceIds: [],
      },
      width: 1056,
      height: 158,
      selected: false,
      positionAbsolute: {
        x: 2329.108758836333,
        y: 182.6905899621785,
      },
      dragging: false,
    },
    {
      id: "media-1769637579489",
      type: "media",
      position: {
        x: 2988.125754978872,
        y: -69.66564260532644,
      },
      data: {
        title: {
          "zh-CN": "正交偏振系统下的光路传播及偏振态演变",
          zh: "正交偏振系统下的光路传播及偏振态演变",
          en: "正交偏振系统下的光路传播及偏振态演变",
        },
        createdAt: "2026-01-28T21:59:39.489Z",
        updatedAt: "2026-01-28T21:59:39.490Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image13.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 360,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 2988.125754978872,
        y: -69.66564260532644,
      },
      dragging: false,
    },
    {
      id: "media-1769637579674",
      type: "media",
      position: {
        x: 2647.9341317584376,
        y: -69.31325566129092,
      },
      data: {
        title: {
          "zh-CN": "偏振光在肥皂泡中的3D传播路径",
          zh: "偏振光在肥皂泡中的3D传播路径",
          en: "偏振光在肥皂泡中的3D传播路径",
        },
        createdAt: "2026-01-28T21:59:39.674Z",
        updatedAt: "2026-01-28T21:59:39.674Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image12.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 309,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 2647.9341317584376,
        y: -69.31325566129092,
      },
      dragging: false,
    },
    {
      id: "media-1769637579890",
      type: "media",
      position: {
        x: 2307.987278433573,
        y: -94.62908052660427,
      },
      data: {
        title: {
          "zh-CN": "",
          zh: "",
          en: "",
        },
        createdAt: "2026-01-28T21:59:39.890Z",
        updatedAt: "2026-01-28T21:59:39.890Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image11.png",
        mediaType: "image",
        description: {
          "zh-CN": "观察到泡泡中心呈现暗十字色块，四角呈现亮色块\n",
          zh: "观察到泡泡中心呈现暗十字色块，四角呈现亮色块\n",
          en: "观察到泡泡中心呈现暗十字色块，四角呈现亮色块\n",
        },
      },
      width: 300,
      height: 232,
      selected: false,
      positionAbsolute: {
        x: 2307.987278433573,
        y: -94.62908052660427,
      },
      dragging: false,
    },
    {
      id: "experiment-1769637783823",
      type: "experiment",
      position: {
        x: 3576.195292398701,
        y: -1023.412740771761,
      },
      data: {
        title: {
          "zh-CN": "猜想三",
          zh: "猜想三",
          en: "猜想三",
        },
        createdAt: "2026-01-28T22:03:03.823Z",
        updatedAt: "2026-01-28T22:03:03.823Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "",
          zh: "",
        },
        status: "pending",
      },
      width: 220,
      height: 56,
      selected: false,
      positionAbsolute: {
        x: 3576.195292398701,
        y: -1023.412740771761,
      },
      dragging: false,
    },
    {
      id: "experiment-1769637791222",
      type: "experiment",
      position: {
        x: 4075.2210886255443,
        y: -105.27288829555002,
      },
      data: {
        title: {
          "zh-CN": "新实验",
          zh: "新实验",
        },
        createdAt: "2026-01-28T22:03:11.222Z",
        updatedAt: "2026-01-28T22:03:11.222Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "实验3：单层泡泡膜薄膜\n",
          zh: "实验3：单层泡泡膜薄膜\n",
          en: "实验3：单层泡泡膜薄膜\n",
        },
        status: "pending",
      },
      width: 220,
      height: 80,
      selected: false,
      positionAbsolute: {
        x: 4075.2210886255443,
        y: -105.27288829555002,
      },
      dragging: false,
    },
    {
      id: "experiment-1769637800289",
      type: "experiment",
      position: {
        x: 4475.514088128213,
        y: -94.40043200021796,
      },
      data: {
        title: {
          "zh-CN": "实验4：圆柱体泡泡",
          zh: "实验4：圆柱体泡泡",
          en: "实验4：圆柱体泡泡",
        },
        createdAt: "2026-01-28T22:03:20.289Z",
        updatedAt: "2026-01-28T22:03:20.289Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "",
          zh: "",
        },
        status: "pending",
      },
      width: 220,
      height: 56,
      selected: false,
      positionAbsolute: {
        x: 4475.514088128213,
        y: -94.40043200021796,
      },
      dragging: false,
    },
    {
      id: "experiment-1769637860573",
      type: "experiment",
      position: {
        x: 3441.890714762487,
        y: -159.0273721473974,
      },
      data: {
        title: {
          "zh-CN": "实验2：旋转两块偏振片，且保持正交",
          zh: "实验2：旋转两块偏振片，且保持正交",
          en: "实验2：旋转两块偏振片，且保持正交",
        },
        createdAt: "2026-01-28T22:04:20.573Z",
        updatedAt: "2026-01-28T22:04:20.573Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "",
          zh: "",
        },
        status: "pending",
      },
      width: 321,
      height: 56,
      selected: false,
      positionAbsolute: {
        x: 3441.890714762487,
        y: -159.0273721473974,
      },
      dragging: false,
    },
    {
      id: "media-1769638016273",
      type: "media",
      position: {
        x: 3741.463360189425,
        y: -4.163603156875624,
      },
      data: {
        title: {
          "zh-CN": "",
          zh: "",
          en: "",
        },
        createdAt: "2026-01-28T22:06:56.273Z",
        updatedAt: "2026-01-28T22:06:56.273Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image15.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 195,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 3741.463360189425,
        y: -4.163603156875624,
      },
      dragging: false,
    },
    {
      id: "media-1769638016789",
      type: "media",
      position: {
        x: 3481.119144737544,
        y: -0.15100160624859882,
      },
      data: {
        title: {
          "zh-CN": "",
          zh: "",
          en: "",
        },
        createdAt: "2026-01-28T22:06:56.790Z",
        updatedAt: "2026-01-28T22:06:56.790Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image14.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 196,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 3481.119144737544,
        y: -0.15100160624859882,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769638059973",
      type: "conclusion",
      position: {
        x: 3052.689644465855,
        y: 448.15042468381307,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T22:07:39.973Z",
        updatedAt: "2026-01-28T22:07:39.973Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "\n实验现象：泡泡上的暗十字色块随偏振片系统的旋转而同步旋转。\n\n实验分析：入射线偏振光和检偏器的偏振面角度发生改变，在泡泡球上所对应的两个正交平面也发生对应偏转，导致暗十字随正交偏振系统的旋转而同步旋转。\n\n",
          zh: "\n实验现象：泡泡上的暗十字色块随偏振片系统的旋转而同步旋转。\n\n实验分析：入射线偏振光和检偏器的偏振面角度发生改变，在泡泡球上所对应的两个正交平面也发生对应偏转，导致暗十字随正交偏振系统的旋转而同步旋转。\n\n",
          en: "\n实验现象：泡泡上的暗十字色块随偏振片系统的旋转而同步旋转。\n\n实验分析：入射线偏振光和检偏器的偏振面角度发生改变，在泡泡球上所对应的两个正交平面也发生对应偏转，导致暗十字随正交偏振系统的旋转而同步旋转。\n\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 1,
        evidenceIds: [],
      },
      width: 876,
      height: 146,
      selected: false,
      positionAbsolute: {
        x: 3052.689644465855,
        y: 448.15042468381307,
      },
      dragging: false,
    },
    {
      id: "media-1769638108973",
      type: "media",
      position: {
        x: 4042.3706749705098,
        y: 246.84302254530795,
      },
      data: {
        title: {
          "zh-CN": "",
          zh: "",
          en: "",
        },
        createdAt: "2026-01-28T22:08:28.973Z",
        updatedAt: "2026-01-28T22:08:28.973Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image16.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
          en: "",
        },
      },
      width: 196,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 4042.3706749705098,
        y: 246.84302254530795,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769638127039",
      type: "conclusion",
      position: {
        x: 3666.0983703442926,
        y: 608.169710461955,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T22:08:47.039Z",
        updatedAt: "2026-01-28T22:08:47.039Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "实验现象：无明暗现象\n\n实验分析：单层泡泡膜可近似为平面，无表面曲率，几何特性导致泡泡膜不存在各向异性，所以没有出现黑白色块。\n\n",
          zh: "实验现象：无明暗现象\n\n实验分析：单层泡泡膜可近似为平面，无表面曲率，几何特性导致泡泡膜不存在各向异性，所以没有出现黑白色块。\n\n",
          en: "实验现象：无明暗现象\n\n实验分析：单层泡泡膜可近似为平面，无表面曲率，几何特性导致泡泡膜不存在各向异性，所以没有出现黑白色块。\n\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 1,
        evidenceIds: [],
      },
      width: 648,
      height: 146,
      selected: false,
      positionAbsolute: {
        x: 3666.0983703442926,
        y: 608.169710461955,
      },
      dragging: false,
    },
    {
      id: "media-1769638196973",
      type: "media",
      position: {
        x: 4598.370511447746,
        y: 129.169546248664,
      },
      data: {
        title: {
          "zh-CN": "新媒体",
          zh: "新媒体",
        },
        createdAt: "2026-01-28T22:09:56.973Z",
        updatedAt: "2026-01-28T22:09:56.973Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image17.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 208,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 4598.370511447746,
        y: 129.169546248664,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769638210789",
      type: "conclusion",
      position: {
        x: 4337.959596113478,
        y: 683.4780069485303,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T22:10:10.789Z",
        updatedAt: "2026-01-28T22:10:10.789Z",
        createdBy: "current-user",
        description: {
          "zh-CN":
            "实验现象：无明暗现象\n\n实验分析：泡泡圆柱侧面仍存在曲率，但水平或垂直改变入射点，入射光线与法线形成的折射面仍为同一平面或相互平行，故折射光线的偏振方向不会改变。\n",
          zh: "实验现象：无明暗现象\n\n实验分析：泡泡圆柱侧面仍存在曲率，但水平或垂直改变入射点，入射光线与法线形成的折射面仍为同一平面或相互平行，故折射光线的偏振方向不会改变。\n",
          en: "实验现象：无明暗现象\n\n实验分析：泡泡圆柱侧面仍存在曲率，但水平或垂直改变入射点，入射光线与法线形成的折射面仍为同一平面或相互平行，故折射光线的偏振方向不会改变。\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 1,
        evidenceIds: [],
      },
      width: 864,
      height: 146,
      selected: false,
      positionAbsolute: {
        x: 4337.959596113478,
        y: 683.4780069485303,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769638527273",
      type: "conclusion",
      position: {
        x: 3421.5954183816225,
        y: 1278.0183437445412,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T22:15:27.273Z",
        updatedAt: "2026-01-28T22:15:27.273Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "球体几何各向异性->正交偏振下明暗纹样\n",
          zh: "球体几何各向异性->正交偏振下明暗纹样\n",
          en: "球体几何各向异性->正交偏振下明暗纹样\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 1,
        evidenceIds: [],
      },
      width: 253,
      height: 126,
      selected: false,
      positionAbsolute: {
        x: 3421.5954183816225,
        y: 1278.0183437445412,
      },
      dragging: false,
    },
    {
      id: "conclusion-1769638578606",
      type: "conclusion",
      position: {
        x: 639.4890852947786,
        y: 884.3608735951618,
      },
      data: {
        title: {
          "zh-CN": "新结论",
          zh: "新结论",
        },
        createdAt: "2026-01-28T22:16:18.606Z",
        updatedAt: "2026-01-28T22:16:18.606Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "薄膜干涉->彩色条纹\n",
          zh: "薄膜干涉->彩色条纹\n",
          en: "薄膜干涉->彩色条纹\n",
        },
        statement: {
          "zh-CN": "",
          zh: "",
        },
        confidence: 1,
        evidenceIds: [],
      },
      width: 220,
      height: 126,
      selected: false,
      positionAbsolute: {
        x: 639.4890852947786,
        y: 884.3608735951618,
      },
      dragging: false,
    },
    {
      id: "experiment-1769638611989",
      type: "experiment",
      position: {
        x: 5144.209770148084,
        y: -112.34978654622972,
      },
      data: {
        title: {
          "zh-CN": "计算建模&程序模拟",
          zh: "计算建模&程序模拟",
          en: "计算建模&程序模拟",
        },
        createdAt: "2026-01-28T22:16:51.990Z",
        updatedAt: "2026-01-28T22:16:51.990Z",
        createdBy: "current-user",
        description: {
          "zh-CN": "",
          zh: "",
        },
        status: "pending",
      },
      width: 220,
      height: 56,
      selected: false,
      positionAbsolute: {
        x: 5144.209770148084,
        y: -112.34978654622972,
      },
      dragging: false,
    },
    {
      id: "media-1769638657522",
      type: "media",
      position: {
        x: 5193.5718384554475,
        y: 152.39796727115788,
      },
      data: {
        title: {
          "zh-CN": "数学公式",
          zh: "数学公式",
          en: "数学公式",
        },
        createdAt: "2026-01-28T22:17:37.522Z",
        updatedAt: "2026-01-28T22:17:37.522Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image18.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 530,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 5193.5718384554475,
        y: 152.39796727115788,
      },
      dragging: false,
    },
    {
      id: "media-1769638685156",
      type: "media",
      position: {
        x: 5356.532385105216,
        y: 432.95442825385095,
      },
      data: {
        title: {
          "zh-CN": "Matlab模拟",
          zh: "Matlab模拟",
          en: "Matlab模拟",
        },
        createdAt: "2026-01-28T22:18:05.156Z",
        updatedAt: "2026-01-28T22:18:05.156Z",
        createdBy: "current-user",
        url: "/gallery/bubble/image19.png",
        mediaType: "image",
        description: {
          "zh-CN": "",
          zh: "",
        },
      },
      width: 195,
      height: 208,
      selected: false,
      positionAbsolute: {
        x: 5356.532385105216,
        y: 432.95442825385095,
      },
      dragging: false,
    },
  ],
  edges: [
    {
      source: "problem-1769635855107",
      sourceHandle: null,
      target: "experiment-1769635887474",
      targetHandle: null,
      type: "custom",
      id: "e-problem-1769635855107-experiment-1769635887474-1769635908540",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "problem-1769635846091",
      sourceHandle: null,
      target: "experiment-1769635946873",
      targetHandle: null,
      type: "custom",
      id: "e-problem-1769635846091-experiment-1769635946873-1769635968074",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769635887474",
      sourceHandle: null,
      target: "media-1769636047340",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769635887474-media-1769636047340-1769636050473",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769635887474",
      sourceHandle: null,
      target: "conclusion-1769636060573",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769635887474-conclusion-1769636060573-1769636064390",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769635887474",
      sourceHandle: null,
      target: "media-1769636190073",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769635887474-media-1769636190073-1769636196157",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636340907",
      sourceHandle: null,
      target: "media-1769636384673",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636340907-media-1769636384673-1769636472990",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636340907",
      sourceHandle: null,
      target: "media-1769636388606",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636340907-media-1769636388606-1769636476889",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636340907",
      sourceHandle: null,
      target: "media-1769636397023",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636340907-media-1769636397023-1769636479092",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636340907",
      sourceHandle: null,
      target: "conclusion-1769636521590",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636340907-conclusion-1769636521590-1769636528357",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769635946873",
      sourceHandle: null,
      target: "experiment-1769636571207",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769635946873-experiment-1769636571207-1769636579973",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636571207",
      sourceHandle: null,
      target: "media-1769636594006",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636571207-media-1769636594006-1769636606359",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636571207",
      sourceHandle: null,
      target: "media-1769636594707",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636571207-media-1769636594707-1769636608023",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636571207",
      sourceHandle: null,
      target: "media-1769636670390",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636571207-media-1769636670390-1769636678224",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769636571207",
      sourceHandle: null,
      target: "conclusion-1769636706023",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769636571207-conclusion-1769636706023-1769636710490",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769635946873",
      sourceHandle: null,
      target: "experiment-1769636340907",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769635946873-experiment-1769636340907-1769637430722",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637504373",
      sourceHandle: null,
      target: "media-1769637579890",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637504373-media-1769637579890-1769637592640",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637504373",
      sourceHandle: null,
      target: "media-1769637579674",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637504373-media-1769637579674-1769637594206",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637504373",
      sourceHandle: null,
      target: "media-1769637579489",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637504373-media-1769637579489-1769637595706",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637504373",
      sourceHandle: null,
      target: "conclusion-1769637564490",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637504373-conclusion-1769637564490-1769637629206",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769635946873",
      sourceHandle: null,
      target: "experiment-1769637783823",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769635946873-experiment-1769637783823-1769637827339",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637783823",
      sourceHandle: null,
      target: "experiment-1769637504373",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637783823-experiment-1769637504373-1769637830506",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637783823",
      sourceHandle: null,
      target: "experiment-1769637800289",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637783823-experiment-1769637800289-1769637846557",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637783823",
      sourceHandle: null,
      target: "experiment-1769637791222",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637783823-experiment-1769637791222-1769637851856",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637783823",
      sourceHandle: null,
      target: "experiment-1769637860573",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637783823-experiment-1769637860573-1769637872190",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637860573",
      sourceHandle: null,
      target: "media-1769638016789",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637860573-media-1769638016789-1769638021557",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637860573",
      sourceHandle: null,
      target: "media-1769638016273",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637860573-media-1769638016273-1769638026839",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637860573",
      sourceHandle: null,
      target: "conclusion-1769638059973",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637860573-conclusion-1769638059973-1769638064759",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637791222",
      sourceHandle: null,
      target: "media-1769638108973",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637791222-media-1769638108973-1769638112056",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637791222",
      sourceHandle: null,
      target: "conclusion-1769638127039",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637791222-conclusion-1769638127039-1769638130256",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637800289",
      sourceHandle: null,
      target: "media-1769638196973",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637800289-media-1769638196973-1769638200709",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637800289",
      sourceHandle: null,
      target: "conclusion-1769638210789",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637800289-conclusion-1769638210789-1769638250406",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "conclusion-1769637564490",
      sourceHandle: null,
      target: "conclusion-1769638527273",
      targetHandle: null,
      type: "custom",
      id: "e-conclusion-1769637564490-conclusion-1769638527273-1769638551423",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "conclusion-1769638059973",
      sourceHandle: null,
      target: "conclusion-1769638527273",
      targetHandle: null,
      type: "custom",
      id: "e-conclusion-1769638059973-conclusion-1769638527273-1769638553790",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "conclusion-1769638127039",
      sourceHandle: null,
      target: "conclusion-1769638527273",
      targetHandle: null,
      type: "custom",
      id: "e-conclusion-1769638127039-conclusion-1769638527273-1769638558538",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "conclusion-1769638210789",
      sourceHandle: null,
      target: "conclusion-1769638527273",
      targetHandle: null,
      type: "custom",
      id: "e-conclusion-1769638210789-conclusion-1769638527273-1769638563572",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "conclusion-1769636060573",
      sourceHandle: null,
      target: "conclusion-1769638578606",
      targetHandle: null,
      type: "custom",
      id: "e-conclusion-1769636060573-conclusion-1769638578606-1769638581639",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769637783823",
      sourceHandle: null,
      target: "experiment-1769638611989",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769637783823-experiment-1769638611989-1769638645006",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "experiment-1769638611989",
      sourceHandle: null,
      target: "media-1769638657522",
      targetHandle: null,
      type: "custom",
      id: "e-experiment-1769638611989-media-1769638657522-1769638661306",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "media-1769638657522",
      sourceHandle: null,
      target: "media-1769638685156",
      targetHandle: null,
      type: "custom",
      id: "e-media-1769638657522-media-1769638685156-1769638688289",
      data: {
        edgeType: "relatedTo",
      },
    },
    {
      source: "media-1769638685156",
      sourceHandle: null,
      target: "conclusion-1769638527273",
      targetHandle: null,
      type: "custom",
      id: "e-media-1769638685156-conclusion-1769638527273-1769638717788",
      data: {
        edgeType: "relatedTo",
      },
    },
  ],
};

// ============================================================
// Export all example projects
// 导出所有示例课题
// ============================================================

export const EXAMPLE_PROJECTS: ExampleProject[] = [BUBBLE_POLARIZATION_PROJECT];

// ============================================================
// Helper Functions - 辅助函数
// ============================================================

/**
 * Get example project by ID
 * 根据 ID 获取示例课题
 */
export function getExampleProjectById(id: string): ExampleProject | undefined {
  return EXAMPLE_PROJECTS.find((project) => project.id === id);
}

/**
 * Get all example project IDs
 * 获取所有示例课题ID
 */
export function getExampleProjectIds(): string[] {
  return EXAMPLE_PROJECTS.map((project) => project.id);
}
