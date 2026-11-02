import test from 'node:test'
import assert from 'node:assert/strict'
import { createAutoSaver } from '../src/utils/autoSave.js'

test('autosave coalesces requests and saves changes made during an in-flight save', async () => {
  let project = { id: null, name: '第一次' }
  const sent = []
  let release
  const saver = createAutoSaver({
    getSnapshot: () => ({ ...project }), getScope: () => 1,
    saveSnapshot: async snapshot => {
      sent.push(snapshot)
      if (sent.length === 1) await new Promise(resolve => { release = resolve })
      return { id: 7, updatedAt: 'now' }
    },
    onSaved: result => { project.id = result.id }
  })
  saver.request()
  saver.request()
  const saving = saver.flush()
  await Promise.resolve()
  project.name = '请求期间的新修改'
  saver.request()
  release()
  await saving
  assert.equal(sent.length, 2)
  assert.equal(sent[1].id, 7)
  assert.equal(sent[1].name, '请求期间的新修改')
  saver.dispose()
})

test('old save responses cannot overwrite a newly opened project', async () => {
  let scope = 1
  let release
  const applied = []
  const saver = createAutoSaver({
    getSnapshot: () => ({ name: '旧项目' }), getScope: () => scope,
    saveSnapshot: () => new Promise(resolve => { release = resolve }),
    onSaved: result => applied.push(result)
  })
  saver.request()
  const saving = saver.flush()
  await Promise.resolve()
  scope = 2
  release({ id: '旧项目id' })
  await saving
  assert.deepEqual(applied, [])
  saver.dispose()
})

test('failed saves report failure and can be retried without losing the latest content', async () => {
  let fails = true
  const statuses = []
  const saver = createAutoSaver({
    getSnapshot: () => ({ name: '仍在本地' }), getScope: () => 1,
    saveSnapshot: async () => { if (fails) throw new Error('offline'); return { id: 8 } },
    onStatus: status => statuses.push(status)
  })
  saver.request()
  await assert.rejects(saver.flush(), /offline/)
  assert.equal(statuses.at(-1), 'error')
  fails = false
  await saver.flush()
  assert.equal(statuses.at(-1), 'saved')
  saver.dispose()
})
