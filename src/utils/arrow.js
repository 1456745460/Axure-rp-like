const PADDING = 16
const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback

export function arrowGeometry(widget) {
  const props = widget.props || {}
  const width = Math.max(33, number(widget.width, 180))
  const height = Math.max(33, number(widget.height, 48))
  const point = (key, defaultX) => ({
    x: PADDING + clamp(number(props[key + 'X'], defaultX), 0, 1) * (width - PADDING * 2),
    y: PADDING + clamp(number(props[key + 'Y'], 0.5), 0, 1) * (height - PADDING * 2)
  })
  const start = point('start', 0)
  const end = point('end', 1)
  const length = Math.hypot(end.x - start.x, end.y - start.y)
  const ux = length ? (end.x - start.x) / length : 1
  const uy = length ? (end.y - start.y) / length : 0
  const strokeWidth = clamp(number(props.strokeWidth, 3), 1, 16)
  const headLength = Math.min(length * 0.6, Math.max(12, strokeWidth * 2.5))
  const halfHead = Math.min(15, Math.max(6, strokeWidth * 1.5), headLength * 0.75)
  const base = { x: end.x - ux * headLength, y: end.y - uy * headLength }
  return { start, end, strokeWidth,
    shaftEnd: { x: base.x + ux, y: base.y + uy },
    headPoints: `${end.x},${end.y} ${base.x - uy * halfHead},${base.y + ux * halfHead} ${base.x + uy * halfHead},${base.y - ux * halfHead}` }
}

export function arrowStrokeWidthAfterDrag(widget, origin, point) {
  const { start, end, strokeWidth } = arrowGeometry(widget)
  const dx = end.x - start.x
  const dy = end.y - start.y
  const delta = ((point.x - origin.x) * -dy + (point.y - origin.y) * dx) / (Math.hypot(dx, dy) || 1)
  return clamp(Math.round(strokeWidth + delta * 2), 1, 16)
}

// Rebuild the bounding box while keeping the opposite endpoint fixed on the page.
export function moveArrowEndpoint(widget, endpoint, point, page) {
  const geometry = arrowGeometry(widget)
  const fixed = geometry[endpoint === 'start' ? 'end' : 'start']
  const stationary = { x: widget.x + fixed.x, y: widget.y + fixed.y }
  const moved = { x: clamp(point.x, PADDING, page.width - PADDING), y: clamp(point.y, PADDING, page.height - PADDING) }
  if (Math.hypot(moved.x - stationary.x, moved.y - stationary.y) < 8) return null
  const start = endpoint === 'start' ? moved : stationary
  const end = endpoint === 'end' ? moved : stationary
  const width = Math.max(33, Math.abs(end.x - start.x) + PADDING * 2)
  const height = Math.max(33, Math.abs(end.y - start.y) + PADDING * 2)
  const x = clamp((start.x + end.x - width) / 2, 0, page.width - width)
  const y = clamp((start.y + end.y - height) / 2, 0, page.height - height)
  return { x, y, width, height, props: {
    startX: (start.x - x - PADDING) / (width - PADDING * 2),
    startY: (start.y - y - PADDING) / (height - PADDING * 2),
    endX: (end.x - x - PADDING) / (width - PADDING * 2),
    endY: (end.y - y - PADDING) / (height - PADDING * 2)
  } }
}
