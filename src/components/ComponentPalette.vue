<template>
  <div class="palette" :class="{ collapsed }">
    <div class="panel-head"><span>组件库</span><el-button :icon="collapsed ? ArrowDown : ArrowUp" text circle size="small" :title="collapsed ? '展开组件库' : '收起组件库'" :aria-label="collapsed ? '展开组件库' : '收起组件库'" @click="collapsed = !collapsed" /></div>
    <div v-if="!collapsed" class="palette-body">
      <div v-for="group in COMPONENT_LIBRARY" :key="group.group" class="group">
        <div class="group-title">{{ group.group }}</div>
        <div class="items">
          <div
            v-for="item in group.items"
            :key="item.type"
            class="comp-item"
            draggable="true"
            @dragstart="onDragStart($event, item)"
            @dragend="clearDragPreview"
          >
            <el-icon class="comp-icon"><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { createApp, onBeforeUnmount, ref } from 'vue'
import WidgetView from './WidgetView.vue'
import { ArrowDown, ArrowUp } from '@element-plus/icons-vue'
const collapsed = ref(false)
import { COMPONENT_LIBRARY } from '@/stores/project'

let previewApp = null
let previewElement = null
function clearDragPreview() {
  previewApp?.unmount()
  previewElement?.remove()
  previewApp = null
  previewElement = null
}
onBeforeUnmount(clearDragPreview)
function onDragStart(e, item) {
  clearDragPreview()
  const widget = { id: 'drag-preview', type: item.type, name: item.label, ...item.defaultSize,
    props: JSON.parse(JSON.stringify(item.defaultProps)), style: { ...item.defaultStyle } }
  previewElement = document.createElement('div')
  previewElement.className = 'component-drag-preview'
  Object.assign(previewElement.style, { position: 'fixed', left: '0px', top: '0px', pointerEvents: 'none',
    zIndex: '2147483647', width: `${widget.width}px`, height: `${widget.height}px` })
  document.body.appendChild(previewElement)
  previewApp = createApp(WidgetView, { widget })
  previewApp.mount(previewElement)
  e.dataTransfer.setDragImage(previewElement, widget.width / 2, widget.height / 2)
  requestAnimationFrame(clearDragPreview)
  e.dataTransfer.setData(
    'application/x-prototype-component',
    JSON.stringify({ type: item.type })
  )
  e.dataTransfer.effectAllowed = 'copy'
  // 兼容部分浏览器
  e.dataTransfer.setData('text/plain', item.type)
}
</script>

<style scoped>
.palette.collapsed { height: auto; }
.palette {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--panel-bg);
  border-top: 1px solid var(--border);
}
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.palette-body {
  flex: 1;
  overflow: auto;
  padding: 8px 10px 16px;
}
.group {
  margin-bottom: 12px;
}
.group-title {
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
  padding-left: 2px;
}
.items {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
.comp-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.comp-item:hover {
  border-color: #a0cfff;
  background: #ecf5ff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.12);
}
.comp-item:active {
  cursor: grabbing;
}
.comp-icon {
  color: #409eff;
  font-size: 14px;
}
</style>
