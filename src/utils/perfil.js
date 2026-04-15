/** Perfis de login (mesmas chaves das abas do login). */
export const PERFIL = {
  PROFESSOR: "professor",
  PSICO: "psico",
  SECRETARIA: "secretaria",
}

/** Secretaria: apenas cadastro de alunos + anexo de laudo (regra do projeto). */
export function isSecretaria(usuario) {
  return usuario?.perfilCodigo === PERFIL.SECRETARIA
}

/** Professor ou psicopedagogo: adaptação, materiais, chatbot. */
export function isEducador(usuario) {
  const c = usuario?.perfilCodigo
  if (c == null) return true
  return c === PERFIL.PROFESSOR || c === PERFIL.PSICO
}

/** Seções que educadores acessam e secretaria não. */
export const SECOES_SO_EDUCADOR = new Set(["dashboard", "adaptar", "historico", "chatbot"])

/**
 * Normaliza metadados do Supabase (user_metadata) para perfilCodigo.
 */
export function perfilCodigoDeMetadata(meta) {
  if (!meta || typeof meta !== "object") return PERFIL.PROFESSOR
  const raw = (meta.funcao || meta.perfil || meta.papel || "").toString().toLowerCase()
  if (raw.includes("secret")) return PERFIL.SECRETARIA
  if (raw.includes("psicoped") || raw === "psico") return PERFIL.PSICO
  if (raw.includes("professor") || raw === "professor(a)") return PERFIL.PROFESSOR
  return PERFIL.PROFESSOR
}

/**
 * Mapeia o texto do cadastro (select) para valor gravado em user_metadata.funcao.
 */
export function funcaoMetadataDePapelCadastro(papel) {
  const p = (papel || "").toLowerCase()
  if (p.includes("secret")) return PERFIL.SECRETARIA
  if (p.includes("psicoped")) return PERFIL.PSICO
  return PERFIL.PROFESSOR
}
