import express from 'express'
import cors from 'cors'
import {
  initDb,
  listProjects,
  getProject,
  saveProject,
  deleteProject,
  getDbPath
} from './db.js'

const app = express()
const PORT = process.env.PORT || 3789

app.use(cors())
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, db: getDbPath() })
})

app.get('/api/projects', (_req, res) => {
  try {
    res.json({ list: listProjects() })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = getProject(req.params.id)
    if (!project) return res.status(404).json({ error: '项目不存在' })
    res.json(project)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/projects', (req, res) => {
  try {
    const saved = saveProject(req.body || {})
    res.json(saved)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/projects/:id', (req, res) => {
  try {
    const saved = saveProject({ ...(req.body || {}), id: req.params.id })
    res.json(saved)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/projects/:id', (req, res) => {
  try {
    const ok = deleteProject(req.params.id)
    if (!ok) return res.status(404).json({ error: '项目不存在' })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

async function main() {
  await initDb()
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[prototype-server] http://127.0.0.1:${PORT}`)
    console.log(`[prototype-server] sqlite: ${getDbPath()}`)
  })
}

main().catch((err) => {
  console.error('[prototype-server] failed to start', err)
  process.exit(1)
})
