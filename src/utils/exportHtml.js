import { paginationState, tableColumnWidths } from './editor.js'

/**
 * 将项目数据导出为可离线打开的多页 HTML（左侧目录树 + 右侧页面内容）
 */
export function buildExportHtml(project) {
  const pages = project.pages || []
  const tree = project.tree || []
  const title = project.name || '原型导出'

  const pageMap = Object.fromEntries(pages.map((p) => [p.id, p]))

  const renderTreeNodes = (nodes, depth = 0) => {
    return (nodes || [])
      .map((node) => {
        const isFolder = node.type === 'folder'
        const page = pageMap[node.pageId]
        const label = node.label || page?.name || '未命名'
        const children = renderTreeNodes(node.children || [], depth + 1)
        if (isFolder) {
          return `<li class="tree-folder" data-depth="${depth}">
            <div class="folder-label">${escapeHtml(label)}</div>
            <ul>${children}</ul>
          </li>`
        }
        const pageId = node.pageId || node.id
        return `<li class="tree-page" data-depth="${depth}">
          <a href="#page-${escapeAttr(pageId)}" data-page="${escapeAttr(pageId)}" class="page-link">${escapeHtml(label)}</a>
        </li>`
      })
      .join('')
  }

  const renderWidget = (w) => {
    const style = [
      `position:absolute`,
      `left:${w.x || 0}px`,
      `top:${w.y || 0}px`,
      `width:${w.width || 120}px`,
      `height:${w.height || 40}px`,
      `z-index:${w.zIndex || 1}`,
      w.style?.fontSize ? `font-size:${w.style.fontSize}px` : '',
      w.style?.color ? `color:${w.style.color}` : '',
      w.style?.background ? `background:${w.style.background}` : '',
      w.style?.borderRadius != null ? `border-radius:${w.style.borderRadius}px` : '',
      w.style?.textAlign ? `text-align:${w.style.textAlign}` : '',
      w.style?.fontWeight ? `font-weight:${w.style.fontWeight}` : '',
      w.style?.fontStyle ? `font-style:${w.style.fontStyle}` : '',
      w.style?.textDecoration ? `text-decoration:${w.style.textDecoration}` : '',
      `white-space:pre-wrap`,
      `overflow-wrap:anywhere`,
      w.style?.opacity != null ? `opacity:${w.style.opacity}` : '',
      w.style?.border ? `border:${w.style.border}` : '',
      `box-sizing:border-box`,
      `overflow:hidden`
    ]
      .filter(Boolean)
      .join(';')

    const text = escapeHtml(w.props?.text ?? w.props?.label ?? w.props?.placeholder ?? '')
    const type = w.type
    const props = w.props || {}

    switch (type) {
      case 'button':
        return `<button class="w-btn" style="${style}">${text || '按钮'}</button>`
      case 'input':
        return `<input class="w-input" style="${style}" placeholder="${escapeAttr(w.props?.placeholder || '请输入')}" value="${escapeAttr(w.props?.value || '')}" />`
      case 'textarea':
        return `<textarea class="w-textarea" style="${style}" placeholder="${escapeAttr(w.props?.placeholder || '请输入多行文本')}">${escapeHtml(w.props?.value || '')}</textarea>`
      case 'text':
        return `<div class="w-text" style="${style}">${text || '文本'}</div>`
      case 'image':
        return `<div class="w-image" style="${style};display:flex;align-items:center;justify-content:center;background:#f3f4f6;border:1px dashed #d1d5db;color:#9ca3af;font-size:12px;">${w.props?.src ? `<img src="${escapeAttr(w.props.src)}" alt="" style="max-width:100%;max-height:100%;object-fit:contain;" />` : '图片占位'}</div>`
      case 'select':
        return `<select class="w-select" style="${style}"><option>${escapeHtml(w.props?.placeholder || '请选择')}</option>${(w.props?.options || ['选项一', '选项二']).map((o) => `<option>${escapeHtml(o)}</option>`).join('')}</select>`
      case 'checkbox':
        return `<label class="w-check" style="${style};display:flex;align-items:center;gap:6px;"><input type="checkbox" ${w.props?.checked ? 'checked' : ''} /> ${text || '复选框'}</label>`
      case 'radio':
        return `<label class="w-radio" style="${style};display:flex;align-items:center;gap:6px;"><input type="radio" name="${escapeAttr(w.props?.name || 'r')}" ${w.props?.checked ? 'checked' : ''} /> ${text || '单选'}</label>`
      case 'switch':
        return `<label class="w-switch" style="${style};display:flex;align-items:center;gap:8px;"><span class="sw ${w.props?.checked ? 'on' : ''}"></span>${text || '开关'}</label>`
      case 'tag':
        return `<span class="w-tag" style="${style};display:inline-flex;align-items:center;justify-content:center;padding:0 10px;background:#ecf5ff;color:#409eff;border:1px solid #d9ecff;">${text || '标签'}</span>`
      case 'divider':
        return `<hr class="w-divider" style="${style};border:none;border-top:1px solid #e5e7eb;height:0;margin:0;" />`
      case 'card':
        return `<div class="w-card" style="${style};background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,.06);"><div style="font-weight:${w.style?.fontWeight || 600};margin-bottom:8px;">${escapeHtml(w.props?.title || '卡片标题')}</div><div style="color:#6b7280;font-size:13px;">${escapeHtml(w.props?.content || '卡片内容')}</div></div>`
      case 'table':
        return renderTable(w, style)
      case 'tabs':
        return renderTabs(w, style)
      case 'alert':
      case 'dialog':
      case 'loading':
      case 'message':
      case 'messagebox':
        return `<div style="${style}">${renderFeedbackHtml(w)}</div>`
      case 'progress':
        return `<div class="w-progress" style="${style};display:flex;align-items:center;"><div style="flex:1;height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;"><div style="width:${Number(w.props?.percentage ?? 50)}%;height:100%;background:#409eff;"></div></div><span style="margin-left:8px;font-size:12px;color:#6b7280;">${Number(w.props?.percentage ?? 50)}%</span></div>`
      case 'avatar':
        return `<div class="w-avatar" style="${style};border-radius:50%;background:#c0c4cc;color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;">${escapeHtml(w.props?.text || 'U')}</div>`
      case 'link':
        return `<a class="w-link" href="${escapeAttr(w.props?.href || '#')}" style="${style};color:#409eff;text-decoration:${w.style?.textDecoration || 'none'};display:flex;align-items:center;">${text || '链接'}</a>`
      case 'number':
        return `<input class="w-number w-input" type="number" style="${style}" value="${Number(props.value || 0)}" min="${Number(props.min ?? 0)}" max="${Number(props.max ?? 100)}" />`
      case 'slider':
        return `<input class="w-slider" type="range" style="${style}" value="${Number(props.value || 0)}" min="${Number(props.min ?? 0)}" max="${Number(props.max ?? 100)}" />`
      case 'rate':
        return `<div class="w-rate" style="${style};display:flex;align-items:center;gap:6px;font-size:24px;">${[1, 2, 3, 4, 5].map(i => `<span style="color:${i <= Number(props.value) ? '#f7ba2a' : '#dcdfe6'}">★</span>`).join('')}</div>`
      case 'date':
      case 'time':
        return `<input class="w-${type} w-input" type="${type}" style="${style}" value="${escapeAttr(props.value || '')}" aria-label="${escapeAttr(props.placeholder || '')}" />`
      case 'pagination': {
        const { count, current, pages } = paginationState(props.total, props.pageSize, props.currentPage)
        return `<nav class="w-pagination" data-count="${count}" data-current="${current}" style="${style};display:flex;align-items:center;gap:6px;" aria-label="分页"><button data-page-step="-1">‹</button>${pages.map(i => `<button data-index="${i}" class="${i === current ? 'on' : ''}">${i}</button>`).join('')}<button data-page-step="1">›</button></nav>`
      }
      case 'breadcrumb':
        return `<nav class="w-breadcrumb" style="${style};display:flex;align-items:center;gap:12px;">${(props.items || []).map(item => `<span>${escapeHtml(item)}</span>`).join('<span style="color:#c0c4cc">/</span>')}</nav>`
      case 'steps':
        return `<div class="w-steps" style="${style};display:flex;gap:12px;">${(props.items || []).map((item, i) => `<div style="flex:1;color:${i <= Number(props.active) ? '#409eff' : '#909399'}"><div style="border-bottom:2px solid currentColor;padding-bottom:8px;margin-bottom:8px;">${i + 1}</div>${escapeHtml(item)}</div>`).join('')}</div>`
      case 'container':
        return `<div class="w-container" style="${style};background:${w.style?.background || '#fafafa'};border:1px dashed #d1d5db;border-radius:4px;"></div>`
      default:
        return `<div style="${style}">${text || type}</div>`
    }
  }

  const pagesHtml = pages
    .map((page) => {
      const widgets = [...(page.widgets || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((widget, index) => renderWidget({ ...widget, zIndex: index + 1 })).join('\n')
      return `<section class="page-panel" id="page-${escapeAttr(page.id)}" data-page-id="${escapeAttr(page.id)}">
        <div class="page-title">${escapeHtml(page.name || '未命名页面')}</div>
        <div class="page-stage" style="width:${page.width || 1440}px;height:${page.height || 900}px;">
          ${widgets}
        </div>
      </section>`
    })
    .join('\n')

  const firstPageId = pages.some(page => page.id === project.currentPageId) ? project.currentPageId : pages[0]?.id || ''

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans SC', sans-serif; color: #1f2937; background: #f3f4f6; }
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; flex-shrink: 0; background: #fff; border-right: 1px solid #e5e7eb; padding: 16px 12px; position: sticky; top: 0; height: 100vh; overflow: auto; }
    .sidebar h1 { font-size: 16px; margin-bottom: 12px; padding: 0 8px; }
    .sidebar { transition:width .15s; }
    .sidebar.collapsed { width:44px; padding:16px 4px; }
    .sidebar.collapsed h1, .sidebar.collapsed .menu-tree { display:none; }
    #menu-toggle { display:block; width:30px; height:30px; margin:0 0 12px auto; border:1px solid #dcdfe6; border-radius:4px; background:white; color:#606266; font-size:20px; cursor:pointer; }
    .prototype-loading-spinner { width:32px; height:32px; border:3px solid #d9ecff; border-top-color:#409eff; border-radius:50%; animation:prototype-spin 1s linear infinite; }
    @keyframes prototype-spin { to { transform:rotate(360deg); } }
    .sidebar ul { list-style: none; }
    .tree-folder > .folder-label { font-weight: 600; font-size: 13px; color: #374151; padding: 8px; }
    .tree-page a, .page-link { display: block; padding: 8px 10px; border-radius: 6px; color: #4b5563; text-decoration: none; font-size: 13px; }
    .tree-page a:hover, .page-link:hover { background: #f3f4f6; color: #111827; }
    .tree-page a.active { background: #ecf5ff; color: #409eff; font-weight: 600; }
    .tree-folder > ul { padding-left: 12px; }
    .main { flex: 1; padding: 24px; overflow: auto; }
    .page-panel { display: none; }
    .page-panel.active { display: block; }
    .page-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
    .page-stage { isolation: isolate; position: relative; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,.04); margin: 0 auto; overflow: hidden; }
    .w-pagination button { border:0; border-radius:4px; padding:6px 10px; color:#606266; background:#f4f4f5; cursor:pointer; }
    .w-pagination button.on { background:#409eff; color:white; }
    .w-text { line-height:1.5; padding:4px 0; }
    .w-btn { border: 1px solid #409eff; background: #409eff; color: #fff; border-radius: 4px; cursor: pointer; }
    .w-input, .w-textarea, .w-select { border: 1px solid #dcdfe6; border-radius: 4px; padding: 0 12px; width: 100%; height: 100%; font: inherit; }
    .w-textarea { padding: 8px 12px; resize: none; }
    .sw { width: 40px; height: 20px; border-radius: 10px; background: #d1d5db; position: relative; display: inline-block; }
    .sw::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #fff; top: 2px; left: 2px; transition: .2s; }
    .sw.on { background: #409eff; }
    .sw.on::after { left: 22px; }
    table.export-table { width: 100%; height: 100%; table-layout:fixed; border-collapse: collapse; font-size: 13px; }
    table.export-table th, table.export-table td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
    table.export-table th { background: #f9fafb; }
    .tabs-head { display: flex; border-bottom: 1px solid #e5e7eb; height: 40px; }
    .tabs-head span { padding: 0 16px; display: flex; align-items: center; color: #6b7280; cursor: pointer; }
    .tabs-head span.on { color: #409eff; border-bottom: 2px solid #409eff; }
    .tabs-body { padding: 12px; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <button id="menu-toggle" aria-label="收起菜单" title="收起菜单" aria-expanded="true">‹</button>
      <h1>${escapeHtml(title)}</h1>
      <ul class="menu-tree">
        ${renderTreeNodes(tree)}
      </ul>
    </aside>
    <main class="main">
      ${pagesHtml || '<p>暂无页面</p>'}
    </main>
  </div>
  <script>
    (function () {
      var menuToggle = document.getElementById('menu-toggle');
      menuToggle.addEventListener('click', function () {
        var collapsed = menuToggle.parentElement.classList.toggle('collapsed');
        menuToggle.setAttribute('aria-expanded', String(!collapsed));
        menuToggle.setAttribute('aria-label', collapsed ? '展开菜单' : '收起菜单');
        menuToggle.title = collapsed ? '展开菜单' : '收起菜单';
        menuToggle.textContent = collapsed ? '›' : '‹';
      });
      document.querySelectorAll('.feedback-close, .feedback-confirm, .feedback-cancel').forEach(function (button) {
        button.addEventListener('click', function () { button.closest('.feedback-box').parentElement.style.display = 'none'; });
      });
      var paginationState = ${paginationState.toString()};
      document.querySelectorAll('.tabs-head').forEach(function (head) {
        head.querySelectorAll('span').forEach(function (tab) {
          tab.addEventListener('click', function () {
            head.querySelectorAll('span').forEach(function (item) { item.classList.toggle('on', item === tab); });
          });
        });
      });
      document.querySelectorAll('.w-pagination').forEach(function (nav) {
        nav.addEventListener('click', function (event) {
          var target = event.target.closest('button');
          if (!target) return;
          var next = target.hasAttribute('data-index') ? Number(target.dataset.index) : Number(nav.dataset.current) + Number(target.dataset.pageStep);
          var state = paginationState(Number(nav.dataset.count), 1, next);
          nav.dataset.current = state.current;
          nav.innerHTML = '<button data-page-step="-1">‹</button>' + state.pages.map(function (index) {
            return '<button data-index="' + index + '" class="' + (index === state.current ? 'on' : '') + '">' + index + '</button>';
          }).join('') + '<button data-page-step="1">›</button>';
        });
      });
      var links = document.querySelectorAll('.page-link');
      var panels = document.querySelectorAll('.page-panel');
      function show(id) {
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-page-id') === id);
        });
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('data-page') === id);
        });
        if (id) history.replaceState(null, '', '#page-' + id);
      }
      links.forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          show(a.getAttribute('data-page'));
        });
      });
      var hash = (location.hash || '').replace('#page-', '');
      var initial = hash || ${JSON.stringify(firstPageId).replace(/</g, '\\u003c')};
      if (initial) show(initial);
      else if (panels[0]) show(panels[0].getAttribute('data-page-id'));
    })();
  </script>
</body>
</html>`
}

function renderTable(w, style) {
  const columns = w.props?.columns || ['列1', '列2', '列3']
  const rows = w.props?.rows || [
    ['数据1', '数据2', '数据3'],
    ['数据4', '数据5', '数据6']
  ]
  const head = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')
  const body = rows
    .map((r) => `<tr>${columns.map((_, index) => `<td>${escapeHtml(String(r?.[index] ?? ''))}</td>`).join('')}</tr>`)
    .join('')
  const cols = tableColumnWidths(w).map(width => `<col style="width:${width}px" />`).join('')
  return `<div style="${style}"><table class="export-table"><colgroup>${cols}</colgroup><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
}

export function feedbackColors(variant) {
  return ({ success: { background: '#f0f9eb', color: '#67c23a', border: '#e1f3d8' },
    warning: { background: '#fdf6ec', color: '#e6a23c', border: '#faecd8' },
    error: { background: '#fef0f0', color: '#f56c6c', border: '#fde2e2' },
    info: { background: '#f4f4f5', color: '#909399', border: '#e9e9eb' } })[variant] ||
    { background: '#edf5ff', color: '#409eff', border: '#d9ecff' }
}

export function renderFeedbackHtml(widget) {
  const props = widget.props || {}
  if (widget.type === 'alert') {
    const colors = feedbackColors(props.variant)
    const style = widget.style || {}
    return `<div class="w-alert" style="width:100%;height:100%;box-sizing:border-box;display:flex;align-items:center;gap:8px;padding:8px 12px;background:${escapeAttr(style.background || colors.background)};color:${escapeAttr(style.color || colors.color)};border:${escapeAttr(style.border || '1px solid ' + colors.border)};border-radius:${Number(style.borderRadius ?? 4)}px;white-space:pre-wrap;"><span>ⓘ</span><div><div>${escapeHtml(props.text || '提示信息')}</div>${props.description ? '<div style="font-size:12px;margin-top:4px;">' + escapeHtml(props.description) + '</div>' : ''}</div></div>`
  }
  if (widget.type === 'loading') return `<div class="w-loading" style="width:100%;height:100%;background:rgba(255,255,255,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#409eff;font-size:14px;"><div class="prototype-loading-spinner"></div><span>${escapeHtml(props.text || '加载中…')}</span></div>`
  if (widget.type === 'message') {
    const colors = feedbackColors(props.variant)
    return `<div class="w-message" style="width:100%;height:100%;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:4px;border:1px solid ${colors.border};background:${colors.background};color:${colors.color};font-size:14px;">ⓘ <span>${escapeHtml(props.text)}</span></div>`
  }
  const button = 'padding:7px 16px;border-radius:4px;font:inherit;cursor:pointer;'
  return `<div class="w-${escapeAttr(widget.type)} feedback-box" style="width:100%;height:100%;display:flex;flex-direction:column;padding:20px 24px;border:1px solid #ebeef5;border-radius:6px;background:white;box-shadow:0 4px 16px #0002;font-size:14px;"><div style="display:flex;justify-content:space-between;font-size:18px;color:#303133;"><span>${escapeHtml(props.title || '提示')}</span><button class="feedback-close" style="border:0;background:none;color:#909399;font-size:20px;cursor:pointer;" aria-label="关闭">×</button></div><div style="flex:1;padding:20px 0;color:#606266;white-space:pre-wrap;overflow:auto;">${escapeHtml(props.content)}</div><div style="display:flex;justify-content:flex-end;gap:12px;"><button class="feedback-cancel" style="${button}background:white;border:1px solid #dcdfe6;color:#606266;">${escapeHtml(props.cancelText || '取消')}</button><button class="feedback-confirm" style="${button}background:#409eff;border:1px solid #409eff;color:white;">${escapeHtml(props.confirmText || '确定')}</button></div></div>`
}

function renderTabs(w, style) {
  const tabs = w.props?.tabs || ['标签一', '标签二', '标签三']
  const active = Number(w.props?.active || 0)
  const heads = tabs
    .map((t, i) => `<span class="${i === active ? 'on' : ''}">${escapeHtml(t)}</span>`)
    .join('')
  return `<div style="${style};background:#fff;border:1px solid #e5e7eb;border-radius:4px;overflow:hidden;"><div class="tabs-head">${heads}</div><div class="tabs-body">${escapeHtml(w.props?.content || '标签内容区域')}</div></div>`
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;')
}

export function downloadHtml(filename, html) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'prototype-export.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
