# SocraticMATH 数据集（本地调试用）

本目录用于存放 [ECNU-ICALK/SocraticMath](https://github.com/ECNU-ICALK/SocraticMath)（CIKM 2024）的苏格拉底式小学数学对话数据集，**仅用于本地调试讲题模型，不纳入版本库**。

## 许可证（重要）

- 代码：MIT
- **数据集：CC BY-NC 4.0（仅限非商用）**

因此数据文件被 `.gitignore` 忽略，不会提交到仓库。若将来商用，需联系原作者另行授权或自建数据集。

## 拉取数据

```bash
cd backend
./scripts/fetch_socraticmath.sh
```

脚本会把以下文件下载到本目录：

- `SocratesMATH.jsonl` —— 6800+ 条完整多轮苏格拉底对话（含题目、解析、ProblemID）

## 数据格式

`SocratesMATH.jsonl` 每行是一个 JSON 数组，结构为：

```
[
  "<题目> + 学生开场提问",   // index 0
  "<老师回复>",              // 苏格拉底引导
  "<学生回复>",
  "<老师回复>",
  ... 多轮交替 ...
  "【ProblemID】:17578",     // 倒数第二项
  "【解析】:..."             // 最后一项，标准解析
]
```

奇数下标（1,3,5…）为老师话语，偶数下标（2,4,6…，不含 0）为学生话语。

## 在本项目中的用途

讲题引擎（`internal/tutor`）在 **debug 模式** 下，可从本数据集筛选与当前题目相关（按关键词，如「分数」「通分」）的对话，作为 **few-shot 示例** 注入 system prompt，引导本地 Qwen 模型产出更地道的苏格拉底式提问。

通过环境变量开启（默认关闭，不影响生产行为）：

| 变量 | 说明 | 默认 |
|------|------|------|
| `SOCRATIC_DATASET` | 数据集 jsonl 路径，设置后即启用 few-shot | 空（关闭） |
| `SOCRATIC_FEWSHOT_N` | 注入的示例对话条数 | `2` |
| `SOCRATIC_FEWSHOT_FILTER` | 示例筛选关键词（命中题面/对话即选） | `分数` |

示例：

```bash
SOCRATIC_DATASET=data/socraticmath/SocratesMATH.jsonl \
SOCRATIC_FEWSHOT_N=2 \
SOCRATIC_FEWSHOT_FILTER=分数 \
go run ./cmd/server
```
