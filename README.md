# 微光 Glimmer — 苏格拉底式 AI 学习伙伴

> 当前 MVP 聚焦小学数学（分数单元）；产品愿景为全龄段全学科，详见 [`docs/roadmap.md`](docs/roadmap.md)。

基于「诊断 → 教学 → 练习」三层架构的可试用原型，当前聚焦 **分数单元**。

## 技术栈

- **前端**：React + Vite + Recharts
- **后端**：Go + Gin
- **存储**：JSON 文件（MVP），MySQL DDL 已预生成（`backend/migrations/`）
- **AI 讲题**：Ollama 本地千问（可选，离线时降级为模板提示）

## 快速启动

### 1. 后端

```bash
cd backend
go run ./cmd/server
```

默认监听 `http://localhost:8080`，数据目录为 `backend/data/`。

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

访问 `http://localhost:5173`

### 3. Ollama（可选，用于 AI 引导讲题）

```bash
ollama pull qwen3.5:2b   # 或你本地的千问小模型
ollama serve
```

环境变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | 8080 | 后端端口 |
| `DATA_DIR` | `./data` | JSON 数据目录 |
| `OLLAMA_URL` | `http://localhost:11434` | Ollama 地址 |
| `OLLAMA_MODEL` | 自动检测 | 留空则使用本机第一个可用模型；可设为 `qwen3.5:2b` |
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
