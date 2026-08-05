/**
 * Course Data Structure
 * 课程数据结构
 *
 * 定义课程内容的类型，包括 PPT、图片、视频等
 * 一个 unit 对应一节课
 */

import type { KnowledgeTag } from "@/lib/course.service";

/** 媒体类型 */
export type MediaType = "pptx" | "pdf" | "image" | "video";

/** 主课件（PDF） */
export interface MainSlide {
  id: string;
  /** PDF URL 或本地路径 */
  url: string;
  /** 标题 */
  title: LabelI18n;
  /** 知识分类 */
  knowledgeTag?: KnowledgeTag;
}

/** PPT/PDF 预览上的超链接区域 */
export interface PdfHyperlink {
  id: string;
  sourceMediaId?: string;
  /** PDF 页码（从 1 开始） */
  page: number;
  /** 中心点 X 坐标（相对于 PDF 页面宽度的比例，0-1） */
  x: number;
  /** 中心点 Y 坐标（相对于 PDF 页面高度的比例，0-1） */
  y: number;
  /** 宽度（相对于 PDF 页面宽度的比例，0-1） */
  width: number;
  /** 高度（相对于 PDF 页面高度的比例，0-1） */
  height: number;
  /** 链接到的媒体资源 id */
  targetMediaId: string;
}

/** 单个媒体资源 */
export interface MediaResource {
  id: string;
  type: MediaType;
  /** 媒体 URL 或本地路径 */
  url: string;
  /** PPT 绑定的 PDF 预览地址 */
  previewPdfUrl?: string;
  /** 媒体标题 */
  title: LabelI18n;
  /** 知识分类 */
  knowledgeTag?: KnowledgeTag;
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
  /** 知识分类 */
  knowledgeTag?: KnowledgeTag;
  /** 主课件 PDF */
  mainSlide?: MainSlide;
  /** PPT/PDF 预览上的超链接区域 */
  hyperlinks?: PdfHyperlink[];
  /** 媒体资源列表 */
  media: MediaResource[];
  /** 最后更新时间 */
  lastUpdated: string;
}
