<template>
  <aside class="props-panel" :class="{ collapsed }">
    <div class="panel-head"><span v-if="!collapsed">属性</span><el-button :icon="collapsed ? DArrowLeft : DArrowRight" text circle size="small" :title="collapsed ? '展开属性' : '收起属性'" :aria-label="collapsed ? '展开属性' : '收起属性'" @click="collapsed = !collapsed" /></div>
    <template v-if="!collapsed">
    <div v-if="!widget && !page" class="empty">请选择页面或组件</div>

    <div v-else-if="!widget && page" class="body">
      <div class="section-title">页面设置</div>
      <el-form label-position="top" size="small">
        <el-form-item label="页面名称">
          <el-input :model-value="page.name" @update:model-value="renamePage" />
        </el-form-item>
        <el-form-item label="画布宽度">
          <el-input-number
            :model-value="page.width"
            :min="320"
            :max="4000"
            controls-position="right"
            @update:model-value="(v) => store.updatePageSize(page.id, v, page.height)"
          />
        </el-form-item>
        <el-form-item label="画布高度">
          <el-input-number
            :model-value="page.height"
            :min="240"
            :max="6000"
            controls-position="right"
            @update:model-value="(v) => store.updatePageSize(page.id, page.width, v)"
          />
        </el-form-item>
      </el-form>
    </div>

    <div v-else class="body">
      <div v-if="store.selectedWidgets.length > 1" class="selection-note">已选择 {{ store.selectedWidgets.length }} 个组件，可整体移动、复制或删除。</div>
      <div class="section-title">
        {{ widget.name || widget.type }}
        <el-tag size="small" type="info">{{ widget.type }}</el-tag>
      </div>
      <el-form label-position="top" size="small">
        <el-form-item label="名称">
          <el-input :model-value="widget.name" @update:model-value="(v) => patch({ name: v })" />
        </el-form-item>
        <div class="row2">
          <el-form-item label="X">
            <el-input-number
              :model-value="widget.x"
              controls-position="right"
              @update:model-value="(v) => patch({ x: Number(v) || 0 })"
            />
          </el-form-item>
          <el-form-item label="Y">
            <el-input-number
              :model-value="widget.y"
              controls-position="right"
              @update:model-value="(v) => patch({ y: Number(v) || 0 })"
            />
          </el-form-item>
        </div>
        <div class="row2">
          <el-form-item label="宽">
            <el-input-number
              :model-value="widget.width"
              :min="widget.type === 'image' ? 1 : 24"
              controls-position="right"
              @update:model-value="(v) => patch({ width: Number(v) || 24 })"
            />
          </el-form-item>
          <el-form-item label="高">
            <el-input-number
              :model-value="widget.height"
              :min="widget.type === 'image' ? 1 : 16"
              controls-position="right"
              @update:model-value="(v) => patch({ height: Number(v) || 16 })"
            />
          </el-form-item>
        </div>

        <template v-if="hasProp('text')">
          <el-form-item label="文本">
            <el-input
              :model-value="widget.props.text"
              type="textarea"
              :rows="2"
              @update:model-value="(v) => patchProp('text', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('placeholder')">
          <el-form-item label="占位符">
            <el-input
              :model-value="widget.props.placeholder"
              @update:model-value="(v) => patchProp('placeholder', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('title')">
          <el-form-item label="标题">
            <el-input
              :model-value="widget.props.title"
              @update:model-value="(v) => patchProp('title', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('content')">
          <el-form-item label="内容">
            <el-input
              :model-value="widget.props.content"
              type="textarea"
              :rows="2"
              @update:model-value="(v) => patchProp('content', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('href')">
          <el-form-item label="链接地址">
            <el-input
              :model-value="widget.props.href"
              @update:model-value="(v) => patchProp('href', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('src')">
          <el-form-item label="图片 URL">
            <el-input
              :model-value="widget.props.src"
              placeholder="https://..."
              @update:model-value="(v) => patchProp('src', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('percentage')">
          <el-form-item label="进度 %">
            <el-slider
              :model-value="Number(widget.props.percentage || 0)"
              :min="0"
              :max="100"
              @update:model-value="(v) => patchProp('percentage', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('checked')">
          <el-form-item label="选中">
            <el-switch
              :model-value="!!widget.props.checked"
              @update:model-value="(v) => patchProp('checked', v)"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('options')">
          <el-form-item label="选项（每行一个）">
            <el-input
              :model-value="(widget.props.options || []).join('\n')"
              type="textarea"
              :rows="3"
              @update:model-value="onOptions"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('tabs')">
          <el-form-item label="标签（每行一个）">
            <el-input
              :model-value="(widget.props.tabs || []).join('\n')"
              type="textarea"
              :rows="3"
              @update:model-value="onTabs"
            />
          </el-form-item>
        </template>
        <template v-if="hasProp('columns')">
          <el-form-item label="表头（逗号分隔）">
            <el-input
              v-model="columnText"
              @change="onColumns"
            />
          </el-form-item>
        </template>

        <template v-for="key in ['value', 'min', 'max', 'total', 'pageSize', 'currentPage', 'active']" :key="key">
          <el-form-item v-if="hasProp(key)" :label="extraLabels[key]">
            <el-input-number v-if="typeof widget.props[key] === 'number'" :model-value="widget.props[key]" @update:model-value="v => patchProp(key, v)" />
            <el-input v-else :model-value="widget.props[key]" @update:model-value="v => patchProp(key, v)" />
          </el-form-item>
        </template>
        <el-form-item v-if="hasProp('items')" label="项目（每行一个）">
          <el-input type="textarea" :rows="3" :model-value="widget.props.items.join('\n')" @update:model-value="v => patchProp('items', v.split('\n'))" />
        </el-form-item>
        <el-form-item v-if="hasProp('variant')" label="提示类型">
          <el-select :model-value="widget.props.variant" @update:model-value="v => patchProp('variant', v)"><el-option v-for="value in ['success', 'info', 'warning', 'error']" :key="value" :label="value" :value="value" /></el-select>
        </el-form-item>
        <el-form-item v-if="hasProp('description')" label="说明"><el-input type="textarea" :model-value="widget.props.description" @update:model-value="v => patchProp('description', v)" /></el-form-item>
        <el-form-item v-for="key in ['confirmText', 'cancelText'].filter(hasProp)" :key="key" :label="key === 'confirmText' ? '确认按钮' : '取消按钮'"><el-input :model-value="widget.props[key]" @update:model-value="v => patchProp(key, v)" /></el-form-item>
        <div class="section-title sub">样式</div>
        <el-form-item label="文字样式">
          <el-button-group>
            <el-button :type="widget.style?.fontWeight === 'bold' ? 'primary' : 'default'" title="加粗（Ctrl/Command+B）" @click="patchStyle('fontWeight', widget.style?.fontWeight === 'bold' ? 'normal' : 'bold')"><b>B</b></el-button>
            <el-button :type="widget.style?.fontStyle === 'italic' ? 'primary' : 'default'" title="倾斜（Ctrl/Command+I）" @click="patchStyle('fontStyle', widget.style?.fontStyle === 'italic' ? 'normal' : 'italic')"><i>I</i></el-button>
            <el-button :type="widget.style?.textDecoration === 'underline' ? 'primary' : 'default'" title="下划线（Ctrl/Command+U）" @click="patchStyle('textDecoration', widget.style?.textDecoration === 'underline' ? 'none' : 'underline')"><u>U</u></el-button>
          </el-button-group>
        </el-form-item>
        <el-form-item label="字号">
          <el-input-number
            :model-value="widget.style?.fontSize || 14"
            :min="10"
            :max="72"
            controls-position="right"
            @update:model-value="(v) => patchStyle('fontSize', v)"
          />
        </el-form-item>
        <el-form-item label="文字颜色">
          <el-color-picker
            :model-value="widget.style?.color || '#303133'"
            @update:model-value="(v) => patchStyle('color', v)"
          />
        </el-form-item>
        <el-form-item label="背景色">
          <el-color-picker
            :model-value="widget.style?.background || ''"
            show-alpha
            @update:model-value="(v) => patchStyle('background', v || '')"
          />
        </el-form-item>
        <el-form-item label="圆角">
          <el-input-number
            :model-value="widget.style?.borderRadius ?? 0"
            :min="0"
            :max="100"
            controls-position="right"
            @update:model-value="(v) => patchStyle('borderRadius', v)"
          />
        </el-form-item>
        <el-form-item label="对齐">
          <el-radio-group
            :model-value="widget.style?.textAlign || 'left'"
            @update:model-value="(v) => patchStyle('textAlign', v)"
          >
            <el-radio-button value="left">左</el-radio-button>
            <el-radio-button value="center">中</el-radio-button>
            <el-radio-button value="right">右</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div class="ops">
          <el-button size="small" @click="store.bringToFront(widget.id)">置顶</el-button>
          <el-button size="small" @click="store.sendToBack(widget.id)">置底</el-button>
          <el-button size="small" @click="store.duplicateWidget(widget.id)">复制</el-button>
          <el-button size="small" type="danger" @click="store.removeWidget(widget.id)">删除</el-button>
        </div>
      </el-form>
    </div>
    </template>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'

const store = useProjectStore()
const collapsed = ref(false)
const extraLabels = { value: '值', min: '最小值', max: '最大值', total: '总条数', pageSize: '每页条数', currentPage: '当前页', active: '当前步骤 / 标签（从 0 开始）' }
const widget = computed(() => store.selectedWidget)
const page = computed(() => store.currentPage)
const columnText = ref('')
watch(() => [widget.value?.id, widget.value?.props.columns], () => { columnText.value = widget.value?.props.columns?.join(',') || '' }, { immediate: true, deep: true })

function hasProp(key) {
  return widget.value && Object.prototype.hasOwnProperty.call(widget.value.props || {}, key)
}

function patch(p) {
  if (!widget.value) return
  store.updateWidget(widget.value.id, p)
}

function patchProp(key, value) {
  patch({ props: { [key]: value } })
}

function patchStyle(key, value) {
  patch({ style: { [key]: value } })
}

// Preserve empty trailing entries while typing, so Enter and commas survive the render.
function onOptions(text) { patchProp('options', String(text).split('\n')) }
function onTabs(text) { patchProp('tabs', String(text).split('\n')) }
function onColumns(text) {
  if (widget.value) store.setTableColumns(widget.value.id, String(text).split(/[,，]/).map(s => s.trim()).filter(Boolean))
}

function renamePage(name) {
  const p = page.value
  if (!p) return
  const label = name || '未命名'
  // 同步树节点
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.pageId === p.id) {
        store.renameTreeNode(n.id, label)
        return true
      }
      if (walk(n.children)) return true
    }
    return false
  }
  if (!walk(store.tree)) {
    p.name = label
  }
}
</script>

<style scoped>
.props-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--panel-bg);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.props-panel.collapsed { width: 42px; }
.panel-head {
  justify-content: space-between;
  padding: 6px;
  font-size: 13px;
  font-weight: 600;
  border-bottom: 1px solid var(--border);
  height: 41px;
  display: flex;
  align-items: center;
}
.body {
  flex: 1;
  overflow: auto;
  padding: 12px;
}
.empty {
  padding: 24px 12px;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}
.selection-note { padding:8px; margin-bottom:10px; font-size:12px; color:#409eff; background:#ecf5ff; border-radius:4px; }
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}
.section-title.sub {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border);
}
.row2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ops {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
:deep(.el-form-item) {
  margin-bottom: 12px;
}
:deep(.el-input-number) {
  width: 100%;
}
</style>
