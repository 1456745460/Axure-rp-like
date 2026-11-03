#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-/Applications/Axure RP Like.app}"
STAGING="$(mktemp -d "${TMPDIR:-/tmp}/axure-app.XXXXXX")"
BUNDLE="$STAGING/Axure RP Like.app"
mkdir -p "$BUNDLE/Contents/MacOS" "$BUNDLE/Contents/Resources"
xcrun clang "$PROJECT_DIR/scripts/app/main.m" -O2 -fobjc-arc -framework AppKit -o "$BUNDLE/Contents/MacOS/AxureLauncher"
cp "$PROJECT_DIR/scripts/app/Info.plist" "$BUNDLE/Contents/Info.plist"
/usr/bin/plutil -insert AxureProjectDirectory -string "$PROJECT_DIR" "$BUNDLE/Contents/Info.plist"
cp "$PROJECT_DIR/scripts/launcher" "$BUNDLE/Contents/Resources/launcher"
/usr/bin/plutil -lint "$BUNDLE/Contents/Info.plist"
/usr/bin/codesign --force --sign - "$BUNDLE"
if [[ -e "$TARGET" ]]; then
  mv "$TARGET" "$STAGING/previous.app"
fi
mkdir -p "$(dirname "$TARGET")"
mv "$BUNDLE" "$TARGET"
echo "应用已安装：$TARGET"
echo "旧应用备份（如有）：$STAGING/previous.app"
