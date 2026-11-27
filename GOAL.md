---
id: goal
type: goal-and-requirements
status: draft
title: 原型设计工具
---

## Goal

在浏览器或独立桌面应用中，用接近 Axure 的方式拖拽 Element Plus 风格控件，绘制可预览、可导出的多页原型。

## Audience

做后台/中台界面稿的人：需要快速摆组件、改文案和样式，并得到可离线打开的 HTML。

## Capabilities

- 页面/文件夹目录、组件库、画布编辑（框选、对齐、撤销、快捷键）
- 自动保存与打开已有项目
- 预览当前草稿；导出单文件 HTML
- Mac 上双击 `Axure RP Like.app` 打开原生窗口，不依赖本机 Node
- GitHub Actions 提供 Mac Apple Silicon `.dmg` 与 Windows NSIS `.exe`；本机不打 Windows

## Non-goals

- 不把仓库里的 `data/prototype.db` 迁进 Mac 应用数据目录
- 不提供 Linux 安装包，不做 Apple 公证分发；Windows 安装包只由 GitHub Actions 产出
- 不在桌面端捆绑 Node / Express sidecar
