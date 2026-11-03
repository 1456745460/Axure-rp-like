<template>
  <div
    ref="viewportRef"
    class="canvas-viewport"
    tabindex="0"
    @mousemove="trackPointer"
    @mousedown="onViewportMouseDown"
    @dragover.prevent="onDragOver"
    @drop="onDrop"
  >
    <div v-if="!page" class="empty-canvas">请先创建或选择一个页面</div>
    <div
      v-else
      class="page-stage"
      :style="stageStyle"
      @mousedown.stop="onStageMouseDown"
    >
      <div
        v-for="w in sortedWidgets"
        :key="w.id"
        class="widget"
        :class="{ selected: selectedIds.includes(w.id) }"
        :style="widgetBoxStyle(w)"
        @mousedown.stop="onWidgetMouseDown($event, w)"
        @dblclick.stop="startEditing(w)"
      >
        <EditableTable v-if="w.type === 'table'" :widget="w" @select="store.selectWidget(w.id)" @move="onWidgetMouseDown($event, w)" />
        <div v-else class="widget-content"><WidgetView :widget="w" /></div>
        <template v-if="w.id === store.selectedWidgetId && selectedIds.length === 1">
          <span
            v-for="h in handles"
            :key="h"
            class="handle"
            :class="h"
            @mousedown.stop="onResizeStart($event, w, h)"
          />
        </template>
      </div>
      <div v-if="marquee" class="selection-marquee" :style="rectStyle(marquee)" />
      <div v-if="selectionBounds && selectedIds.length > 1" class="selection-bounds" :style="rectStyle(selectionBounds)"><span>已选择 {{ selectedIds.length }} 个组件</span></div>
      <div v-if="guides.x != null" class="alignment-guide vertical" :style="{ left: guides.x + 'px' }" />
      <div v-if="guides.y != null" class="alignment-guide horizontal" :style="{ top: guides.y + 'px' }" />
      <form v-if="editingWidget" class="inline-editor" :style="editorPosition" @submit.prevent="finishEditing" @mousedown.stop @dblclick.stop @keydown.esc.stop.prevent="cancelEditing" @focusout="onEditorFocusOut">
        <div class="editor-title">编辑 {{ editingWidget.name }} <button type="button" @click="cancelEditing" title="取消">×</button></div>
        <label v-for="field in editFields" :key="field.key">
          <span>{{ field.label }}</span>
          <textarea v-if="field.multiline" v-model="editDraft[field.key]" :aria-label="field.label" rows="3" />
          <input v-else-if="field.type === 'checkbox'" v-model="editDraft[field.key]" type="checkbox" :aria-label="field.label" />
          <input v-else v-model="editDraft[field.key]" :type="field.type" :aria-label="field.label" />
        </label>
        <label v-if="editingWidget.type === 'image'">选择图片<input type="file" accept="image/*" @change="replaceImage" /></label>
        <button class="editor-done" type="submit">完成</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import WidgetView from './WidgetView.vue'
import EditableTable from './EditableTable.vue'
import { snapPosition, editableFields, parseField, isTextInput, shouldIgnoreCanvasClipboard, widgetBounds, widgetsInRect } from '@/utils/editor'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const viewportRef = ref(null)
const page = computed(() => store.currentPage)
const selectedIds = computed(() => store.selectedWidgets.map(w => w.id))
const selectionBounds = computed(() => widgetBounds(store.selectedWidgets))
const marquee = ref(null)
function rectStyle(rect) { return { left: rect.x + 'px', top: rect.y + 'px', width: rect.width + 'px', height: rect.height + 'px' } }
const guides = ref({ x: null, y: null })
const editingId = ref(null)
const editingWidget = computed(() => page.value?.widgets.find(w => w.id === editingId.value))
const editFields = ref([])
const editDraft = ref({})
const editorPosition = computed(() => ({
  left: `${Math.max(0, Math.min(editingWidget.value?.x || 0, (page.value?.width || 320) - 300))}px`,
  top: `${Math.max(0, Math.min(editingWidget.value?.y || 0, (page.value?.height || 400) - 200))}px`
}))
watch(() => store.currentPageId, () => { cancelEditing(); onMouseUp(); lastPointer = null })

function startEditing(widget) {
  if (widget.type === 'table') return
  onMouseUp()
  if (editingId.value) finishEditing()
  store.selectWidget(widget.id)
  editingId.value = widget.id
  editFields.value = editableFields(widget)
  if (!editFields.value.length) editFields.value = [
    { key: '__name', label: '名称', type: 'text', value: widget.name },
    { key: '__background', label: '背景色', type: 'color', value: widget.style?.background || '#fafafa' },
    { key: '__border', label: '边框（例如 1px solid #cccccc）', type: 'text', value: widget.style?.border || '' }
  ]
  editDraft.value = Object.fromEntries(editFields.value.map(field => [field.key, field.value]))
  nextTick(() => viewportRef.value?.querySelector('.inline-editor textarea, .inline-editor input')?.focus())
}
function finishEditing() {
  const widget = editingWidget.value
  if (!widget) return cancelEditing()
  const props = {}
  for (const field of editFields.value) {
    if (!field.key.startsWith('__')) props[field.key] = parseField(field.key, editDraft.value[field.key], widget.props[field.key])
  }
  const patch = { props }
  if ('__name' in editDraft.value) {
    patch.name = editDraft.value.__name
    patch.style = { background: editDraft.value.__background, border: editDraft.value.__border }
  }
  store.updateWidget(widget.id, patch)
  cancelEditing()
}
function cancelEditing() { editingId.value = null }
function onEditorFocusOut(event) {
  if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) finishEditing()
}
async function replaceImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try { editDraft.value.src = (await readImage(file)).src }
  catch (error) { ElMessage.error(error.message) }
}


const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

const sortedWidgets = computed(() => {
  if (!page.value) return []
  return [...page.value.widgets].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
})

const stageStyle = computed(() => {
  if (!page.value) return {}
  return {
    width: `${page.value.width}px`,
    height: `${page.value.height}px`
  }
})

function widgetBoxStyle(w) {
  return {
    left: `${w.x}px`,
    top: `${w.y}px`,
    width: `${w.width}px`,
    height: `${w.height}px`,
    zIndex: w.zIndex || 1
  }
}

/* —— 拖放组件到画布 —— */
function onDragOver(e) {
  e.dataTransfer.dropEffect = 'copy'
}

function stagePoint(event) {
  const stage = viewportRef.value?.querySelector('.page-stage')
  if (!stage) return null
  const rect = stage.getBoundingClientRect()
  return { x: event.clientX - rect.left - stage.clientLeft, y: event.clientY - rect.top - stage.clientTop }
}
let lastPointer = null
function trackPointer(event) {
  const point = stagePoint(event)
  if (point && page.value && point.x >= 0 && point.y >= 0 && point.x <= page.value.width && point.y <= page.value.height) lastPointer = point
}
function pastePoint() {
  if (lastPointer) return lastPointer
  const viewport = viewportRef.value
  const rect = viewport.querySelector('.page-stage').getBoundingClientRect()
  const view = viewport.getBoundingClientRect()
  return { x: Math.max(0, (Math.max(rect.left, view.left) + Math.min(rect.right, view.right)) / 2 - rect.left),
    y: Math.max(0, (Math.max(rect.top, view.top) + Math.min(rect.bottom, view.bottom)) / 2 - rect.top) }
}
function onDrop(e) {
  e.preventDefault()
  if (!page.value) return
  const point = stagePoint(e)
  if (!point) return
  const images = Array.from(e.dataTransfer.files || []).filter(file => file.type.startsWith('image/'))
  if (images.length) { importImages(images, point); return }
  let type = e.dataTransfer.getData('application/x-prototype-component')
  if (type) {
    try { type = JSON.parse(type).type } catch { /* plain type */ }
  }
  if (!type) type = e.dataTransfer.getData('text/plain')
  if (type) store.addWidgetFromLibrary(type, point.x, point.y, { centered: true })
}
function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('无法识别这张图片'))
      image.onload = () => resolve({ src: reader.result, width: image.naturalWidth, height: image.naturalHeight })
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
async function importImages(files, point) {
  const targetPageId = store.currentPageId
  const results = await Promise.allSettled(files.map(readImage))
  if (store.currentPageId !== targetPageId) { ElMessage.warning('页面已切换，请重新导入图片'); return }
  store.beginTransaction()
  try {
    results.forEach((result, index) => {
      if (result.status === 'rejected') { ElMessage.error(result.reason.message); return }
      const image = result.value
      store.addImageWidget(image.src, image.width, image.height, point.x + index * 16, point.y + index * 16)
    })
  } finally { store.endTransaction() }
}

/* —— 选择 / 拖动 / 缩放 —— */
let dragState = null

function onViewportMouseDown() {
  finishEditing()
  viewportRef.value.focus({ preventScroll: true })
  store.clearSelection()
}

function onStageMouseDown(event) {
  if (event.button !== 0) return
  finishEditing()
  viewportRef.value.focus({ preventScroll: true })
  onMouseUp()
  const point = stagePoint(event)
  const originalIds = event.shiftKey ? [...selectedIds.value] : []
  if (!event.shiftKey) store.clearSelection()
  dragState = { mode: 'marquee', point, originalIds }
  marquee.value = { x: point.x, y: point.y, width: 0, height: 0 }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onWidgetMouseDown(e, w) {
  if (e.button !== 0 || isTextInput(e.target)) return
  if (editingId.value) finishEditing()
  viewportRef.value.focus({ preventScroll: true })
  onMouseUp()
  if (e.shiftKey || e.ctrlKey || e.metaKey) {
    store.selectWidget(w.id, { additive: true, toggle: true })
    return
  }
  if (!selectedIds.value.includes(w.id)) store.selectWidget(w.id)
  const originals = store.selectedWidgets.map(widget => ({ id: widget.id, x: widget.x, y: widget.y }))
  const bounds = widgetBounds(store.selectedWidgets)
  store.beginTransaction()
  dragState = { mode: 'move', startX: e.clientX, startY: e.clientY, originals, bounds }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onResizeStart(e, w, handle) {
  if (e.button !== 0) return
  onMouseUp()
  store.beginTransaction()
  dragState = {
    mode: 'resize',
    id: w.id,
    handle,
    startX: e.clientX,
    startY: e.clientY,
    origX: w.x,
    origY: w.y,
    origW: w.width,
    origH: w.height
  }
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  if (!dragState) return
  if (dragState.mode === 'marquee') {
    const point = stagePoint(e)
    const start = dragState.point
    marquee.value = { x: Math.min(start.x, point.x), y: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x), height: Math.abs(point.y - start.y) }
    store.selectWidgets([...dragState.originalIds, ...widgetsInRect(page.value.widgets, marquee.value)])
    return
  }
  const dx = e.clientX - dragState.startX
  const dy = e.clientY - dragState.startY
  if (dragState.mode === 'move') {
    const bounds = dragState.bounds
    const others = { ...page.value, widgets: page.value.widgets.filter(w => !selectedIds.value.includes(w.id)) }
    const position = snapPosition({ ...bounds, id: '__selection' }, bounds.x + dx, bounds.y + dy, others)
    guides.value = { x: position.guideX, y: position.guideY }
    for (const original of dragState.originals) {
      store.moveWidget(original.id, original.x + position.x - bounds.x, original.y + position.y - bounds.y)
    }
    return
  }
  const hdl = dragState.handle
  let x = dragState.origX
  let y = dragState.origY
  let width = dragState.origW
  let height = dragState.origH
  if (hdl.includes('e')) width = dragState.origW + dx
  if (hdl.includes('s')) height = dragState.origH + dy
  if (hdl.includes('w')) {
    width = dragState.origW - dx
    x = dragState.origX + dx
  }
  if (hdl.includes('n')) {
    height = dragState.origH - dy
    y = dragState.origY + dy
  }
  if (width < 24) {
    if (hdl.includes('w')) x = dragState.origX + dragState.origW - 24
    width = 24
  }
  if (height < 16) {
    if (hdl.includes('n')) y = dragState.origY + dragState.origH - 16
    height = 16
  }
  store.updateWidget(dragState.id, {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height)
  })
}

function onMouseUp() {
  if (dragState && dragState.mode !== 'marquee') store.endTransaction()
  marquee.value = null
  dragState = null
  guides.value = { x: null, y: null }
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function ignoreShortcut(target) {
  return isTextInput(target) || !!target?.closest?.('.el-dialog, .el-message-box')
}
function onCopy(e) {
  if (shouldIgnoreCanvasClipboard(e.target) || !store.selectedWidget) return
  e.preventDefault()
  const data = JSON.stringify({ widgets: store.selectedWidgets })
  e.clipboardData.setData('application/x-prototype-widget', data)
  e.clipboardData.setData('text/plain', 'prototype-widget:' + data)
}
function onCut(e) {
  if (shouldIgnoreCanvasClipboard(e.target) || !store.selectedWidget) return
  onCopy(e)
  store.removeSelectedWidgets()
}
function onPaste(e) {
  if (shouldIgnoreCanvasClipboard(e.target) || !page.value) return
  const images = Array.from(e.clipboardData?.items || [])
    .filter(item => item.kind === 'file' && item.type.startsWith('image/')).map(item => item.getAsFile()).filter(Boolean)
  if (images.length) { e.preventDefault(); importImages(images, pastePoint()); return }
  let data = e.clipboardData?.getData('application/x-prototype-widget')
  const text = e.clipboardData?.getData('text/plain') || ''
  if (!data && text.startsWith('prototype-widget:')) data = text.slice('prototype-widget:'.length)
  if (data) {
    try {
      e.preventDefault()
      const parsed = JSON.parse(data)
      store.pasteWidgets(parsed.widgets || (Array.isArray(parsed) ? parsed : [parsed]), pastePoint())
    } catch { /* unrelated clipboard */ }
  }
}
function onKeyDown(e) {
  if (e.defaultPrevented || e.isComposing || ignoreShortcut(e.target)) return
  const key = e.key.toLowerCase()
  const mod = e.metaKey || e.ctrlKey
  if (mod && key === 'z') { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); return }
  if (mod && key === 'y') { e.preventDefault(); store.redo(); return }
  if (e.target?.closest?.('.el-tree')) return
  if (mod && key === 'a') { e.preventDefault(); store.selectAllWidgets(); return }
  const widget = store.selectedWidget
  if (key === 'escape') { cancelEditing(); store.clearSelection(); return }
  if (!widget) return
  if (mod && ['b', 'i', 'u'].includes(key)) {
    e.preventDefault()
    const [property, enabled, disabled] = { b: ['fontWeight', 'bold', 'normal'], i: ['fontStyle', 'italic', 'normal'], u: ['textDecoration', 'underline', 'none'] }[key]
    const value = widget.style?.[property] === enabled ? disabled : enabled
    store.beginTransaction()
    try { for (const selected of store.selectedWidgets) store.updateWidget(selected.id, { style: { [property]: value } }) }
    finally { store.endTransaction() }
    return
  }
  if (key === 'delete' || key === 'backspace') { e.preventDefault(); store.removeSelectedWidgets() }
  if (mod && key === 'd') { e.preventDefault(); store.duplicateSelectedWidgets() }
  if (key === 'enter') { e.preventDefault(); startEditing(widget) }
  const delta = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[key]
  if (delta) {
    e.preventDefault()
    const step = e.shiftKey ? 10 : 1
    store.moveSelectedWidgets(delta[0] * step, delta[1] * step)
  }
}

onMounted(() => {
  window.addEventListener('prototype:commit-edit', finishEditing)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('copy', onCopy)
  window.addEventListener('cut', onCut)
  window.addEventListener('paste', onPaste)
})

onBeforeUnmount(() => {
  onMouseUp()
  window.removeEventListener('copy', onCopy)
  window.removeEventListener('cut', onCut)
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('prototype:commit-edit', finishEditing)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<style scoped>
.canvas-viewport {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background:
    linear-gradient(45deg, #eef0f3 25%, transparent 25%) 0 0 / 16px 16px,
    linear-gradient(-45deg, #eef0f3 25%, transparent 25%) 0 0 / 16px 16px,
    #e5e7eb;
  padding: 32px;
  position: relative;
}
.empty-canvas {
  color: #6b7280;
  text-align: center;
  margin-top: 80px;
}
.page-stage {
  position: relative;
  margin: 0 auto;
  background: radial-gradient(circle, #dce0e5 1px, transparent 1px) 0 0 / 16px 16px, #fff;
  isolation: isolate;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.12);
  border: 1px solid #d1d5db;
  transform-origin: top center;
}
.canvas-viewport:focus { outline: none; }
.widget-content { width: 100%; height: 100%; pointer-events: none; }
.widget-content :deep(*) { pointer-events: none; }
.alignment-guide { position: absolute; z-index: 2147483646; pointer-events: none; }
.alignment-guide.vertical { top: 0; bottom: 0; border-left: 1px dashed #f56c6c; }
.alignment-guide.horizontal { left: 0; right: 0; border-top: 1px dashed #f56c6c; }
.inline-editor { position: absolute; z-index: 2147483647; width: 300px; max-height: 380px; overflow: auto; padding: 12px; border: 1px solid #409eff; border-radius: 6px; background: white; box-shadow: 0 4px 20px #0002; cursor: default; font-size: 12px; }
.editor-title { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 8px; }
.inline-editor label { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.inline-editor input, .inline-editor textarea { width: 100%; padding: 6px; border: 1px solid #dcdfe6; border-radius: 4px; font: inherit; }
.inline-editor input[type=checkbox] { width: auto; align-self: flex-start; }
.inline-editor textarea { resize: vertical; }
.inline-editor button { cursor: pointer; border: 0; padding: 4px 10px; border-radius: 4px; }
.editor-done { background: #409eff; color: white; }
.selection-marquee, .selection-bounds { position:absolute; pointer-events:none; z-index:2147483645; border:1px solid #409eff; }
.selection-marquee { background:#409eff20; }
.selection-bounds { border-style:dashed; }
.selection-bounds span { position:absolute; bottom:100%; left:0; color:#409eff; font-size:12px; white-space:nowrap; }
.widget {
  position: absolute;
  cursor: move;
  outline: 1px solid transparent;
}
.widget:hover {
  outline: 1px dashed #93c5fd;
}
.widget.selected {
  outline: 2px solid #409eff;
}
.handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #fff;
  border: 1px solid #409eff;
  border-radius: 1px;
  z-index: 2;
}
.handle.nw { left: -5px; top: -5px; cursor: nwse-resize; }
.handle.n  { left: 50%; top: -5px; margin-left: -4px; cursor: ns-resize; }
.handle.ne { right: -5px; top: -5px; cursor: nesw-resize; }
.handle.e  { right: -5px; top: 50%; margin-top: -4px; cursor: ew-resize; }
.handle.se { right: -5px; bottom: -5px; cursor: nwse-resize; }
.handle.s  { left: 50%; bottom: -5px; margin-left: -4px; cursor: ns-resize; }
.handle.sw { left: -5px; bottom: -5px; cursor: nesw-resize; }
.handle.w  { left: -5px; top: 50%; margin-top: -4px; cursor: ew-resize; }
</style>
