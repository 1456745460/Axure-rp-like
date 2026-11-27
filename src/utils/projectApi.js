import { isTauri, invokeCommand } from './desktop.js'

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || '请求失败')
  return data
}

export async function listProjects() {
  if (isTauri()) return invokeCommand('list_projects')
  const data = await request('/api/projects')
  return data.list || []
}

export async function getProject(id) {
  if (isTauri()) return invokeCommand('get_project', { id })
  return request(`/api/projects/${id}`)
}

export async function saveProject(body, { signal } = {}) {
  if (isTauri()) return invokeCommand('save_project', { payload: body })
  return request(body.id ? `/api/projects/${body.id}` : '/api/projects', {
    method: body.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  })
}

export async function deleteProject(id) {
  if (isTauri()) {
    const ok = await invokeCommand('delete_project', { id })
    if (!ok) throw new Error('项目不存在')
    return { ok: true }
  }
  return request(`/api/projects/${id}`, { method: 'DELETE' })
}
