<template>
  <header class="toolbar">
    <div class="left">
      <div class="logo">原型设计</div>
      <el-input
        v-model="projectName"
        class="name-input"
        size="small"
        placeholder="项目名称"
        @update:model-value="onNameChange"
      />
    </div>
    <div class="center">
      <el-tag size="small" type="info" effect="plain">
        {{ store.pageCount }} 页 · 当前：{{ store.currentPage?.name || '无' }}
      </el-tag>
      <span v-if="saveHint" class="hint">{{ saveHint }}</span>
    </div>
    <div class="right">
      <el-button size="small" :disabled="!store.canUndo" title="撤销（Ctrl/Command+Z）" @click="store.undo()">后退</el-button>
      <el-button size="small" :disabled="!store.canRedo" title="重做（Ctrl/Command+Shift+Z）" @click="store.redo()">前进</el-button>
      <el-button size="small" @click="openProjectDialog">打开</el-button>
      <el-button size="small" type="primary" :loading="saving" @click="save">保存</el-button>
      <el-button size="small" @click="preview">预览</el-button>
      <el-button size="small" type="success" @click="exportHtml">导出 HTML</el-button>
      <el-button size="small" @click="confirmNew">新建</el-button>
    </div>

    <el-dialog v-model="dialogVisible" title="打开项目" width="520px" destroy-on-close>
      <div v-loading="loadingList" class="project-list">
        <el-empty v-if="!projects.length" description="暂无已保存项目" />
        <div
          v-for="p in projects"
          :key="p.id"
          class="project-row"
          @click="loadProject(p.id)"
        >
          <div class="p-name">{{ p.name }}</div>
          <div class="p-meta">{{ formatTime(p.updatedAt) }}</div>
          <el-button
            size="small"
            type="danger"
            text
            @click.stop="removeProject(p.id)"
          >删除</el-button>
        </div>
      </div>
    </el-dialog>
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import { createAutoSaver } from '@/utils/autoSave'
import { buildExportHtml, downloadHtml } from '@/utils/exportHtml'
import { DRAFT_KEY } from '@/utils/livePreview'

const store = useProjectStore()
const projectName = ref(store.name)
const saving = ref(false)
const saveHint = ref('')
const dialogVisible = ref(false)
const loadingList = ref(false)
const projects = ref([])
const draftKey = DRAFT_KEY
let restoredPending = false
try {
  const draft = JSON.parse(localStorage.getItem(draftKey) || 'null')
  if (draft?.project?.pages?.length) {
    store.loadProject(draft.project)
    restoredPending = !!draft.pending
  }
} catch { /* An unavailable local draft must not block editing. */ }
projectName.value = store.name
let pending = restoredPending
function persistDraft() {
  try {
    localStorage.setItem(draftKey, JSON.stringify({ project: store.toJSON(), pending }))
    return true
  } catch { return false /* The API remains the primary persistence path if storage is full. */ }
}
const saver = createAutoSaver({
  getSnapshot: () => store.toJSON(),
  getScope: () => store._epoch,
  async saveSnapshot(body) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await fetch(body.id ? `/api/projects/${body.id}` : '/api/projects', {
        method: body.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body), signal: controller.signal
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || '保存失败')
      return data
    } finally { clearTimeout(timeout) }
  },
  onSaved(data) { store.id = data.id; store.updatedAt = data.updatedAt },
  onStatus(status, error) {
    saving.value = status === 'saving'
    if (status === 'pending') saveHint.value = '等待自动保存…'
    if (status === 'saving') saveHint.value = '自动保存中…'
    if (status === 'saved') {
      pending = false
      persistDraft()
      saveHint.value = `已自动保存 ${formatTime(store.updatedAt)}`
    }
    if (status === 'error') saveHint.value = `自动保存失败：${error.message}（可点击保存重试）`
  }
})
watch(() => store._revision, () => { pending = true; persistDraft(); saver.request() }, { flush: 'sync' })
if (restoredPending) saver.request()
function flushOnLeave() {
  window.dispatchEvent(new Event('prototype:commit-edit'))
  persistDraft()
  saver.flush().catch(() => {})
}
function onVisibilityChange() { if (document.hidden) flushOnLeave() }
function retryOnReconnect() { if (pending) saver.request() }
onMounted(() => {
  window.addEventListener('pagehide', flushOnLeave)
  window.addEventListener('online', retryOnReconnect)
  document.addEventListener('visibilitychange', onVisibilityChange)
})
onBeforeUnmount(() => {
  persistDraft()
  saver.dispose()
  window.removeEventListener('pagehide', flushOnLeave)
  window.removeEventListener('online', retryOnReconnect)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

watch(
  () => store.name,
  (v) => {
    projectName.value = v
  }
)

function onNameChange(value = projectName.value) {
  store.setName(value)
}

function onSaveShortcut(event) {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return
  if (event.target?.closest?.('.el-dialog, .el-message-box')) return
  event.preventDefault()
  event.target?.closest?.('.inline-editor')?.requestSubmit()
  save()
}
onMounted(() => window.addEventListener('keydown', onSaveShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onSaveShortcut))

async function save() {
  window.dispatchEvent(new Event('prototype:commit-edit'))
  store.setName(projectName.value)
  pending = true
  persistDraft()
  saver.request()
  try { await saver.flush() }
  catch (error) { ElMessage.error(error.message || '保存失败，请确认后端已启动') }
}

function preview() {
  window.dispatchEvent(new Event('prototype:commit-edit'))
  store.setName(projectName.value)
  if (!persistDraft()) {
    ElMessage.error('无法更新预览，请检查浏览器本地存储空间或权限后重试')
    return
  }
  const url = new URL(window.location.href)
  url.searchParams.set('preview', '1')
  url.hash = ''
  const tab = window.open(url.href, '_blank')
  if (!tab) ElMessage.warning('请允许浏览器打开预览标签页')
  else tab.opener = null
}

function exportHtml() {
  store.setName(projectName.value)
  const html = buildExportHtml(store.toJSON())
  const safe = (store.name || 'prototype').replace(/[\\/:*?"<>|]/g, '_')
  downloadHtml(`${safe}.html`, html)
  ElMessage.success('已导出 HTML')
}

async function openProjectDialog() {
  dialogVisible.value = true
  loadingList.value = true
  try {
    const res = await fetch('/api/projects')
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '加载失败')
    projects.value = data.list || []
  } catch (e) {
    ElMessage.error(e.message || '无法连接后端')
    projects.value = []
  } finally {
    loadingList.value = false
  }
}

async function loadProject(id) {
  try {
    await saver.flush()
    const res = await fetch(`/api/projects/${id}`)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '打开失败')
    store.loadProject(data)
    pending = false
    persistDraft()
    projectName.value = store.name
    dialogVisible.value = false
    ElMessage.success('已打开项目')
  } catch (e) {
    ElMessage.error(e.message || '打开失败')
  }
}

async function removeProject(id) {
  try {
    await ElMessageBox.confirm('确定删除该项目？此操作不可恢复。', '删除确认', {
      type: 'warning'
    })
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '删除失败')
    projects.value = projects.value.filter((p) => p.id !== id)
    ElMessage.success('已删除')
  } catch (e) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error(e.message || '删除失败')
  }
}

async function confirmNew() {
  try {
    await ElMessageBox.confirm('新建会清空当前未保存内容，是否继续？', '新建项目', {
      type: 'warning'
    })
    await saver.flush()
    store.reset()
    projectName.value = store.name
  } catch (error) {
    if (error instanceof Error) ElMessage.error(error.message)
    /* cancel */
  }
}

function formatTime(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', { hour12: false })
  } catch {
    return iso
  }
}
</script>

<style scoped>
.toolbar {
  min-height: var(--toolbar-height);
  flex-shrink: 0;
  flex-wrap: wrap;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--panel-bg);
  border-bottom: 1px solid var(--border);
  gap: 16px;
}
.left,
.right,
.center {
  display: flex;
  align-items: center;
  gap: 10px;
}
.right { flex-wrap: wrap; }
.left {
  min-width: 200px;
}
.center {
  flex: 1;
  justify-content: center;
}
.logo {
  font-weight: 700;
  font-size: 15px;
  color: #111827;
  white-space: nowrap;
}
.name-input {
  width: 160px;
}
.hint {
  font-size: 12px;
  color: var(--muted);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.project-list {
  min-height: 120px;
  max-height: 360px;
  overflow: auto;
}
.project-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.project-row:hover {
  background: #f5f7fa;
}
.p-name {
  flex: 1;
  font-weight: 500;
}
.p-meta {
  font-size: 12px;
  color: var(--muted);
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
