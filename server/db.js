import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../data')
const dbPath = path.join(dataDir, 'prototype.db')

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let SQL = null
let db = null

function persist() {
  if (!db) return
  const data = db.export()
  fs.writeFileSync(dbPath, Buffer.from(data))
}

export async function initDb() {
  if (db) return db
  const wasmPath = path.join(path.dirname(require.resolve('sql.js')), 'sql-wasm.wasm')
  SQL = await initSqlJs({
    locateFile: () => wasmPath
  })
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)
  persist()
  return db
}

function rowsFrom(stmt) {
  const cols = stmt.getColumnNames()
  const out = []
  while (stmt.step()) {
    const values = stmt.get()
    const row = {}
    cols.forEach((c, i) => {
      row[c] = values[i]
    })
    out.push(row)
  }
  stmt.free()
  return out
}

export function listProjects() {
  const stmt = db.prepare(
    `SELECT id, name, created_at as createdAt, updated_at as updatedAt
     FROM projects ORDER BY updated_at DESC`
  )
  return rowsFrom(stmt)
}

export function getProject(id) {
  const stmt = db.prepare(`SELECT * FROM projects WHERE id = ?`)
  stmt.bind([id])
  const rows = rowsFrom(stmt)
  const row = rows[0]
  if (!row) return null
  let data
  try {
    data = JSON.parse(row.data_json)
  } catch {
    data = { name: row.name, tree: [], pages: [] }
  }
  return {
    ...data,
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function saveProject(payload) {
  const now = new Date().toISOString()
  const id =
    payload.id || `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const name = payload.name || '未命名项目'
  const data = {
    name,
    tree: payload.tree || [],
    pages: payload.pages || [],
    currentPageId: payload.currentPageId || null
  }
  const json = JSON.stringify(data)

  const existStmt = db.prepare(`SELECT id, created_at FROM projects WHERE id = ?`)
  existStmt.bind([id])
  const existing = rowsFrom(existStmt)[0]

  if (existing) {
    db.run(`UPDATE projects SET name = ?, data_json = ?, updated_at = ? WHERE id = ?`, [
      name,
      json,
      now,
      id
    ])
    persist()
    return { id, name, createdAt: existing.created_at, updatedAt: now, ...data }
  }

  db.run(
    `INSERT INTO projects (id, name, data_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [id, name, json, now, now]
  )
  persist()
  return { id, name, createdAt: now, updatedAt: now, ...data }
}

export function deleteProject(id) {
  const before = db.prepare(`SELECT id FROM projects WHERE id = ?`)
  before.bind([id])
  const found = rowsFrom(before)[0]
  if (!found) return false
  db.run(`DELETE FROM projects WHERE id = ?`, [id])
  persist()
  return true
}

export function getDbPath() {
  return dbPath
}
