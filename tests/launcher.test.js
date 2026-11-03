import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import net from 'node:net'
import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

async function freePort() {
  const server = net.createServer()
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise(resolve => server.close(resolve))
  return port
}

async function responds(port) {
  try {
    return (await fetch(`http://localhost:${port}`, { signal: AbortSignal.timeout(300) })).ok
  } catch {
    return false
  }
}

async function until(check, description) {
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await check()) return
    await delay(100)
  }
  assert.fail(description)
}

test('launcher stays alive and stopping it closes both services and their descendants', {
  skip: process.platform !== 'darwin', timeout: 25000
}, async () => {
  const project = await mkdtemp(path.join(tmpdir(), 'axure-launcher-'))
  const apiPort = await freePort()
  const webPort = await freePort()
  await mkdir(path.join(project, 'server'))
  await mkdir(path.join(project, 'node_modules/vite/bin'), { recursive: true })
  await writeFile(path.join(project, 'server/index.js'), `
    const http = require('node:http');
    http.createServer((_, res) => res.end('ok')).listen(Number(process.env.PORT));
  `)
  // Vite may start worker processes. The launcher must also clean these up.
  const descendantPort = await freePort()
  await writeFile(path.join(project, 'node_modules/vite/bin/vite.js'), `
    const { spawn } = require('node:child_process');
    spawn(process.execPath, ['-e', "require('node:http').createServer((q,r)=>r.end('child')).listen(${descendantPort})"]);
    require('node:http').createServer((q,r)=>r.end('web')).listen(Number(process.argv[process.argv.indexOf('--port') + 1]));
  `)
  const launcher = spawn('/bin/bash', ['scripts/launcher'], {
    env: { ...process.env, AXURE_PROJECT_DIR: project, AXURE_WEB_PORT: String(webPort),
      AXURE_API_PORT: String(apiPort), AXURE_OPEN_BROWSER: '0' },
    stdio: 'ignore'
  })
  try {
    await delay(500)
    assert.equal(launcher.exitCode, null, 'launcher must remain running after startup')
    await until(async () => (await responds(webPort)) && (await responds(apiPort)) &&
      (await responds(descendantPort)), 'both services and the worker must start')
    await delay(500)
    assert.equal(launcher.exitCode, null, 'launcher must remain running after startup')
    launcher.kill('SIGTERM')
    await until(() => launcher.exitCode !== null || launcher.signalCode !== null, 'launcher must exit')
    await until(async () => !(await responds(webPort)) && !(await responds(apiPort)) &&
      !(await responds(descendantPort)), 'quit must release both ports and stop descendants')
  } finally {
    if (launcher.exitCode === null && launcher.signalCode === null) launcher.kill('SIGTERM')
    await rm(project, { recursive: true, force: true })
  }
})

test('launcher reports a port conflict without stopping the existing listener', {
  skip: process.platform !== 'darwin', timeout: 5000
}, async () => {
  const existing = net.createServer(socket => socket.end())
  await new Promise(resolve => existing.listen(0, '127.0.0.1', resolve))
  const apiPort = existing.address().port
  const webPort = await freePort()
  const launcher = spawn('/bin/bash', ['scripts/launcher'], {
    env: { ...process.env, AXURE_API_PORT: String(apiPort), AXURE_WEB_PORT: String(webPort),
      AXURE_OPEN_BROWSER: '0' },
    stdio: ['ignore', 'ignore', 'pipe']
  })
  let stderr = ''
  launcher.stderr.on('data', chunk => { stderr += chunk })
  try {
    const exitCode = await new Promise(resolve => launcher.on('exit', resolve))
    assert.equal(exitCode, 1)
    assert.match(stderr, /已被占用/)
    const socket = net.createConnection({ host: '127.0.0.1', port: apiPort })
    await new Promise((resolve, reject) => {
      socket.on('connect', resolve)
      socket.on('error', reject)
    })
    socket.destroy()
  } finally {
    await new Promise(resolve => existing.close(resolve))
  }
})
