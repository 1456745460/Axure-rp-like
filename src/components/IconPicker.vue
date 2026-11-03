<template>
  <div class="icon-picker">
    <div class="current-icon"><span class="icon-preview" v-html="renderIconSvg(modelValue)" /><span>{{ resolveIconName(modelValue) }}</span></div>
    <el-input v-model="query" placeholder="搜索图标英文名，如 Search" clearable aria-label="搜索图标" />
    <div class="icon-count">Element Plus · {{ filteredIcons.length }} 个图标</div>
    <div class="icon-grid" aria-label="Element Plus 图标库">
      <button v-for="name in filteredIcons" :key="name" type="button" class="icon-option"
        :class="{ active: name === resolveIconName(modelValue) }" :title="name" :aria-label="name"
        :aria-pressed="name === resolveIconName(modelValue)" @click="$emit('update:modelValue', name)">
        <span v-html="renderIconSvg(name)" />
      </button>
      <div v-if="!filteredIcons.length" class="icon-empty">未找到图标</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ICON_NAMES, renderIconSvg, resolveIconName } from '@/utils/icons'
defineProps({ modelValue: { type: String, default: 'Picture' } })
defineEmits(['update:modelValue'])
const query = ref('')
const filteredIcons = computed(() => ICON_NAMES.filter(name => name.toLowerCase().includes(query.value.trim().toLowerCase())))
</script>

<style scoped>
.icon-picker { width:100%; }
.current-icon { display:flex; align-items:center; gap:8px; margin-bottom:8px; color:#606266; overflow-wrap:anywhere; }
.icon-preview { display:flex; width:24px; height:24px; flex-shrink:0; color:#409eff; }
.icon-count { margin:6px 0; font-size:11px; color:#909399; }
.icon-grid { display:grid; grid-template-columns:repeat(6, 1fr); gap:4px; max-height:220px; overflow:auto; padding:4px; border:1px solid #e4e7ed; border-radius:4px; }
.icon-option { display:flex; justify-content:center; align-items:center; height:32px; padding:5px; border:1px solid transparent; border-radius:4px; background:white; color:#606266; cursor:pointer; }
.icon-option span { display:flex; width:20px; height:20px; }
.icon-option:hover, .icon-option:focus-visible { background:#ecf5ff; color:#409eff; outline:1px solid #409eff; }
.icon-option.active { background:#ecf5ff; color:#409eff; border-color:#409eff; }
.icon-empty { grid-column:1 / -1; padding:12px; text-align:center; color:#909399; }
</style>
