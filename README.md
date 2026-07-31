# PolariScope 开发指南

## 项目概述

PolariScope 是一款由零一学院开发的偏振光学习与研究平台。它结合真实的光学原理、交互模拟、实验内容与项目协作，让学生通过可视化体验理解偏振光束与光学组件。

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
- **数学/物理**：光学计算库（几何光学、菲涅尔公式、旋光计算）
- **动画**：Framer Motion
- **公式渲染**：KaTeX
- **文档**：react-markdown + remark-gfm
- **国际化**：i18next + react-i18next
- **后端**：Express + TypeScript + MongoDB + JWT

## 快速命令

推荐使用 **pnpm**（本仓库为 pnpm workspace）。若本机只有 npm，也可用 `npm install` / `npm run ...`，后端需在 `server/` 下单独安装。

```bash
# 根目录（推荐）
pnpm install              # 安装前端 + server 工作区依赖
pnpm dev                  # 仅前端（Vite，默认 :5173）
pnpm dev:api              # 仅后端（Express，默认 :3001）
pnpm dev:all              # 前后端一起启动
pnpm build                # 前端生产构建 → dist/
pnpm build:api            # 后端 TypeScript 编译 → server/dist/
pnpm test:run             # 前端测试（单次）
pnpm --filter polariscope-server test:run   # 后端测试（单次）
# 注意：pnpm test / pnpm test:api 是 watch 模式，非交互终端会一直挂起
pnpm typecheck            # 前端类型检查
pnpm typecheck:api        # 后端类型检查

# 仅 npm 时
npm install
npm run dev
cd server && npm install && npm run dev
```

本地开发环境变量模板：

- 前端：复制 `.env.example` → `.env`
- 后端：复制 `server/.env.example` → `server/.env`

---

## 生产部署教程（完整步骤）

按顺序做完下列步骤即可上线。默认约定：

| 项 | 值 |
|----|-----|
| 项目目录 | `/var/www/polarcraft` |
| 域名 | `你的域名`（如 `app.example.com`） |
| 后端端口 | `3001`（仅本机，不对公网开放） |
| 数据库名 | `polarcraft` |

### 架构说明

```text
浏览器 ──HTTPS──► Nginx(:443)
                     │
                     ▼
              Node/Express(:3001)   ← PM2 单进程
                 ├─ /api/*          API
                 ├─ /uploads/*      上传文件
                 └─ /*              前端 dist 静态资源（生产自动托管）
                     │
                     ▼
              MongoDB（推荐 Atlas 免费/共享集群）
```

- **Nginx**：HTTPS、反代、上传体积限制。
- **Express**：`NODE_ENV=production` 且存在 `dist/index.html` 时托管 SPA；API 在 `/api`。
- **PM2**：只跑 **1 个** 进程（1G 内存不要用 `-i max`）。
- **MongoDB**：推荐云托管；小内存 ECS 不建议本机再装 Mongo。

---

### 步骤 0：上线前准备

准备好这些东西再动手：

1. 一台 Ubuntu 22.04（或相近）云服务器，建议 ≥1G 内存；1G 务必开 swap。
2. 一个已备案/可用的域名（若国内服务器），能改 DNS。
3. 服务器安全组 / 防火墙放行：**22（SSH）**、**80**、**443**；**不要**放行 3001。
4. （推荐）[MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 账号。
5. （可选）PostHog 账号，用于产品分析。

---

### 步骤 1：服务器初始化

SSH 登录服务器后执行：

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git curl openssl

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 全局工具
sudo npm i -g pnpm pm2

# 确认版本
node -v    # 建议 v20.x
pnpm -v
nginx -v
```

1G 内存机器强烈建议加 swap：

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

### 步骤 2：域名解析

在域名服务商控制台添加：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | `@` 或 `app` 等 | 服务器公网 IP |

生效后在本机或服务器上验证：

```bash
ping 你的域名
# 或
dig +short 你的域名
```

应解析到你的 ECS 公网 IP。后续所有 `https://你的域名` 都用这个域名。

---

### 步骤 3：配置 MongoDB（推荐 Atlas）

应用启动时会连接 `MONGODB_URI`；**生产环境必须配置**，否则服务无法启动。集合与索引会在业务使用时自动创建，一般**不需要**手写迁移脚本。

#### 3.1 创建 Atlas 集群

1. 打开 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 并登录。
2. **Create** → 选 **M0 Free**（或按需付费档）。
3. 选云厂商与区域（离你的 ECS 近的区域，如 `Hong Kong` / `Singapore` / `Tokyo`）。
4. 集群创建完成后进入项目。

#### 3.2 创建数据库用户

1. 左侧 **Database Access** → **Add New Database User**。
2. Authentication：**Password**。
3. 用户名例如 `polarcraft_app`，密码用强随机串（**保存好**，后面写进 `.env`）。
4. 权限选 **Built-in Role → Read and write to any database**（或只授权目标库 `polarcraft` 的 readWrite）。
5. 点击 **Add User**。

> 密码若含 `@` `#` `:` `/` `?` `%` 等特殊字符，写入 URI 时必须 [URL 编码](https://developer.mozilla.org/en-US/docs/Glossary/Percent-encoding)（例如 `@` → `%40`）。最省事：密码只用字母数字。

#### 3.3 放行服务器 IP（Network Access）

1. 左侧 **Network Access** → **Add IP Address**。
2. 推荐：**Add Current IP Address** 无效时，手动填入 **ECS 的公网 IP**（精确到 `/32`）。
3. 开发临时调试可点 **Allow Access from Anywhere**（`0.0.0.0/0`），**生产强烈不建议长期开启**。
4. 等状态变为 Active。

#### 3.4 获取连接串

1. **Database** → 你的集群 → **Connect** → **Drivers**（或 “Connect your application”）。
2. 驱动选 **Node.js**，复制形如：

```text
mongodb+srv://polarcraft_app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

3. 把 `<password>` 换成真实密码；建议在路径里写上库名：

```text
mongodb+srv://polarcraft_app:你的密码@cluster0.xxxxx.mongodb.net/polarcraft?retryWrites=true&w=majority
```

4. 最终填入 `server/.env` 的 `MONGODB_URI`；`MONGODB_DB_NAME=polarcraft` 与 URI 中库名保持一致。

#### 3.5 在服务器上测连通（可选）

```bash
# 若未安装 mongosh，可跳过，等应用启动日志判断
# sudo npm i -g mongosh
# mongosh "mongodb+srv://polarcraft_app:你的密码@cluster0.xxxxx.mongodb.net/polarcraft"
```

常见失败原因：

- Network Access 未放行 ECS IP（换了弹性 IP 也要更新）。
- 密码特殊字符未 URL 编码。
- 用户名/密码复制错误、多了空格或尖括号 `<>`。

#### 3.6 备选：本机自建 MongoDB（不推荐 1G 机）

仅在内存 ≥2G、能接受自己运维备份时使用：

```bash
# Ubuntu 示例：安装 MongoDB 社区版后
sudo systemctl enable --now mongod
# server/.env 中：
# MONGODB_URI=mongodb://127.0.0.1:27017/polarcraft
# MONGODB_DB_NAME=polarcraft
```

务必绑定 `127.0.0.1`，**不要**把 27017 暴露到公网。

---

### 步骤 4：拉取代码

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone https://github.com/amatke31/polarcraft.git
sudo chown -R "$USER":"$USER" /var/www/polarcraft
cd /var/www/polarcraft
```

---

### 步骤 5：配置环境变量（`.env`）

项目有 **两套** 环境变量，不要混：

| 文件 | 谁读 | 何时生效 | 模板 |
|------|------|----------|------|
| 仓库根 `.env.production`（或构建时的 `.env`） | Vite 前端 | **`pnpm build` 构建时**写入 JS | `.env.example` |
| `server/.env` | Express 后端 | **进程启动时**读取 | `server/.env.example` |

安全约定：

- **不要**把 `.env` / `server/.env` / 含真实 key 的文件提交进 Git。
- 生产密钥用 `openssl rand -hex 32` 生成，每个环境不同。
- 改前端 `VITE_*` 后必须重新 `pnpm build`；改 `server/.env` 后 `pm2 restart`。

#### 5.1 生成密钥

在服务器上执行，把输出分别填进后端 `.env`：

```bash
openssl rand -hex 32   # → JWT_ACCESS_SECRET
openssl rand -hex 32   # → JWT_REFRESH_SECRET
openssl rand -hex 32   # → CSRF_SECRET
openssl rand -hex 32   # → COOKIE_SECRET
```

#### 5.2 后端 `server/.env`（完整示例）

```bash
cd /var/www/polarcraft
cp server/.env.example server/.env
nano server/.env   # 或 vim / code
```

将内容改成类似下面（**务必替换域名、Mongo URI、四个密钥**）：

```bash
# ========== 运行环境 ==========
NODE_ENV=production
PORT=3001

# 对外访问地址（同域部署时三者通常相同）
API_URL=https://你的域名
FRONTEND_URL=https://你的域名
# 多个源用英文逗号分隔；必须是完整 origin，不要尾斜杠
CORS_ORIGIN=https://你的域名

# 前端构建产物目录（相对仓库根，或绝对路径）
FRONTEND_DIST_DIR=dist

# ========== MongoDB（必填）==========
# 把下面整行换成步骤 3 拿到的连接串
MONGODB_URI=mongodb+srv://polarcraft_app:你的密码@cluster0.xxxxx.mongodb.net/polarcraft?retryWrites=true&w=majority
MONGODB_DB_NAME=polarcraft
DB_MAX_POOL_SIZE=10

# ========== 上传目录 ==========
# 需可写；可改到数据盘，例如 /data/polarcraft/uploads
UPLOAD_ROOT_DIR=/var/www/polarcraft/public/uploads
UPLOAD_PUBLIC_URL_PREFIX=/uploads/courses

# ========== JWT / Cookie / CSRF（生产必改）==========
JWT_ACCESS_SECRET=这里粘贴第一个 openssl 输出
JWT_REFRESH_SECRET=这里粘贴第二个 openssl 输出
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CSRF_SECRET=这里粘贴第三个 openssl 输出
COOKIE_SECRET=这里粘贴第四个 openssl 输出
# 同域 HTTPS 推荐 strict + secure
COOKIE_SAME_SITE=strict
COOKIE_SECURE=true
# 一般不用设；前后端不同父域时再考虑
# COOKIE_DOMAIN=

# ========== 密码策略 / 限流（可保持默认）==========
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBER=true
PASSWORD_REQUIRE_SPECIAL_CHAR=true
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ========== 邮件（可选：密码重置、反馈通知）==========
EMAIL_ENABLED=false
# EMAIL_ENABLED=true 时再填写：
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your@gmail.com
# EMAIL_PASSWORD=应用专用密码
# EMAIL_FROM=noreply@你的域名
# EMAIL_FROM_NAME=PolariScope

# ========== PostHog 管理端查询（可选，见「PostHog 配置」）==========
POSTHOG_APP_HOST=
POSTHOG_ENVIRONMENT_ID=
POSTHOG_PERSONAL_API_KEY=

# ========== 课题 AI 顾问（可选）==========
# AI_API_BASE_URL=https://provider.example.com/v1
# AI_API_KEY=
# AI_MODEL=

# ========== 日志 ==========
LOG_LEVEL=info
LOG_ENABLED=true
```

**生产启动硬性要求**（`validateConfig`）：

- 必须有真实的 `MONGODB_URI`（不能空）。
- `JWT_ACCESS_SECRET`、`JWT_REFRESH_SECRET` 必须设置，且不能包含字面量 `change_this`。

字段含义速查：

| 变量 | 含义 |
|------|------|
| `API_URL` | 后端对外 URL，用于拼链接、Cookie 同源判断 |
| `FRONTEND_URL` | 前端站点 URL（如密码重置邮件中的链接） |
| `CORS_ORIGIN` | 允许的浏览器 Origin；同域填站点域名即可 |
| `FRONTEND_DIST_DIR` | 生产托管的前端目录，默认仓库根 `dist` |
| `MONGODB_URI` | Mongo 连接串 |
| `MONGODB_DB_NAME` | 逻辑库名 |
| `UPLOAD_ROOT_DIR` | 上传文件落盘路径 |
| `COOKIE_SECURE=true` | 仅 HTTPS 下发 Cookie；生产 + HTTPS 必须 true |
| `COOKIE_SAME_SITE=strict` | 同站 Cookie；前后端跨站时用 `none` 且必须 secure |

创建上传目录并保证可写：

```bash
mkdir -p /var/www/polarcraft/public/uploads
chmod -R u+rwX /var/www/polarcraft/public/uploads
```

#### 5.3 前端 `.env.production`（完整示例）

```bash
cd /var/www/polarcraft
cp .env.example .env.production
nano .env.production
```

同域单服务部署推荐：

```bash
# 同域部署：留空。浏览器会请求当前域名下的 /api
# 若前后端分域（例如 api.xxx.com），再写成 https://api.xxx.com
VITE_API_URL=

# ---- PostHog 浏览器采集（可选；不配则不初始化分析）----
# Project API Key（Project Settings 里 phc_ 开头，可进前端包）
VITE_PUBLIC_POSTHOG_KEY=
# 美区默认；欧盟改为 https://eu.i.posthog.com
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# 会话录屏：生产默认建议关
VITE_PUBLIC_POSTHOG_SESSION_RECORDING=false
```

说明：

- 只有 `VITE_` 前缀变量会进前端产物。
- **不要**把后端 `POSTHOG_PERSONAL_API_KEY` 或 JWT 密钥写进前端 env。
- 本地开发用根目录 `.env`（`VITE_API_URL=http://localhost:3001`），与生产 `.env.production` 分开。

本地开发参考（不要用于生产）：

```bash
# 根目录 .env
VITE_API_URL=http://localhost:3001
VITE_PUBLIC_POSTHOG_KEY=
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
VITE_PUBLIC_POSTHOG_SESSION_RECORDING=false

# server/.env
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/polarcraft
MONGODB_DB_NAME=polarcraft
JWT_ACCESS_SECRET=dev_access_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
CSRF_SECRET=dev_csrf_secret_change_me
COOKIE_SECRET=dev_cookie_secret_change_me
```

---

### 步骤 6：安装依赖并构建

**先写好** `server/.env` 与 `.env.production`，再构建：

```bash
cd /var/www/polarcraft
pnpm install
pnpm build        # 读取 .env.production，输出 dist/
pnpm build:api    # 输出 server/dist/
```

确认产物存在：

```bash
test -f dist/index.html && echo "frontend ok"
test -f server/dist/index.js && echo "backend ok"
```

1G 机器上 `pnpm build` 可能很慢或 OOM：可在内存更大的机器/CI 构建后，把 `dist/` 与 `server/dist/` rsync 到服务器。

---

### 步骤 7：用 PM2 启动后端

后端在生产会同时提供 API 与（若有 `dist/`）前端静态页。

```bash
cd /var/www/polarcraft

# 1G 机型限制 V8 堆
NODE_OPTIONS='--max-old-space-size=384' \
  pm2 start server/dist/index.js --name polariscope

pm2 save
pm2 startup
# 按终端提示再执行一条 sudo 命令，实现开机自启
```

检查：

```bash
pm2 status
pm2 logs polariscope --lines 80
curl -sS http://127.0.0.1:3001/api/health
```

健康检查应返回 `success: true` / `status: healthy`。若失败：

- 看日志是否 `Missing required environment variables` → 检查 JWT / Mongo。
- 是否 `Failed to connect to MongoDB` → 回到步骤 3 查 IP 白名单与 URI。
- 是否上传目录不可写 → 检查 `UPLOAD_ROOT_DIR` 权限。

常用运维：

```bash
pm2 restart polariscope
pm2 logs polariscope --lines 100
pm2 monit
```

---

### 步骤 8：配置 Nginx 并启用 HTTPS

详细配置见下方 [Nginx 配置](#nginx-配置)。最短路径：

```bash
# 1）先写 HTTP 反代（证书尚未申请时）
sudo nano /etc/nginx/sites-available/polarcraft
```

粘贴（方案 A 的 HTTP 版即可）：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 你的域名;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/polarcraft /etc/nginx/sites-enabled/polarcraft
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 2）申请 HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
sudo certbot renew --dry-run
```

浏览器访问 `https://你的域名` 应打开站点。

---

### 步骤 9：配置 PostHog（可选）

需要分析再做；跳过不影响核心功能。详见 [PostHog 配置](#posthog-配置)。

简要：

1. 在 PostHog 创建项目，复制 Project API Key（`phc_...`）写入根目录 `.env.production` 的 `VITE_PUBLIC_POSTHOG_KEY`。
2. `pnpm build` 后 `pm2 restart polariscope`。
3. 若要管理员查看用户行为：再在 `server/.env` 配 `POSTHOG_APP_HOST`、`POSTHOG_ENVIRONMENT_ID`、`POSTHOG_PERSONAL_API_KEY` 并重启。

---

### 步骤 10：上线验收

```bash
# API 本机
curl -sS http://127.0.0.1:3001/api/health

# 经域名
curl -I https://你的域名/
curl -sS https://你的域名/api/health

pm2 status
free -h
df -h
```

浏览器：

- [ ] 首页与各模块可打开；刷新深链不 404。
- [ ] 注册 / 登录成功（Cookie + HTTPS）。
- [ ] 上传功能正常（体积受 Nginx `client_max_body_size` 限制）。
- [ ] （可选）PostHog Live events 有数据。

---

### 步骤 11：日常更新代码

```bash
cd /var/www/polarcraft
git pull
pnpm install

# 若改了 .env.production 中的 VITE_*，必须重新 build 前端
pnpm build
pnpm build:api

# 若只改了 server/.env，rebuild 可省略，直接：
pm2 restart polariscope
```

---

### 1G 机型优化

- PM2 **单实例**，禁止 `pm2 start -i max`。
- `NODE_OPTIONS=--max-old-space-size=384`（可在 320–512 间微调）。
- MongoDB 用 Atlas；ECS 上只跑 Nginx + Node。
- 上传目录放到数据盘，避免系统盘写满。
- 构建尽量在大内存机器完成再同步产物。

---

## Nginx 配置

### 方案 A：全量反代（推荐，与当前代码一致）

生产模式下 Express 已提供：

- `/api/*` API
- `/uploads/*` 上传文件
- 其余路径 SPA 静态资源 + `index.html` fallback

因此 Nginx 只需 HTTPS + 反代到 `127.0.0.1:3001`。

创建 `/etc/nginx/sites-available/polarcraft`：

```nginx
# HTTP → HTTPS（certbot 也可自动改写；初次可先只 listen 80）
server {
    listen 80;
    listen [::]:80;
    server_name 你的域名;

    # Let’s Encrypt 校验（certbot 使用）
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name 你的域名;

    # 由 certbot 写入证书路径；手动配置时替换为实际路径
    # ssl_certificate     /etc/letsencrypt/live/你的域名/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/你的域名/privkey.pem;
    # include             /etc/letsencrypt/options-ssl-nginx.conf;
    # ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # 课程 PPT / 媒体上传体积；按实际上限调整
    client_max_body_size 50m;

    # 安全头（可按需增减）
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";

        proxy_connect_timeout 60s;
        proxy_send_timeout    120s;
        proxy_read_timeout    120s;

        # 上传较大文件时避免缓冲占满磁盘
        proxy_request_buffering off;
    }
}
```

若证书尚未申请，可先只保留 `listen 80` 的反代（去掉 301），再跑 certbot：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name 你的域名;

    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}
```

启用站点并重载：

```bash
sudo ln -sf /etc/nginx/sites-available/polarcraft /etc/nginx/sites-enabled/polarcraft
# 建议关闭默认站点，避免抢占
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

### 方案 B：Nginx 直接托管前端静态资源（可选）

适合希望把静态文件压力从 Node 卸到 Nginx 的场景。Node 只处理 `/api` 与 `/uploads`。

```nginx
server {
    listen 80;
    server_name 你的域名;
    client_max_body_size 50m;

    root /var/www/polarcraft/dist;
    index index.html;

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 用户上传
    location /uploads/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 带 hash 的构建产物可长缓存
    location /assets/ {
        try_files $uri =404;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # SPA：未知路径回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

使用方案 B 时，后端仍可设 `FRONTEND_DIST_DIR`，但静态流量主要由 Nginx 承担。

### HTTPS（Let’s Encrypt）

域名 A 记录指向服务器公网 IP 后：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
# 测试自动续期
sudo certbot renew --dry-run
```

证书续期后 Nginx 会由 certbot 钩子自动 reload（默认安装即支持）。

### Nginx 排查

```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -n 100 /var/log/nginx/error.log
curl -I http://127.0.0.1:3001/api/health
curl -I https://你的域名/api/health
```

---

## PostHog 配置

本项目集成 [PostHog](https://posthog.com/) 做产品分析：

| 层级 | 作用 | 配置位置 |
|------|------|----------|
| 前端 `posthog-js` | 页面浏览、自动点击采集、登录用户 identify | 根目录 `.env` / `.env.production`（构建时注入） |
| 后端 Query API | 管理后台查看单个用户近 30 天行为 | `server/.env`（运行时读取） |

前端实现见 `src/lib/posthog.ts`：未配置 `VITE_PUBLIC_POSTHOG_KEY` 时 **完全不初始化**；`person_profiles` 为 `identified_only`（仅登录用户建档案）。

### 1. 创建 PostHog 项目

1. 注册并创建 Project。
2. 区域：US 默认 `https://us.i.posthog.com`；EU 用 `https://eu.i.posthog.com`。
3. 在 **Project Settings → Project API Key** 复制 `phc_...`（仅用于浏览器采集，可暴露在前端包中）。
4. 若要用管理端用户行为查询，再创建 **Personal API Key**（私密，仅放服务端）。

### 2. 前端采集变量

根目录 `.env.production`（生产）或 `.env`（本地）：

```bash
# 必填才开启采集
VITE_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx

# 采集 ingest 地址（注意是 i.posthog.com，不是控制台域名）
VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
# 欧盟区示例：
# VITE_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# 会话录屏（true 会增大流量与隐私面，默认建议 false）
VITE_PUBLIC_POSTHOG_SESSION_RECORDING=false
```

说明：

- 变量名必须以 `VITE_` 开头，才会进入客户端。
- **改完后必须重新 `pnpm build`**，旧 `dist/` 里仍是旧 key。
- 本地开发：写在 `.env`，重启 `pnpm dev` 即可。
- 不要把 **Personal API Key** 写进 `VITE_*`。

### 3. 后端管理查询变量（可选）

管理员接口：`GET /api/users/:userId/posthog-analytics`。三者都配置后才启用查询；缺任一则返回 `status: "disabled"`。

```bash
# 控制台 / App Host（不是 us.i.posthog.com 采集地址）
# 美区示例：https://us.posthog.com
# 欧区示例：https://eu.posthog.com
POSTHOG_APP_HOST=https://us.posthog.com

# Project / Environment ID（控制台 URL 或 Project settings 中可见的数字 ID）
POSTHOG_ENVIRONMENT_ID=12345

# Personal API Key（Settings → Personal API Keys，需具备 query / 读 person 权限）
POSTHOG_PERSONAL_API_KEY=phx_xxxxxxxx
```

修改 `server/.env` 后：

```bash
pm2 restart polariscope
```

### 4. 行为与验收

前端会自动：

- `initPostHog()`：应用启动时初始化（有 key 时）
- `$pageview`：路由变化时手动上报
- `identify`：登录后同步用户 id / username / role 等；登出 `reset`

验收步骤：

1. 浏览器打开站点，无痕登录一次，在 PostHog **Activity / Live events** 看到 `$pageview` 或 autocapture。
2. 确认 person 的 distinct id 为系统用户 id。
3. 管理员打开用户详情中的行为面板，应能看到近 30 天摘要（需后端三项配置齐全）。
4. 若完全不想用分析：清空 `VITE_PUBLIC_POSTHOG_KEY` 并重建前端；后端三项留空即可。

### 5. 隐私与合规建议

- 默认关闭 Session Recording；开启前确认隐私政策与用户告知。
- Personal API Key 仅放服务器环境变量，权限最小化，定期轮换。
- 生产 `COOKIE_SECURE=true` + HTTPS，避免 Cookie 明文传输。

---

## 部署验收清单

```bash
# 1）本机 API
curl -sS http://127.0.0.1:3001/api/health | jq .

# 2）经 Nginx / 域名
curl -I https://你的域名/
curl -sS https://你的域名/api/health | jq .

# 3）进程与日志
pm2 status
pm2 logs polariscope --lines 100

# 4）磁盘与内存（1G 机型）
free -h
df -h
```

浏览器检查：

- 首页与各模块可打开，刷新深链不 404（SPA fallback 正常）。
- 注册 / 登录 / Cookie 正常（需 HTTPS + `COOKIE_SECURE`）。
- 上传功能可用（`client_max_body_size` 足够）。
- PostHog Live events 有数据（若已配置）。

### 1G 机型优化

- PM2 **单实例**，不要 `pm2 start -i max`。
- `NODE_OPTIONS=--max-old-space-size=384`（可按负载在 320–512 间调整）。
- MongoDB 用托管服务；ECS 上只跑 Nginx + Node。
- 上传目录放到数据盘或 OSS，避免系统盘写满。
- 构建阶段尽量在 CI 或内存更大的机器完成，再 rsync `dist/` 与 `server/dist/` 到生产机（1G 机本地 `pnpm build` 可能较吃力）。

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
polariscope/
|--public/       # 公共静态资源
|--server/       # 后端服务器
|--src/          # 前端源码
|--docs/         # 项目文档
|--resources/    # 课程/实验原始素材
|--scripts/      # 本地开发脚本（dev-all.mjs）
|--README.md
|--CLAUDE.md     # Claude Code 项目说明
|--DESIGN.md     # 设计语言说明
|--components.json
|--eslint.config.js
|--index.html
|--package.json
|--pnpm-lock.yaml
|--pnpm-workspace.yaml
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
|--__tests__/          # 测试配置（vitest setup）
|--assets/             # 静态资源（字体、图标等）
|--components/         # 通用可复用组件
|   |--admin/         # 管理后台组件
|   |--auth/          # 登录/注册/路由守卫
|   |--discussion/    # 讨论区组件
|   |--icons/         # 自定义 SVG 图标
|   |--shared/        # 跨模块共享的 UI 组件
|   `--ui/            # 基础 UI 组件
|--contexts/           # React Context
|   |--AuthContext.tsx    # 认证状态管理
|   |--SystemContext.tsx  # 系统级配置
|   `--ThemeContext.tsx   # 主题切换
|--data/               # 静态数据文件
|   |--courses.ts           # 课程结构数据
|   |--gallery.ts           # 画廊作品数据
|   |--chronicles-*.ts      # 历史事件数据
|   |--timeline-events.ts   # 时间线数据
|   |--concept-network.ts   # 概念网络数据
|   `--scientist-network.ts # 科学家网络数据
|--feature/            # 功能模块（按业务模块组织）
|   |--admin/         # 管理后台业务逻辑
|   |--course/        # 课程学习模块
|   |   |--chronicles/       # 光学史时间线组件
|   |   |--CourseViewer.tsx  # 课程查看器
|   |   `--PdfViewer.tsx     # PDF查看器
|   |--demos/         # 理论模拟模块
|   |   |--components/ # 演示控件和UI
|   |   `--unit0-1/    # 各单元演示实现
|   |--feedback/      # 用户反馈模块
|   |--gallery/       # 成果展示模块
|   |   |--card/      # 作品卡片
|   |   |--detail/    # 作品详情页
|   |   |--media/     # 媒体画廊
|   |   |--record/    # 成就记录
|   |   `--WorksGrid.tsx
|   |--profile/       # 个人主页模块
|   |--quiz/          # 随堂测验模块
|   |--research/      # 虚拟课题组模块
|   |   |--components/
|   |   |   |--project/   # 项目详情、讨论区、证据链
|   |   |   `--shared/    # Markdown 渲染/编辑器
|   |   `--pages/         # 研究页面
|   `--unit/          # 单元与课程选择
|--hooks/              # 自定义 React Hooks
|   `--useIsMobile.ts
|--i18n/               # 国际化配置（仅 zh-cn）
|--lib/                # 核心工具库
|   |--physics/       # 物理计算库
|   |   |--GeometricOptics.ts # 几何光学
|   |   |--Fresnel.ts         # 菲涅尔公式
|   |   |--OpticsConstants.ts # 光学常量
|   |   `--Saccharimetry.ts   # 旋光计算
|   |--api.ts            # API 客户端
|   |--auth.service.ts   # 认证工具
|   |--datetime.util.ts  # 日期时间格式化
|   |--logger.ts         # 日志工具
|   `--storage.ts        # 本地存储
|--pages/              # 主页面组件（路由层）
|   |--admin/             # 管理后台页面
|   |--HomePage.tsx       # 首页（模块入口）
|   |--CoursesPage.tsx    # 课程历史
|   |--DevicesPage.tsx    # 光学器件
|   |--DemosPage.tsx      # 理论模拟
|   |--GamesPage.tsx      # 游戏挑战
|   |--GalleryPage.tsx    # 成果展示
|   |--QuizPage.tsx       # 随堂测验
|   |--ProfilePage.tsx    # 个人中心
|   |--InboxPage.tsx      # 收件箱
|   `--AboutPage.tsx
|--stores/             # Zustand 状态管理
|--types/              # TypeScript 类型定义
|   `--i18n.d.ts
|--utils/              # 工具函数
|--App.tsx             # 应用入口（路由配置）
|--index.css           # 全局样式与设计令牌
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
