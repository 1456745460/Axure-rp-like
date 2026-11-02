<template><component :is="renderWidget(widget)" /></template>

<script setup>
import { h } from 'vue'
import { ElInputNumber, ElSlider, ElRate, ElDatePicker, ElTimePicker, ElPagination, ElBreadcrumb, ElBreadcrumbItem, ElSteps, ElStep } from 'element-plus'
import { renderFeedbackHtml } from '@/utils/exportHtml'
defineProps({ widget: { type: Object, required: true } })

function innerStyle(w) {
  const s = w.style || {}
  return {
    width: '100%',
    height: '100%',
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    color: s.color,
    background: s.background,
    borderRadius: s.borderRadius != null ? `${s.borderRadius}px` : undefined,
    textAlign: s.textAlign,
    fontWeight: s.fontWeight,
    fontStyle: s.fontStyle,
    textDecoration: s.textDecoration,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    opacity: s.opacity,
    border: s.border,
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      s.textAlign === 'center' ? 'center' : s.textAlign === 'right' ? 'flex-end' : 'flex-start',
    padding: '0 8px',
    userSelect: 'none',
    pointerEvents: 'none'
  }
}

function renderWidget(w) {
  const style = innerStyle(w)
  const text = w.props?.text ?? ''

  switch (w.type) {
    case 'button':
      return {
        render: () =>
          h(
            'button',
            {
              style: {
                ...style,
                border: '1px solid transparent',
                background: w.style?.background || '#409eff',
                color: w.style?.color || '#fff',
                borderRadius: `${w.style?.borderRadius ?? 4}px`,
                justifyContent: 'center',
                cursor: 'default'
              }
            },
            text || '按钮'
          )
      }
    case 'text':
      return {
        render: () =>
          h('div', { style: { ...style, display: 'block', lineHeight: 1.5, padding: '4px 0' } }, text || '文本')
      }
    case 'link':
      return {
        render: () =>
          h(
            'span',
            { style: { ...style, color: w.style?.color || '#409eff', textDecoration: w.style?.textDecoration || 'none' } },
            text || '链接'
          )
      }
    case 'image':
      return {
        render: () =>
          h(
            'div',
            {
              style: {
                ...style,
                justifyContent: 'center',
                background: '#f3f4f6',
                border: '1px dashed #d1d5db',
                color: '#9ca3af',
                fontSize: '12px',
                padding: 0
              }
            },
            w.props?.src
              ? h('img', {
                  src: w.props.src,
                  style: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }
                })
              : '图片占位'
          )
      }
    case 'input':
      return {
        render: () =>
          h('div', {
            style: {
              ...style,
              border: '1px solid #dcdfe6',
              borderRadius: '4px',
              background: '#fff',
              color: '#c0c4cc',
              padding: '0 12px'
            }
          }, w.props?.value || w.props?.placeholder || '请输入')
      }
    case 'textarea':
      return {
        render: () =>
          h(
            'div',
            {
              style: {
                ...style,
                border: '1px solid #dcdfe6',
                borderRadius: '4px',
                background: '#fff',
                color: '#c0c4cc',
                alignItems: 'flex-start',
                padding: '8px 12px'
              }
            },
            w.props?.value || w.props?.placeholder || '请输入多行文本'
          )
      }
    case 'select':
      return {
        render: () =>
          h(
            'div',
            {
              style: {
                ...style,
                border: '1px solid #dcdfe6',
                borderRadius: '4px',
                background: '#fff',
                justifyContent: 'space-between',
                padding: '0 12px',
                color: '#a8abb2'
              }
            },
            [h('span', w.props?.placeholder || '请选择'), h('span', '▾')]
          )
      }
    case 'checkbox':
      return {
        render: () =>
          h('div', { style: { ...style, gap: '6px', justifyContent: 'flex-start' } }, [
            h('span', {
              style: {
                width: '14px',
                height: '14px',
                border: '1px solid #dcdfe6',
                borderRadius: '2px',
                background: w.props?.checked ? '#409eff' : '#fff',
                flexShrink: 0
              }
            }),
            h('span', text || '复选框')
          ])
      }
    case 'radio':
      return {
        render: () =>
          h('div', { style: { ...style, gap: '6px', justifyContent: 'flex-start' } }, [
            h('span', {
              style: {
                width: '14px',
                height: '14px',
                border: '1px solid #dcdfe6',
                borderRadius: '50%',
                background: w.props?.checked ? '#409eff' : '#fff',
                flexShrink: 0
              }
            }),
            h('span', text || '单选')
          ])
      }
    case 'switch':
      return {
        render: () =>
          h('div', { style: { ...style, gap: '8px', justifyContent: 'flex-start' } }, [
            h('span', {
              style: {
                width: '40px',
                height: '20px',
                borderRadius: '10px',
                background: w.props?.checked ? '#409eff' : '#d1d5db',
                position: 'relative',
                flexShrink: 0
              }
            }, [
              h('span', {
                style: {
                  position: 'absolute',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#fff',
                  top: '2px',
                  left: w.props?.checked ? '22px' : '2px'
                }
              })
            ]),
            h('span', text || '开关')
          ])
      }
    case 'tag':
      return {
        render: () =>
          h(
            'span',
            {
              style: {
                ...style,
                justifyContent: 'center',
                background: w.style?.background || '#ecf5ff',
                color: w.style?.color || '#409eff',
                border: '1px solid #d9ecff',
                borderRadius: `${w.style?.borderRadius ?? 4}px`,
                fontSize: `${w.style?.fontSize || 12}px`
              }
            },
            text || '标签'
          )
      }
    case 'divider':
      return {
        render: () =>
          h('div', {
            style: {
              ...style,
              padding: 0,
              border: 'none',
              borderTop: '1px solid #e5e7eb',
              height: '0',
              alignSelf: 'center',
              marginTop: `${Math.max(0, (w.height - 1) / 2)}px`
            }
          })
      }
    case 'card':
      return {
        render: () =>
          h(
            'div',
            {
              style: {
                ...style,
                display: 'block',
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,.06)',
                alignItems: 'stretch'
              }
            },
            [
              h('div', { style: { fontWeight: w.style?.fontWeight || 600, marginBottom: '8px' } }, w.props?.title || '卡片标题'),
              h('div', { style: { color: '#6b7280', fontSize: '13px' } }, w.props?.content || '卡片内容')
            ]
          )
      }
    case 'table': {
      const columns = w.props?.columns || ['列1', '列2', '列3']
      const rows = w.props?.rows || []
      return {
        render: () =>
          h(
            'div',
            { style: { ...style, display: 'block', padding: 0, background: '#fff' } },
            h('table', {
              style: { width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: '12px' }
            }, [
              h('thead', [
                h(
                  'tr',
                  columns.map((c) =>
                    h('th', {
                      style: {
                        border: '1px solid #e5e7eb',
                        padding: '6px 8px',
                        background: '#f9fafb',
                        textAlign: 'left'
                      }
                    }, c)
                  )
                )
              ]),
              h(
                'tbody',
                rows.map((r) =>
                  h(
                    'tr',
                    (Array.isArray(r) ? r : []).map((c) =>
                      h('td', { style: { border: '1px solid #e5e7eb', padding: '6px 8px' } }, String(c))
                    )
                  )
                )
              )
            ])
          )
      }
    }
    case 'tabs': {
      const tabs = w.props?.tabs || ['标签一', '标签二']
      const active = Number(w.props?.active || 0)
      return {
        render: () =>
          h(
            'div',
            {
              style: {
                ...style,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                padding: 0,
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                justifyContent: 'flex-start'
              }
            },
            [
              h(
                'div',
                {
                  style: {
                    display: 'flex',
                    height: '36px',
                    borderBottom: '1px solid #e5e7eb',
                    flexShrink: 0
                  }
                },
                tabs.map((t, i) =>
                  h(
                    'span',
                    {
                      style: {
                        padding: '0 14px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '13px',
                        color: i === active ? '#409eff' : '#6b7280',
                        borderBottom: i === active ? '2px solid #409eff' : '2px solid transparent'
                      }
                    },
                    t
                  )
                )
              ),
              h(
                'div',
                { style: { padding: '12px', color: '#6b7280', fontSize: '13px', flex: 1 } },
                w.props?.content || '标签内容区域'
              )
            ]
          )
      }
    }
    case 'alert':
    case 'dialog':
    case 'loading':
    case 'message':
    case 'messagebox':
      return { render: () => h('div', { style: { ...style, padding: 0, display: 'block' }, innerHTML: renderFeedbackHtml(w) }) }
    case 'progress': {
      const pct = Number(w.props?.percentage ?? 50)
      return {
        render: () =>
          h('div', { style: { ...style, gap: '8px', padding: '0 4px' } }, [
            h(
              'div',
              {
                style: {
                  flex: 1,
                  height: '8px',
                  background: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }
              },
              h('div', {
                style: { width: `${pct}%`, height: '100%', background: '#409eff' }
              })
            ),
            h('span', { style: { fontSize: '12px', color: '#6b7280', flexShrink: 0 } }, `${pct}%`)
          ])
      }
    }
    case 'avatar':
      return {
        render: () =>
          h(
            'div',
            {
              style: {
                ...style,
                justifyContent: 'center',
                borderRadius: '50%',
                background: w.style?.background || '#c0c4cc',
                color: w.style?.color || '#fff',
                padding: 0
              }
            },
            w.props?.text || 'U'
          )
      }
    case 'number':
      return { render: () => h(ElInputNumber, { modelValue: Number(w.props.value), min: w.props.min, max: w.props.max, style: { width: '100%', height: '100%' } }) }
    case 'slider':
      return { render: () => h('div', { style: { ...style, padding: '0 12px' } }, [h(ElSlider, { modelValue: Number(w.props.value), min: w.props.min, max: w.props.max })]) }
    case 'rate':
      return { render: () => h(ElRate, { modelValue: Number(w.props.value), style: { height: '100%' } }) }
    case 'date':
    case 'time':
      return { render: () => h(w.type === 'date' ? ElDatePicker : ElTimePicker, { modelValue: w.props.value || '', placeholder: w.props.placeholder, valueFormat: w.type === 'date' ? 'YYYY-MM-DD' : 'HH:mm:ss', style: { width: '100%', height: '100%' } }) }
    case 'pagination':
      return { render: () => h(ElPagination, { total: w.props.total, pageSize: w.props.pageSize, currentPage: w.props.currentPage, 'onUpdate:currentPage': () => {}, pagerCount: 5, layout: 'prev, pager, next', background: true, style: { height: '100%' } }) }
    case 'breadcrumb':
      return { render: () => h(ElBreadcrumb, { separator: '/', style: { ...style, padding: 0 } }, { default: () => w.props.items.map(item => h(ElBreadcrumbItem, {}, { default: () => item })) }) }
    case 'steps':
      return { render: () => h(ElSteps, { active: Number(w.props.active), style: { width: '100%', height: '100%' } }, { default: () => w.props.items.map(item => h(ElStep, { title: item })) }) }
    case 'container':
      return {
        render: () =>
          h('div', {
            style: {
              ...style,
              background: w.style?.background || '#fafafa',
              border: '1px dashed #d1d5db',
              borderRadius: '4px',
              padding: 0
            }
          })
      }
    default:
      return { render: () => h('div', { style }, text || w.type) }
  }
}

</script>

<style>
.prototype-loading-spinner { width:32px; height:32px; border:3px solid #d9ecff; border-top-color:#409eff; border-radius:50%; animation:prototype-spin 1s linear infinite; }
@keyframes prototype-spin { to { transform:rotate(360deg); } }
</style>
