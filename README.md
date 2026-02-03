# PolarCraft 开发指南

## 项目概述

PolarCraft 是一款由零一学院开发的，基于偏振光物理的教育类体素解谜游戏。它结合了真实的光学原理（马吕斯定律、双折射、干涉）和 Minecraft 风格的体素玩法。玩家通过操控各种光学组件来操纵偏振光束以解决谜题。

## 如何在项目中贡献代码

> 除了下列工具，你可能还需要AI代码辅助，比如Trae,下载链接为[https://www.trae.cn/](https://www.trae.cn/)

首先你需要一个代码编辑器，如VScode，下载链接是[https://code.visualstudio.com/download](https://code.visualstudio.com/download)，然后需要一个必备的代码管理器git下载链接是[https://cn-git.com/downloads/](https://cn-git.com/downloads/),接下来你需要安装该项目的工具链，首先是node.js，下载链接是[https://nodejs.cn/download/](https://nodejs.cn/download/)，请务必确保这些软件都添加到了路径下，否则可能无法调用指令，如果在终端上可以正确显示上述软件版本

> （具体指令可以参考浏览器搜索(如何查询XXX（工具名称）的版本）或者询问AI）

那么接下来可以在git bash 里克隆远程的github仓库（可以在互联网直接搜索或者询问AI)具体的git要求详见[git工作流](#git工作流)，链接为[https://github.com/amatke31/polarcraft](https://github.com/amatke31/polarcraft)，然后再在该目录下运行[终端指令](#快速命令)，接着你就可以在自己的本地仓库进行下面的修改流程，具体到步骤是：

### 第一步：运行项目，观察效果

- 按照  README\.md中的，尝试安装依赖并运行开发服务器。
- 浏览各个页面，看看是否有明显的错误。

### 第二步：阅读核心代码

- 从入口文件开始，了解应用的启动过程。
- 阅读核心类型定义和核心逻辑。
- 阅读状态管理（stores）和主要页面组件。

### 第三步：尝试修复简单问题

- 如果发现明显的语法错误或类型错误，先修复这些错误。
- 如果发现某个功能不工作，可以针对该功能进行调试。

### 第四步：增加新功能

- 在增加新功能前，确保对相关模块有足够的了解。
- 按照READEME\.md中的开发指南，例如添加新的Demo或新的Block Type，按照指导步骤进行。
- 不论是开发过程还是最后提交PR时,所有人都应遵循[git工作流](#git工作流)中的格式规范

### 第五步：测试与集成

- 为新增功能编写测试，同时考虑为现有核心功能补充测试。
- 如果项目没有CI/CD，考虑设置，以确保每次修改都能通过测试。

## 主要功能

### 主页面入口

- head: 标题"偏振光下新世界"
- body: 六个module入口
- bottom: 随机的**光学发展历史**和**偏振知识点**

### 模块入口

- 第一部分: **基础知识**--- 按单元分类放课程ppt以及课程大纲
- 第二部分: (器材设备?-器材分类??)
- 第三部分: **理论模拟**--- 理论是什么，公式和**交互实验演示**
- 第四部分: (闯关性游戏？MineCraft体素游戏?)
- 第五部分: **成果展示**--- 已完成的作品， 实验报告，新发现
- 第六部分: **虚拟课题**--- 未完成的一些小课题（seperated & piverite用户组私有）

> 实验模拟？（3D的偏振片和2D的彩色胶带?）和 探索性问题（假如把泡泡放进偏振片里?）

## 技术栈

- **前端**：React 19 + TypeScript（严格模式）
- **状态管理**：Zustand（附带 subscribeWithSelector 中间件）
- **路由**：React Router v7
- **样式**：Tailwind CSS v4
- **构建工具**：Vite
- **3D渲染**：Three.js + @react-three/fiber + @react-three/drei
- **实时协作**：Yjs + y-websocket
- **数学/物理**：自研数学库（复数、矩阵、向量）+ 光学计算库（Jones矢阵、几何光学、波动光学）
- **动画**：Framer Motion
- **公式渲染**：KaTeX
- **文档**：react-markdown + remark-gfm
- **国际化**：i18next + react-i18next
- **后端**：Express + TypeScript + MySQL + WebSocket + JWT

## 快速命令

```bash
# 前端
npm install          # 安装依赖
npm run dev          # 启动开发服务器（热重载）
npm run build        # 生产环境构建 (tsc && vite build)
npm run preview      # 预览生产环境构建
npm run test         # 使用 vitest 运行测试
npm run test:run     # 运行一次测试
npm run test:coverage # 运行测试并生成覆盖率报告

# 后端（在 /server 目录中）
cd server
npm install
npm run start:dev    # 以监视模式启动 Express 服务器
npm run build        # 为生产环境构建
```

## Git工作流

**分支策略：**

- 所有开发工作完成后应合并到 `main` 分支
- 从 `main` 分支创建功能分支以开发新功能或修复
- 代码审查/测试后，将功能分支直接合并到 `main`
- 始终保持 `main` 分支为可部署状态

**提交规范：**

- 使用约定式提交格式：`feat:`、`fix:`、`chore:`、`docs:` 等
- 用英文撰写清晰、简洁的提交信息
- 如适用，请引用问题编号

## 文件架构

### 根目录

```txt
polarcraft/
|--public/       # 公共静态资源
|--server/       # 后端服务器
|--src/          # 前端源码
|--docs/         # 项目文档
|--README.md
|--components.json
|--eslint.config.js
|--index.html
|--package-lock.json
|--package.json
|--pnpm-lock.yaml
|--pnpm-workspace.yaml
|--postcss.config.js
|--tailwind.config.js
|--tsconfig.json
|--tsconfig.node.json
|--tsconfig.app.json
|--vercel.json
|--vite.config.ts
`--vitest.config.ts
```

### 前端源码目录 (src/)

```txt
src/
|--__test__/           # 测试配置
|--assets/             # 静态资源（字体、图标等）
|--components/         # 通用可复用组件
|   |--icons/         # 自定义 SVG 图标
|   |--shared/        # 跨模块共享的 UI 组件
|   `--ui/            # 基础 UI 组件
|--contexts/           # React Context
|   |--AuthContext.tsx    # 认证状态管理
|   `--ThemeContext.tsx   # 主题切换
|--data/               # 静态数据文件
|   |--courses.ts           # 课程结构数据
|   |--gallery.ts           # 画廊作品数据
|   |--chronicles-*.ts      # 历史事件数据
|   |--timeline-events.ts   # 时间线数据
|   `--scientist-network.ts # 科学家网络数据
|--feature/            # 功能模块（按业务模块组织）
|   |--course/        # 课程学习模块
|   |   |--chronicles/   # 光学史时间线组件
|   |   |--CourseViewer.tsx  # 课程查看器
|   |   `--PdfViewer.tsx     # PDF查看器
|   |--demos/         # 理论模拟模块
|   |   |--components/ # 演示控件和UI
|   |   `--unit0-3/    # 各单元演示实现
|   |--devices/       # 光学器件模块
|   |--gallery/       # 成果展示模块
|   |   |--card/      # 作品卡片
|   |   |--detail/    # 作品详情页
|   |   |--media/     # 媒体画廊
|   |   |--record/    # 成就记录
|   |   `--WorksGrid.tsx
|   |--games/         # 游戏挑战模块
|   |   |--EscapePage.tsx    # 密室逃脱
|   |   `--MinecraftPage.tsx # 体素游戏
|   |--lab/           # 虚拟实验室模块
|   `--research/      # 虚拟课题组模块
|       |--components/
|       |   |--canvas/    # 研究画布（React Flow）
|       |   |--edges/     # 自定义边组件
|       |   |--nodes/     # 节点类型（6种）
|       |   |--panels/    # 详情面板
|       |   |--project/   # 项目管理
|       |   `--shared/    # Markdown编辑器
|       |--stores/        # 画布状态管理
|       `--pages/         # 研究页面
|--hooks/              # 自定义 React Hooks
|   |--useHapticAudio.ts
|   |--useIsMobile.ts
|   `--usePolarizationSimulation.ts
|--i18n/               # 国际化配置
|--lib/                # 核心工具库
|   |--math/          # 数学库
|   |   |--Complex.ts      # 复数运算（已测试）
|   |   |--Matrix2x2.ts    # 2x2矩阵（已测试）
|   |   `--Vector3.ts      # 3D向量（已测试）
|   |--physics/       # 物理计算库
|   |   |--GeoOptics.ts      # 几何光学
|   |   |--JonesCalculus.ts  # Jones矢阵
|   |   |--Saccharimetry.ts  # 旋光计算
|   |   |--WaveOptics.ts     # 波动光学
|   |   `--unified/          # 统一物理接口
|   |--api.ts           # API 客户端
|   |--auth.service.ts  # 认证工具
|   |--logger.ts        # 日志工具
|   `--storage.ts       # 本地存储
|--pages/              # 主页面组件（路由层）
|   |--HomePage.tsx       # 首页（六个模块入口）
|   |--CoursesPage.tsx    # 模块一：课程历史
|   |--DevicesPage.tsx    # 模块二：光学器件
|   |--DemosPage.tsx      # 模块三：理论模拟
|   |--GamesPage.tsx      # 模块四：游戏挑战
|   |--GalleryPage.tsx    # 模块五：成果展示
|   |--LabPage.tsx        # 模块六：虚拟课题组
|   |--AboutPage.tsx
|   |--LoginPage.tsx
|   `--RegisterPage.tsx
|--stores/             # Zustand 状态管理
|   `--game/          # 游戏状态存储
|--test/               # 测试文件
|--types/              # TypeScript 类型定义
|   |--i18n.d.ts
|   `--research.ts    # 研究画布类型
|--utils/              # 工具函数
|--App.tsx             # 应用入口（路由配置）
|--APP.css
|--index.css           # 全局样式
|--main.tsx            # React 入口
`--vite-env.d.ts
```

### 后端目录 (server/)

```txt
server/
|--src/
|   |--config/          # 配置文件
|   |--controllers/     # 路由控制器
|   |--database/        # 数据库设置和迁移
|   |--middleware/      # Express 中间件
|   |--models/          # 数据模型
|   |--routes/          # API 路由
|   |--services/        # 业务逻辑
|   |--types/           # TypeScript 类型
|   |--utils/           # 工具函数
|   `--index.ts         # 服务器入口
|--package.json
`--tsconfig.json
```

### 静态资源目录 (public/)

```txt
public/
|--courses/            # 课程资源
|   |--unit0/         # 按单元组织的PPT、PDF、视频
|   |--unit1/
|   |--unit2/
|   |--unit3/
|   `--unit4/
|--gallery/            # 学员作品
|--images/             # 通用图片
`--videos/             # 视频文件
```
