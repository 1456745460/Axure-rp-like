---
id: architecture
type: architecture-design
status: draft
title: 双运行时架构
parent: goal
---

## Drivers

同一套 Vue 编辑器既要 `npm run dev` 在浏览器里改，也要打成不依赖 Node 的 Mac / Windows 应用。现有 Express + sql.js 只服务浏览器开发，不能打进桌面包。

## Decisions

- **前端一份，存储两套。** 浏览器走 Vite 代理到 Express（sql.js，仓库 `data/prototype.db`）。Tauri 走 Rust 命令 + rusqlite（`~/Library/Application Support/com.prototype.axure-rp-like/prototype.db`）。JSON 字段与 REST 同形，由 `src/utils/projectApi.js` 按是否存在 Tauri 运行时分流。
- **不升级 Vite。** Tauri 2 只消费 `devUrl` / `frontendDist`，与 Vite 3 共存。
- **预览同源。** 桌面端用第二个 webview（`preview=1`），共享 localStorage 草稿；浏览器仍 `window.open`。
- **导出在桌面走保存对话框。** webview 里 `<a download>` 不可靠；JS dialog 插件选路径，Rust 写文件。
- **桌面窗口关掉 Tauri 原生拖放。** 编辑器用 HTML5 DnD；`dragDropEnabled` 保持 false，详见 desktop-tauri。

## Invariants

- 两套存储互不读取。打开 Mac 应用看不到仓库 SQLite 里的项目，反之亦然。
- `npm run dev` 不启动 Tauri；`tauri:dev` 不启动 Express。

## Out of scope

Linux 打包、公证、旧 Objective-C 启动器。Windows 安装包只在 GitHub Actions 构建，本机不打。
