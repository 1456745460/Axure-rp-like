#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-/Applications/Axure RP Like.app}"
cd "$PROJECT_DIR"

if [[ ! -d node_modules ]]; then
  echo '请先在项目目录运行 npm install。' >&2
  exit 1
fi

npm run tauri:build

APP="$PROJECT_DIR/src-tauri/target/release/bundle/macos/Axure RP Like.app"
if [[ ! -d "$APP" ]]; then
  echo "未找到打包结果：$APP" >&2
  exit 1
fi

STAGING="$(mktemp -d "${TMPDIR:-/tmp}/axure-app.XXXXXX")"
if [[ -e "$TARGET" ]]; then
  mv "$TARGET" "$STAGING/previous.app"
fi
mkdir -p "$(dirname "$TARGET")"
cp -R "$APP" "$TARGET"
echo "应用已安装：$TARGET"
echo "旧应用备份（如有）：$STAGING/previous.app"
