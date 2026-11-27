import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('Tauri windows disable native drag-drop so HTML5 palette and tree drags work', () => {
  const conf = JSON.parse(readFileSync(new URL('../src-tauri/tauri.conf.json', import.meta.url), 'utf8'))
  for (const window of conf.app.windows) {
    assert.equal(window.dragDropEnabled, false, `${window.label} must not intercept HTML5 drag and drop`)
  }
})

test('desktop bundles include Mac app/dmg and Windows NSIS, with ad-hoc Mac signing', () => {
  const conf = JSON.parse(readFileSync(new URL('../src-tauri/tauri.conf.json', import.meta.url), 'utf8'))
  assert.deepEqual(conf.bundle.targets, ['app', 'dmg', 'nsis'])
  assert.equal(conf.bundle.macOS.signingIdentity, '-')
})

test('GitHub Actions builds macOS and Windows desktop packages', () => {
  const yml = readFileSync(new URL('../.github/workflows/desktop.yml', import.meta.url), 'utf8')
  assert.match(yml, /macos-latest/)
  assert.match(yml, /windows-latest/)
  assert.match(yml, /tauri-apps\/tauri-action/)
  assert.match(yml, /tags: \['v\*'\]/)
  assert.doesNotMatch(yml, /ubuntu-22|ubuntu-24/)
})
