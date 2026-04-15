import { supabase, isSupabaseConfigured } from "./supabaseClient"

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
  return `neuroinclude_alunos_${uid}`
}
function storageKeyMateriais(uid) {
  return `neuroinclude_materiais_${uid}`
}

export async function fetchAlunos(userId) {
  if (!isSupabaseConfigured() || !supabase) {
    const raw = sessionStorage.getItem(storageKeyAlunos(userId))
    if (raw) return JSON.parse(raw)
    sessionStorage.setItem(storageKeyAlunos(userId), JSON.stringify(DEMO_ALUNOS))
    return DEMO_ALUNOS
  }

  const { data, error } = await supabase
    .from("alunos")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data || []).map((row) => ({
    id: row.id,
    matricula: row.matricula || "",
    nome: row.nome,
    nascimento: row.nascimento || "",
    diagnostico: row.diagnostico,
    obs: row.observacoes || "",
    laudo: Boolean(row.laudo_url),
    materiais: row.materiais_count ?? 0,
  }))
}

export async function fetchMateriais(userId) {
  if (!isSupabaseConfigured() || !supabase) {
    const raw = sessionStorage.getItem(storageKeyMateriais(userId))
    if (raw) return JSON.parse(raw)
    sessionStorage.setItem(storageKeyMateriais(userId), JSON.stringify(DEMO_MATERIAIS))
    return DEMO_MATERIAIS
  }

  const { data: mats, error: errMats } = await supabase.from("materiais").select("*").order("created_at", { ascending: false })

  if (errMats) throw errMats

  const { data: aluRows, error: errAlu } = await supabase.from("alunos").select("id, nome, diagnostico")

  if (errAlu) throw errAlu

  const porId = new Map((aluRows || []).map((a) => [a.id, a]))

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
    }
  })
}

export async function updateAluno(userId, aluno) {
  if (!isSupabaseConfigured() || !supabase) {
    const list = await fetchAlunos(userId)
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

  const { data, error } = await supabase
    .from("alunos")
    .update({
      matricula: aluno.matricula || null,
      nome: aluno.nome,
      nascimento: aluno.nascimento || null,
      diagnostico: aluno.diagnostico,
      observacoes: aluno.obs || null,
      laudo_url: aluno.laudo_url || null,
    })
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

export async function insertAluno(userId, aluno) {
  if (!isSupabaseConfigured() || !supabase) {
    const list = await fetchAlunos(userId)
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

  const { data, error } = await supabase
    .from("alunos")
    .insert({
      user_id: userId,
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

export async function insertMaterial(userId, row) {
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

  const { data, error } = await supabase
    .from("materiais")
    .insert({
      user_id: userId,
      aluno_id: row.aluno_id || null,
      nome: row.nome,
      perfil: row.perfil,
      conteudo_html: row.conteudo_html || null,
      pdf_original_nome: row.pdf_original_nome || null,
      pdf_adaptado_nome: row.pdf_adaptado_nome || null,
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
