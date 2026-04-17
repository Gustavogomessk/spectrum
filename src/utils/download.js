export function downloadString(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function wrapHtmlDocument({ title, bodyHtml }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title || "Material Adaptado")}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif; padding: 24px; }
      h1,h2,h3 { margin: 0.75rem 0 0.5rem; }
      .meta { color: #555; font-size: 0.9rem; margin-bottom: 1rem; }
      .box { border: 1px solid #ddd; border-radius: 10px; padding: 16px; }
    </style>
  </head>
  <body>
    <div class="box">
      ${bodyHtml || ""}
    </div>
  </body>
</html>`
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

