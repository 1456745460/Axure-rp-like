---
id: canvas-editor
type: module-design
status: draft
title: 画布内联编辑
parent: architecture
tags: [canvas, editor, image]
---

## Responsibility

画布上双击（或选中后回车）打开贴在组件旁的内联编辑框，改文案、属性和图片，不打断右侧属性面板。

## Boundary

- **允许：** 编辑框内改草稿；图片用原生文件选择器读成 data URL 写入 `src` 草稿，由「完成」提交。
- **禁止：** 系统文件/颜色选择器一打开就卸掉编辑框。选择或取消之后编辑框仍保持，直到点画布空白、焦点落到框外的页面控件、Esc 或「完成」。

## Invariants

系统文件选择器会让页面失焦，`relatedTarget` 常落到带 `tabindex` 的画布根节点。focusout 必须等焦点落地（或确认 `document` 已把焦点交给系统框）再决定是否提交；否则编辑框被卸掉，Choose File 等于点了个空。
