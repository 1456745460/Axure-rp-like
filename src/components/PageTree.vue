<template>
  <div class="page-tree" :class="{ collapsed }">
    <div class="panel-head">
      <span>页面目录</span>
      <div class="actions">
        <el-button :icon="collapsed ? ArrowDown : ArrowUp" text circle size="small" :title="collapsed ? '展开页面目录' : '收起页面目录'" :aria-label="collapsed ? '展开页面目录' : '收起页面目录'" @click="collapsed = !collapsed" />
        <el-tooltip content="新建页面" placement="top">
          <el-button :icon="DocumentAdd" aria-label="新建页面" circle size="small" @click="onAddPage" />
        </el-tooltip>
        <el-tooltip content="新建文件夹" placement="top">
          <el-button :icon="FolderAdd" aria-label="新建文件夹" circle size="small" @click="onAddFolder" />
        </el-tooltip>
      </div>
    </div>

    <el-tree
      v-if="!collapsed"
      draggable
      :allow-drag="() => !editingId"
      :allow-drop="allowDrop"
      @node-drag-start="store.beginTransaction()"
      @node-drag-end="store.endTransaction()"
      ref="treeRef"
      class="tree"
      :data="store.tree"
      node-key="id"
      default-expand-all
      highlight-current
      :expand-on-click-node="false"
      :current-node-key="currentNodeKey"
      :props="{ label: 'label', children: 'children' }"
      @node-click="onNodeClick"
    >
      <template #default="{ data }">
        <div class="tree-node" @dblclick.stop="startRename(data)">
          <el-icon class="node-icon">
            <Folder v-if="data.type === 'folder'" />
            <Document v-else />
          </el-icon>
          <template v-if="editingId === data.id">
            <el-input
              ref="editInputRef"
              v-model="editingLabel"
              size="small"
              class="rename-input"
              @click.stop
              @keyup.enter="commitRename"
              @blur="commitRename"
            />
          </template>
          <span v-else class="node-label">{{ data.label }}</span>
          <span class="node-ops" @click.stop>
            <el-button
              v-if="data.type === 'folder'"
              :icon="DocumentAdd"
              link
              size="small"
              title="在此文件夹下新建页面"
              @click="store.addPage(data.id)"
            />
            <el-button
              :icon="EditPen"
              link
              size="small"
              title="重命名"
              @click="startRename(data)"
            />
            <el-button
              :icon="Delete"
              link
              size="small"
              type="danger"
              title="删除"
              @click="onDelete(data)"
            />
          </span>
        </div>
      </template>
    </el-tree>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Document, DocumentAdd, Folder, FolderAdd, EditPen, Delete, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const collapsed = ref(false)
const treeRef = ref(null)
const editingId = ref(null)
const editingLabel = ref('')
const editInputRef = ref(null)

const currentNodeKey = computed(() => {
  const pageId = store.currentPageId
  const find = (nodes) => {
    for (const n of nodes || []) {
      if (n.type === 'page' && n.pageId === pageId) return n.id
      const c = find(n.children)
      if (c) return c
    }
    return null
  }
  return find(store.tree)
})

watch(currentNodeKey, (key) => {
  nextTick(() => {
    if (key && treeRef.value) treeRef.value.setCurrentKey(key)
  })
})

function allowDrop(dragging, target, type) {
  return type !== 'inner' || target.data.type === 'folder'
}

function onNodeClick(data) {
  if (data.type === 'page' && data.pageId) {
    store.selectPage(data.pageId)
  }
}

function onAddPage() {
  store.addPage(null, `页面 ${store.pageCount + 1}`)
}

function onAddFolder() {
  store.addFolder(null, '新建文件夹')
}

function startRename(data) {
  editingId.value = data.id
  editingLabel.value = data.label
  nextTick(() => {
    const input = editInputRef.value
    input?.focus?.()
    input?.select?.()
  })
}

function commitRename() {
  if (!editingId.value) return
  const label = (editingLabel.value || '').trim() || '未命名'
  store.renameTreeNode(editingId.value, label)
  editingId.value = null
}

async function onDelete(data) {
  try {
    await ElMessageBox.confirm(
      data.type === 'folder'
        ? `删除文件夹「${data.label}」及其下所有页面？`
        : `删除页面「${data.label}」？`,
      '删除确认',
      { type: 'warning' }
    )
    store.deleteTreeNode(data.id)
  } catch {
    /* cancel */
  }
}
</script>

<style scoped>
.page-tree.collapsed { height: auto; }
.page-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--panel-bg);
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.actions {
  display: flex;
  gap: 4px;
}
.tree {
  flex: 1;
  overflow: auto;
  padding: 8px 4px;
  background: transparent;
}
.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding-right: 4px;
  min-width: 0;
}
.node-icon {
  color: var(--muted);
  flex-shrink: 0;
}
.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.node-ops {
  display: none;
  flex-shrink: 0;
}
.tree-node:hover .node-ops {
  display: inline-flex;
  align-items: center;
}
.rename-input {
  flex: 1;
  max-width: 140px;
}
</style>
