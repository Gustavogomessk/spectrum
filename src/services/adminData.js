import { supabase, isSupabaseConfigured } from "./supabaseClient"

const DEFAULT_DATA = {
  instituicoes: [],
  usuarios: [],
  notificacoes: [],
  boletos: [],
  iaMetrics: {
    totalTokens: 0,
    adaptacoesRealizadas: 0,
    perguntasChat: 0,
    custoEstimado: 0,
  },
}

function buildSimplePixPayload(reference, amount) {
  const valor = Number(amount || 0).toFixed(2)
  return `PIX|REF:${reference}|VALOR:${valor}`
}

function toInstituicao(row) {
  return {
    id: row.id,
    nome: row.name,
    cnpj: row.document || "",
    plano: row.plan || "Trial Institucional",
    limiteUsuarios: row.user_limit ?? 0,
    ativo: row.active !== false,
  }
}

function toUsuario(row) {
  return {
    id: row.id,
    instituicaoId: row.institution_id,
    nome: row.full_name || "Usuário",
    email: row.email || "",
    papel: row.role || "usuario",
    licencas: row.licenses ?? 1,
    tipoLicenca: row.license_type || "Basic",
    ativo: row.active !== false,
    contaPessoal: !row.institution_id,
    trial: row.account_type === "trial",
  }
}

function toNotificacao(row) {
  return {
    id: row.id,
    instituicaoId: row.institution_id || null,
    titulo: row.title,
    conteudo: row.message,
    tipo: row.type || "info",
    dataCriacao: row.created_at,
  }
}

function toBoleto(row) {
  return {
    id: row.id,
    instituicaoId: row.institution_id,
    referencia: row.reference,
    valor: Number(row.amount || 0),
    status: row.status || "pendente",
    qrCodePayload: row.qr_code_payload || "",
  }
}

async function fetchInstituicoes() {
  const { data, error } = await supabase.from("admin_institutions").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return (data || []).map(toInstituicao)
}

async function fetchUsuarios() {
  const { data, error } = await supabase.from("admin_users").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return (data || []).map(toUsuario)
}

async function fetchNotificacoes() {
  const { data, error } = await supabase.from("admin_notifications").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return (data || []).map(toNotificacao)
}

async function fetchBoletos() {
  const { data, error } = await supabase.from("admin_payments").select("*").order("created_at", { ascending: false })
  if (error) throw error
  return (data || []).map(toBoleto)
}

async function fetchIaMetrics() {
  const [{ data: usage }, { count: adaptacoes }] = await Promise.all([
    supabase.from("ai_usage_logs").select("total_tokens, estimated_cost, request_kind"),
    supabase.from("materiais").select("id", { count: "exact", head: true }),
  ])
  const totalTokens = (usage || []).reduce((acc, row) => acc + Number(row.total_tokens || 0), 0)
  const custoEstimado = (usage || []).reduce((acc, row) => acc + Number(row.estimated_cost || 0), 0)
  const perguntas = (usage || []).filter((row) => row.request_kind === "chat").length
  const adaptacoesIa = (usage || []).filter((row) => row.request_kind === "adaptacao").length
  return {
    totalTokens,
    adaptacoesRealizadas: Math.max(adaptacoes || 0, adaptacoesIa),
    perguntasChat: perguntas,
    custoEstimado,
  }
}

export async function getAdminData() {
  if (!isSupabaseConfigured() || !supabase) return DEFAULT_DATA
  try {
    const [instituicoes, usuarios, notificacoes, boletos, iaMetrics] = await Promise.all([
      fetchInstituicoes(),
      fetchUsuarios(),
      fetchNotificacoes(),
      fetchBoletos(),
      fetchIaMetrics(),
    ])
    return { instituicoes, usuarios, notificacoes, boletos, iaMetrics }
  } catch (error) {
    console.error("Erro ao carregar dados administrativos:", error)
    return DEFAULT_DATA
  }
}

export async function createInstituicao(payload) {
  if (!supabase) return null
  const insert = {
    name: payload.nome,
    document: payload.cnpj || null,
    plan: payload.plano || "Trial Institucional",
    user_limit: Number(payload.limiteUsuarios || 0),
    active: true,
  }
  const { data, error } = await supabase.from("admin_institutions").insert(insert).select().single()
  if (error) throw error
  return toInstituicao(data)
}

export async function createUsuarioInstituicao(payload) {
  if (!supabase) return null
  const insert = {
    institution_id: payload.instituicaoId || null,
    full_name: payload.nome,
    email: payload.email || null,
    password_hash: payload.passwordHash || null,
    role: payload.papel || "usuario",
    licenses: Number(payload.licencas || 1),
    license_type: payload.tipoLicenca || "Basic",
    account_type: payload.accountType || (payload.instituicaoId ? "institution" : "trial"),
    active: true,
  }
  const { data, error } = await supabase.from("admin_users").insert(insert).select().single()
  if (error) throw error
  return toUsuario(data)
}

export async function enviarNotificacao(payload) {
  if (!supabase) return null
  const insert = {
    institution_id: payload.instituicaoId || null,
    title: payload.titulo || "Notificação",
    message: payload.conteudo || payload.mensagem || "",
    type: payload.tipo || "info",
  }
  const { data, error } = await supabase.from("admin_notifications").insert(insert).select().single()
  if (error) throw error
  return toNotificacao(data)
}

export async function atualizarLicenca(usuarioId, licencas) {
  if (!supabase) return
  const { error } = await supabase.from("admin_users").update({ licenses: Number(licencas) }).eq("id", usuarioId)
  if (error) throw error
}

export async function atualizarStatusBoleto(boletoId, status) {
  if (!supabase) return
  const { error } = await supabase.from("admin_payments").update({ status }).eq("id", boletoId)
  if (error) throw error
}

export async function atualizarLicencasUsuario(usuarioId, licencas) {
  return atualizarLicenca(usuarioId, licencas)
}

export function gerarSenhaAleatoria() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
  let senha = ""
  for (let i = 0; i < 12; i++) senha += chars.charAt(Math.floor(Math.random() * chars.length))
  return senha
}

export async function desabilitarInstituicao(instituicaoId) {
  if (!supabase) return
  const { error } = await supabase.from("admin_institutions").update({ active: false }).eq("id", instituicaoId)
  if (error) throw error
}

export async function habilitarInstituicao(instituicaoId) {
  if (!supabase) return
  const { error } = await supabase.from("admin_institutions").update({ active: true }).eq("id", instituicaoId)
  if (error) throw error
}

export async function desabilitarUsuario(usuarioId) {
  if (!supabase) return
  const { error } = await supabase.from("admin_users").update({ active: false }).eq("id", usuarioId)
  if (error) throw error
}

export async function habilitarUsuario(usuarioId) {
  if (!supabase) return
  const { error } = await supabase.from("admin_users").update({ active: true }).eq("id", usuarioId)
  if (error) throw error
}

export async function criarBoleto(payload) {
  if (!supabase) return null
  const insert = {
    institution_id: payload.instituicaoId,
    reference: payload.referencia,
    amount: Number(payload.valor || 0),
    status: "pendente",
    qr_code_payload: payload.qrCodePayload || null,
    payment_method: "pix",
  }
  const { data, error } = await supabase.from("admin_payments").insert(insert).select().single()
  if (error) throw error
  return toBoleto(data)
}

export async function criarPagamentoSubadmin(payload) {
  if (!supabase) return null
  const qr = buildSimplePixPayload(payload.referencia, payload.valor)
  const insert = {
    institution_id: payload.instituicaoId,
    subadmin_user_id: payload.subadminUserId || null,
    reference: payload.referencia,
    amount: Number(payload.valor || 0),
    status: "pendente",
    qr_code_payload: qr,
    payment_method: "pix",
  }
  const { data, error } = await supabase.from("admin_payments").insert(insert).select().single()
  if (error) throw error
  return toBoleto(data)
}

export async function listarPagamentosSubadmin(subadminUserId) {
  if (!supabase || !subadminUserId) return []
  const { data, error } = await supabase
    .from("admin_payments")
    .select("*")
    .eq("subadmin_user_id", subadminUserId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data || []).map(toBoleto)
}

export async function listarPagamentosPorInstituicao(instituicaoId) {
  if (!supabase || !instituicaoId) return []
  const { data, error } = await supabase
    .from("admin_payments")
    .select("*")
    .eq("institution_id", instituicaoId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data || []).map(toBoleto)
}

export async function confirmarPagamentoViaWebhook(paymentId) {
  const response = await fetch("/api/payments/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, status: "pago" }),
  })
  if (!response.ok) throw new Error("Erro ao confirmar pagamento")
  return response.json()
}

export async function deletarBoleto(boletoId) {
  if (!supabase) return
  const { error } = await supabase.from("admin_payments").delete().eq("id", boletoId)
  if (error) throw error
}

export async function deletarUsuario(usuarioId) {
  if (!supabase) return
  
  // Primeiro, tentar deletar do auth via API
  try {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    
    if (token) {
      const response = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: usuarioId }),
      })
      if (!response.ok) {
        const err = await response.json()
        console.error("Erro ao deletar usuário do auth:", err)
      }
    }
  } catch (err) {
    console.error("Erro ao chamar API de deletar usuário:", err)
  }
  
  // Deletar do banco de dados local
  const { error } = await supabase.from("admin_users").delete().eq("id", usuarioId)
  if (error) throw error
}

export async function editarUsuario(usuarioId, dados) {
  if (!supabase) return
  const update = {
    full_name: dados.nome,
    email: dados.email,
    role: dados.papel,
    license_type: dados.tipoLicenca,
  }
  const { error } = await supabase.from("admin_users").update(update).eq("id", usuarioId)
  if (error) throw error
}

export async function editarInstituicao(instituicaoId, dados) {
  if (!supabase) return
  const update = {
    name: dados.nome,
    document: dados.cnpj,
    plan: dados.plano,
    user_limit: Number(dados.limiteUsuarios || 0),
  }
  const { error } = await supabase.from("admin_institutions").update(update).eq("id", instituicaoId)
  if (error) throw error
}

export async function deletarInstituicao(instituicaoId) {
  if (!supabase) return
  const { error } = await supabase.from("admin_institutions").delete().eq("id", instituicaoId)
  if (error) throw error
}

export async function obterTokensCohere() {
  if (!supabase) return 0
  const { data, error } = await supabase.from("ai_usage_logs").select("total_tokens")
  if (error) {
    console.error("Erro ao obter tokens Cohere:", error)
    return 0
  }
  return (data || []).reduce((acc, row) => acc + Number(row.total_tokens || 0), 0)
}

export async function registrarUsoIa({ userId, model, tokensUsados, promptTokens = 0, completionTokens = 0, requestKind = "chat", estimatedCost = 0 }) {
  if (!supabase || !userId) return
  const { error } = await supabase.from("ai_usage_logs").insert({
    user_id: userId,
    provider: "cohere",
    model: model || null,
    prompt_tokens: Number(promptTokens || 0),
    completion_tokens: Number(completionTokens || 0),
    total_tokens: Number(tokensUsados || 0),
    estimated_cost: Number(estimatedCost || 0),
    request_kind: requestKind,
  })
  if (error) throw error
}

export async function listarNotificacoesSubadmin({ userId, instituicaoId }) {
  if (!supabase || !userId) return []
  const { data: notifications, error: errN } = await supabase
    .from("admin_notifications")
    .select("*")
    .or(`institution_id.eq.${instituicaoId},institution_id.is.null`)
    .order("created_at", { ascending: false })
  if (errN) throw errN

  const notificationIds = (notifications || []).map((n) => n.id)
  if (notificationIds.length === 0) return []
  const { data: reads, error: errR } = await supabase
    .from("admin_notification_reads")
    .select("notification_id")
    .eq("user_id", userId)
    .in("notification_id", notificationIds)
  if (errR) throw errR
  const readSet = new Set((reads || []).map((r) => r.notification_id))
  return (notifications || []).map((n) => ({ ...toNotificacao(n), lida: readSet.has(n.id) }))
}

export async function marcarNotificacaoComoLida({ notificationId, userId }) {
  if (!supabase) return
  const { error } = await supabase
    .from("admin_notification_reads")
    .upsert({ notification_id: notificationId, user_id: userId, read_at: new Date().toISOString() }, { onConflict: "notification_id,user_id" })
  if (error) throw error
}

export async function salvarPdfGerado({ materialId, userId, pdfUrl }) {
  if (!supabase || !materialId || !userId || !pdfUrl) return
  const { error } = await supabase.from("generated_pdfs").insert({
    material_id: materialId,
    user_id: userId,
    pdf_url: pdfUrl,
    generated_at: new Date().toISOString(),
  })
  if (error) throw error
}

