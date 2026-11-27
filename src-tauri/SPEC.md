---
id: desktop-tauri
type: module-design
status: draft
title: Tauri 桌面壳
parent: architecture
---

## Responsibility

把已构建的前端装进桌面包：Mac `.app` / `.dmg`，以及 GitHub Actions 产出的 Windows NSIS `.exe`。主窗口、应用内预览窗口、项目 CRUD、HTML 导出写盘。显示名 `Axure RP Like`，bundle id `com.prototype.axure-rp-like`。Dock 图标为蓝底白画板 + 点阵 + 选中框 + 指针。

## Boundary

- **允许：** rusqlite（bundled）、Tauri dialog 插件、创建 `preview` webview。
- **禁止：** 启动 Node/Vite/Express；读写仓库 `data/`；依赖本机已安装的 Node；本机打 Windows 包。
- **CI：** `.github/workflows/desktop.yml` 在 `main` / `v*` / 手动触发时打 Apple Silicon `.dmg` 与 Windows x64 NSIS。Mac 用 ad-hoc 签名（`signingIdentity: "-"`），不做公证。Linux 不打。
- **HTML5 拖放：** 组件库、页面树、向画布拖图片都走浏览器 DnD。窗口必须 `dragDropEnabled: false`，否则 Tauri 会拦截并把拖拽吃掉。拖拽预览 DOM 要留到 `dragend`，WKWebView 不会像 Chrome 那样在 `setDragImage` 后立刻快照。
- 命令：`list_projects` / `get_project` / `save_project` / `delete_project` / `write_exported_html`。

## Commands

```bash
npm run tauri:dev
npm run tauri:build                 # 本机只出 Mac .app / .dmg
bash scripts/install-macos-app.sh   # 安装到 /Applications
```
