import test from 'node:test'
import assert from 'node:assert/strict'
import { Script } from 'node:vm'
import { createPinia, setActivePinia } from 'pinia'
import { useProjectStore, COMPONENT_LIBRARY } from '../src/stores/project.js'
import { buildExportHtml, renderFeedbackHtml } from '../src/utils/exportHtml.js'
import { snapPosition, editableFields, parseField, paginationState, widgetsInRect } from '../src/utils/editor.js'

function setup() {
  setActivePinia(createPinia())
  return useProjectStore()
}

test('centered drop and image insertion respect page edges', () => {
  const store = setup()
  const w = store.addWidgetFromLibrary('button', 300, 200, { centered: true })
  assert.equal(w.x + w.width / 2, 300)
  assert.equal(w.y + w.height / 2, 200)
  const edge = store.addWidgetFromLibrary('card', 9999, 9999, { centered: true })
  assert.ok(edge.x + edge.width <= store.currentPage.width)
  assert.ok(edge.y + edge.height <= store.currentPage.height)
})

test('sending to back keeps every widget above the canvas and adds above current maximum', () => {
  const store = setup()
  const container = store.addWidgetFromLibrary('container', 0, 0)
  const text = store.addWidgetFromLibrary('text', 10, 10)
  store.sendToBack(container.id)
  store.sendToBack(container.id)
  assert.ok(container.zIndex >= 1)
  assert.ok(container.zIndex < text.zIndex)
  store.bringToFront(container.id)
  const next = store.addWidgetFromLibrary('button', 20, 20)
  assert.ok(next.zIndex > container.zIndex)
})

test('undo and redo treat a drag as one edit and discard redo after new edits', () => {
  const store = setup()
  const widget = store.addWidgetFromLibrary('text', 30, 40)
  store.beginTransaction()
  store.moveWidget(widget.id, 50, 60)
  store.moveWidget(widget.id, 80, 90)
  store.endTransaction()
  store.undo()
  assert.equal(store.currentPage.widgets[0].x, 30)
  store.redo()
  assert.equal(store.currentPage.widgets[0].x, 80)
  store.undo()
  store.updateWidget(widget.id, { props: { text: '新内容' } })
  assert.equal(store.canRedo, false)
  assert.equal(store.toJSON()._past, undefined)
})

test('array properties keep trailing separators and independent defaults', () => {
  const store = setup()
  const first = store.addWidgetFromLibrary('tabs', 0, 0)
  const second = store.addWidgetFromLibrary('tabs', 0, 0)
  first.props.tabs.push('')
  assert.equal(second.props.tabs.length, 3)
  store.updateWidget(second.id, { props: { tabs: ['一', ''] } })
  assert.equal(second.props.tabs.join('\n'), '一\n')
})

test('tree moves between folders and root are reversible and reject cycles', () => {
  const store = setup()
  const original = store.tree[0]
  const folder = store.addFolder()
  store.moveTreeNode(original.id, folder.id, 'inner')
  assert.equal(store.tree.length, 1)
  assert.equal(folder.children[0].id, original.id)
  store.moveTreeNode(folder.id, original.id, 'inner')
  assert.equal(store.tree.length, 1)
  store.moveTreeNode(original.id, folder.id, 'after')
  assert.equal(store.tree[1].id, original.id)
  store.undo()
  assert.equal(store.tree[0].children[0].id, original.id)
})

test('image is stored as a portable base64 widget and supports undo', () => {
  const store = setup()
  const src = 'data:image/png;base64,aGVsbG8='
  const image = store.addImageWidget(src, 640, 480, 600, 400)
  assert.equal(image.type, 'image')
  assert.equal(image.props.src, src)
  assert.equal(image.x + image.width / 2, 600)
  assert.ok(image.width <= 640)
  store.undo()
  assert.equal(store.currentPage.widgets.length, 0)
})

test('alignment snaps edges and centers to widgets and page, with a finite threshold', () => {
  const widget = { id: 'a', x: 0, y: 0, width: 100, height: 40 }
  const page = { width: 1000, height: 800, widgets: [widget, { id: 'b', x: 200, y: 100, width: 100, height: 40 }] }
  const aligned = snapPosition(widget, 197, 102, page)
  assert.equal(aligned.x, 200)
  assert.equal(aligned.y, 100)
  assert.equal(aligned.guideX, 200)
  const free = snapPosition(widget, 333, 333, page)
  assert.equal(free.x, 333)
  assert.equal(free.guideX, null)
  assert.equal(snapPosition(widget, 448, 378, page).x, 450)
})

test('direct editor preserves array separators and parses table data', () => {
  const fields = editableFields({ props: { columns: ['一', ''], tabs: ['一', ''], rows: [['张三', '28']] } })
  assert.equal(fields.find(f => f.key === 'columns').value, '一,')
  assert.equal(fields.find(f => f.key === 'tabs').value, '一\n')
  assert.deepEqual(parseField('columns', '一，二,', []), ['一', '二', ''])
  assert.deepEqual(parseField('rows', '张三\t28\n李四\t32', []), [['张三', '28'], ['李四', '32']])
})

test('pagination keeps later pages reachable beyond the first seven buttons', () => {
  const state = paginationState(100, 10, 8)
  assert.equal(state.current, 8)
  assert.ok(state.pages.includes(8))
  assert.ok(state.pages.includes(10))
  assert.equal(paginationState(100, 10, 11).current, 10)
})

test('loading an old project repairs negative layer values and clears history', () => {
  const store = setup()
  const back = store.addWidgetFromLibrary('container', 0, 0)
  store.addWidgetFromLibrary('text', 0, 0)
  back.zIndex = -2
  store.loadProject(store.toJSON())
  assert.ok(store.currentPage.widgets.every(widget => widget.zIndex >= 1))
  assert.equal(store.currentPage.widgets[0].zIndex, 1)
  assert.equal(store.canUndo, false)
})

test('preview exports all new controls, line breaks and text decorations', () => {
  const store = setup()
  for (const group of COMPONENT_LIBRARY) {
    for (const item of group.items) store.addWidgetFromLibrary(item.type, 0, 0)
  }
  const text = store.currentPage.widgets.find(w => w.type === 'text')
  store.updateWidget(text.id, { props: { text: '第一行\n第二行' }, style: { fontStyle: 'italic', textDecoration: 'underline' } })
  const html = buildExportHtml(store.toJSON())
  assert.doesNotThrow(() => new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]))
  assert.match(html, /font-style:italic/)
  assert.match(html, /text-decoration:underline/)
  assert.match(html, /white-space:pre-wrap/)
  for (const type of ['number', 'slider', 'rate', 'date', 'time', 'pagination', 'breadcrumb', 'steps']) {
    assert.ok(store.currentPage.widgets.some(w => w.type === type), type)
    assert.ok(html.includes(`w-${type}`), type)
  }
})

test('selection supports groups and moving/deleting groups is one undo step', () => {
  const store = setup()
  const first = store.addWidgetFromLibrary('button', 30, 40)
  const second = store.addWidgetFromLibrary('text', 200, 100)
  store.selectAllWidgets()
  assert.equal(store.selectedWidgets.length, 2)
  store.moveSelectedWidgets(20, 30)
  assert.equal(first.x, 50)
  assert.equal(second.x, 220)
  store.undo()
  assert.deepEqual(store.currentPage.widgets.map(w => w.x), [30, 200])
  store.removeSelectedWidgets()
  assert.equal(store.currentPage.widgets.length, 0)
  store.undo()
  assert.equal(store.currentPage.widgets.length, 2)
})

test('paste places a copied group at the mouse and preserves relative positions', () => {
  const store = setup()
  const first = store.addWidgetFromLibrary('button', 30, 40)
  const second = store.addWidgetFromLibrary('text', 200, 100)
  const copies = store.pasteWidgets([first, second], { x: 700, y: 500 })
  const left = Math.min(...copies.map(w => w.x))
  const right = Math.max(...copies.map(w => w.x + w.width))
  assert.equal((left + right) / 2, 700)
  assert.equal(copies[1].x - copies[0].x, 170)
  assert.equal(copies[1].y - copies[0].y, 60)
  assert.equal(store.selectedWidgets.length, 2)
})

test('editing table cells, adding/removing rows and resizing columns are reversible', () => {
  const store = setup()
  const table = store.addWidgetFromLibrary('table', 0, 0)
  store.updateTableCell(table.id, 0, 1, '35')
  assert.equal(table.props.rows[0][1], '35')
  store.insertTableRow(table.id, 0)
  assert.deepEqual(table.props.rows[1], ['', '', ''])
  store.deleteTableRow(table.id, 1)
  assert.equal(table.props.rows.length, 3)
  store.resizeTableColumn(table.id, 0, 20)
  assert.deepEqual(table.props.columnWidths, [180, 140, 160])
  assert.equal(table.width, 480)
  store.resizeTableColumn(table.id, 2, 30)
  assert.equal(table.width, 510)
  assert.equal(table.props.columnWidths[2], 190)
  store.undo()
  assert.equal(store.currentPage.widgets[0].width, 480)
})

test('removing a table header preserves the data and width of remaining named columns', () => {
  const store = setup()
  const table = store.addWidgetFromLibrary('table', 0, 0)
  store.setTableColumns(table.id, ['姓名', '城市', '部门'])
  assert.deepEqual(table.props.rows[0], ['张三', '上海', ''])
  assert.equal(table.props.columnWidths.length, 3)
  store.undo()
  assert.deepEqual(store.currentPage.widgets[0].props.rows[0], ['张三', '28', '上海'])
})

test('autosave revision advances on completed edits, not selection or intermediate drag frames', () => {
  const store = setup()
  const before = store._revision
  const widget = store.addWidgetFromLibrary('button', 0, 0)
  assert.equal(store._revision, before + 1)
  store.clearSelection()
  store.selectWidget(widget.id)
  assert.equal(store._revision, before + 1)
  store.beginTransaction()
  store.moveWidget(widget.id, 10, 20)
  store.moveWidget(widget.id, 20, 30)
  assert.equal(store._revision, before + 1)
  store.endTransaction()
  assert.equal(store._revision, before + 2)
  store.undo()
  assert.equal(store._revision, before + 3)
})

test('preview and export include collapsible menus, feedback controls and table column widths', () => {
  const store = setup()
  for (const type of ['alert', 'dialog', 'loading', 'message', 'messagebox', 'date', 'time']) {
    assert.ok(store.addWidgetFromLibrary(type, 0, 0), type)
  }
  const table = store.addWidgetFromLibrary('table', 0, 0)
  store.resizeTableColumn(table.id, 0, 20)
  const html = buildExportHtml(store.toJSON())
  assert.match(html, /id="menu-toggle"/)
  assert.match(html, /aria-expanded="true"/)
  assert.match(html, /<col[^>]*width:180px/)
  for (const type of ['dialog', 'loading', 'message', 'messagebox']) assert.ok(html.includes(`w-${type}`))
  assert.doesNotThrow(() => new Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]))
})

test('renaming a table column preserves existing cells and column width', () => {
  const store = setup()
  const table = store.addWidgetFromLibrary('table', 0, 0)
  store.resizeTableColumn(table.id, 0, 30)
  store.setTableColumns(table.id, ['名字', '年龄', '城市'])
  assert.deepEqual(table.props.rows[0], ['张三', '28', '上海'])
  assert.deepEqual(table.props.columnWidths, [190, 130, 160])
})

test('pasted groups preserve stacking after an earlier widget was brought forward', () => {
  const store = setup()
  const button = store.addWidgetFromLibrary('button', 0, 0)
  const text = store.addWidgetFromLibrary('text', 0, 0)
  store.bringToFront(button.id)
  const copies = store.pasteWidgets([button, text], { x: 300, y: 200 })
  assert.ok(copies.find(w => w.type === 'button').zIndex > copies.find(w => w.type === 'text').zIndex)
})

test('marquee selects intersecting widgets and excludes outside and touching edges', () => {
  const widgets = [{ id: 'a', x: 10, y: 10, width: 50, height: 20 },
    { id: 'b', x: 70, y: 10, width: 20, height: 20 }, { id: 'c', x: 100, y: 10, width: 20, height: 20 }]
  assert.deepEqual(widgetsInRect(widgets, { x: 20, y: 0, width: 80, height: 40 }), ['a', 'b'])
})

test('export menu toggles closed and open with matching accessibility state', () => {
  const html = buildExportHtml(setup().toJSON())
  let click
  let collapsed = false
  const attrs = {}
  const toggle = { parentElement: { classList: { toggle() { collapsed = !collapsed; return collapsed } } },
    addEventListener(_, listener) { click = listener }, setAttribute(key, value) { attrs[key] = value } }
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1]
  new Script(script).runInNewContext({ document: { getElementById: () => toggle, querySelectorAll: () => [] },
    history: { replaceState() {} }, location: { hash: '' } })
  click()
  assert.equal(collapsed, true)
  assert.equal(attrs['aria-expanded'], 'false')
  assert.equal(attrs['aria-label'], '展开菜单')
  click()
  assert.equal(collapsed, false)
  assert.equal(attrs['aria-expanded'], 'true')
})

test('shared alert rendering includes description and custom colors', () => {
  const store = setup()
  const alert = store.addWidgetFromLibrary('alert', 0, 0)
  store.updateWidget(alert.id, { props: { description: '补充说明', variant: 'error' }, style: { color: '#123456', background: '#abcdef' } })
  const shared = renderFeedbackHtml(alert)
  assert.match(shared, /补充说明/)
  assert.match(shared, /background:#abcdef/)
  assert.match(shared, /color:#123456/)
  assert.ok(buildExportHtml(store.toJSON()).includes(shared))
})
