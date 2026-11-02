<template>
  <div class="editable-table" :style="textStyle" @mousedown.stop="$emit('select')" @dblclick.stop>
    <table :style="{ width: widget.width + 56 + 'px' }">
      <colgroup><col v-for="(width, index) in widths" :key="index" :style="{ width: width + 'px' }" /><col style="width:56px" /></colgroup>
      <thead><tr>
        <th v-for="(column, index) in columns" :key="index">
          <textarea :aria-label="`第 ${index + 1} 列表头`" :value="column" rows="1" @input="store.updateTableCell(widget.id, -1, index, $event.target.value)" @keydown.esc="blurCell" />
          <span class="column-resizer" :aria-label="`调整第 ${index + 1} 列宽度`" role="separator" aria-orientation="vertical" @mousedown.stop.prevent="startResize($event, index)" />
        </th>
        <th class="row-actions"><button class="table-move" type="button" title="拖动表格" aria-label="拖动表格" @mousedown.stop="$emit('move', $event)">⠿</button><button v-if="!rows.length" type="button" aria-label="新增第一行" @click="store.insertTableRow(widget.id, -1)">+</button></th>
      </tr></thead>
      <tbody><tr v-for="(row, rowIndex) in rows" :key="rowIndex">
        <td v-for="(_, columnIndex) in columns" :key="columnIndex">
          <textarea :aria-label="`第 ${rowIndex + 1} 行第 ${columnIndex + 1} 列`" :value="row[columnIndex] ?? ''" rows="1" @input="store.updateTableCell(widget.id, rowIndex, columnIndex, $event.target.value)" @keydown.esc="blurCell" />
        </td>
        <td class="row-actions"><button type="button" :aria-label="`在第 ${rowIndex + 1} 行后新增`" title="在当前行后新增" @click="store.insertTableRow(widget.id, rowIndex)">+</button><button type="button" :aria-label="`删除第 ${rowIndex + 1} 行`" title="删除当前行" @click="store.deleteTableRow(widget.id, rowIndex)">−</button></td>
      </tr></tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { useProjectStore } from '@/stores/project'
import { tableColumnWidths } from '@/utils/editor'
const props = defineProps({ widget: { type: Object, required: true } })
defineEmits(['select', 'move'])
const store = useProjectStore()
const columns = computed(() => props.widget.props.columns || [])
const rows = computed(() => props.widget.props.rows || [])
const widths = computed(() => tableColumnWidths(props.widget))
const textStyle = computed(() => ({ fontSize: `${props.widget.style?.fontSize || 13}px`,
  color: props.widget.style?.color, fontWeight: props.widget.style?.fontWeight,
  fontStyle: props.widget.style?.fontStyle, textDecoration: props.widget.style?.textDecoration }))
let resizing = null
function blurCell(event) { event.target.blur() }
function startResize(event, column) {
  finishResize()
  store.selectWidget(props.widget.id)
  store.beginTransaction()
  resizing = { column, lastX: event.clientX }
  window.addEventListener('mousemove', resizeColumn)
  window.addEventListener('mouseup', finishResize)
}
function resizeColumn(event) {
  if (!resizing) return
  store.resizeTableColumn(props.widget.id, resizing.column, event.clientX - resizing.lastX)
  resizing.lastX = event.clientX
}
function finishResize() {
  if (resizing) store.endTransaction()
  resizing = null
  window.removeEventListener('mousemove', resizeColumn)
  window.removeEventListener('mouseup', finishResize)
}
onBeforeUnmount(finishResize)
</script>

<style scoped>
.editable-table { width:100%; height:100%; cursor:default; }
table { height:100%; table-layout:fixed; border-collapse:collapse; background:white; }
th, td { position:relative; border:1px solid #dcdfe6; padding:0; height:36px; }
th { background:#f5f7fa; }
textarea { width:100%; height:100%; min-height:32px; display:block; padding:7px 9px; border:0; outline:none; resize:none; background:transparent; font:inherit; color:inherit; text-decoration:inherit; line-height:1.5; }
textarea:focus { box-shadow:inset 0 0 0 2px #409eff; background:#ecf5ff; }
.row-actions { border:0; background:transparent; white-space:nowrap; padding-left:5px; }
.row-actions button { width:23px; height:24px; border:1px solid #dcdfe6; border-radius:3px; background:#fff; color:#409eff; cursor:pointer; font-size:16px; }
.row-actions button:hover { background:#ecf5ff; }
.table-move { cursor:move !important; }
.column-resizer { position:absolute; top:0; bottom:0; right:-4px; width:8px; cursor:col-resize; z-index:3; }
.column-resizer:hover { background:#409eff55; }
</style>
