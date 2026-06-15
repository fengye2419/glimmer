#!/usr/bin/env bash
# 拉取 SocraticMATH 数据集到本地用于调试（CC BY-NC 4.0，仅限非商用，不入版本库）。
# 用法：在 backend/ 目录下执行 ./scripts/fetch_socraticmath.sh
set -euo pipefail

DEST_DIR="$(cd "$(dirname "$0")/.." && pwd)/data/socraticmath"
BASE_URL="https://raw.githubusercontent.com/ECNU-ICALK/SocraticMath/main/data"

mkdir -p "$DEST_DIR"

echo "下载 SocraticMATH 完整对话数据集到 $DEST_DIR ..."
curl -fSL "$BASE_URL/jsonl/SocratesMATH.jsonl" -o "$DEST_DIR/SocratesMATH.jsonl"
curl -fSL "$BASE_URL/README.md" -o "$DEST_DIR/UPSTREAM_README.md"

LINES=$(wc -l < "$DEST_DIR/SocratesMATH.jsonl" | tr -d ' ')
echo "完成：$DEST_DIR/SocratesMATH.jsonl（$LINES 条对话）"
echo "提醒：该数据集为 CC BY-NC 4.0，仅限非商用。"
