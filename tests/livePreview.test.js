import test from 'node:test'
import assert from 'node:assert/strict'

const draftKey = 'prototype-design-draft-v1'
const project = name => ({ name, pages: [{ id: 'home', widgets: [] }], tree: [] })

function environment(initial) {
  const values = new Map(initial ? [[draftKey, JSON.stringify({ project: initial, pending: true })]] : [])
  const events = new EventTarget()
  return {
    storage: { getItem: key => values.get(key) ?? null },
    eventTarget: events,
    write(value, key = draftKey) {
      if (value === null) values.delete(key)
      else values.set(key, value)
      const event = new Event('storage')
      Object.assign(event, { key, storageArea: this.storage })
      events.dispatchEvent(event)
    },
    focus() { events.dispatchEvent(new Event('focus')) }
  }
}

test('preview reads the latest unsaved canvas both initially and after a browser refresh', async () => {
  const { watchPreviewProject } = await import('../src/utils/livePreview.js')
  const env = environment(project('修改前'))
  const shown = []
  const stop = watchPreviewProject({ ...env, onChange: value => shown.push(value) })
  assert.equal(shown.at(-1).name, '修改前')
  env.write(JSON.stringify({ project: project('最新画布'), pending: true }))
  assert.equal(shown.at(-1).name, '最新画布')
  stop()
  const refreshed = []
  const stopRefreshed = watchPreviewProject({ ...env, onChange: value => refreshed.push(value) })
  assert.equal(refreshed[0].name, '最新画布')
  stopRefreshed()
})

test('preview ignores unrelated and save-status-only changes and stops listening on unmount', async () => {
  const { watchPreviewProject } = await import('../src/utils/livePreview.js')
  const env = environment(project('画布'))
  const shown = []
  const stop = watchPreviewProject({ ...env, onChange: value => shown.push(value) })
  env.write('unrelated', 'other-key')
  env.write(JSON.stringify({ project: project('画布'), pending: false }))
  env.focus()
  assert.equal(shown.length, 1)
  stop()
  env.write(JSON.stringify({ project: project('停止后'), pending: true }))
  env.focus()
  assert.equal(shown.length, 1)
})

test('missing, corrupt or inaccessible drafts show an empty state and recover on the next valid update', async () => {
  const { watchPreviewProject } = await import('../src/utils/livePreview.js')
  const env = environment()
  const shown = []
  const stop = watchPreviewProject({ ...env, onChange: value => shown.push(value) })
  assert.equal(shown.at(-1), null)
  env.write('{broken')
  env.write(JSON.stringify({ project: { pages: 'invalid' } }))
  assert.equal(shown.at(-1), null)
  env.write(JSON.stringify({ project: project('恢复'), pending: true }))
  assert.equal(shown.at(-1).name, '恢复')
  env.write(null)
  assert.equal(shown.at(-1), null)
  stop()

  const stopBlocked = watchPreviewProject({
    storage: { getItem() { throw new Error('storage disabled') } },
    eventTarget: new EventTarget(), onChange: value => assert.equal(value, null)
  })
  stopBlocked()
})
