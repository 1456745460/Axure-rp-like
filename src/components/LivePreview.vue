<template>
  <iframe v-if="source" ref="frame" class="live-preview" :src="source" title="原型预览" @load="releasePrevious" />
  <div v-else class="preview-empty">暂无可预览的内容，请返回编辑器点击「预览」。</div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { buildExportHtml } from '@/utils/exportHtml'
import { watchPreviewProject } from '@/utils/livePreview'

const frame = ref(null)
const source = ref('')
const retiredUrls = []
function releasePrevious() {
  retiredUrls.splice(0).forEach(url => URL.revokeObjectURL(url))
}
const stop = watchPreviewProject({
  storage: window.localStorage,
  eventTarget: window,
  onChange(project) {
    if (source.value) retiredUrls.push(source.value)
    if (!project) {
      source.value = ''
      document.title = '原型预览'
      releasePrevious()
      return
    }
    // Keep the page the viewer chose while the editor updates its contents.
    const activeId = frame.value?.contentDocument?.querySelector('.page-panel.active')?.dataset.pageId
    const currentPageId = project.pages.some(page => page.id === activeId) ? activeId : project.currentPageId
    source.value = URL.createObjectURL(new Blob([buildExportHtml({ ...project, currentPageId })], { type: 'text/html;charset=utf-8' }))
    document.title = `${project.name || '未命名项目'} · 预览`
  }
})
onBeforeUnmount(() => {
  stop()
  if (source.value) URL.revokeObjectURL(source.value)
  releasePrevious()
})
</script>

<style scoped>
.live-preview { display: block; width: 100%; height: 100%; border: 0; }
.preview-empty { padding: 48px; text-align: center; color: #6b7280; }
</style>
