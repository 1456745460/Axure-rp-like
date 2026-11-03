export const DRAFT_KEY = 'prototype-design-draft-v1'

// Read the editor's draft rather than a saved API response, so pending edits appear too.
export function watchPreviewProject({ storage, eventTarget, onChange }) {
  let previous
  function refresh() {
    let project = null
    try {
      const draft = JSON.parse(storage.getItem(DRAFT_KEY) || 'null')
      if (Array.isArray(draft?.project?.pages)) project = draft.project
    } catch { /* Missing or unavailable drafts are handled by the preview's empty state. */ }
    const serialized = JSON.stringify(project)
    if (serialized === previous) return
    previous = serialized
    onChange(project)
  }
  function onStorage(event) {
    if ((event.key === DRAFT_KEY || event.key === null) && event.storageArea === storage) refresh()
  }
  eventTarget.addEventListener('storage', onStorage)
  eventTarget.addEventListener('focus', refresh)
  eventTarget.addEventListener('pageshow', refresh)
  refresh()
  return () => {
    eventTarget.removeEventListener('storage', onStorage)
    eventTarget.removeEventListener('focus', refresh)
    eventTarget.removeEventListener('pageshow', refresh)
  }
}
