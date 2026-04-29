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

/**
 * Validações de acesso por licença
 * Plano Secretaria: apenas Alunos (cadastro e laudos)
 * Plano Basic: Dashboard, Alunos, Histórico, Chatbot
 * Plano PRO: Todos os acessos (Dashboard, Adaptar, Histórico, Alunos, Chatbot)
 */

export function canAccessDashboard(usuario) {
  // Dashboard: PRO, Basic e Educadores
  if (isAdmin(usuario)) return true
  if (usuario?.tipoLicenca === "Sem Licença") return false
  if (isSecretaria(usuario)) return false
  return true
}

export function canAccessAdaptar(usuario) {
  // Adaptar Material: apenas PRO
  if (usuario?.trial) return true
  const licenca = usuario?.tipoLicenca
  if (isSecretaria(usuario)) return false
  if (usuario?.tipoLicenca === "Sem Licença") return false
  // Allow trial users full access to Adaptar
  
  
  return licenca === "PRO"
}

export function canAccessChatbot(usuario) {
  // Chatbot: PRO e Basic
  if (usuario?.trial) return true
  if (isSecretaria(usuario)) return false
  const licenca = usuario?.tipoLicenca
  if (licenca === "Sem Licença") return false
  return licenca === "PRO" || licenca === "Basic"
}

export function canAccessHistorico(usuario) {
  // Histórico: PRO e Basic
  if (isSecretaria(usuario)) return false
  if (usuario?.tipoLicenca === "Sem Licença") return false
  return true
}

export function canAccessAlunos(usuario) {
  // Alunos: todos (Secretaria, Basic, PRO) mais educadores
  if (usuario?.tipoLicenca === "Sem Licença") return false
  return true
}

export function canAccessSection(usuario, sectionId) {
  // Admin e suas seções - mas também permite acesso a seções de licença se tiverem licença atribuída
  if (isAdminMaster(usuario) || isAdminInstituicao(usuario)) {
    const adminSections = new Set(["dashboard", "admin-global", "admin-notificacoes", "admin-instituicao", "admin-usuarios", "perfil"])
    if (adminSections.has(sectionId)) return true
    
    // SubAdmins/Admin Instituição com licença podem acessar seções de usuário também
    if (usuario?.tipoLicenca && usuario?.tipoLicenca !== "Sem Licença") {
      // Permitir acesso às seções de educador/usuário baseado em licença
      switch (sectionId) {
        case "dashboard":
          return canAccessDashboard(usuario)
        case "adaptar":
          return canAccessAdaptar(usuario)
        case "chatbot":
          return canAccessChatbot(usuario)
        case "historico":
          return canAccessHistorico(usuario)
        case "alunos":
          return canAccessAlunos(usuario)
        default:
          return false
      }
    }
    return false
  }

  // Se usuário está sem licença, bloquear acesso a principais seções de uso
  if (usuario?.tipoLicenca === "Sem Licença") {
    const blocked = new Set(["dashboard", "adaptar", "historico", "alunos"])
    if (blocked.has(sectionId)) return false
  }

  // Seções por tipo de usuário
  switch (sectionId) {
    case "dashboard":
      return canAccessDashboard(usuario)
    case "adaptar":
      return canAccessAdaptar(usuario)
    case "chatbot":
      return canAccessChatbot(usuario)
    case "historico":
      return canAccessHistorico(usuario)
    case "alunos":
      return canAccessAlunos(usuario)
    case "perfil":
      return true
    default:
      return false
  }
}

export function getAccessibleSections(usuario) {
  const sections = ["perfil"]
  
  if (isAdmin(usuario)) {
    sections.push("admin-instituicao", "admin-usuarios")
    if (isAdminMaster(usuario)) {
      sections.push("admin-global", "admin-notificacoes")
    }
  } else {
    // Se usuário sem licença, não adicionar seções principais
    if (usuario?.tipoLicenca === "Sem Licença") return sections

    if (canAccessDashboard(usuario)) sections.push("dashboard")
    if (canAccessAdaptar(usuario)) sections.push("adaptar")
    if (canAccessHistorico(usuario)) sections.push("historico")
    if (canAccessAlunos(usuario)) sections.push("alunos")
    if (canAccessChatbot(usuario)) sections.push("chatbot")
  }

  return sections
}

export function getDefaultSection(usuario) {
  if (isAdminInstituicao(usuario)) return "admin-usuarios"
  if (isAdminMaster(usuario)) return "admin-global"
  if (isSecretaria(usuario)) return "alunos"
  
  const licenca = usuario?.tipoLicenca
  if (licenca === "Sem Licença") return "perfil"
  if (licenca === "PRO") return "dashboard"
  if (licenca === "Basic") return "dashboard"
  
  return "dashboard"
}
