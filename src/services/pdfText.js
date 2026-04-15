/**
 * Extrai texto de PDF no navegador (pdfjs-dist).
 * Em falha, retorna um resumo mínimo para a IA não ficar sem contexto.
 */
export async function extrairTextoPdf(file) {
  if (!file || file.type !== "application/pdf") {
    return ""
  }

  try {
    const pdfjs = await import("pdfjs-dist")
    const workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).href
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

    const buf = await file.arrayBuffer()
    const doc = await pdfjs.getDocument({ data: buf }).promise
    const maxPages = Math.min(doc.numPages, 12)
    const partes = []
    for (let p = 1; p <= maxPages; p++) {
      const page = await doc.getPage(p)
      const content = await page.getTextContent()
      const texto = content.items.map((it) => ("str" in it ? it.str : "")).join(" ")
      partes.push(texto)
    }
    const junto = partes.join("\n\n").trim()
    return junto || `[PDF sem texto selecionável: ${file.name}]`
  } catch {
    return `[Não foi possível ler o texto do PDF automaticamente. Nome do arquivo: ${file.name}. Peça à IA para gerar um modelo de adaptação com base no título e no perfil do aluno.]`
  }
}
