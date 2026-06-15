# 微光 Glimmer — 全学科 · 全龄段 AI 学习平台

> 覆盖幼儿园到银发族、K12 到职业考证的学习场景。平台内核学段无关、学科可插拔；当前体验内容从 **小学数学（分数单元）** 起步，更多学科持续扩展。详见 [`docs/roadmap.md`](docs/roadmap.md)。

基于「诊断 → 教学 → 练习」三层架构，用苏格拉底式 AI 引导替代灌输，让每位学习者在适合自己的节奏里成长。

## 技术栈

- **前端**：React + Vite + Recharts
- **后端**：Go + Gin
- **存储**：JSON 文件（MVP），MySQL DDL 已预生成（`backend/migrations/`）
- **AI 讲题**：Agnes AI 云 API（OpenAI 兼容）或本地 Ollama，离线时降级为模板提示

## 快速启动

### Docker 部署（推荐）

```bash
cp .env.example .env   # 填入 LLM_API_KEY
docker compose up -d --build
```

访问 `http://localhost:8080`（可通过 `GLIMMER_PORT` 修改宿主机端口）。

常用命令：

```bash
docker compose logs -f          # 查看日志
docker compose down             # 停止服务
docker compose up -d --build    # 重新构建并启动
```

说明：
- 前端由 Nginx 提供静态资源，并将 `/api` 反向代理到后端
- 学生学习数据持久化在 Docker volume `glimmer-runtime`
- 后端不对外暴露端口，仅容器内网访问

### 本地开发

#### 1. 后端

```bash
cd backend
go run ./cmd/server
```

默认监听 `http://localhost:8080`，数据目录为 `backend/data/`。  
在项目根目录放置 `.env` 后会自动加载（见 `.env.example`）。

#### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`

### 演示账号

应用启动时会自动创建五类角色的演示账号（存储在浏览器 localStorage）：

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 家长 | `demo@glimmer.app` | `demo123456` |
| 学生 | `student@glimmer.app` | `demo123456` |
| 老师 | `teacher@glimmer.app` | `demo123456` |
| 机构 | `org@glimmer.app` | `demo123456` |
| 平台方 | `admin@glimmer.app` | `demo123456` |

登录页支持**按角色一键演示登录**。各角色进入不同工作台：

- **家长**：孩子档案管理、学情报告
- **学生**：诊断、练习、AI 讲题
- **老师**：班级与学生学情
- **机构**：教师与班级运营
- **平台方**：租户与学科域管理

### 3. AI 大模型（讲题功能）

**默认推荐 [Agnes AI](https://agnes-ai.com/doc/overview)**（Sapiens AI 出品，OpenAI 兼容接口）：

```bash
cp .env.example .env
# 编辑 .env，填入你的 LLM_API_KEY
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `LLM_PROVIDER` | 自动检测 | `openai_compat`（云 API）或 `ollama`（本地） |
| `LLM_BASE_URL` | `https://apihub.agnes-ai.com/v1` | OpenAI 兼容 API 地址 |
| `LLM_API_KEY` | — | Bearer Token（云 API 必填） |
| `LLM_MODEL` | `agnes-2.0-flash` | 文本对话模型 |

**本地 Ollama（可选，开发调试）**：

```bash
ollama pull qwen3.5:2b
ollama serve
```

在 `.env` 中设置 `LLM_PROVIDER=ollama`，或使用下表中的 `OLLAMA_*` 变量（未配置云 API 时自动回退到 Ollama）。

环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 8080 | 后端端口 |
| `DATA_DIR` | `./data` | JSON 数据目录 |
| `CORS_ALLOW_ORIGINS` | localhost:5173 | 逗号分隔的允许跨域来源 |
| `GLIMMER_PORT` | 8080 | Docker 前端宿主机端口（仅 compose） |
| `LLM_PROVIDER` | 自动检测 | `openai_compat` 或 `ollama` |
| `LLM_BASE_URL` | Agnes API 地址 | OpenAI 兼容端点 |
| `LLM_API_KEY` | — | 云 API 密钥 |
| `LLM_MODEL` | `agnes-2.0-flash` | 模型名称 |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama 地址（仅 ollama 模式） |
| `OLLAMA_MODEL` | 自动检测 | 留空则使用本机第一个可用模型 |
| `SOCRATIC_DATASET` | 空（关闭） | SocraticMATH 数据集路径，设置后启用 few-shot 调试 |
| `SOCRATIC_FEWSHOT_N` | 2 | 注入 prompt 的示例对话条数 |
| `SOCRATIC_FEWSHOT_FILTER` | 分数 | 示例筛选关键词 |

### 4. SocraticMATH 数据集（可选，本地调试讲题质量）

讲题引擎可借助 [SocraticMATH](https://github.com/ECNU-ICALK/SocraticMath) 的真实苏格拉底对话作为 few-shot 示例，引导本地千问产出更地道的提问。数据集为 **CC BY-NC 4.0（仅限非商用）**，不纳入版本库。

```bash
cd backend
./scripts/fetch_socraticmath.sh   # 拉取到 data/socraticmath/（已 gitignore）

# 启用 few-shot 调试模式
SOCRATIC_DATASET=data/socraticmath/SocratesMATH.jsonl go run ./cmd/server
```

详见 [backend/data/socraticmath/README.md](backend/data/socraticmath/README.md)。

## 核心流程

1. **创建学生** → 自动进入诊断测评
2. **诊断测评**（12 题）→ 手动下一题，查看掌握度变化与根因链
3. **自适应练习** → 显示推题原因（复习/薄弱点/最近发展区）
4. **AI 引导讲题** → 展示题干，苏格拉底式引导，支持公式渲染

## 产品特性

- 新用户 onboarding：未完成诊断时仪表盘引导开始测评
- 全局错误处理：加载失败可重试，不再假死
- 导航高亮、统计卡片（答题数/正确率/掌握度）
- 薄弱技能与待复习一键跳转练习

## 数据文件

```
backend/data/
├── static/          # 18 微技能 + 60 道题（只读）
└── runtime/         # 学生、掌握度、作答记录（运行时生成，已 gitignore）
```

## 后期切换 MySQL

1. 执行 `backend/migrations/001_schema.mysql.sql`
2. 实现 `MySQLStore`（接口已预留）
3. 设置 `STORAGE=mysql`

详细设计见 [docs/plan.md](docs/plan.md)。
