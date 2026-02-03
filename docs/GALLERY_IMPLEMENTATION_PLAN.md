# Gallery 学生作品展示平台 - 实施计划

## 项目概述

为 PolarCraft 项目创建一个完整的学生作品展示和交流平台。学生可以展示他们的研究成果、实验记录、媒体资源，并进行讨论交流。

**核心功能：**

- 作品展示（列表 + 详情）
- 实验记录（时间线式记录研究过程）
- 媒体资源管理（图片、视频、文档）
- 讨论区（评论和交流）

**技术决策：**

- 前端：React + TypeScript + Tailwind CSS
- 后端：Node.js + Express + TypeScript
- 数据库：MySQL
- 认证：JWT
- 存储：本地存储 / 云存储（可选）

**实施策略：分阶段开发：**

- 第一阶段：前端基础架构（静态数据）
- 第二阶段：详情页完整实现
- 第三阶段：后端 API 开发
- 第四阶段：用户认证系统
- 第五阶段：上传和管理功能

---

## 第一阶段：前端基础架构（MVP）

### 目标

创建完整的 UI/UX 和数据结构，使用静态数据进行演示。

### 1.1 数据结构设计

**文件：** `src/data/gallery.ts`

```typescript
// ============================================================
// Types - 类型定义
// ============================================================

/** 媒体类型 */
export type GalleryMediaType =
  | "image"      // 图片
  | "video"      // 视频
  | "pdf"        // PDF 文档
  | "docx"       // Word 文档
  | "pptx"       // PPT 演示文稿
  | "markdown"   // Markdown 文档
  | "matlab"     // MATLAB 代码
  | "other";     // 其他

/** 作者信息 */
export interface Author {
  id: string;
  name: LabelI18n;
  avatar?: string;
  role?: LabelI18n;  // 学生/教师/研究员
}

/** 讨论评论 */
export interface Comment {
  id: string;
  authorId: string;
  authorName: LabelI18n;
  authorAvatar?: string;
  content: string;
  timestamp: number;  // Unix 时间戳
  replyTo?: string;   // 回复的评论 ID
  likes: number;
}

/** 实验记录条目 */
export interface RecordEntry {
  id: string;
  date: string;       // ISO 日期格式
  title: LabelI18n;
  content: string;
  images?: string[];  // 图片 URL 数组
  tags?: string[];
}

/** 媒体资源 */
export interface GalleryMedia {
  id: string;
  type: GalleryMediaType;
  url: string;
  title: LabelI18n;
  description?: LabelI18n;
  thumbnail?: string;
  duration?: number;      // 视频时长（秒）
  fileSize?: number;      // 文件大小（字节）
  uploadedAt: string;     // ISO 时间格式
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
  gallery: string[];      // 展示画廊图片

  // 研究记录
  recordEntries?: RecordEntry[];

  // 媒体资源
  mediaResources: GalleryMedia[];

  // 讨论区
  comments: Comment[];

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
  {
    id: "bubble-polarization",
    title: { "zh-CN": "洗手液气泡在偏振光下的条纹成因探究" },
    subtitle: { "zh-CN": "三分之七个诸葛亮组" },
    description: {
      "zh-CN": "通过观察洗手液气泡在偏振光下的条纹现象，探究其成因并分析偏振光的干涉原理。本实验记录了从装置搭建、现象观察到数据分析的完整研究过程。",
    },
    authors: [
      { id: "author1", name: { "zh-CN": "张三" }, role: { "zh-CN": "学生" } },
      { id: "author2", name: { "zh-CN": "李四" }, role: { "zh-CN": "学生" } },
    ],
    coverImage: "/gallery/bubble/cover.png",
    gallery: ["/gallery/bubble/IMG_7523.png", "/gallery/bubble/IMG_7524.png"],
    recordEntries: [
      {
        id: "record1",
        date: "2025-01-15",
        title: { "zh-CN": "初次观察" },
        content: "将两片偏振片垂直放置，中间形成气泡膜。在白光照射下观察到清晰的彩色条纹，条纹间距随气泡厚度变化呈现规律性分布。",
        images: ["/gallery/bubble/record1.png"],
        tags: ["观察", "条纹"],
      },
      {
        id: "record2",
        date: "2025-01-16",
        title: { "zh-CN": "定量测量" },
        content: "使用游标卡尺测量不同位置的条纹间距，数据表明条纹间距与气泡厚度呈反比关系。",
        tags: ["测量", "数据分析"],
      },
    ],
    mediaResources: [
      {
        id: "media1",
        type: "image",
        url: "/gallery/bubble/IMG_7523.png",
        title: { "zh-CN": "条纹照片1" },
        description: { "zh-CN": "偏振光下的气泡条纹特写" },
        uploadedAt: "2025-01-15T10:00:00Z",
      },
      {
        id: "media2",
        type: "pptx",
        url: "/gallery/bubble/presentation.pptx",
        title: { "zh-CN": "研究报告演示文稿" },
        uploadedAt: "2025-01-17T14:30:00Z",
      },
    ],
    comments: [
      {
        id: "comment1",
        authorId: "teacher1",
        authorName: { "zh-CN": "王老师" },
        content: "观察非常细致！条纹的颜色分布很有规律性，建议进一步分析不同波长的光在不同厚度薄膜中的干涉条件。",
        timestamp: 1736982600000,
        likes: 5,
      },
    ],
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-17T15:30:00Z",
    status: "public",
    views: 156,
    likes: 23,
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
 * 搜索作品
 */
export function searchWorks(query: string): GalleryWork[] {
  const lowerQuery = query.toLowerCase();
  return GALLERY_WORKS.filter(
    (work) =>
      work.title["zh-CN"].toLowerCase().includes(lowerQuery) ||
      work.description["zh-CN"].toLowerCase().includes(lowerQuery),
  );
}

/**
 * 获取公开作品列表
 */
export function getPublicWorks(): GalleryWork[] {
  return GALLERY_WORKS.filter((work) => work.status === "public");
}
```

### 1.2 组件目录结构

```txt
src/components/gallery/
├── index.ts                      # 统一导出
│
├── card/                         # 作品卡片相关
│   ├── index.ts
│   ├── WorkCard.tsx              # 作品卡片组件
│   └── WorkCardSkeleton.tsx      # 加载骨架屏
│
├── detail/                       # 详情页相关
│   ├── index.ts
│   ├── WorkDetailPage.tsx        # 详情页主框架
│   ├── WorkHeader.tsx            # 作品头部信息
│   └── WorkActions.tsx           # 操作按钮（点赞、分享、收藏）
│
├── record/                       # 实验记录相关
│   ├── index.ts
│   ├── RecordSection.tsx         # 记录区块
│   ├── RecordTimeline.tsx        # 时间线展示
│   ├── RecordEntry.tsx           # 单条记录
│   └── RecordForm.tsx            # 记录表单（后期）
│
├── discussion/                   # 讨论区相关
│   ├── index.ts
│   ├── DiscussionSection.tsx     # 讨论区容器
│   ├── CommentList.tsx           # 评论列表
│   ├── CommentItem.tsx           # 单条评论
│   ├── CommentForm.tsx           # 评论表单
│   └── ReplyThread.tsx           # 回复线程
│
└── media/                        # 媒体资源相关
    ├── index.ts
    ├── MediaGallery.tsx          # 媒体画廊
    ├── MediaGrid.tsx             # 媒体网格
    ├── MediaItem.tsx             # 单个媒体项
    ├── MediaViewer.tsx           # 媒体查看器
    └── MediaUpload.tsx           # 上传组件（后期）
```

### 1.3 核心组件实现

#### WorkCard.tsx - 作品卡片

**文件：** `src/components/gallery/card/WorkCard.tsx`

```typescript
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/classNames";
import { Eye, Heart, Users } from "lucide-react";
import type { GalleryWork } from "@/data/gallery";

interface WorkCardProps {
  work: GalleryWork;
  onClick: () => void;
}

export function WorkCard({ work, onClick }: WorkCardProps) {
  const { theme } = useTheme();
  const { i18n } = useTranslation();

  return (
    <div
      onClick={onClick}
      className={cn(
        "group rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-xl",
        theme === "dark"
          ? "bg-slate-800/50 border-2 border-slate-700 hover:border-slate-500"
          : "bg-white shadow-sm hover:shadow-lg",
      )}
    >
      {/* 封面图 */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={work.coverImage}
          alt={work.title[i18n.language]}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* 内容 */}
      <div className="p-5">
        {/* 标题 */}
        <h3
          className={cn(
            "text-lg font-bold mb-2 line-clamp-2",
            theme === "dark" ? "text-white" : "text-gray-900",
          )}
        >
          {work.title[i18n.language]}
        </h3>

        {/* 副标题/团队 */}
        {work.subtitle && (
          <p
            className={cn(
              "text-xs mb-2",
              theme === "dark" ? "text-gray-500" : "text-gray-400",
            )}
          >
            {work.subtitle[i18n.language]}
          </p>
        )}

        {/* 描述 */}
        <p
          className={cn(
            "text-sm mb-4 line-clamp-2",
            theme === "dark" ? "text-gray-400" : "text-gray-600",
          )}
        >
          {work.description[i18n.language]}
        </p>

        {/* 作者 */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-gray-500" />
          <span
            className={cn(
              "text-xs",
              theme === "dark" ? "text-gray-400" : "text-gray-600",
            )}
          >
            {work.authors.map((a) => a.name[i18n.language]).join(", ")}
          </span>
        </div>

        {/* 统计 */}
        <div className="flex items-center gap-4 text-xs">
          <div
            className={cn(
              "flex items-center gap-1",
              theme === "dark" ? "text-gray-400" : "text-gray-600",
            )}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{work.views}</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1",
              theme === "dark" ? "text-gray-400" : "text-gray-600",
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{work.likes}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### WorkDetailPage.tsx - 详情页主框架

**文件：** `src/components/gallery/detail/WorkDetailPage.tsx`

```typescript
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/utils/classNames";
import { ChevronLeft } from "lucide-react";
import type { GalleryWork } from "@/data/gallery";
import { getWorkById } from "@/data/gallery";

import { WorkHeader } from "./WorkHeader";
import { WorkActions } from "./WorkActions";
import { RecordSection } from "../record";
import { DiscussionSection } from "../discussion";
import { MediaGallery } from "../media";

type DetailTab = "overview" | "record" | "discussion" | "media";

export function WorkDetailPage() {
  const { theme } = useTheme();
  const { t, i18n } = useTranslation();
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  const work = workId ? getWorkById(workId) : null;

  if (!work) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>作品未找到</p>
      </div>
    );
  }

  // 动态生成标签页
  const tabs = [
    { id: "overview" as const, label: { "zh-CN": "概览" } },
    ...(work.recordEntries?.length
      ? [{ id: "record" as const, label: { "zh-CN": "研究记录" } }]
      : []),
    ...(work.comments?.length
      ? [{ id: "discussion" as const, label: { "zh-CN": "讨论" } }]
      : []),
    ...(work.mediaResources?.length
      ? [{ id: "media" as const, label: { "zh-CN": "媒体资源" } }]
      : []),
  ];

  return (
    <div
      className={cn(
        "min-h-screen",
        theme === "dark"
          ? "bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0a0a2a]"
          : "bg-gradient-to-br from-[#fffbeb] via-[#fef3c7] to-[#fffbeb]",
      )}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 backdrop-blur-lg border-b">
        <div
          className={cn(
            theme === "dark"
              ? "bg-slate-900/80 border-slate-700"
              : "bg-white/80 border-gray-200",
          )}
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            {/* 返回按钮 */}
            <button
              onClick={() => navigate("/gallery")}
              className={cn(
                "inline-flex items-center gap-2 mb-4 text-sm",
                theme === "dark"
                  ? "text-gray-400 hover:text-white"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>返回列表</span>
            </button>

            {/* 作品头部 */}
            <WorkHeader work={work} />

            {/* 操作按钮 */}
            <WorkActions work={work} />
          </div>

          {/* 标签页 */}
          <div className="max-w-7xl mx-auto px-4 pb-4">
            <div
              className={cn(
                "flex gap-1 p-1 rounded-lg overflow-x-auto",
                theme === "dark" ? "bg-slate-800" : "bg-gray-100",
              )}
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? theme === "dark"
                        ? "bg-slate-700 text-white"
                        : "bg-white text-gray-900 shadow-sm"
                      : theme === "dark"
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-600 hover:text-gray-900",
                  )}
                >
                  {tab.label[i18n.language]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "overview" && (
          <div
            className={cn(
              "rounded-2xl p-6",
              theme === "dark" ? "bg-slate-800/50" : "bg-white",
            )}
          >
            {/* 概览内容 */}
            <h2
              className={cn(
                "text-xl font-bold mb-4",
                theme === "dark" ? "text-white" : "text-gray-900",
              )}
            >
              项目简介
            </h2>
            <p
              className={cn(
                "mb-4 leading-relaxed",
                theme === "dark" ? "text-gray-300" : "text-gray-700",
              )}
            >
              {work.description[i18n.language]}
            </p>

            {/* 画廊预览 */}
            {work.gallery.length > 0 && (
              <div className="mt-6">
                <h3
                  className={cn(
                    "text-lg font-semibold mb-3",
                    theme === "dark" ? "text-white" : "text-gray-900",
                  )}
                >
                  项目展示
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {work.gallery.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Gallery ${idx + 1}`}
                      className="rounded-lg object-cover w-full h-32"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "record" && work.recordEntries && (
          <RecordSection entries={work.recordEntries} />
        )}

        {activeTab === "discussion" && work.comments && (
          <DiscussionSection comments={work.comments} workId={work.id} />
        )}

        {activeTab === "media" && work.mediaResources && (
          <MediaGallery media={work.mediaResources} />
        )}
      </main>
    </div>
  );
}
```

### 1.4 修改现有文件

#### GalleryPage.tsx - 添加导航功能

**文件：** `src/pages/GalleryPage.tsx`

主要修改：

1. 导入新的 `WorkCard` 组件和 `GALLERY_WORKS` 数据
2. 替换原有的 `GalleryCard`
3. 添加点击事件处理

#### App.tsx - 添加详情页路由

```typescript
// 添加路由
<Route path="/gallery/work/:workId" element={<WorkDetailPage />} />
```

---

## 第二阶段：功能模块组件

### 2.1 WorkHeader - 作品头部信息

显示：标题、副标题、作者信息、标签、统计数据

### 2.2 WorkActions - 操作按钮

功能：点赞、分享、收藏

### 2.3 RecordSection - 研究记录

**文件：** `src/components/gallery/record/RecordSection.tsx`

功能：时间线式展示研究过程的记录

**RecordTimeline.tsx** - 时间线组件

**RecordEntry.tsx** - 单条记录组件，显示日期、标题、内容、图片、标签

### 2.4 DiscussionSection - 讨论区

**文件：** `src/components/gallery/discussion/DiscussionSection.tsx`

功能：展示评论列表，支持嵌套回复

**CommentList.tsx** - 评论列表

**CommentItem.tsx** - 单条评论，显示作者、内容、时间、点赞数

**CommentForm.tsx** - 评论表单

**ReplyThread.tsx** - 回复线程展示

### 2.5 MediaGallery - 媒体资源

**文件：** `src/components/gallery/media/MediaGallery.tsx`

功能：网格展示所有媒体资源

**MediaGrid.tsx** - 媒体网格布局

**MediaItem.tsx** - 单个媒体项，根据类型显示不同预览

**MediaViewer.tsx** - 媒体查看器，支持图片、视频、PDF 预览

---

## 第三阶段：后端 API 开发

### 3.1 技术决策：渐进式架构

**MVP 阶段（推荐起步）：**

- 后端框架: Node.js + Express + TypeScript
- 数据存储: JSON 文件存储 (server/db/json/)
- 认证: JWT + bcrypt
- 文件存储: 本地存储 / Multer

**扩展阶段（数据增长后）：**

- 数据库: PostgreSQL + Prisma ORM
- 云存储: Vercel Blob / AWS S3

**优势：**

- 快速启动，无需数据库配置
- 易于调试和数据迁移
- 成本为零
- 可无缝升级到 PostgreSQL

### 3.2 安装依赖

```bash
# 后端核心依赖
pnpm add express cors multer jsonwebtoken bcryptjs

# TypeScript 类型
pnpm add -D @types/express @types/cors @types/multer @types/jsonwebtoken @types/bcryptjs tsx

# 前端 API 客户端（如果还没有）
pnpm add axios
```

### 3.3 后端目录结构

```txt
server/
├── index.ts              # Express 服务器入口
├── config/
│   ├── jwt.ts            # JWT 配置
│   └── upload.ts         # 上传配置
├── routes/
│   ├── auth.ts           # 认证路由
│   ├── works.ts          # 作品路由
│   ├── records.ts        # 记录路由
│   ├── comments.ts       # 评论路由
│   └── media.ts          # 媒体路由
├── middleware/
│   ├── auth.ts           # JWT 认证中间件
│   ├── error.ts          # 错误处理
│   └── upload.ts         # Multer 文件上传中间件
├── services/
│   └── authService.ts    # 认证业务逻辑
├── db/
│   ├── repository.ts     # JSON 数据访问层
│   └── json/
│       ├── users.json    # 用户数据
│       ├── works.json    # 作品数据
│       ├── records.json  # 记录数据
│       ├── comments.json # 评论数据
│       └── media.json    # 媒体数据
└── types/
    └── index.ts          # 共享类型定义

src/api/
├── client.ts             # Axios API 客户端
├── auth.ts               # 认证 API 调用
├── works.ts              # 作品 API 调用
└── upload.ts             # 上传 API 调用

public/uploads/           # 上传文件目录
```

### 3.4 API 端点总览

```txt
API 基础路径: /api
认证方式: Bearer Token (JWT)
```

### 3.5 认证模块 API

| 方法 | 端点 | 描述 | 认证 |
| ------ | ------ | ------ | ------ |
| POST | `/auth/register` | 用户注册 | 否 |
| POST | `/auth/login` | 用户登录 | 否 |
| POST | `/auth/logout` | 用户登出 | 是 |
| POST | `/auth/refresh` | 刷新 Token | 否 |
| POST | `/auth/forgot-password` | 忘记密码 | 否 |
| POST | `/auth/reset-password` | 重置密码 | 否 |
| GET | `/auth/me` | 获取当前用户信息 | 是 |
| PUT | `/auth/profile` | 更新个人资料 | 是 |
| PUT | `/auth/password` | 修改密码 | 是 |

#### 请求/响应示例

**POST /auth/register - 用户注册:**

```typescript
// 请求
interface RegisterRequest {
  username: string;      // 用户名（3-20字符）
  email: string;         // 邮箱
  password: string;      // 密码（至少8位）
  role?: "student" | "teacher";  // 角色（可选）
}

// 响应
interface RegisterResponse {
  success: true;
  message: string;
  data: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      avatar?: string;
      createdAt: string;
    };
    token: string;       // JWT Token
    refreshToken: string;
  };
}
```

**POST /auth/login - 用户登录:**

```typescript
// 请求
interface LoginRequest {
  email: string;
  password: string;
}

// 响应
interface LoginResponse {
  success: true;
  message: string;
  data: {
    user: User;
    token: string;
    refreshToken: string;
  };
}
```

### 3.6 后端实施步骤

#### Step 1: 创建服务器入口

**文件**: `server/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import worksRouter from './routes/works.js';
import uploadRouter from './routes/upload.js';
import { errorHandler } from './middleware/error.js';

const app = express();
const PORT = process.env.API_PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('public/uploads'));

// 公开路由
app.use('/api/auth', authRouter);
app.use('/api/works', worksRouter);

// 需要认证的路由
app.use('/api/upload', uploadRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
```

#### Step 2: 创建认证中间件

**文件**: `server/middleware/auth.ts`

```typescript
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Express.Request {
  user?: { id: string; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: '未登录' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as any;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token 无效' });
  }
}

// 管理员权限验证
export function requireAdmin(req: AuthRequest, res: any, next: any) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
    return res.status(403).json({ success: false, error: '需要管理员权限' });
  }
  next();
}
```

#### Step 3: 创建认证服务

**文件**: `server/services/authService.ts`

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../db/repository.js';

export const authService = {
  // 注册
  async register(email: string, password: string, name: string, role: string = 'student') {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new Error('邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
      role,
      createdAt: new Date().toISOString(),
    });

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
  },

  // 登录
  async login(email: string, password: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error('邮箱或密码错误');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('邮箱或密码错误');
    }

    const token = this.generateToken(user.id, user.email, user.role);
    return { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token };
  },

  // 生成 JWT token
  generateToken(id: string, email: string, role: string) {
    return jwt.sign(
      { id, email, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
  },
};
```

#### Step 4: 创建 JSON 数据访问层

**文件**: `server/db/repository.ts`

```typescript
import fs from 'fs';
import path from 'path';

const dbPath = path.join(__dirname, 'json');

// 确保数据文件存在
function ensureDbFile(filename: string, initialData: any) {
  const filePath = path.join(dbPath, filename);
  if (!fs.existsSync(filePath)) {
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
  }
}

// 初始化数据文件
ensureDbFile('users.json', { users: [] });
ensureDbFile('works.json', { works: [] });
ensureDbFile('records.json', { records: [] });
ensureDbFile('comments.json', { comments: [] });
ensureDbFile('media.json', { media: [] });

export const userRepository = {
  findByEmail: async (email: string) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'users.json'), 'utf-8'));
    return data.users.find((u: any) => u.email === email);
  },

  findById: async (id: string) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'users.json'), 'utf-8'));
    return data.users.find((u: any) => u.id === id);
  },

  create: async (userData: any) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'users.json'), 'utf-8'));
    const newUser = { id: `user-${Date.now()}`, ...userData };
    data.users.push(newUser);
    fs.writeFileSync(path.join(dbPath, 'users.json'), JSON.stringify(data, null, 2));
    return newUser;
  },
};

export const worksRepository = {
  findAll: async (filters: any = {}) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'works.json'), 'utf-8'));
    let works = data.works;
    if (filters.status === 'public') {
      works = works.filter((w: any) => w.status === 'public');
    }
    return works;
  },

  findById: async (id: string) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'works.json'), 'utf-8'));
    return data.works.find((w: any) => w.id === id);
  },

  create: async (workData: any) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'works.json'), 'utf-8'));
    const newWork = {
      id: `work-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      views: 0,
      likes: 0,
      ...workData
    };
    data.works.push(newWork);
    fs.writeFileSync(path.join(dbPath, 'works.json'), JSON.stringify(data, null, 2));
    return newWork;
  },

  update: async (id: string, updates: any) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'works.json'), 'utf-8'));
    const index = data.works.findIndex((w: any) => w.id === id);
    if (index === -1) return null;
    data.works[index] = { ...data.works[index], ...updates, updatedAt: new Date().toISOString() };
    fs.writeFileSync(path.join(dbPath, 'works.json'), JSON.stringify(data, null, 2));
    return data.works[index];
  },

  delete: async (id: string) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'works.json'), 'utf-8'));
    const index = data.works.findIndex((w: any) => w.id === id);
    if (index === -1) return false;
    data.works.splice(index, 1);
    fs.writeFileSync(path.join(dbPath, 'works.json'), JSON.stringify(data, null, 2));
    return true;
  },
};

export const commentsRepository = {
  findByWorkId: async (workId: string) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'comments.json'), 'utf-8'));
    return data.comments.filter((c: any) => c.workId === workId && !c.replyTo);
  },

  create: async (commentData: any) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'comments.json'), 'utf-8'));
    const newComment = {
      id: `comment-${Date.now()}`,
      likes: 0,
      createdAt: new Date().toISOString(),
      ...commentData
    };
    data.comments.push(newComment);
    fs.writeFileSync(path.join(dbPath, 'comments.json'), JSON.stringify(data, null, 2));
    return newComment;
  },
};

export const mediaRepository = {
  findByWorkId: async (workId: string) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'media.json'), 'utf-8'));
    return data.media.filter((m: any) => m.workId === workId);
  },

  create: async (mediaData: any) => {
    const data = JSON.parse(fs.readFileSync(path.join(dbPath, 'media.json'), 'utf-8'));
    const newMedia = {
      id: `media-${Date.now()}`,
      createdAt: new Date().toISOString(),
      ...mediaData
    };
    data.media.push(newMedia);
    fs.writeFileSync(path.join(dbPath, 'media.json'), JSON.stringify(data, null, 2));
    return newMedia;
  },
};
```

#### Step 5: 创建认证路由

**文件**: `server/routes/auth.ts`

```typescript
import express from 'express';
import { authService } from '../services/authService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.register(email, password, name, role);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(401).json({ success: false, error: error.message });
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: { user: (req as any).user } });
});

export default router;
```

#### Step 6: 配置文件上传

**文件**: `server/config/upload.ts`

```typescript
export const uploadConfig = {
  maxSize: {
    image: 10 * 1024 * 1024,      // 10MB
    video: 500 * 1024 * 1024,     // 500MB
    pdf: 50 * 1024 * 1024,        // 50MB
    pptx: 100 * 1024 * 1024,      // 100MB
    docx: 50 * 1024 * 1024,       // 50MB
  },
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
};
```

**文件**: `server/middleware/upload.ts`

```typescript
import multer from 'multer';
import path from 'path';
import { uploadConfig } from '../config/upload.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadConfig.uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 默认 100MB
  fileFilter: (req, file, cb) => {
    if (uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`));
    }
  },
});
```

#### Step 7: 创建上传路由

**文件**: `server/routes/upload.ts`

```typescript
import express from 'express';
import { upload } from '../middleware/upload.js';
import { authenticate } from '../middleware/auth.js';
import { mediaRepository } from '../db/repository.js';

const router = express.Router();

router.post('/', authenticate, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { workId, type, title, description } = req.body;

    const media = await mediaRepository.create({
      workId,
      type: type || getFileType(file.mimetype),
      url: `/uploads/${file.filename}`,
      title: title ? JSON.parse(title) : {},
      description: description ? JSON.parse(description) : undefined,
      fileSize: file.size,
    });

    res.json({ success: true, data: media });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('presentation')) return 'pptx';
  if (mimeType.includes('word')) return 'docx';
  return 'other';
}

export default router;
```

#### Step 8: 更新 Vite 配置

**文件**: `vite.config.ts`

```typescript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: { /* ... */ },
});
```

#### Step 9: 更新 package.json 脚本

**文件**: `package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "dev:api": "tsx watch server/index.ts",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview"
  }
}
```

**开发时需要两个终端**：

- 终端 1: `pnpm dev` - 运行 Vite 前端 (端口 5173)
- 终端 2: `pnpm dev:api` - 运行 Express 后端 (端口 3001)

#### Step 10: 创建环境变量文件

**文件**: `.env.local`

```env
# API 配置
API_PORT=3001

# JWT 配置
JWT_SECRET=your-secret-key-change-in-production

# 上传配置
UPLOAD_DIR=public/uploads
MAX_FILE_SIZE=104857600
```

### 3.7 作品模块 API

| 方法 | 端点 | 描述 | 认证 |
| ------ | ------ | ------ | ------ |
| GET | `/works` | 获取作品列表 | 否 |
| GET | `/works/:id` | 获取作品详情 | 否 |
| POST | `/works` | 创建作品 | 是 |
| PUT | `/works/:id` | 更新作品 | 是 |
| DELETE | `/works/:id` | 删除作品 | 是 |
| POST | `/works/:id/publish` | 发布作品 | 是 |
| POST | `/works/:id/unpublish` | 取消发布 | 是 |

#### GET /works - 获取作品列表

**查询参数：**

```typescript
interface WorksQuery {
  page?: number;           // 页码（默认1）
  limit?: number;          // 每页数量（默认20）
  status?: "public" | "all";  // 状态筛选
  search?: string;         // 搜索关键词
  sortBy?: "createdAt" | "updatedAt" | "views" | "likes";  // 排序
  order?: "asc" | "desc";  // 排序方向
}
```

**响应：**

```typescript
interface WorksResponse {
  success: true;
  data: {
    works: GalleryWork[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

#### POST /works - 创建作品

**请求：**

```typescript
interface CreateWorkRequest {
  title: { [lang: string]: string };
  subtitle?: { [lang: string]: string };
  description: { [lang: string]: string };
  authorIds: string[];     // 作者ID列表
  coverImage: string;      // 封面图URL
  gallery: string[];       // 画廊图片URLs
  status: "private" | "public";
}
```

**响应：**

```typescript
interface CreateWorkResponse {
  success: true;
  message: string;
  data: {
    work: GalleryWork;
  };
}
```

### 3.5 记录模块 API

| 方法 | 端点 | 描述 | 认证 |
| ------ | ------ | ------ | ------ |
| GET | `/works/:workId/records` | 获取作品记录列表 | 否 |
| POST | `/works/:workId/records` | 添加记录 | 是 |
| PUT | `/works/:workId/records/:recordId` | 更新记录 | 是 |
| DELETE | `/works/:workId/records/:recordId` | 删除记录 | 是 |

#### POST /works/:workId/records - 添加记录

**请求：**

```typescript
interface CreateRecordRequest {
  date: string;            // ISO 日期格式
  title: { [lang: string]: string };
  content: string;
  images?: string[];       // 图片URLs
  tags?: string[];
}
```

### 3.6 评论模块 API

| 方法 | 端点 | 描述 | 认证 |
| ------ | ------ | ------ | ------ |
| GET | `/works/:workId/comments` | 获取评论列表 | 否 |
| POST | `/works/:workId/comments` | 添加评论 | 是 |
| PUT | `/works/:workId/comments/:commentId` | 更新评论 | 是 |
| DELETE | `/works/:workId/comments/:commentId` | 删除评论 | 是 |
| POST | `/works/:workId/comments/:commentId/like` | 点赞评论 | 是 |
| POST | `/works/:workId/comments/:commentId/unlike` | 取消点赞 | 是 |

#### GET /works/:workId/comments - 获取评论列表

**查询参数：**

```typescript
interface CommentsQuery {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "likes";
}
```

**响应：**

```typescript
interface CommentsResponse {
  success: true;
  data: {
    comments: Comment[];
    total: number;
  };
}
```

#### POST /works/:workId/comments - 添加评论

**请求：**

```typescript
interface CreateCommentRequest {
  content: string;
  replyTo?: string;  // 回复的评论ID
}
```

### 3.7 媒体模块 API

| 方法 | 端点 | 描述 | 认证 |
|------|------|------|------|
| GET | `/works/:workId/media` | 获取媒体列表 | 否 |
| POST | `/works/:workId/media` | 添加媒体 | 是 |
| DELETE | `/works/:workId/media/:mediaId` | 删除媒体 | 是 |
| POST | `/upload` | 上传文件 | 是 |
| GET | `/upload/:filename` | 获取文件 | 否 |

#### POST /upload - 上传文件

**请求：** `multipart/form-data`

```typescript
// FormData
{
  file: File;            // 文件
  workId?: string;       // 作品ID（可选）
  type?: string;         // 媒体类型（可选，自动检测）
}
```

**响应：**

```typescript
interface UploadResponse {
  success: true;
  message: string;
  data: {
    filename: string;
    url: string;
    size: number;
    mimeType: string;
    type: GalleryMediaType;
  };
}
```

### 3.8 统计模块 API

| 方�� | 端点 | 描述 | 认证 |
|------|------|------|------|
| POST | `/works/:workId/view` | 记录浏览 | 否 |
| POST | `/works/:workId/like` | 点赞作品 | 是 |
| DELETE | `/works/:workId/like` | 取消点赞 | 是 |

### 3.9 数据模型设计

#### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 用户模型
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  role         UserRole @default(STUDENT)
  avatar       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // 关系
  authoredWorks  Work[]  @relation("WorkAuthors")
  createdWorks   Work[]  @relation("WorkCreator")
  comments       Comment[]
  media          Media[]
}

enum UserRole {
  STUDENT
  TEACHER
  ADMIN
}

// 作品模型
model Work {
  id          String   @id @default(cuid())
  title       Json     // { "zh-CN": "标题", ... }
  subtitle    Json?
  description Json
  coverImage  String
  gallery     String[] // 图片URL数组
  status      WorkStatus @default(PRIVATE)
  views       Int      @default(0)
  likes       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // 外键
  createdBy   String

  // 关系
  creator     User           @relation("WorkCreator", fields: [createdBy], references: [id])
  authors     User[]         @relation("WorkAuthors")
  records     RecordEntry[]
  comments    Comment[]
  media       Media[]
}

enum WorkStatus {
  PRIVATE
  PUBLIC
}

// 研究记录
model RecordEntry {
  id        String   @id @default(cuid())
  date      DateTime
  title     Json
  content   String   @db.Text
  images    String[] // 图片URL数组
  tags      String[] // 标签数组
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 外键
  workId    String

  // 关系
  work      Work     @relation(fields: [workId], references: [id], onDelete: Cascade)
}

// 评论
model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  likes     Int      @default(0)
  replyTo   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 外键
  workId    String
  authorId  String

  // 关系
  work      Work     @relation(fields: [workId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
  replies   Comment[] @relation("CommentReplies")
  parent    Comment? @relation("CommentReplies", fields: [replyTo], references: [id])
}

// 媒体资源
model Media {
  id          String          @id @default(cuid())
  type        MediaType
  url         String
  title       Json
  description Json?
  thumbnail   String?
  duration    Int?            // 视频时长（秒）
  fileSize    Int?            // 文件大小（字节）
  createdAt   DateTime        @default(now())

  // 外键
  workId      String
  uploadedBy  String

  // 关系
  work        Work            @relation(fields: [workId], references: [id], onDelete: Cascade)
  uploader    User            @relation(fields: [uploadedBy], references: [id])
}

enum MediaType {
  IMAGE
  VIDEO
  PDF
  DOCX
  PPTX
  MARKDOWN
  MATLAB
  OTHER
}
```

### 3.10 后端目录结构

```
server/
├── src/
│   ├── config/           # 配置文件
│   │   ├── database.ts   # 数据库配置
│   │   ├── auth.ts       # 认证配置
│   │   └── storage.ts    # 存储配置
│   │
│   ├── controllers/      # 控制器
│   │   ├── auth.controller.ts
│   │   ├── work.controller.ts
│   │   ├── record.controller.ts
│   │   ├── comment.controller.ts
│   │   └── media.controller.ts
│   │
│   ├── services/         # 业务逻辑
│   │   ├── auth.service.ts
│   │   ├── work.service.ts
│   │   ├── record.service.ts
│   │   ├── comment.service.ts
│   │   └── media.service.ts
│   │
│   ├── middleware/       # 中间件
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── error.middleware.ts
│   │
│   ├── routes/           # 路由
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── work.routes.ts
│   │   ├── record.routes.ts
│   │   ├── comment.routes.ts
│   │   └── media.routes.ts
│   │
│   ├── models/           # 数据模型（Prisma）
│   │   └── (generated)
│   │
│   ├── validators/       # 请求验证
│   │   ├── auth.validator.ts
│   │   ├── work.validator.ts
│   │   └── ...
│   │
│   ├── utils/           # 工具函数
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   ├── upload.ts
│   │   └── ...
│   │
│   └── index.ts         # 入口文件
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── uploads/             # 上传文件存储
│   └── works/
│
├── package.json
├── tsconfig.json
└── .env
```

---

## 第四阶段：用户认证系统

### 4.1 前端认证组件

**文件：**

| 路径 | 说明 |
|------|------|
| `src/components/auth/LoginForm.tsx` | 登录表单 |
| `src/components/auth/RegisterForm.tsx` | 注册表单 |
| `src/components/auth/ForgotPasswordForm.tsx` | 忘记密码表单 |
| `src/contexts/AuthContext.tsx` | 认证上下文 |
| `src/hooks/useAuth.ts` | 认证 Hook |

### 4.2 受保护路由

**文件：** `src/components/auth/ProtectedRoute.tsx`

```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;

  return <>{children}</>;
}
```

### 4.3 认证流程

```
1. 用户登录
   ↓
2. 后端验证并返回 JWT Token
   ↓
3. 前端存储 Token (localStorage)
   ↓
4. 每次请求携带 Token (Authorization: Bearer xxx)
   ↓
5. Token 过期后使用 RefreshToken 刷新
   ↓
6. 登出时清除 Token
```

---

## 第五阶段：上传和管理功能

### 5.1 上传组件

**文件：** `src/components/gallery/media/MediaUpload.tsx`

功能：
- 拖拽上传
- 批量上传
- 进度显示
- 类型验证
- 大小限制
- 图片预览

### 5.2 作品创建/编辑表单

**文件：** `src/components/gallery/WorkForm.tsx`

功能：
- 基本信息（标题、描述）
- 作者管理
- 封面上传
- 画廊管理
- 记录添加
- 媒体管理
- 预览和发布

---

## 实施顺序建议

### 第一阶段（2-3天）
1. 创建数据结构 `src/data/gallery.ts`
2. 实现 WorkCard 组件
3. 修改 GalleryPage 添加导航
4. 创建 WorkDetailPage 基础框架
5. 添加路由配置

### 第二阶段（3-4天）
1. 实现 WorkHeader 和 WorkActions
2. 实现 RecordSection 和相关组件
3. 实现 DiscussionSection 和相关组件
4. 实现 MediaGallery 和相关组件
5. 添加国际化配置

### 第三阶段（5-7天）
1. 初始化后端项目
2. 设置数据库和 Prisma
3. 实现认证 API
4. 实现作品 CRUD API
5. 实现记录、评论、媒体 API
6. 文件上传功能

### 第四阶段（3-4天）
1. 前端认证组件
2. AuthContext 和 useAuth Hook
3. 受保护路由
4. Token 管理

### 第五阶段（3-4天）
1. 上传组件
2. 作品表单
3. 管理后台（可选）

---

## 关键文件清单

### 新建文件

**优先级 P0（第一阶段必需）：**
- `src/data/gallery.ts`
- `src/components/gallery/index.ts`
- `src/components/gallery/card/index.ts`
- `src/components/gallery/card/WorkCard.tsx`
- `src/components/gallery/detail/index.ts`
- `src/components/gallery/detail/WorkDetailPage.tsx`

**优先级 P1（第二阶段）：**
- `src/components/gallery/detail/WorkHeader.tsx`
- `src/components/gallery/detail/WorkActions.tsx`
- `src/components/gallery/record/` （完整目录）
- `src/components/gallery/discussion/` （完整目录）
- `src/components/gallery/media/` （完整目录）

**优先级 P2（第三阶段后端）：**
- `server/` 完整后端目录结构

**优先级 P3（第四、五阶段）：**
- `src/components/auth/`
- `src/contexts/AuthContext.tsx`
- `src/hooks/useAuth.ts`

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/pages/GalleryPage.tsx` | 使用新组件和数据 |
| `src/App.tsx` | 添加详情页路由 |
| `src/i18n/locales/zh-cn.json` | 添加翻译 |

---

## 验证测试计划

### 第一阶段完成后
1. 作品列表正常显示
2. 点击卡片跳转详情页
3. 详情页基本框架正常
4. 主题切换工作正常
5. 返回列表功能正常

### 第二阶段完成后
1. 所有标签页正常切换
2. 研究记录正确显示
3. 讨论区正确展示
4. 媒体资源正确显示
5. 操作按钮有视觉反馈

### 第三阶段完成后
1. API 可正常调用
2. 数据持久化正常
3. 文件上传功能正常
4. 错误处理正确

### 第四阶段完成后
1. 用户注册/登录正常
2. Token 管理正确
3. 受保护路由生效
4. 自动登出功能正常

### 第五阶段完成后
1. 作品创建/编辑正常
2. 文件上传顺畅
3. 表单验证正确
4. 预览功能正常

---

## 注意事项

1. **渐进式开发**：先完成前端 MVP，使用静态数据，确认 UI/UX 后再开发后端
2. **组件复用**：优先使用现有的共享组件
3. **设计一致性**：严格遵循 CoursesPage 的设计风格
4. **类型安全**：所有数据结构使用 TypeScript
5. **国际化优先**：使用 LabelI18n 类型
6. **安全性**：密码加密、XSS 防护、CSRF 防护
7. **性能优化**：图片懒加载、代码分割、缓存策略