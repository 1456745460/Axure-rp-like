export function snapPosition(widget, x, y, page, threshold = 5) {
  const others = page.widgets.filter(w => w.id !== widget.id)
  const snapAxis = (start, size, axis, dimension, limit) => {
    const anchors = [0, limit / 2, limit]
    for (const w of others) anchors.push(w[axis], w[axis] + w[dimension] / 2, w[axis] + w[dimension])
    let best = threshold + 1
    let result = start
    let guide = null
    for (const offset of [0, size / 2, size]) {
      for (const anchor of anchors) {
        const distance = Math.abs(start + offset - anchor)
        if (distance < best && distance <= threshold) {
          best = distance
          result = anchor - offset
          guide = anchor
        }
      }
    }
    return { value: Math.round(result), guide }
  }
  const horizontal = snapAxis(x, widget.width, 'x', 'width', page.width)
  const vertical = snapAxis(y, widget.height, 'y', 'height', page.height)
  return { x: horizontal.value, y: vertical.value, guideX: horizontal.guide, guideY: vertical.guide }
}

const labels = { text: '文本', title: '标题', content: '内容', placeholder: '占位符', src: '图片地址',
  href: '链接地址', value: '值', checked: '选中', options: '选项（每行一个）', tabs: '标签（每行一个）',
  columns: '表头（逗号分隔）', rows: '表格数据（每行一条，列用制表符分隔）', items: '项目（每行一个）',
  percentage: '进度 %', active: '当前步骤 / 标签（从 0 开始）', min: '最小值', max: '最大值',
  total: '总条数', pageSize: '每页条数', currentPage: '当前页', name: '单选组名称', variant: '提示类型（success/info/warning/error）', description: '说明', confirmText: '确认按钮文字', cancelText: '取消按钮文字' }

export function editableFields(widget) {
  const props = widget.props || {}
  return Object.keys(props).map(key => ({
    key, label: labels[key] || key,
    type: typeof props[key] === 'boolean' ? 'checkbox' : typeof props[key] === 'number' ? 'number' : 'text',
    multiline: Array.isArray(props[key]) || ['text', 'content', 'placeholder'].includes(key),
    value: Array.isArray(props[key])
      ? key === 'rows' ? props[key].map(row => row.join('\t')).join('\n') : props[key].join(key === 'columns' ? ',' : '\n')
      : props[key]
  }))
}

export function parseField(key, value, original) {
  if (Array.isArray(original)) {
    if (key === 'rows') return value.split('\n').map(row => row.split('\t'))
    return value.split(key === 'columns' ? /[,，]/ : '\n')
  }
  if (typeof original === 'number') return Number(value) || 0
  return value
}

export function isTextInput(target) {
  return !!target?.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]')
}

export function paginationState(total, pageSize, currentPage) {
  const count = Math.max(1, Math.ceil((Number(total) || 0) / Math.max(1, Number(pageSize) || 10)))
  const current = Math.max(1, Math.min(Number(currentPage) || 1, count))
  const start = Math.max(1, Math.min(current - 2, count - 6))
  return { count, current, pages: Array.from({ length: Math.min(7, count) }, (_, i) => start + i) }
}

export function widgetBounds(widgets) {
  if (!widgets.length) return null
  const x = Math.min(...widgets.map(w => w.x))
  const y = Math.min(...widgets.map(w => w.y))
  return { x, y, width: Math.max(...widgets.map(w => w.x + w.width)) - x,
    height: Math.max(...widgets.map(w => w.y + w.height)) - y }
}

export function widgetsInRect(widgets, rect) {
  return widgets.filter(w => w.x < rect.x + rect.width && w.x + w.width > rect.x &&
    w.y < rect.y + rect.height && w.y + w.height > rect.y).map(w => w.id)
}

export function tableColumnWidths(widget) {
  const columns = widget.props.columns || []
  if (!columns.length) return []
  const raw = columns.map((_, index) => Math.max(40, Number(widget.props.columnWidths?.[index]) || widget.width / columns.length))
  const total = raw.reduce((sum, width) => sum + width, 0)
  return raw.map(width => width * widget.width / total)
}
