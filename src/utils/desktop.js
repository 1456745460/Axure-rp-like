export function isTauri(win = globalThis.window) {
  return !!win && ('__TAURI_INTERNALS__' in win || '__TAURI__' in win)
}

export async function invokeCommand(cmd, args) {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke(cmd, args)
}

export async function openPreviewWindow(href) {
  if (!isTauri()) {
    const tab = window.open(href, '_blank')
    if (tab) tab.opener = null
    return Boolean(tab)
  }
  const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
  const existing = await WebviewWindow.getByLabel('preview')
  if (existing) {
    try {
      await existing.setFocus()
      return true
    } catch {
      /* Recreate when the previous preview window is already gone. */
    }
  }
  const preview = new WebviewWindow('preview', {
    url: href,
    title: '预览',
    width: 1440,
    height: 900,
    center: true,
    dragDropEnabled: false
  })
  return new Promise((resolve) => {
    preview.once('tauri://created', () => resolve(true))
    preview.once('tauri://error', () => resolve(false))
  })
}

export async function exportHtmlToFile(filename, html) {
  const { save } = await import('@tauri-apps/plugin-dialog')
  const path = await save({
    defaultPath: filename,
    filters: [{ name: 'HTML', extensions: ['html'] }]
  })
  if (!path) return false
  await invokeCommand('write_exported_html', { path, contents: html })
  return true
}
