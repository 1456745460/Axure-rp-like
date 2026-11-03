import { defineStore } from 'pinia'
import { uid } from '../utils/id.js'
import { widgetBounds, tableColumnWidths } from '../utils/editor.js'

const clone = (value) => JSON.parse(JSON.stringify(value))

const DEFAULT_PAGE_SIZE = { width: 1440, height: 900 }

function createPage(name = '首页') {
  return {
    id: uid('page'),
    name,
    width: DEFAULT_PAGE_SIZE.width,
    height: DEFAULT_PAGE_SIZE.height,
    widgets: []
  }
}

function createDefaultProject() {
  const page = createPage('首页')
  return {
    id: null,
    name: '未命名项目',
    tree: [
      {
        id: uid('node'),
        type: 'page',
        label: page.name,
        pageId: page.id,
        children: []
      }
    ],
    pages: [page],
    currentPageId: page.id,
    selectedWidgetId: null,
    selectedWidgetIds: [],
    updatedAt: null
  }
}

/** 组件库定义：可拖到画布 */
export const COMPONENT_LIBRARY = [
  {
    group: '基础',
    items: [
      { type: 'button', label: '按钮', icon: 'Pointer', defaultProps: { text: '按钮' }, defaultSize: { width: 96, height: 36 }, defaultStyle: { background: '#409eff', color: '#ffffff', borderRadius: 4, fontSize: 14, textAlign: 'center' } },
      { type: 'text', label: '文本', icon: 'Document', defaultProps: { text: '文本内容' }, defaultSize: { width: 160, height: 32 }, defaultStyle: { fontSize: 14, color: '#303133', textAlign: 'left' } },
      { type: 'link', label: '链接', icon: 'Link', defaultProps: { text: '链接文字', href: '#' }, defaultSize: { width: 100, height: 28 }, defaultStyle: { fontSize: 14, color: '#409eff' } },
      { type: 'image', label: '图片', icon: 'Picture', defaultProps: { src: '' }, defaultSize: { width: 200, height: 140 }, defaultStyle: {} },
      { type: 'arrow', label: '箭头', icon: 'Right', defaultProps: { startX: 0, startY: 0.5, endX: 1, endY: 0.5, strokeWidth: 3 }, defaultSize: { width: 180, height: 48 }, defaultStyle: { color: '#303133' } },
      { type: 'icon', label: '图标', icon: 'Star', defaultProps: { icon: 'Picture' }, defaultSize: { width: 40, height: 40 }, defaultStyle: { color: '#409eff' } },
      { type: 'tag', label: '标签', icon: 'PriceTag', defaultProps: { text: '标签' }, defaultSize: { width: 64, height: 28 }, defaultStyle: { fontSize: 12, borderRadius: 4 } },
      { type: 'divider', label: '分割线', icon: 'Minus', defaultProps: {}, defaultSize: { width: 320, height: 16 }, defaultStyle: {} },
      { type: 'avatar', label: '头像', icon: 'User', defaultProps: { text: 'U' }, defaultSize: { width: 48, height: 48 }, defaultStyle: {} }
    ]
  },
  {
    group: '表单',
    items: [
      { type: 'input', label: '输入框', icon: 'EditPen', defaultProps: { placeholder: '请输入', value: '' }, defaultSize: { width: 220, height: 36 }, defaultStyle: { fontSize: 14 } },
      { type: 'textarea', label: '多行输入', icon: 'Edit', defaultProps: { placeholder: '请输入多行文本', value: '' }, defaultSize: { width: 280, height: 96 }, defaultStyle: { fontSize: 14 } },
      { type: 'number', label: '数字输入', icon: 'Plus', defaultProps: { value: 1, min: 0, max: 100 }, defaultSize: { width: 180, height: 36 }, defaultStyle: {} },
      { type: 'slider', label: '滑块', icon: 'Operation', defaultProps: { value: 40, min: 0, max: 100 }, defaultSize: { width: 240, height: 36 }, defaultStyle: {} },
      { type: 'rate', label: '评分', icon: 'Star', defaultProps: { value: 3 }, defaultSize: { width: 180, height: 36 }, defaultStyle: {} },
      { type: 'date', label: '日期选择', icon: 'Calendar', defaultProps: { placeholder: '请选择日期', value: '' }, defaultSize: { width: 220, height: 36 }, defaultStyle: {} },
      { type: 'time', label: '时间选择', icon: 'Clock', defaultProps: { placeholder: '请选择时间', value: '' }, defaultSize: { width: 200, height: 36 }, defaultStyle: {} },
      { type: 'select', label: '下拉选择', icon: 'ArrowDown', defaultProps: { placeholder: '请选择', options: ['选项一', '选项二', '选项三'] }, defaultSize: { width: 220, height: 36 }, defaultStyle: { fontSize: 14 } },
      { type: 'checkbox', label: '复选框', icon: 'Select', defaultProps: { text: '复选框', checked: false }, defaultSize: { width: 120, height: 32 }, defaultStyle: { fontSize: 14 } },
      { type: 'radio', label: '单选框', icon: 'CircleCheck', defaultProps: { text: '单选', checked: false, name: 'radio1' }, defaultSize: { width: 100, height: 32 }, defaultStyle: { fontSize: 14 } },
      { type: 'switch', label: '开关', icon: 'Open', defaultProps: { text: '开关', checked: false }, defaultSize: { width: 100, height: 32 }, defaultStyle: { fontSize: 14 } }
    ]
  },
  {
    group: '数据与布局',
    items: [
      { type: 'card', label: '卡片', icon: 'Postcard', defaultProps: { title: '卡片标题', content: '这里是卡片内容描述。' }, defaultSize: { width: 280, height: 140 }, defaultStyle: {} },
      { type: 'table', label: '表格', icon: 'Grid', defaultProps: { columns: ['姓名', '年龄', '城市'], rows: [['张三', '28', '上海'], ['李四', '32', '北京'], ['王五', '25', '深圳']] }, defaultSize: { width: 480, height: 180 }, defaultStyle: {} },
      { type: 'tabs', label: '标签页', icon: 'Files', defaultProps: { tabs: ['标签一', '标签二', '标签三'], active: 0, content: '标签内容区域' }, defaultSize: { width: 360, height: 160 }, defaultStyle: {} },
      { type: 'alert', label: 'Alert 提示', icon: 'Warning', defaultProps: { text: '这是一条提示信息', variant: 'success', description: '' }, defaultSize: { width: 320, height: 40 }, defaultStyle: { borderRadius: 4 } },
      { type: 'progress', label: '进度条', icon: 'Odometer', defaultProps: { percentage: 60 }, defaultSize: { width: 260, height: 28 }, defaultStyle: {} },
      { type: 'pagination', label: '分页', icon: 'More', defaultProps: { total: 100, pageSize: 10, currentPage: 1 }, defaultSize: { width: 380, height: 40 }, defaultStyle: {} },
      { type: 'breadcrumb', label: '面包屑', icon: 'ArrowRight', defaultProps: { items: ['首页', '列表', '详情'] }, defaultSize: { width: 300, height: 32 }, defaultStyle: {} },
      { type: 'steps', label: '步骤条', icon: 'Guide', defaultProps: { items: ['步骤一', '步骤二', '步骤三'], active: 1 }, defaultSize: { width: 420, height: 80 }, defaultStyle: {} },
      { type: 'container', label: '容器', icon: 'FullScreen', defaultProps: {}, defaultSize: { width: 360, height: 200 }, defaultStyle: { background: '#fafafa' } }
    ]
  },
  {
    group: '反馈与弹层',
    items: [
      { type: 'dialog', label: 'Dialog 对话框', icon: 'CopyDocument', defaultProps: { title: '对话框标题', content: '这里是对话框内容。', cancelText: '取消', confirmText: '确定' }, defaultSize: { width: 420, height: 220 }, defaultStyle: {} },
      { type: 'loading', label: 'Loading 加载', icon: 'Loading', defaultProps: { text: '加载中…' }, defaultSize: { width: 240, height: 160 }, defaultStyle: {} },
      { type: 'message', label: 'Message 消息', icon: 'ChatDotRound', defaultProps: { text: '这是一条消息提示', variant: 'success' }, defaultSize: { width: 320, height: 48 }, defaultStyle: {} },
      { type: 'messagebox', label: 'MessageBox 消息框', icon: 'ChatSquare', defaultProps: { title: '提示', content: '确定执行此操作吗？', cancelText: '取消', confirmText: '确定' }, defaultSize: { width: 420, height: 180 }, defaultStyle: {} }
    ]
  }
]

function findLibraryItem(type) {
  for (const g of COMPONENT_LIBRARY) {
    const item = g.items.find((i) => i.type === type)
    if (item) return item
  }
  return null
}

function walkTree(nodes, visitor, parent = null) {
  for (const node of nodes || []) {
    visitor(node, parent)
    if (node.children?.length) walkTree(node.children, visitor, node)
  }
}

function findTreeNode(nodes, id) {
  for (const node of nodes || []) {
    if (node.id === id) return node
    const found = findTreeNode(node.children, id)
    if (found) return found
  }
  return null
}

function removeTreeNode(nodes, id) {
  const list = nodes || []
  const idx = list.findIndex((n) => n.id === id)
  if (idx >= 0) {
    const [removed] = list.splice(idx, 1)
    return removed
  }
  for (const n of list) {
    if (n.children?.length) {
      const removed = removeTreeNode(n.children, id)
      if (removed) return removed
    }
  }
  return null
}

function collectPageIds(nodes, out = []) {
  walkTree(nodes, (node) => {
    if (node.type === 'page' && node.pageId) out.push(node.pageId)
  })
  return out
}

const projectOptions = {
  state: () => ({ ...createDefaultProject(), _past: [], _future: [], _transaction: null, _transactionDepth: 0, _revision: 0, _epoch: 0 }),

  getters: {
    canUndo: (state) => state._past.length > 0,
    canRedo: (state) => state._future.length > 0,
    currentPage(state) {
      return state.pages.find((p) => p.id === state.currentPageId) || null
    },
    selectedWidget(state) {
      const page = state.pages.find((p) => p.id === state.currentPageId)
      if (!page) return null
      return page.widgets.find((w) => w.id === state.selectedWidgetId) || null
    },
    selectedWidgets() {
      const ids = this.selectedWidgetIds.length ? this.selectedWidgetIds : [this.selectedWidgetId]
      return (this.currentPage?.widgets || []).filter(w => ids.includes(w.id))
    },
    pageCount(state) {
      return state.pages.length
    }
  },

  actions: {
    snapshot() {
      return clone({ name: this.name, tree: this.tree, pages: this.pages,
        currentPageId: this.currentPageId, selectedWidgetId: this.selectedWidgetId, selectedWidgetIds: this.selectedWidgetIds })
    },
    remember(before) {
      if (JSON.stringify(before) === JSON.stringify(this.snapshot())) return
      this._past.push(before)
      if (this._past.length > 60) this._past.shift()
      this._future = []
      this._revision++
    },
    beginTransaction() {
      if (!this._transactionDepth) this._transaction = this.snapshot()
      this._transactionDepth++
    },
    endTransaction() {
      if (!this._transactionDepth) return
      this._transactionDepth--
      if (!this._transactionDepth) {
        const before = this._transaction
        this._transaction = null
        this.remember(before)
      }
    },
    undo() {
      if (!this._past.length || this._transactionDepth) return
      this._future.push(this.snapshot())
      Object.assign(this, this._past.pop())
      this._revision++
    },
    redo() {
      if (!this._future.length || this._transactionDepth) return
      this._past.push(this.snapshot())
      Object.assign(this, this._future.pop())
      this._revision++
    },
    clearHistory() {
      this._past = []
      this._future = []
      this._transaction = null
      this._transactionDepth = 0
    },
    reset() {
      Object.assign(this, createDefaultProject())
      this.clearHistory()
      this._epoch++
      this._revision++
    },

    loadProject(data) {
      if (!data) return
      this.id = data.id ?? null
      this.name = data.name || '未命名项目'
      this.tree = data.tree || []
      this.pages = data.pages || []
      // Older projects may contain negative layers from the former send-to-back action.
      for (const page of this.pages) {
        ;[...(page.widgets || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
          .forEach((widget, index) => { widget.zIndex = index + 1 })
      }
      this.currentPageId = data.currentPageId || this.pages[0]?.id || null
      this.clearSelection()
      this.updatedAt = data.updatedAt || null
      this.clearHistory()
      this._epoch++
    },

    toJSON() {
      return {
        id: this.id,
        name: this.name,
        tree: JSON.parse(JSON.stringify(this.tree)),
        pages: JSON.parse(JSON.stringify(this.pages)),
        currentPageId: this.currentPageId,
        updatedAt: this.updatedAt
      }
    },

    setName(name) {
      this.name = name || '未命名项目'
    },

    selectPage(pageId) {
      if (!this.pages.find((p) => p.id === pageId)) return
      this.currentPageId = pageId
      this.clearSelection()
    },

    selectWidget(widgetId, { additive = false, toggle = false } = {}) {
      const ids = additive ? this.selectedWidgets.map(w => w.id) : []
      if (toggle && ids.includes(widgetId)) this.selectWidgets(ids.filter(id => id !== widgetId))
      else this.selectWidgets([...ids, widgetId])
    },
    selectWidgets(ids) {
      const valid = new Set(this.currentPage?.widgets.map(w => w.id) || [])
      this.selectedWidgetIds = [...new Set(ids)].filter(id => valid.has(id))
      this.selectedWidgetId = this.selectedWidgetIds.at(-1) || null
    },
    selectAllWidgets() { this.selectWidgets(this.currentPage?.widgets.map(w => w.id) || []) },
    clearSelection() {
      this.selectedWidgetId = null
      this.selectedWidgetIds = []
    },
    moveSelectedWidgets(dx, dy) {
      for (const widget of this.selectedWidgets) this.moveWidget(widget.id, widget.x + dx, widget.y + dy)
    },
    removeSelectedWidgets() {
      for (const widget of this.selectedWidgets) this.removeWidget(widget.id)
      this.clearSelection()
    },
    duplicateSelectedWidgets() {
      return this.pasteWidgets(this.selectedWidgets)
    },

    /** 目录：新增文件夹 */
    addFolder(parentId = null, label = '新建文件夹') {
      const node = {
        id: uid('node'),
        type: 'folder',
        label,
        children: []
      }
      if (!parentId) {
        this.tree.push(node)
      } else {
        const parent = findTreeNode(this.tree, parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        } else {
          this.tree.push(node)
        }
      }
      return node
    },

    /** 目录：新增页面 */
    addPage(parentId = null, name = '新页面') {
      const page = createPage(name)
      this.pages.push(page)
      const node = {
        id: uid('node'),
        type: 'page',
        label: name,
        pageId: page.id,
        children: []
      }
      if (!parentId) {
        this.tree.push(node)
      } else {
        const parent = findTreeNode(this.tree, parentId)
        if (parent && parent.type === 'folder') {
          parent.children = parent.children || []
          parent.children.push(node)
        } else {
          this.tree.push(node)
        }
      }
      this.currentPageId = page.id
      this.clearSelection()
      return { page, node }
    },

    moveTreeNode(nodeId, targetId, position = 'inner') {
      const node = findTreeNode(this.tree, nodeId)
      const target = findTreeNode(this.tree, targetId)
      if (!node || !target || node === target || findTreeNode(node.children, targetId)) return
      if (position === 'inner' && target.type !== 'folder') return
      if (!['inner', 'before', 'after'].includes(position)) return
      removeTreeNode(this.tree, nodeId)
      if (position === 'inner') {
        target.children ||= []
        target.children.push(node)
      } else {
        let siblings = this.tree
        walkTree(this.tree, (item, parent) => {
          if (item.id === targetId && parent) siblings = parent.children
        })
        const index = siblings.findIndex(item => item.id === targetId)
        siblings.splice(index + (position === 'after' ? 1 : 0), 0, node)
      }
    },

    renameTreeNode(nodeId, label) {
      const node = findTreeNode(this.tree, nodeId)
      if (!node) return
      node.label = label
      if (node.type === 'page' && node.pageId) {
        const page = this.pages.find((p) => p.id === node.pageId)
        if (page) page.name = label
      }
    },

    deleteTreeNode(nodeId) {
      const node = findTreeNode(this.tree, nodeId)
      if (!node) return
      const pageIds = []
      if (node.type === 'page' && node.pageId) pageIds.push(node.pageId)
      collectPageIds(node.children || [], pageIds)

      removeTreeNode(this.tree, nodeId)
      if (pageIds.length) {
        this.pages = this.pages.filter((p) => !pageIds.includes(p.id))
      }
      if (!this.pages.find((p) => p.id === this.currentPageId)) {
        this.currentPageId = this.pages[0]?.id || null
      }
      this.clearSelection()

      // 保证至少一页
      if (this.pages.length === 0) {
        const { page, node: n } = this.addPage(null, '首页')
        this.currentPageId = page.id
        return n
      }
    },

    updatePageSize(pageId, width, height) {
      const page = this.pages.find((p) => p.id === pageId)
      if (!page) return
      if (width) page.width = Math.max(320, Number(width) || page.width)
      if (height) page.height = Math.max(240, Number(height) || page.height)
    },

    addWidgetFromLibrary(type, x, y, { centered = false } = {}) {
      const page = this.currentPage
      if (!page) return null
      const lib = findLibraryItem(type)
      if (!lib) return null
      const widget = {
        id: uid('w'),
        type: lib.type,
        name: lib.label,
        x: Math.round(x - (centered ? lib.defaultSize.width / 2 : 0)),
        y: Math.round(y - (centered ? lib.defaultSize.height / 2 : 0)),
        width: lib.defaultSize.width,
        height: lib.defaultSize.height,
        zIndex: Math.max(0, ...page.widgets.map(w => w.zIndex || 0)) + 1,
        props: clone(lib.defaultProps),
        style: { ...lib.defaultStyle }
      }
      // 防止越界
      widget.x = Math.max(0, Math.min(widget.x, page.width - widget.width))
      widget.y = Math.max(0, Math.min(widget.y, page.height - widget.height))
      page.widgets.push(widget)
      this.selectWidget(widget.id)
      return widget
    },

    addImageWidget(src, naturalWidth, naturalHeight, x, y) {
      if (!this.currentPage) return null
      const page = this.currentPage
      const scale = Math.min(1, 640 / naturalWidth, 480 / naturalHeight,
        page.width / naturalWidth, page.height / naturalHeight)
      const width = Math.max(1, Math.round(naturalWidth * scale))
      const height = Math.max(1, Math.round(naturalHeight * scale))
      const widget = this.addWidgetFromLibrary('image', 0, 0)
      this.updateWidget(widget.id, { width, height,
        x: Math.max(0, Math.min(Math.round(x - width / 2), page.width - width)),
        y: Math.max(0, Math.min(Math.round(y - height / 2), page.height - height)),
        props: { src } })
      return widget
    },

    pasteWidget(data, point) { return this.pasteWidgets([data], point)?.[0] },
    pasteWidgets(data, point) {
      const page = this.currentPage
      const originals = (Array.isArray(data) ? data : []).filter(w => findLibraryItem(w?.type))
      if (!page || !originals.length) return []
      const bounds = widgetBounds(originals)
      const x = point ? Math.max(0, Math.min(point.x - bounds.width / 2, page.width - bounds.width)) : bounds.x + 16
      const y = point ? Math.max(0, Math.min(point.y - bounds.height / 2, page.height - bounds.height)) : bounds.y + 16
      const maxZ = Math.max(0, ...page.widgets.map(w => w.zIndex || 0))
      const layers = [...originals].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      const copies = originals.map((original, index) => ({ ...clone(original), id: uid('w'),
        x: Math.round(x + original.x - bounds.x), y: Math.round(y + original.y - bounds.y), zIndex: maxZ + layers.indexOf(original) + 1 }))
      page.widgets.push(...copies)
      this.selectWidgets(copies.map(w => w.id))
      return copies
    },

    updateTableCell(widgetId, row, column, value) {
      const widget = this.currentPage?.widgets.find(w => w.id === widgetId && w.type === 'table')
      if (!widget || column < 0 || column >= widget.props.columns.length) return
      if (row === -1) {
        const columns = [...widget.props.columns]
        columns[column] = value
        this.updateWidget(widgetId, { props: { columns } })
      } else {
        const rows = clone(widget.props.rows || [])
        if (!rows[row]) return
        rows[row][column] = value
        this.updateWidget(widgetId, { props: { rows } })
      }
    },
    insertTableRow(widgetId, afterIndex) {
      const widget = this.currentPage?.widgets.find(w => w.id === widgetId && w.type === 'table')
      if (!widget) return
      const rows = clone(widget.props.rows || [])
      const rowHeight = widget.height / Math.max(2, rows.length + 1)
      rows.splice(afterIndex + 1, 0, widget.props.columns.map(() => ''))
      this.updateWidget(widgetId, { height: Math.round(Math.max(widget.height, (rows.length + 1) * rowHeight)), props: { rows } })
    },
    deleteTableRow(widgetId, rowIndex) {
      const widget = this.currentPage?.widgets.find(w => w.id === widgetId && w.type === 'table')
      if (!widget) return
      const rows = clone(widget.props.rows || [])
      if (rowIndex < 0 || rowIndex >= rows.length) return
      const rowHeight = widget.height / (rows.length + 1)
      rows.splice(rowIndex, 1)
      this.updateWidget(widgetId, { height: Math.max(72, Math.round((rows.length + 1) * rowHeight)), props: { rows } })
    },
    resizeTableColumn(widgetId, column, delta) {
      const widget = this.currentPage?.widgets.find(w => w.id === widgetId && w.type === 'table')
      if (!widget) return
      const widths = tableColumnWidths(widget)
      if (column < 0 || column >= widths.length) return
      let change = Math.max(40 - widths[column], Number(delta) || 0)
      if (column < widths.length - 1) change = Math.min(change, widths[column + 1] - 40)
      widths[column] += change
      if (column < widths.length - 1) widths[column + 1] -= change
      this.updateWidget(widgetId, { width: widths.reduce((sum, width) => sum + width, 0), props: { columnWidths: widths } })
    },
    setTableColumns(widgetId, columns) {
      const widget = this.currentPage?.widgets.find(w => w.id === widgetId && w.type === 'table')
      if (!widget || !columns.length) return
      const old = widget.props.columns || []
      const widths = tableColumnWidths(widget)
      const used = new Set()
      const indices = columns.map(label => {
        const index = old.findIndex((name, i) => name === label && !used.has(i))
        if (index >= 0) used.add(index)
        return index
      })
      indices.forEach((index, position) => {
        if (index < 0 && position < old.length && !used.has(position)) {
          indices[position] = position
          used.add(position)
        }
      })
      const rows = (widget.props.rows || []).map(row => indices.map(index => index < 0 ? '' : row[index] ?? ''))
      const columnWidths = indices.map(index => index < 0 ? 160 : widths[index])
      this.updateWidget(widgetId, { width: columnWidths.reduce((sum, width) => sum + width, 0), props: { columns, rows, columnWidths } })
    },

    updateWidget(widgetId, patch) {
      const page = this.currentPage
      if (!page) return
      const w = page.widgets.find((i) => i.id === widgetId)
      if (!w) return
      if (patch.props) w.props = { ...w.props, ...patch.props }
      if (patch.style) w.style = { ...w.style, ...patch.style }
      const keys = ['x', 'y', 'width', 'height', 'zIndex', 'name']
      for (const k of keys) {
        if (patch[k] !== undefined) w[k] = patch[k]
      }
    },

    moveWidget(widgetId, x, y) {
      this.updateWidget(widgetId, { x, y })
    },

    resizeWidget(widgetId, width, height) {
      this.updateWidget(widgetId, {
        width: Math.max(24, width),
        height: Math.max(16, height)
      })
    },

    removeWidget(widgetId) {
      const page = this.currentPage
      if (!page) return
      page.widgets = page.widgets.filter((w) => w.id !== widgetId)
      this.selectWidgets(this.selectedWidgets.filter(w => w.id !== widgetId).map(w => w.id))
    },

    bringToFront(widgetId) {
      const page = this.currentPage
      if (!page) return
      const maxZ = Math.max(0, ...page.widgets.map((w) => w.zIndex || 0))
      this.updateWidget(widgetId, { zIndex: maxZ + 1 })
    },

    sendToBack(widgetId) {
      const page = this.currentPage
      if (!page) return
      const widget = page.widgets.find(w => w.id === widgetId)
      if (!widget) return
      const ordered = page.widgets.filter(w => w.id !== widgetId).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      ;[widget, ...ordered].forEach((w, index) => { w.zIndex = index + 1 })
    },

    duplicateWidget(widgetId) {
      const page = this.currentPage
      if (!page) return
      const w = page.widgets.find((i) => i.id === widgetId)
      if (!w) return
      const copy = {
        ...JSON.parse(JSON.stringify(w)),
        id: uid('w'),
        x: w.x + 16,
        y: w.y + 16,
        zIndex: Math.max(0, ...page.widgets.map(w => w.zIndex || 0)) + 1
      }
      page.widgets.push(copy)
      this.selectWidget(copy.id)
      return copy
    }
  }
}

// Centralize history around public edits; nested actions form one undo step.
const historyActions = ['setName', 'addFolder', 'addPage', 'renameTreeNode', 'deleteTreeNode',
  'moveTreeNode', 'updatePageSize', 'addWidgetFromLibrary', 'addImageWidget', 'pasteWidget',
  'pasteWidgets', 'moveSelectedWidgets', 'removeSelectedWidgets', 'duplicateSelectedWidgets',
  'updateTableCell', 'insertTableRow', 'deleteTableRow', 'resizeTableColumn', 'setTableColumns',
  'updateWidget', 'moveWidget', 'resizeWidget', 'removeWidget', 'bringToFront', 'sendToBack', 'duplicateWidget']
for (const name of historyActions) {
  const action = projectOptions.actions[name]
  projectOptions.actions[name] = function (...args) {
    this.beginTransaction()
    try { return action.apply(this, args) }
    finally { this.endTransaction() }
  }
}
export const useProjectStore = defineStore('project', projectOptions)
