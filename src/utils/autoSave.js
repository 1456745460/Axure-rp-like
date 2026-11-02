// Serialize writes so the initial POST's id is known before the next update.
export function createAutoSaver({ getSnapshot, getScope, saveSnapshot, onSaved = () => {}, onStatus = () => {}, delay = 500 }) {
  let timer = null
  let dirty = false
  let running = null
  let disposed = false
  function request() {
    if (disposed) return
    dirty = true
    clearTimeout(timer)
    onStatus('pending')
    timer = setTimeout(() => { flush().catch(() => {}) }, delay)
  }
  function flush() {
    clearTimeout(timer)
    if (running) return running
    if (!dirty || disposed) return Promise.resolve()
    running = (async () => {
      while (dirty && !disposed) {
        dirty = false
        const scope = getScope()
        const snapshot = getSnapshot()
        onStatus('saving')
        try {
          const result = await saveSnapshot(snapshot)
          if (!disposed && scope === getScope()) onSaved(result)
        } catch (error) {
          dirty = true
          if (!disposed) onStatus('error', error)
          throw error
        }
      }
      if (!disposed) onStatus('saved')
    })().finally(() => { running = null })
    return running
  }
  function dispose() { disposed = true; clearTimeout(timer) }
  return { request, flush, dispose }
}
