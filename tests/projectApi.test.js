import test from 'node:test'
import assert from 'node:assert/strict'
import { listProjects, getProject, saveProject, deleteProject } from '../src/utils/projectApi.js'

function mockFetch(handler) {
  const previous = globalThis.fetch
  globalThis.fetch = handler
  return () => { globalThis.fetch = previous }
}

test('listProjects reads the REST list in the browser', async () => {
  const restore = mockFetch(async (url) => {
    assert.equal(url, '/api/projects')
    return { ok: true, json: async () => ({ list: [{ id: 'p1', name: 'A' }] }) }
  })
  try {
    assert.deepEqual(await listProjects(), [{ id: 'p1', name: 'A' }])
  } finally {
    restore()
  }
})

test('saveProject posts a new project and puts an existing one', async () => {
  const restore = mockFetch(async (url, options) => {
    if (!options.body) {
      return { ok: false, json: async () => ({ error: 'missing body' }) }
    }
    const body = JSON.parse(options.body)
    return { ok: true, json: async () => ({ id: body.id || 'new', name: body.name }) }
  })
  try {
    const created = await saveProject({ name: '草稿' })
    assert.equal(created.id, 'new')
    const updated = await saveProject({ id: 'p1', name: '已有' })
    assert.equal(updated.id, 'p1')
  } finally {
    restore()
  }
})

test('getProject and deleteProject hit the REST routes', async () => {
  const calls = []
  const restore = mockFetch(async (url, options = {}) => {
    calls.push({ url, method: options.method || 'GET' })
    return { ok: true, json: async () => (options.method === 'DELETE' ? { ok: true } : { id: 'p1' }) }
  })
  try {
    assert.equal((await getProject('p1')).id, 'p1')
    assert.equal((await deleteProject('p1')).ok, true)
    assert.deepEqual(calls, [
      { url: '/api/projects/p1', method: 'GET' },
      { url: '/api/projects/p1', method: 'DELETE' }
    ])
  } finally {
    restore()
  }
})
