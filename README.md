# LINUX DO 抽奖管理系统

基于 Next.js + Docker 构建的论坛抽奖工具，支持配置 API 调用识别帖子，并实现自动在论坛发帖公布抽奖结果。

## 功能特点

- 🎯 **精准识别**: 自动识别符合抽奖条件的楼层
- 🔐 **公正透明**: 使用多重哈希算法生成种子，确保抽奖结果可验证
- 🚀 **自动发帖**: 配置 Discourse API 后，可在原帖下自动回复公布结果
- 🔒 **后台保护**: 后台管理需要账号密码登录
- 🐳 **Docker 部署**: 一键部署，开箱即用
- 🔑 **CDK管理**: 完整的兑换码管理系统，支持批量生成和验证
- 👤 **用户资料**: 通过API识别用户头像、等级、发帖数等资料

## 后台登录

- **地址**: `/admin/login`
- **账号**: `cshll`
- **密码**: `15068253855z`

## 快速开始

### 1. 环境要求

- Docker & Docker Compose
- Node.js 18+ (本地开发)
- Discourse 论坛 API Key (示例站点: https://c.910500.xyz)

### 2. Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 3. 本地开发

```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:push

# 启动开发服务器
npm run dev
```

## CDK 功能

### 后台管理

访问 `/admin/cdks` 进行 CDK 管理：

1. **单个创建**: 点击"添加CDK"手动创建
2. **批量生成**: 点击"批量生成"一次性生成多个CDK
3. **CDK格式**: 默认格式为 `LOT-XXXXXXXX`
4. **使用记录**: 点击"查看"查看使用情况

### CDK 验证

访问 `/cdk` 验证 CDK 有效性：

- 输入 CDK 代码进行验证
- 查看剩余使用次数
- 了解使用说明和常见问题

### CDK 字段说明

| 字段 | 说明 |
|------|------|
| code | CDK代码，唯一标识 |
| name | CDK名称 |
| cdkType | CDK类型 (lottery/vip/custom) |
| maxUses | 最大使用次数 |
| usedCount | 已使用次数 |
| expiresAt | 过期时间 |
| isActive | 是否启用 |

## 抽奖功能

### 抽奖配置

管理员在后台 (`/admin/lottery-configs`) 创建抽奖配置：

1. 配置名称
2. 中奖人数
3. 关联的API配置
4. 是否自动发帖

### 抽奖流程

1. 选择抽奖配置（配置由管理员预设，不可修改）
2. 输入帖子链接（必须是配置关联站点的帖子）
3. 可选设置最后楼层限制
4. 点击开始抽奖
5. 查看抽奖结果
6. 发帖公布结果（回复到原帖下）

### 公平性保障

- 配置由管理员预设，用户无法修改
- 帖子域名必须与配置的站点域名一致
- 抽奖基于楼层号，不考虑用户等级
- 发帖使用管理员API，确保结果不可篡改

## API 文档

### CDK APIs

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/cdks | 获取CDK列表 |
| POST | /api/admin/cdks | 创建CDK |
| POST | /api/admin/cdks/generate | 批量生成CDK |
| GET | /api/admin/cdks/[id] | 获取CDK详情 |
| PUT | /api/admin/cdks/[id] | 更新CDK |
| DELETE | /api/admin/cdks/[id] | 删除CDK |
| GET | /api/cdk/validate | 查询CDK有效性 |
| POST | /api/cdk/validate | 使用CDK |

### 抽奖 APIs

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/lottery | 执行抽奖 |
| POST | /api/lottery/post | 发帖公布结果 |

### 管理 APIs

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/admin/api-configs | API配置管理 |
| GET/POST | /api/admin/level-rules | 等级规则管理 |
| GET/POST | /api/admin/lottery-configs | 抽奖配置管理 |
| GET | /api/admin/lottery-records | 抽奖记录查询 |

## 数据库模型

- **ApiConfig**: Discourse API 配置
- **LevelRule**: 用户等级规则
- **LotteryConfig**: 抽奖预设配置
- **LotteryRecord**: 抽奖记录
- **Cdk**: CDK兑换码
- **CdkUsage**: CDK使用记录
- **UserProfile**: 用户资料缓存

## 技术栈

- **前端**: Next.js 14, React 18, TypeScript
- **样式**: Tailwind CSS, shadcn/ui
- **后端**: Next.js API Routes
- **数据库**: SQLite + Prisma ORM
- **部署**: Docker & Docker Compose

## 目录结构

```
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/         # 管理API
│   │   │   ├── cdk/           # CDK API
│   │   │   └── lottery/       # 抽奖API
│   │   ├── admin/             # 后台管理页面
│   │   ├── lottery/           # 抽奖页面
│   │   ├── cdk/               # CDK验证页面
│   │   └── page.tsx           # 首页
│   └── lib/
│       └── prisma.ts          # Prisma客户端
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## License

MIT License
