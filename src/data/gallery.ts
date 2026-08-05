/**
 * Gallery Data Structure
 * 作品展示数据结构
 *
 * 定义学生作品展示平台的类型和数据
 */

// ============================================================
// Types - 类型定义
// ============================================================

/** 媒体类型 */
export type GalleryMediaType =
  | "image" // 图片
  | "video" // 视频
  | "pdf" // PDF 文档
  | "docx" // Word 文档
  | "pptx" // PPT 演示文稿
  | "markdown" // Markdown 文档
  | "matlab" // MATLAB 代码
  | "other"; // 其他

/** 作者信息 */
export interface Author {
  id: string;
  name: LabelI18n;
  avatar?: string;
  role?: LabelI18n; // 学生/教师/研究员
}

/** 记录图片 */
export interface RecordImage {
  url: string;
  caption?: LabelI18n; // 图片说明
}

/** 实验记录条目 */
export interface RecordEntry {
  id: string;
  date: string; // ISO 日期格式
  title: LabelI18n;
  content: string;
  images?: RecordImage[]; // 图片数组（含描述）
}

/** 媒体资源 */
export interface GalleryMedia {
  id: string;
  type: GalleryMediaType;
  url: string;
  title: LabelI18n;
  description?: LabelI18n;
  thumbnail?: string;
  duration?: number; // 视频时长（秒）
  fileSize?: number; // 文件大小（字节）
  uploadedAt: string; // ISO 时间格式
}

/** 作品数据 */
export interface GalleryWork {
  id: string;

  // 基本信息
  title: LabelI18n;
  subtitle?: LabelI18n;
  description: LabelI18n;

  // 作者信息
  authors: Author[];

  // 视觉资源
  coverImage: string;
  gallery: string[]; // 展示画廊图片

  // 研究记录
  recordEntries?: RecordEntry[];

  // 媒体资源
  mediaResources: GalleryMedia[];

  // 元数据
  createdAt: string;
  updatedAt: string;
  status: "private" | "public";

  // 统计数据
  views: number;
  likes: number;
}

// ============================================================
// Sample Data - 示例数据
// ============================================================

export const GALLERY_WORKS: GalleryWork[] = [
  // ========================================
  // 作品 1: 洗手液气泡偏振实验
  // ========================================
  {
    id: "bubble-polarization",
    title: { "zh-CN": "洗手液气泡在偏振光下的条纹成因探究" },
    subtitle: { "zh-CN": "三分之七个诸葛亮组" },
    description: {
      "zh-CN":
        "本实验基于菲涅尔公式和球体的空间几何对称性，通过搭建正交偏振系统，对不同形态、不同浓度的洗手液泡泡进行观测，探究洗手液泡泡表面彩色条纹和明暗色块的成因。",
    },
    authors: [
      { id: "author1", name: { "zh-CN": "周义茗" }, role: { "zh-CN": "学生" } },
      { id: "author2", name: { "zh-CN": "朱梓晗" }, role: { "zh-CN": "学生" } },
      { id: "author3", name: { "zh-CN": "郭佳怡" }, role: { "zh-CN": "学生" } },
      { id: "author4", name: { "zh-CN": "聂天泽" }, role: { "zh-CN": "学生" } },
      { id: "author5", name: { "zh-CN": "邓天健" }, role: { "zh-CN": "学生" } },
      { id: "author6", name: { "zh-CN": "李依琳" }, role: { "zh-CN": "学生" } },
      { id: "author7", name: { "zh-CN": "吕一鸣" }, role: { "zh-CN": "学生" } },
    ],
    coverImage: "/gallery/bubble/IMG_7523.png",
    gallery: [
      "/gallery/bubble/IMG_7523.png",
      "/gallery/bubble/IMG_7524.png",
    ],
    recordEntries: [
      {
        id: "record1",
        date: "2026-01-22",
        title: { "zh-CN": "初次观察" },
        content: "泡泡在正交偏振下出现彩色条纹和明暗色块",
        images: [
          { url: "/gallery/bubble/image1.png", caption: { "zh-CN": "十字形明暗色块" } },
          { url: "/gallery/bubble/image2.png", caption: { "zh-CN": "彩色条纹" } },
        ],
      },
      {
        id: "record2",
        date: "2026-01-23",
        title: { "zh-CN": "猜想：彩色条纹的出现源于光的色偏振？光的干涉？" },
        content:
          "实验现象：移去偏振片彩色条纹不变\n实验结论：彩色条纹的出现源于光的干涉，与光的色偏振无关",
        images: [
          { url: "/gallery/bubble/image3.png", caption: { "zh-CN": "有正交偏振片" } },
          { url: "/gallery/bubble/image4.png", caption: { "zh-CN": "移去前面偏振片" } },
        ],
      },
      {
        id: "record3",
        date: "2026-01-23",
        title: { "zh-CN": "猜想1：偏振光照射下出现的明暗纹样是气泡膜上应力的表现" },
        content:
          "应力分布：泡泡顶部最薄的区域，表面张力需要支撑下方大部分液体的重量，因此这里的应力最大；相反，在底部最厚的区域，应力最小。\n初步分析：应力分布上下不对称，图样上下对称，故初步排除明暗纹样是气泡膜上应力的表现",
        images: [
          { url: "/gallery/bubble/image5.png", caption: { "zh-CN": "气泡应力分布仿真图" } },
          { url: "/gallery/bubble/image6.png", caption: { "zh-CN": "有正交偏振片" } },
          { url: "/gallery/bubble/image7.png", caption: { "zh-CN": "移去前面偏振片" } },
        ],
      },
      {
        id: "record4",
        date: "2026-01-23",
        title: { "zh-CN": "猜想2：明暗纹样是气泡膜表面分子排布具有各向异性的体现" },
        content: "改变溶液浓度，泡泡明暗图样无变化现象，故初步排除猜想2。",
        images: [
          { url: "/gallery/bubble/image8.png", caption: { "zh-CN": "高浓度" } },
          { url: "/gallery/bubble/image9.png", caption: { "zh-CN": "低浓度" } },
          {
            url: "/gallery/bubble/image10.png",
            caption: { "zh-CN": "SSIM值：0.72，形状大体相似" },
          },
        ],
      },
      {
        id: "record5",
        date: "2026-01-23",
        title: { "zh-CN": "猜想3：明暗纹样源于球形曲面的几何特性与线偏振光之间的相互作用 实验一" },
        content:
          "实验1：球形泡泡\n实验分析：\n根据菲涅尔定律，当入射面与入射光偏振方向平行时，投射光的偏振方向与原偏振光偏振方向一致。\n球体经面和纬面处所有法向量和入射偏振光向量分别组成两个正交平面，与入射平行光共面，所以折射光的偏振方向未发生改变，在检偏器下仍呈现暗色，向四周渐变扩散；根据球体的中心对称性，折射偏振光的偏振方向关于入射偏振光偏振方向的改变量关于球体几何中心对称，在检偏器下观测的图像也呈中心对称图案，印证泡泡球体由于几何特性出现各向异性。",
        images: [
          {
            url: "/gallery/bubble/image11.png",
            caption: { "zh-CN": "观察到泡泡中心呈现暗十字色块，四角呈现亮色块" },
          },
          {
            url: "/gallery/bubble/image12.png",
            caption: { "zh-CN": "" },
          },
          {
            url: "/gallery/bubble/image13.png",
            caption: { "zh-CN": "" },
          },
        ],
      },
      {
        id: "record6",
        date: "2026-01-23",
        title: { "zh-CN": "猜想3：明暗纹样源于球形曲面的几何特性与线偏振光之间的相互作用 实验二" },
        content:
          "实验2：旋转两块偏振片，且保持正交\n实验现象：泡泡上的暗十字色块随偏振片系统的旋转而同步旋转。\n实验分析：入射线偏振光和检偏器的偏振面角度发生改变，在泡泡球上所对应的两个正交平面也发生对应偏转，导致暗十字随正交偏振系统的旋转而同步旋转。",
        images: [
          {
            url: "/gallery/bubble/image14.png",
            caption: { "zh-CN": "" },
          },
          {
            url: "/gallery/bubble/image15.png",
            caption: { "zh-CN": "" },
          },
        ],
      },
      {
        id: "record7",
        date: "2026-01-23",
        title: { "zh-CN": "猜想3：明暗纹样源于球形曲面的几何特性与线偏振光之间的相互作用 实验三" },
        content:
          "实验3：单层泡泡膜薄膜\n实验现象：无明暗现象\n实验分析：单层泡泡膜可近似为平面，无表面曲率，几何特性导致泡泡膜不存在各向异性，所以没有出现黑白色块。",
        images: [
          {
            url: "/gallery/bubble/image16.png",
            caption: { "zh-CN": "" },
          },
        ],
      },
      {
        id: "record8",
        date: "2026-01-23",
        title: { "zh-CN": "猜想3：明暗纹样源于球形曲面的几何特性与线偏振光之间的相互作用 实验四" },
        content:
          "实验4：圆柱体泡泡\n实验现象：无明暗现象\n实验分析：泡泡圆柱侧面仍存在曲率，但水平或垂直改变入射点，入射光线与法线形成的折射面仍为同一平面或相互平行，故折射光线的偏振方向不会改变。",
        images: [
          {
            url: "/gallery/bubble/image17.png",
            caption: { "zh-CN": "" },
          },
        ],
      },
      {
        id: "record9",
        date: "2026-01-23",
        title: { "zh-CN": "计算建模&程序模拟" },
        content: "",
        images: [
          {
            url: "/gallery/bubble/image18.png",
            caption: { "zh-CN": "人眼近似看到的光强" },
          },
          {
            url: "/gallery/bubble/image19.png",
            caption: { "zh-CN": "Matlab程序计算模拟模拟图像" },
          },
        ],
      },
      {
        id: "record10",
        date: "2026-01-23",
        title: { "zh-CN": "实验初步结论" },
        content: "",
        images: [
          {
            url: "/gallery/bubble/image20.png",
            caption: { "zh-CN": "球体几何各向异性->正交偏振下明暗纹样" },
          },
          {
            url: "/gallery/bubble/image21.png",
            caption: { "zh-CN": "薄膜干涉->彩色条纹" },
          },
        ],
      },
    ],
    mediaResources: [
      {
        id: "media3",
        type: "pptx",
        url: "/gallery/bubble/01偏振光.pptx",
        title: { "zh-CN": "研究报告演示文稿" },
        description: { "zh-CN": "完整的研究报告PPT，包含实验过程、数据分析和结论" },
        uploadedAt: "2026-01-27T14:30:00Z",
      },
      {
        id: "media4",
        type: "pdf",
        url: "/gallery/bubble/实验报告.pdf",
        title: { "zh-CN": "实验报告 PDF" },
        description: { "zh-CN": "详细的实验报告，包含完整的理论推导和数据分析" },
        uploadedAt: "2026-01-27T09:00:00Z",
      },
      {
        id: "media5",
        type: "pptx",
        url: "/gallery/bubble/泡泡偏振海报.pptx",
        title: { "zh-CN": "海报" },
        description: { "zh-CN": "海报" },
        uploadedAt: "2026-01-27T14:30:00Z",
      },
    ],
    createdAt: "2026-01-22T10:00:00Z",
    updatedAt: "2026-01-28T15:30:00Z",
    status: "public",
    views: 0,
    likes: 0,
  },
];

// ============================================================
// Helper Functions - 辅助函数
// ============================================================

/**
 * 根据 ID 获取作品
 */
export function getWorkById(id: string): GalleryWork | undefined {
  return GALLERY_WORKS.find((work) => work.id === id);
}

/**
 * 获取公开作品列表
 */
export function getPublicWorks(): GalleryWork[] {
  return GALLERY_WORKS.filter((work) => work.status === "public");
}
