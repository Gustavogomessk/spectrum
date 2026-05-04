import { supabase, isSupabaseConfigured } from "./supabaseClient"

export function isValidUUID(uuid) {
  if (!uuid) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(String(uuid))
}

// Converts institution_id (from admin_institutions) to school_id (from schools table)
// This handles the mapping between old and new schema
// EXPORTED for use in components
export async function getSchoolIdFromInstitutionId(institutionId) {
  if (!institutionId || !isValidUUID(institutionId) || !isSupabaseConfigured() || !supabase) {
    return null
  }

  try {
    // Try to find existing mapping
    const { data, error } = await supabase
      .from("institution_school_mapping")
      .select("school_id")
      .eq("institution_id", institutionId)
      .maybeSingle()

    if (!error && data) {
      console.log("[getSchoolIdFromInstitutionId] Found mapping:", institutionId, "→", data.school_id)
      return data.school_id
    }

    // If no mapping exists, try server sync endpoint to create school if needed
    console.log("[getSchoolIdFromInstitutionId] No mapping found, calling sync endpoint...")
    try {
      const { data: sess } = await supabase.auth.getSession()
      const token = sess?.session?.access_token
      if (!token) throw new Error("not_authenticated")

      const response = await fetch("/api/institutions/sync-to-schools", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ institutionId }),
      })

      const result = await response.json()
      if (result.success && result.schoolId) {
        console.log("[getSchoolIdFromInstitutionId] Synced successfully:", institutionId, "→", result.schoolId)
        return result.schoolId
      }
    } catch (syncErr) {
      console.warn("[getSchoolIdFromInstitutionId] Sync endpoint failed:", syncErr)
    }

    // If sync failed, return null (don't use invalid schoolId that would violate FK constraint)
    console.log("[getSchoolIdFromInstitutionId] Sync failed, returning null to avoid FK violation")
    return null
  } catch (err) {
    console.error("[getSchoolIdFromInstitutionId] Error:", err)
    return null
  }
}

const DEMO_ALUNOS = [
  {
    id: "1",
    matricula: "2024-001",
    nome: "Lucas Mendes",
    nascimento: "2015-03-12",
    diagnostico: "TDAH",
    obs: "Dificuldade com textos longos. Responde bem a listas.",
    laudo: true,
    materiais: 4,
  },
  {
    id: "2",
    matricula: "2024-002",
    nome: "Ana Beatriz",
    nascimento: "2014-07-22",
    diagnostico: "TEA Nível 1",
    obs: "Linguagem literal. Evitar metáforas e ironias.",
    laudo: true,
    materiais: 3,
  },
  {
    id: "3",
    matricula: "2024-003",
    nome: "Pedro Santos",
    nascimento: "2015-11-05",
    diagnostico: "TDAH",
    obs: "Precisa de pausas frequentes e instruções curtas.",
    laudo: true,
    materiais: 5,
  },
]

const DEMO_MATERIAIS = [
  {
    id: "1",
    nome: "Frações — Cap. 3",
    aluno: "Lucas Mendes",
    perfil: "TDAH",
    data: "14/04/2026",
    pdf_original_nome: "fracoes-cap3.pdf",
    pdf_adaptado_nome: "fracoes-cap3-adaptado.pdf",
  },
  {
    id: "2",
    nome: "Texto: A Floresta",
    aluno: "Ana Beatriz",
    perfil: "TEA Nível 1",
    data: "13/04/2026",
    pdf_original_nome: "floresta.pdf",
    pdf_adaptado_nome: "floresta-adaptado.pdf",
  },
]

function storageKeyAlunos(uid) {
  return `spectrum_alunos_${uid}`
}
function storageKeyMateriais(uid) {
  return `spectrum_materiais_${uid}`
}

export async function fetchAlunos(userId, schoolId = null) {
  if (!isSupabaseConfigured() || !supabase) {
    const raw = sessionStorage.getItem(storageKeyAlunos(userId))
    if (raw) return JSON.parse(raw)
    sessionStorage.setItem(storageKeyAlunos(userId), JSON.stringify(DEMO_ALUNOS))
    return DEMO_ALUNOS
  }

  // RLS policy handles filtering:
  // - If user owns aluno (user_id = auth.uid()): always visible
  // - If aluno.school_id is set AND user is member of school: visible
  // Just fetch all and let RLS filter
  console.log(`[fetchAlunos] Fetching alunos for user ${userId}, schoolId=${schoolId}`)
  
  const { data, error } = await supabase
    .from("alunos")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  
  console.log(`[fetchAlunos] Retrieved ${(data || []).length} alunos`)
  
  return (data || []).map((row) => ({
    id: row.id,
    matricula: row.matricula || "",
    nome: row.nome,
    nascimento: row.nascimento || "",
    diagnostico: row.diagnostico,
    obs: row.observacoes || "",
    laudo: Boolean(row.laudo_url),
    laudo_url: row.laudo_url || null,
    materiais: row.materiais_count ?? 0,
  }))
}

export async function fetchMateriais(userId, schoolId = null) {
  if (!isSupabaseConfigured() || !supabase) {
    const raw = sessionStorage.getItem(storageKeyMateriais(userId))
    if (raw) return JSON.parse(raw)
    sessionStorage.setItem(storageKeyMateriais(userId), JSON.stringify(DEMO_MATERIAIS))
    return DEMO_MATERIAIS
  }

  // RLS policy handles filtering:
  // - If user owns material (user_id = auth.uid()): always visible
  // - If material.school_id is set AND user is member of school: visible
  // Just fetch all and let RLS filter
  console.log(`[fetchMateriais] Fetching materiais for user ${userId}, schoolId=${schoolId}`)

  const { data: mats, error: errMats } = await supabase
    .from("materiais")
    .select("*")
    .order("created_at", { ascending: false })

  if (errMats) throw errMats

  // Also fetch alunos for display names
  const { data: aluRows, error: errAlu } = await supabase
    .from("alunos")
    .select("id, nome, diagnostico")
    .order("created_at", { ascending: false })

  if (errAlu) throw errAlu

  const porId = new Map((aluRows || []).map((a) => [a.id, a]))

  console.log(`[fetchMateriais] Retrieved ${(mats || []).length} materiais`)

  return (mats || []).map((row) => {
    const alunoRow = row.aluno_id ? porId.get(row.aluno_id) : null
    return {
      id: row.id,
      nome: row.nome,
      aluno: alunoRow?.nome || "—",
      perfil: row.perfil || alunoRow?.diagnostico || "—",
      data: row.created_at ? new Date(row.created_at).toLocaleDateString("pt-BR") : "—",
      conteudo_html: row.conteudo_html,
      pdf_original_nome: row.pdf_original_nome || "",
      pdf_adaptado_nome: row.pdf_adaptado_nome || "",
      pdf_original_path: row.pdf_original_path || null,
      pdf_adaptado_path: row.pdf_adaptado_path || null,
    }
  })
}

export async function updateAluno(userId, aluno, schoolId = null) {
  if (!isSupabaseConfigured() || !supabase) {
    const list = await fetchAlunos(userId, schoolId)
    const next = list.map((a) =>
      String(a.id) === String(aluno.id)
        ? {
            ...a,
            matricula: aluno.matricula ?? "",
            nome: aluno.nome,
            nascimento: aluno.nascimento || "",
            diagnostico: aluno.diagnostico,
            obs: aluno.obs || "",
            laudo: aluno.laudo,
          }
        : a,
    )
    sessionStorage.setItem(storageKeyAlunos(userId), JSON.stringify(next))
    return next.find((a) => String(a.id) === String(aluno.id))
  }

  const updateData = {
    matricula: aluno.matricula || null,
    nome: aluno.nome,
    nascimento: aluno.nascimento || null,
    diagnostico: aluno.diagnostico,
    observacoes: aluno.obs || null,
    laudo_url: aluno.laudo_url || null,
  }

  // Use schoolId directly - it's already synchronized by the caller (salvarAlunoApi)
  if (isValidUUID(schoolId)) {
    updateData.school_id = schoolId
  }

  const { data, error } = await supabase
    .from("alunos")
    .update(updateData)
    .eq("id", aluno.id)
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    matricula: data.matricula || "",
    nome: data.nome,
    nascimento: data.nascimento || "",
    diagnostico: data.diagnostico,
    obs: data.observacoes || "",
    laudo: Boolean(data.laudo_url),
    materiais: data.materiais_count ?? 0,
  }
}

export async function patchAluno(userId, alunoId, fields) {
  if (!alunoId) throw new Error("missing_aluno_id")
  const f = fields || {}

  if (!isSupabaseConfigured() || !supabase) {
    const list = await fetchAlunos(userId)
    const next = list.map((a) => {
      if (String(a.id) !== String(alunoId)) return a
      return {
        ...a,
        ...(f.matricula !== undefined ? { matricula: f.matricula ?? "" } : null),
        ...(f.nome !== undefined ? { nome: f.nome } : null),
        ...(f.nascimento !== undefined ? { nascimento: f.nascimento || "" } : null),
        ...(f.diagnostico !== undefined ? { diagnostico: f.diagnostico } : null),
        ...(f.obs !== undefined ? { obs: f.obs || "" } : null),
        ...(f.laudo !== undefined ? { laudo: Boolean(f.laudo) } : null),
      }
    })
    sessionStorage.setItem(storageKeyAlunos(userId), JSON.stringify(next))
    return next.find((a) => String(a.id) === String(alunoId))
  }

  const update = {}
  if (f.matricula !== undefined) update.matricula = f.matricula || null
  if (f.nome !== undefined) update.nome = f.nome
  if (f.nascimento !== undefined) update.nascimento = f.nascimento || null
  if (f.diagnostico !== undefined) update.diagnostico = f.diagnostico
  if (f.obs !== undefined) update.observacoes = f.obs || null
  if (f.laudo_url !== undefined) update.laudo_url = f.laudo_url || null

  if (Object.keys(update).length === 0) return null

  const { data, error } = await supabase.from("alunos").update(update).eq("id", alunoId).select().single()
  if (error) throw error
  return {
    id: data.id,
    matricula: data.matricula || "",
    nome: data.nome,
    nascimento: data.nascimento || "",
    diagnostico: data.diagnostico,
    obs: data.observacoes || "",
    laudo: Boolean(data.laudo_url),
    materiais: data.materiais_count ?? 0,
  }
}

export async function insertAluno(userId, aluno, schoolId = null) {
  if (!isSupabaseConfigured() || !supabase) {
    const list = await fetchAlunos(userId, schoolId)
    const novo = {
      id: String(Date.now()),
      matricula: aluno.matricula || "",
      nome: aluno.nome,
      nascimento: aluno.nascimento || "",
      diagnostico: aluno.diagnostico,
      obs: aluno.obs || "",
      laudo: aluno.laudo,
      materiais: 0,
    }
    const next = [...list, novo]
    sessionStorage.setItem(storageKeyAlunos(userId), JSON.stringify(next))
    return novo
  }

  // Use schoolId directly - it's already synchronized by the caller (salvarAlunoApi)
  // or null if not from an institution
  const validSchoolId = isValidUUID(schoolId) ? schoolId : null
  console.log("[insertAluno] Using schoolId:", validSchoolId)

  const { data, error } = await supabase
    .from("alunos")
    .insert({
      user_id: userId,
      school_id: validSchoolId,
      matricula: aluno.matricula || null,
      nome: aluno.nome,
      nascimento: aluno.nascimento || null,
      diagnostico: aluno.diagnostico,
      observacoes: aluno.obs || null,
      laudo_url: aluno.laudo_url || null,
      materiais_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    matricula: data.matricula || "",
    nome: data.nome,
    nascimento: data.nascimento || "",
    diagnostico: data.diagnostico,
    obs: data.observacoes || "",
    laudo: Boolean(data.laudo_url),
    materiais: data.materiais_count ?? 0,
  }
}

export async function deleteAluno(userId, id) {
  if (!isSupabaseConfigured() || !supabase) {
    const list = (await fetchAlunos(userId)).filter((a) => String(a.id) !== String(id))
    sessionStorage.setItem(storageKeyAlunos(userId), JSON.stringify(list))
    return
  }
  const { error } = await supabase.from("alunos").delete().eq("id", id)
  if (error) throw error
}

export async function insertMaterial(userId, row, schoolId = null) {
  if (!isSupabaseConfigured() || !supabase) {
    const list = await fetchMateriais(userId)
    const novo = {
      id: String(Date.now()),
      nome: row.nome,
      aluno: row.aluno,
      perfil: row.perfil,
      data: new Date().toLocaleDateString("pt-BR"),
      conteudo_html: row.conteudo_html,
      pdf_original_nome: row.pdf_original_nome || "",
      pdf_adaptado_nome: row.pdf_adaptado_nome || "",
    }
    sessionStorage.setItem(storageKeyMateriais(userId), JSON.stringify([novo, ...list]))
    return novo
  }

  // Use schoolId directly - it's already synchronized by the caller (salvarMaterialApi)
  // or null if not from an institution
  const validSchoolId = isValidUUID(schoolId) ? schoolId : null

  const { data, error } = await supabase
    .from("materiais")
    .insert({
      user_id: userId,
      school_id: validSchoolId,
      aluno_id: row.aluno_id || null,
      nome: row.nome,
      perfil: row.perfil,
      conteudo_html: row.conteudo_html || null,
      pdf_original_nome: row.pdf_original_nome || null,
      pdf_adaptado_nome: row.pdf_adaptado_nome || null,
      pdf_original_path: row.pdf_original_path || null,
      pdf_adaptado_path: row.pdf_adaptado_path || null,
    })
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    nome: data.nome,
    aluno: row.aluno,
    perfil: row.perfil,
    data: new Date(data.created_at).toLocaleDateString("pt-BR"),
    conteudo_html: data.conteudo_html,
    pdf_original_nome: data.pdf_original_nome || "",
    pdf_adaptado_nome: data.pdf_adaptado_nome || "",
    pdf_original_path: data.pdf_original_path || null,
    pdf_adaptado_path: data.pdf_adaptado_path || null,
  }
}

export async function deleteMaterial(userId, id) {
  if (!isSupabaseConfigured() || !supabase) {
    const list = (await fetchMateriais(userId)).filter((m) => String(m.id) !== String(id))
    sessionStorage.setItem(storageKeyMateriais(userId), JSON.stringify(list))
    return
  }
  const { error } = await supabase.from("materiais").delete().eq("id", id)
  if (error) throw error
}

// ============ Chat Messages ============

export async function createChatConversation(userId, title = "Nova conversa", schoolId = null) {
  if (!isSupabaseConfigured() || !supabase) return null

  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({
      user_id: userId,
      school_id: schoolId,
      title,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getChatConversation(conversationId) {
  if (!isSupabaseConfigured() || !supabase) return null

  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, user_id, school_id, title, created_at, updated_at")
    .eq("id", conversationId)
    .single()

  if (error) throw error
  return data
}

export async function fetchChatMessages(conversationId) {
  if (!isSupabaseConfigured() || !supabase) return []

  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content_markdown, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data || []).map((msg) => ({
    id: msg.id,
    papel: msg.role === "assistant" ? "ia" : "usuario",
    texto: msg.content_markdown,
    createdAt: msg.created_at,
  }))
}

export async function saveChatMessage(conversationId, userId, role, content, schoolId = null) {
  if (!isSupabaseConfigured() || !supabase) return null

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      school_id: schoolId,
      role,
      content_markdown: content,
    })
    .select()
    .single()

  if (error) throw error
  return data
}
