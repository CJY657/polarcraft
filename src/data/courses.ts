/**
 * Course Data Structure
 * 课程数据结构
 *
 * 定义课程内容的类型，包括 PPT、图片、视频等
 * 一个 unit 对应一节课
 */

// ============================================================
// Types - 类型定义
// ============================================================

/** 媒体类型 */
export type MediaType = "pptx" | "image" | "video" | "pdf";

/** 单个媒体资源 */
export interface MediaResource {
  id: string;
  type: MediaType;
  /** 媒体 URL 或本地路径 */
  url: string;
  /** 媒体标题 */
  title: LabelI18n;
  /** 持续时间（秒，用于视频） */
  duration?: number;
}

/** 课程数据 */
export interface CourseData {
  id: string;
  /** 课程 ID（对应 psrt-curriculum.ts 中的单元 ID） */
  unitId: string;
  /** 课程标题 */
  title: LabelI18n;
  /** 课程描述 */
  description: LabelI18n;
  /** 课程封面图 */
  coverImage?: string;
  /** 课程颜色 */
  color: string;
  /** 媒体资源列表 */
  media: MediaResource[];
  /** 最后更新时间 */
  lastUpdated: string;
}

// ============================================================
// Course Data - 课程数据
// ============================================================

export const COURSE_DATA: CourseData[] = [
  {
    id: "course1",
    unitId: "course1",
    title: { "zh-CN": "冰洲石和布儒斯特实验介绍" },
    description: { "zh-CN": "介绍冰洲石和布儒斯特实验的基本原理和实验过程。" },
    color: "#C9A227",
    coverImage: "/courses/unit1/第一单元——冰洲石和布儒斯特实验介绍.jpg",
    lastUpdated: "2025-01-15",
    media: [
      {
        id: "course1-1-pdf",
        type: "pdf",
        url: "/courses/unit1/第一单元——冰洲石和布儒斯特实验介绍.pdf",
        title: { "zh-CN": "冰洲石和布儒斯特实验介绍PDF" },
      },
      {
        id: "course1-1-ppt",
        type: "pptx",
        url: "/courses/unit1/第一单元——冰洲石和布儒斯特实验介绍.pptx",
        title: { "zh-CN": "冰洲石和布儒斯特实验介绍PPT" },
      },
      {
        id: "course1-1-video",
        type: "video",
        url: "/courses/unit1/deb97d7e3269a022d2253806f412e176.mp4",
        title: { "zh-CN": "冰洲石上放置偏振片并进行旋转" },
        duration: 22,
      },
      {
        id: "course1-2-video",
        type: "video",
        url: "/courses/unit1/541c1ab4bb4ddaaa4dbe9d5ee387b900.mp4",
        title: { "zh-CN": "旋转最上面的冰洲石观察像的变化" },
        duration: 33,
      },
      {
        id: "course1-3-video",
        type: "video",
        url: "/courses/unit1/290ff791d6af4c5f5823d677d96a6214.mp4",
        title: { "zh-CN": "无偏振片旋转玻璃反射效果" },
        duration: 10,
      },
      {
        id: "course1-4-video",
        type: "video",
        url: "/courses/unit1/536ca3998764daacb81fe99c6ae7f5cf.mp4",
        title: { "zh-CN": "偏振片方向与纵向反射光偏振方向垂直旋转玻璃反射效果" },
        duration: 19,
      },
      {
        id: "course1-5-video",
        type: "video",
        url: "/courses/unit1/0e8f89038896948fd3e08075cfd3e31d.mp4",
        title: { "zh-CN": "偏振片方向与纵向反射光偏振方向平行旋转玻璃反射效果" },
        duration: 22,
      },
    ],
  },
  {
    id: "course2",
    unitId: "course2",
    title: { "zh-CN": "色偏振及旋光实验介绍" },
    description: { "zh-CN": "介绍色偏振及旋光实验的基本原理和实验过程。" },
    color: "#C9A227",
    coverImage: "/courses/unit2/第二单元——色偏振及旋光实验介绍.jpg",
    lastUpdated: "2025-01-15",
    media: [
      {
        id: "course2-1-pdf",
        type: "pdf",
        url: "/courses/unit2/第二单元——色偏振及旋光实验介绍.pdf",
        title: { "zh-CN": "第二单元——色偏振及旋光实验介绍PDF" },
      },
      {
        id: "course2-1-video",
        type: "video",
        url: "/courses/unit2/实验-打火机烧玻璃-正交偏振系统-长时间观察视频.mp4",
        title: { "zh-CN": "普通玻璃顶角加热在正交偏振系统视频" },
        duration: 31,
      },
      {
        id: "course2-2-video",
        type: "video",
        url: "/courses/unit2/实验-保鲜膜拉伸-平行偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "普通玻璃顶角加热在平行偏振系统正视图视频" },
        duration: 27,
      },
      {
        id: "course2-3-video",
        type: "video",
        url: "/courses/unit2/实验-保鲜膜拉伸-正交偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "普通玻璃顶角加热在正交偏振系统正视图视频" },
        duration: 34,
      },
      {
        id: "course2-4-video",
        type: "video",
        url: "/courses/unit2/实验-透明胶条-平行偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "透明胶条-平行偏振系统-旋转样品视频" },
        duration: 20,
      },
      {
        id: "course2-5-video",
        type: "video",
        url: "/courses/unit2/实验-透明胶条-正交偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "透明胶条-垂直偏振系统-旋转样品视频" },
        duration: 21,
      },
      {
        id: "course2-6-video",
        type: "video",
        url: "/courses/unit2/实验-透明胶条（重叠阵列）-正交偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "透明胶条（重叠阵列）-正交偏振系统-旋转样品视频" },
        duration: 28,
      },
      {
        id: "course2-7-video",
        type: "video",
        url: "/courses/unit2/文创-学院logo-正交偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "文创-学院logo" },
        duration: 35,
      },
      {
        id: "course2-8-video",
        type: "video",
        url: "/courses/unit2/文创-辛普森一家丽莎-正交偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "文创-辛普森一家丽莎" },
        duration: 21,
      },
      {
        id: "course2-9-video",
        type: "video",
        url: "/courses/unit2/文创-辛普森一家巴特-正交偏振系统-旋转样品视频.mp4",
        title: { "zh-CN": "文创-辛普森一家巴特" },
        duration: 20,
      },
      {
        id: "course2-10-video",
        type: "video",
        url: "/courses/unit2/3f7bddcd83e1c78ec530e8034a4707d9.mp4",
        title: { "zh-CN": "在电脑屏幕前色偏振效果展示" },
        duration: 32,
      },
      {
        id: "course2-11-video",
        type: "video",
        url: "/courses/unit2/ec19af91556693c2a4dbaab09b96560d.mp4",
        title: { "zh-CN": "旋光实验——白光旋光" },
        duration: 19,
      },
      {
        id: "course2-12-video",
        type: "video",
        url: "/courses/unit2/2f2c64e3c8c9665db282586a149d8f17.mp4",
        title: { "zh-CN": "旋光实验——单色激光" },
        duration: 22,
      },
    ],
  },
  {
    id: "course3",
    unitId: "course3",
    title: { "zh-CN": "散射实验介绍" },
    description: { "zh-CN": "介绍散射实验的基本原理和实验过程。" },
    color: "#C9A227",
    coverImage: "/courses/unit3/第三单元——散射实验介绍.jpg",
    lastUpdated: "2025-01-15",
    media: [
      {
        id: "course3-1-pdf",
        type: "pdf",
        url: "/courses/unit3/第三单元——散射实验介绍.pdf",
        title: { "zh-CN": "第三单元——散射实验介绍PDF" },
      },
      {
        id: "course3-1-ppt",
        type: "pptx",
        url: "/courses/unit3/第三单元——散射实验介绍.pptx",
        title: { "zh-CN": "第三单元——散射实验介绍PPT" },
      },
    ],
  },
  {
    id: "course4",
    unitId: "course4",
    title: { "zh-CN": "3种仪器介绍" },
    description: { "zh-CN": "介绍3种实验仪器的基本原理和使用方法。" },
    color: "#C9A227",
    coverImage: "/courses/unit4/第四单元——3种仪器介绍-.jpg",
    lastUpdated: "2025-01-15",
    media: [
      {
        id: "course4-1-pdf",
        type: "pdf",
        url: "/courses/unit4/第四单元——3种仪器介绍-.pdf",
        title: { "zh-CN": "第四单元——3种仪器介绍PDF" },
      },
    ],
  },
];

// ============================================================
// Helper Functions - 辅助函数
// ============================================================

/**
 * 根据单元 ID 获取课程数据
 */
export function getCourseByUnitId(unitId: string): CourseData | undefined {
  return COURSE_DATA.find((course) => course.unitId === unitId);
}

/**
 * 获取课程的所有媒体资源
 */
export function getAllMediaForCourse(courseId: string): MediaResource[] {
  const course = COURSE_DATA.find((c) => c.id === courseId);
  if (!course) return [];
  return course.media;
}

/**
 * 根据媒体类型筛选资源
 */
export function filterMediaByType(courseId: string, type: MediaType): MediaResource[] {
  const allMedia = getAllMediaForCourse(courseId);
  return allMedia.filter((media) => media.type === type);
}
