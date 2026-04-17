/** Perfis de login (mesmas chaves das abas do login). */
export const PERFIL = {
  PROFESSOR: "professor",
  PSICO: "psico",
  SECRETARIA: "secretaria",
  ADMIN_MASTER: "admin_master",
  ADMIN_INSTITUICAO: "admin_instituicao",
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

export function isAdminMaster(usuario) {
  return usuario?.perfilCodigo === PERFIL.ADMIN_MASTER
}

export function isAdminInstituicao(usuario) {
  return usuario?.perfilCodigo === PERFIL.ADMIN_INSTITUICAO
}

export function isAdmin(usuario) {
  return isAdminMaster(usuario) || isAdminInstituicao(usuario)
}

/** Seções que educadores acessam e secretaria não. */
export const SECOES_SO_EDUCADOR = new Set(["dashboard", "adaptar", "historico", "chatbot"])

/**
 * Normaliza metadados do Supabase (user_metadata) para perfilCodigo.
 */
export function perfilCodigoDeMetadata(meta) {
  if (!meta || typeof meta !== "object") return PERFIL.PROFESSOR
  const rawPapel = (meta.papel || "").toString().toLowerCase()
  const rawFuncao = (meta.funcao || "").toString().toLowerCase()
  const rawPerfil = (meta.perfil || "").toString().toLowerCase()
  const rawRole = (meta.role || "").toString().toLowerCase()
  const rawRoleName = (meta.roleName || "").toString().toLowerCase()
  const raw = `${rawPapel} ${rawFuncao} ${rawPerfil} ${rawRole} ${rawRoleName}`

  if (raw.includes("admin_master") || raw.includes("adminmaster") || raw.includes("master")) return PERFIL.ADMIN_MASTER
  if (raw.includes("admin_instituicao") || raw.includes("subadmin") || raw.includes("instituicao")) return PERFIL.ADMIN_INSTITUICAO
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
  if (p.includes("admin master") || p.includes("admin_master")) return PERFIL.ADMIN_MASTER
  if (p.includes("subadmin") || p.includes("admin instituição") || p.includes("admin instituicao")) return PERFIL.ADMIN_INSTITUICAO
  if (p.includes("secret")) return PERFIL.SECRETARIA
  if (p.includes("psicoped")) return PERFIL.PSICO
  return PERFIL.PROFESSOR
}
