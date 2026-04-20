export function markdownParaHTML(md) {
  if (!md) return ""
  const bold = (text) => text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  const lines = md.split(/\r?\n/)
  const out = []
  let listItems = []
  let listType = null

  const flushList = () => {
    if (!listItems.length || !listType) return
    out.push(`<${listType}>${listItems.join("")}</${listType}>`)
    listItems = []
    listType = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      flushList()
      continue
    }

    if (line.startsWith("### ")) {
      flushList()
      out.push(`<h3>${bold(line.slice(4))}</h3>`)
      continue
    }

    if (line.startsWith("## ")) {
      flushList()
      out.push(`<h2>${bold(line.slice(3))}</h2>`)
      continue
    }

    if (line.startsWith("BOX IMPORTANTE:")) {
      flushList()
      out.push(`<div class="destaque-box"><strong>Box Importante</strong><p>${bold(line.replace("BOX IMPORTANTE:", "").trim())}</p></div>`)
      continue
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/)
    if (orderedMatch) {
      if (listType !== "ol") flushList()
      listType = "ol"
      listItems.push(`<li>${bold(orderedMatch[1])}</li>`)
      continue
    }

    const unorderedMatch = line.match(/^[-•]\s+(.+)$/)
    if (unorderedMatch) {
      if (listType !== "ul") flushList()
      listType = "ul"
      listItems.push(`<li>${bold(unorderedMatch[1])}</li>`)
      continue
    }

    flushList()
    out.push(`<p>${bold(line)}</p>`)
  }

  flushList()
  return out.join("")
}

export function formatarMensagemChat(texto) {
  return markdownParaHTMLChat(texto)
}

export function markdownParaHTMLChat(md) {
  if (!md) return ""
  // Versão "chat": mantém quebras de linha e suporta listas/títulos básicos.
  let html = md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\s*[-•]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => "<ul>" + match + "</ul>")

  // Parágrafos e quebras
  html = html
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br />")}</p>`)
    .join("")

  return html
}
