export function markdownParaHTML(md) {
  if (!md) return ""
  let html = md
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(
      /^### (.+)$/gm,
      '<h3 style="font-weight:700;margin:1rem 0 0.5rem;color:var(--cor-texto-principal)">$1</h3>',
    )
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /^BOX IMPORTANTE: (.+)$/gm,
      '<div class="destaque-box"><strong>📌 Destaque Importante</strong>$1</div>',
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      '<li style="padding:0.4rem 0.75rem;margin-bottom:0.3rem;background:var(--cor-fundo);border-radius:var(--raio-sm);list-style-type:decimal;margin-left:1.5rem">$2</li>',
    )
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      if (match.includes("list-style-type:decimal")) {
        return '<ol style="padding:0;margin:0.5rem 0">' + match + "</ol>"
      }
      return "<ul>" + match + "</ul>"
    })
    .replace(/\n{2,}/g, '</p><p style="margin:0.5rem 0">')
    .replace(/\n/g, " ")
  return html
}

export function formatarMensagemChat(texto) {
  return texto.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br />")
}
