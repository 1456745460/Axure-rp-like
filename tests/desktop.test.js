import test from 'node:test'
import assert from 'node:assert/strict'
import { isTauri } from '../src/utils/desktop.js'

test('isTauri is false in Node and true when Tauri internals exist', () => {
  assert.equal(isTauri(undefined), false)
  assert.equal(isTauri({}), false)
  assert.equal(isTauri({ __TAURI_INTERNALS__: {} }), true)
  assert.equal(isTauri({ __TAURI__: {} }), true)
})
