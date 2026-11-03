import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { useProjectStore } from '../src/stores/project.js'
import { buildExportHtml } from '../src/utils/exportHtml.js'

test('arrow and icon widgets can be inserted and exported as offline SVG graphics', () => {
  setActivePinia(createPinia())
  const store = useProjectStore()
  const arrow = store.addWidgetFromLibrary('arrow', 100, 100)
  const icon = store.addWidgetFromLibrary('icon', 300, 100)
  assert.ok(arrow, 'arrow is available in the library')
  assert.ok(icon, 'icon is available in the library')
  store.updateWidget(arrow.id, { props: { strokeWidth: 8 }, style: { color: '#123456' } })
  store.updateWidget(icon.id, { props: { icon: 'Search' } })
  const html = buildExportHtml(store.toJSON())
  assert.match(html, /class="w-arrow"/)
  assert.match(html, /stroke-width="8"/)
  assert.match(html, /#123456/)
  assert.match(html, /class="w-icon"/)
  assert.match(html, /data-icon="Search"/)
  assert.match(html, /<svg[^>]+viewBox="0 0 1024 1024"/)
  assert.doesNotMatch(html, /<script[^>]+src=/)
})

test('dragging either arrow endpoint preserves the other and supports reversing direction', async () => {
  const { arrowGeometry, moveArrowEndpoint } = await import('../src/utils/arrow.js')
  const widget = { x: 100, y: 100, width: 180, height: 48, props: { startX: 0, startY: 0.5, endX: 1, endY: 0.5, strokeWidth: 3 } }
  const patch = moveArrowEndpoint(widget, 'end', { x: 60, y: 220 }, { width: 1440, height: 900 })
  const changed = { ...widget, ...patch, props: { ...widget.props, ...patch.props } }
  const geometry = arrowGeometry(changed)
  assert.equal(changed.x + geometry.start.x, 116)
  assert.equal(changed.y + geometry.start.y, 124)
  assert.equal(changed.x + geometry.end.x, 60)
  assert.equal(changed.y + geometry.end.y, 220)
  const next = moveArrowEndpoint(changed, 'start', { x: 220, y: 50 }, { width: 1440, height: 900 })
  const after = { ...changed, ...next, props: { ...changed.props, ...next.props } }
  assert.equal(after.x + arrowGeometry(after).end.x, 60)
  assert.equal(after.y + arrowGeometry(after).end.y, 220)
})

test('arrow endpoint dragging stays inside the page and does not collapse to invalid geometry', async () => {
  const { arrowGeometry, moveArrowEndpoint } = await import('../src/utils/arrow.js')
  const widget = { x: 100, y: 100, width: 180, height: 48, props: { startX: 0, startY: 0.5, endX: 1, endY: 0.5 } }
  const patch = moveArrowEndpoint(widget, 'end', { x: -100, y: 2000 }, { width: 1440, height: 900 })
  assert.ok(patch.x >= 0 && patch.y >= 0)
  assert.ok(patch.x + patch.width <= 1440 && patch.y + patch.height <= 900)
  const collapsed = moveArrowEndpoint(widget, 'end', { x: 116, y: 124 }, { width: 1440, height: 900 })
  assert.equal(collapsed, null)
  const geometry = arrowGeometry({ ...widget, props: { strokeWidth: 999 } })
  assert.equal(geometry.strokeWidth, 16)
  assert.doesNotMatch(geometry.headPoints, /NaN|Infinity/)
  const atRight = { ...widget, x: 1160, props: { startX: 1, startY: 0, endX: 1, endY: 1 } }
  const vertical = moveArrowEndpoint(atRight, 'end', { x: 1324, y: 800 }, { width: 1340, height: 900 })
  assert.ok(vertical.x + vertical.width <= 1340, 'vertical arrow bounding box stays within the right edge')
})

test('arrow edits form one undo step and icon changes survive serialization and paste', async () => {
  const { moveArrowEndpoint } = await import('../src/utils/arrow.js')
  setActivePinia(createPinia())
  const store = useProjectStore()
  const arrow = store.addWidgetFromLibrary('arrow', 100, 100)
  const original = JSON.parse(JSON.stringify(arrow))
  store.beginTransaction()
  store.updateWidget(arrow.id, moveArrowEndpoint(original, 'end', { x: 300, y: 200 }, store.currentPage))
  store.updateWidget(arrow.id, moveArrowEndpoint(original, 'end', { x: 320, y: 240 }, store.currentPage))
  store.endTransaction()
  store.undo()
  assert.deepEqual(JSON.parse(JSON.stringify(store.selectedWidget)), original)
  store.redo()
  assert.notEqual(store.selectedWidget.height, original.height)
  const icon = store.addWidgetFromLibrary('icon', 400, 100)
  store.updateWidget(icon.id, { props: { icon: 'StarFilled' } })
  const copy = store.pasteWidget(JSON.parse(JSON.stringify(icon)))
  assert.equal(copy.props.icon, 'StarFilled')
  assert.match(buildExportHtml(JSON.parse(JSON.stringify(store.toJSON()))), /data-icon="StarFilled"/)
})

test('icon rendering uses actual selected paths and falls back safely for unknown names', async () => {
  const { renderIconSvg } = await import('../src/utils/icons.js')
  const search = renderIconSvg('Search')
  const star = renderIconSvg('StarFilled')
  assert.match(search, /<path/)
  assert.notEqual(search, star)
  assert.equal(renderIconSvg('<script>'), renderIconSvg('Picture'))
  assert.equal(renderIconSvg('toString'), renderIconSvg('Picture'))
})

test('dragging the edge of the width handle preserves thickness until moving perpendicular to the arrow', async () => {
  const { arrowStrokeWidthAfterDrag } = await import('../src/utils/arrow.js')
  const widget = { width: 180, height: 48, props: { strokeWidth: 3 } }
  assert.equal(arrowStrokeWidthAfterDrag(widget, { x: 90, y: 36.5 }, { x: 91, y: 36.5 }), 3)
  assert.equal(arrowStrokeWidthAfterDrag(widget, { x: 90, y: 36.5 }, { x: 91, y: 38.5 }), 7)
  assert.equal(arrowStrokeWidthAfterDrag(widget, { x: 90, y: 36.5 }, { x: 90, y: 80 }), 16)
})
