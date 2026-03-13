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
- **后端**：Express + TypeScript + MongoDB + JWT

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
npm run dev          # 以监视模式启动 Express 服务器
npm run build        # 为生产环境构建
```

## Render 部署

当前仓库已经适配为“单个 Render Web Service”部署：

- Render 上只需要创建一个 Node Web Service。
- 生产环境由 Express 同时提供 `/api`、`/uploads` 和前端 SPA 页面。
- 上传文件建议挂载 Render Persistent Disk，否则实例重启后上传内容会丢失。
- 如果采用这个单服务方案，前端不要额外设置 `VITE_API_URL`，保持同域 `/api` 即可。

### 关键文件

- `render.yaml`：Render Blueprint 配置
- `server/src/index.ts`：生产环境下托管前端构建产物
- `server/src/config/paths.ts`：统一前端构建目录与上传目录

### 部署前准备

1. 确保代码已推送到 GitHub。
2. 准备一个 MongoDB 连接串，推荐 MongoDB Atlas。
3. 如果需要密码重置邮件，再准备 SMTP 账号；不需要则保持 `EMAIL_ENABLED=false`。

### 在 Render 中部署

1. 登录 Render，点击 `New +` -> `Blueprint`。
2. 选择这个 GitHub 仓库，Render 会自动读取根目录的 `render.yaml`。
3. 首次创建时填写 `MONGODB_URI`。
4. 其余密钥类变量会由 Blueprint 自动生成，无需手填：
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CSRF_SECRET`
   - `COOKIE_SECRET`
5. 确认磁盘挂载路径为 `/var/data`。
6. 创建完成后等待首次构建部署。

### 可选环境变量

- `FRONTEND_URL`：如需自定义密码重置链接域名，可设置为站点公网地址
- `API_URL`：如需覆盖默认公网地址，可手动设置
- `CORS_ORIGIN`：允许的前端来源，支持逗号分隔多个域名
- `COOKIE_SAME_SITE`：默认自动推断；若前后端分域部署，请显式设为 `none`
- `COOKIE_SECURE`：默认生产环境启用；若 `COOKIE_SAME_SITE=none`，必须为 `true`
- `COOKIE_DOMAIN`：需要跨子域共享 cookie 时可设置
- `HTTP_KEEP_ALIVE_TIMEOUT_MS`：Node HTTP keep-alive 超时，默认 `120000`
- `HTTP_HEADERS_TIMEOUT_MS`：Node headers 超时，默认比 keep-alive 大 `1000ms`
- `HTTP_REQUEST_TIMEOUT_MS`：上传这类慢请求的总超时，默认 `600000`
- `EMAIL_ENABLED=true` 后，还需要补齐 `EMAIL_HOST`、`EMAIL_PORT`、`EMAIL_USER`、`EMAIL_PASSWORD`、`EMAIL_FROM`

### 前后端分域部署说明

如果你没有使用上面的“单个 Render Web Service”方案，而是把前端和后端分别部署在不同域名：

- 前端设置 `VITE_API_URL=https://你的后端域名`
- 后端设置 `FRONTEND_URL=https://你的前端域名`
- 后端设置 `CORS_ORIGIN=https://你的前端域名`
- 后端设置 `COOKIE_SAME_SITE=none`
- 后端设置 `COOKIE_SECURE=true`

否则浏览器在拖拽上传本地文件到 `/api/upload/:category` 时，常见现象就是直接报 `Failed to fetch`。

如果你已经是单服务同域部署，错误里看到的还是相对路径（例如 `/api/upload/pptx`），这通常更像是 Render 上的服务连接被中断，而不是 `VITE_API_URL` 本身有问题。优先检查 Render 日志中是否有 `connection reset by peer`、实例重启或上传超时。

### 本地验证生产构建

```bash
npm ci --include=dev
npm --prefix server ci --include=dev
npm run build
npm --prefix server run build
```

## 阿里云 ECS（1G 内存）部署

如果你希望部署到阿里云服务器（ECS）并控制在 1G 内存机型可稳定运行，建议采用 **Nginx + Node.js（单进程）+ PM2 + MongoDB Atlas** 的方案：

- Nginx 负责 HTTPS、静态缓存、反向代理。
- Node.js 只跑一个进程（避免 1G 内存下多进程爆内存）。
- MongoDB 建议放到云数据库（Atlas/阿里云 MongoDB），不要在 1G 机器本地再起一套 MongoDB。

### 1）服务器初始化（Ubuntu 22.04 示例）

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

# 可选：创建 1G swap，降低内存不足导致的进程被杀风险
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2）拉取代码并构建

```bash
cd /var/www
sudo git clone https://github.com/amatke31/polarcraft.git
sudo chown -R $USER:$USER /var/www/polarcraft
cd /var/www/polarcraft

npm ci --include=dev
npm --prefix server ci --include=dev
npm run build
npm --prefix server run build
```

### 3）配置后端环境变量（生产）

在 `/var/www/polarcraft/server/.env` 中至少填写以下变量（示例）：

```bash
NODE_ENV=production
PORT=3001

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
MONGODB_DB_NAME=polarcraft

JWT_ACCESS_SECRET=<strong_random_string>
JWT_REFRESH_SECRET=<strong_random_string>
CSRF_SECRET=<strong_random_string>
COOKIE_SECRET=<strong_random_string>

FRONTEND_URL=https://你的域名
CORS_ORIGIN=https://你的域名
API_URL=https://你的域名
COOKIE_SAME_SITE=strict
COOKIE_SECURE=true

UPLOAD_ROOT_DIR=/var/www/polarcraft/server/uploads
LOG_LEVEL=info
LOG_ENABLED=true
EMAIL_ENABLED=false
```

> 说明：生产环境下必须配置 `MONGODB_URI`、`JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET`，否则服务启动会失败。

### 4）用 PM2 启动并设置开机自启

```bash
cd /var/www/polarcraft

# 用较保守的 V8 内存上限，适配 1G 机器
NODE_OPTIONS='--max-old-space-size=384' pm2 start server/dist/index.js --name polarcraft

pm2 save
pm2 startup
```

如需更新代码：

```bash
cd /var/www/polarcraft
git pull
npm ci --include=dev
npm --prefix server ci --include=dev
npm run build
npm --prefix server run build
pm2 restart polarcraft
```

### 5）配置 Nginx 反向代理

新建 `/etc/nginx/sites-available/polarcraft`：

```nginx
server {
    listen 80;
    server_name 你的域名;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用并重载：

```bash
sudo ln -s /etc/nginx/sites-available/polarcraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6）配置 HTTPS（Let’s Encrypt）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

### 7）1G 机型优化建议（重点）

- 只开 **1 个 PM2 实例**，不要 `-i max`。
- 把 MongoDB 放到托管服务，ECS 上仅运行 Nginx + Node。
- `NODE_OPTIONS=--max-old-space-size=384`（可在 320~512 间按实际负载微调）。
- 上传目录单独挂盘（或对象存储 OSS），避免系统盘撑满。
- 使用 `pm2 monit`、`free -h`、`top` 观察内存；若频繁 OOM，先扩到 2G。

### 8）验收检查

```bash
# 本机回环健康检查
curl http://127.0.0.1:3001/api/health

# 域名健康检查
curl -I https://你的域名/api/health

# 查看进程与日志
pm2 status
pm2 logs polarcraft --lines 100
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
