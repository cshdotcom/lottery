# LINUX DO 抽奖管理系统

基于 Next.js + Docker 构建的论坛抽奖工具，支持配置 API 调用精准识别有等级要求的帖子，并实现自动在论坛发帖公布抽奖结果。

## 功能特点

- 🎯 **精准识别**: 自动识别符合抽奖条件的楼层，支持等级要求配置
- 🔐 **公正透明**: 使用多重哈希算法生成种子，确保抽奖结果可验证
- 🚀 **自动发帖**: 配置 Discourse API 后，可自动在论坛发帖公布结果
- 🔒 **用户认证**: 基于 Discourse 用户认证，防止未授权访问
- 👥 **权限控制**: 普通用户可抽奖，Trust Level ≥2 用户可访问后台
- 🐳 **Docker 部署**: 一键部署，开箱即用

## 快速开始

### 1. 环境要求

- Docker & Docker Compose
- Node.js 18+ (本地开发)
- Discourse 论坛 API Key

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# Database
DATABASE_URL="file:./dev.db"

# Discourse API配置
DISCOURSE_BASE_URL="https://linux.do"
DISCOURSE_API_KEY="your-api-key-here"
DISCOURSE_API_USERNAME="system"

# 安全配置
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="change-me-in-production"
```

### 3. 使用 Docker 启动

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 4. 本地开发

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:push

# 启动开发服务器
npm run dev
```

## 使用指南

### 登录系统

1. 访问网站首页
2. 点击右上角"登录"按钮
3. 输入您的 Discourse 论坛用户名
4. 选择要登录的站点（支持多站点配置）
5. 系统通过 Discourse API 验证您的身份
6. 登录成功后，会话保持 7 天

### 抽奖工具

1. 访问首页，点击"开始抽奖"
2. 输入帖子 URL (如: `https://linux.do/t/topic/12345`)
3. 设置中奖人数
4. (可选) 设置参与抽奖的最后楼层
5. 点击"开始抽奖"
6. 复制结果或点击"自动发帖到论坛"

### 后台管理

访问 `/admin` 下的各个页面：

- **API 配置管理** (`/admin/api-configs`): 配置 Discourse API 连接
- **等级规则管理** (`/admin/level-rules`): 设置用户参与抽奖的等级要求
- **抽奖预设配置** (`/admin/lottery-configs`): 创建预设的抽奖参数

## API 文档

### 抽奖 API

```
POST /api/lottery
```

请求体：

```json
{
  "topicUrl": "https://linux.do/t/topic/12345",
  "winnersCount": 3,
  "lastFloor": 100,
  "apiConfigId": "optional-config-id"
}
```

### 自动发帖 API

```
POST /api/lottery/post
```

请求体：

```json
{
  "recordId": "lottery-record-id",
  "content": "抽奖结果内容..."
}
```

### 管理 API

- `GET/POST /api/admin/api-configs` - 获取/创建 API 配置
- `GET/PUT/DELETE /api/admin/api-configs/[id]` - 操作单个配置
- `GET/POST /api/admin/level-rules` - 获取/创建等级规则
- `GET/PUT/DELETE /api/admin/level-rules/[id]` - 操作单个规则
- `GET/POST /api/admin/lottery-configs` - 获取/创建抽奖配置
- `GET/PUT/DELETE /api/admin/lottery-configs/[id]` - 操作单个配置

## Discourse API Key 获取

1. 登录 Discourse 论坛后台
2. 进入用户偏好设置 (Preferences)
3. 找到 API 选项
4. 创建一个新的 API Key
5. 设置 Key 类型为 "Current User" 或 "System"
6. 确保 Key 具有发帖权限

## Docker 部署

### 构建镜像

```bash
docker build -t lottery-app .
```

### 使用 Docker Compose

```yaml
version: '3.8'
services:
  lottery-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./dev.db
      - DISCOURSE_BASE_URL=https://linux.do
      - DISCOURSE_API_KEY=your-api-key
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### 数据持久化

建议将数据库文件挂载到宿主机的 volumes：

```yaml
volumes:
  - ./data:/app/data
  - ./prisma:/app/prisma
```

## 目录结构

```
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/
│   │   │   │   ├── api-configs/      # API配置管理
│   │   │   │   ├── level-rules/      # 等级规则管理
│   │   │   │   └── lottery-configs/  # 抽奖配置管理
│   │   │   └── lottery/
│   │   │       ├── route.ts          # 抽奖核心逻辑
│   │   │       └── post/route.ts      # 自动发帖
│   │   ├── admin/                     # 后台管理页面
│   │   ├── lottery/                   # 抽奖工具页面
│   │   └── page.tsx                   # 首页
│   └── lib/
│       └── prisma.ts                  # Prisma客户端
├── Dockerfile
├── docker-compose.yml
├── package.json
└── .env
```

## 安全建议

1. 修改默认管理员密码
2. 使用 HTTPS 部署
3. 限制 API Key 的权限范围
4. 定期备份数据库文件
5. 使用环境变量存储敏感信息

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, shadcn/ui
- **后端**: Next.js API Routes
- **数据库**: SQLite + Prisma ORM
- **部署**: Docker & Docker Compose

## License

MIT License
