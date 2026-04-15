/**
 * Erro real de tabela ausente (não confundir com PGRST200 = relacionamento/embed).
 */
export function isErroTabelaAusente(error) {
  if (!error) return false
  const code = error.code || ""
  const msg = (error.message || "").toLowerCase()
  if (code === "PGRST205") return true
  if (code === "42P01") return true
  if (msg.includes("could not find the table")) return true
  if (msg.includes("relation ") && msg.includes("does not exist")) return true
  return false
}

/** Embed/join não reconhecido pelo PostgREST — tabelas podem existir. */
export function isErroRelacionamentoPostgrest(error) {
  if (!error) return false
  const code = error.code || ""
  const msg = error.message || ""
  if (code === "PGRST200") return true
  if (msg.includes("Could not find a relationship")) return true
  return false
}

export function resumoErroSupabase(error) {
  if (!error) return ""
  return [error.code, error.message].filter(Boolean).join(": ")
}
