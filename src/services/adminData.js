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

// Helper para testar DELETE diretamente (use no console: window.testDelete('id'))
window.testDelete = async function(usuarioId) {
  const { supabase } = await import('./supabaseClient.js')
  
  console.log(`%c[TEST DELETE] Testando delete do usuário: ${usuarioId}`, 'color: blue; font-weight: bold;')
  
  try {
    // 1. Verificar se existe
    const { data: existe } = await supabase.from("admin_users").select("*").eq("id", usuarioId).single()
    console.log('1️⃣ Usuário encontrado?', existe ? 'SIM' : 'NÃO', existe)
    
    if (!existe) {
      console.error('❌ Usuário não existe!')
      return
    }
    
    // 2. Tentar deletar
    const { data, error, count } = await supabase.from("admin_users").delete().eq("id", usuarioId).select()
    console.log('2️⃣ DELETE Response:', { data, error, count })
    
    // 3. Verificar se foi deletado
    const { data: verificar } = await supabase.from("admin_users").select("*").eq("id", usuarioId).single()
    console.log('3️⃣ Usuário ainda existe?', verificar ? 'SIM ❌' : 'NÃO ✅', verificar)
    
    if (error) {
      console.error('%c❌ ERRO RLS:', 'color: red; font-weight: bold;', error)
    } else if (data && data.length === 0 && verificar) {
      console.error('%c❌ RLS BLOQUEOU SILENCIOSAMENTE - nenhum registro deletado', 'color: red; font-weight: bold;')
    } else {
      console.log('%c✅ DELETE FUNCIONOU!', 'color: green; font-weight: bold;')
    }
  } catch (err) {
    console.error('❌ Erro:', err)
  }
}

export async function deletarUsuario(usuarioId) {
  if (!supabase) return
  
  try {
    console.log(`[DELETE] Iniciando deleção do usuário: ${usuarioId}`)
    
    // Verificar se o usuário existe
    const { data: existsData, error: checkError } = await supabase
      .from("admin_users")
      .select("id, email, full_name")
      .eq("id", usuarioId)
      .single()
    
    if (checkError || !existsData) {
      throw new Error(`Usuário ${usuarioId} não encontrado no banco de dados`)
    }
    
    console.log(`✓ Usuário encontrado:`, existsData)
    
    // PASSO 1: Tentar deletar do auth.users via API
    const { data: session } = await supabase.auth.getSession()
    const token = session?.access_token
    
    if (token && typeof window !== 'undefined') {
      try {
        const authResponse = await fetch("/api/users/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: usuarioId }),
        })
        
        if (authResponse.ok) {
          const result = await authResponse.json()
          console.log(`✓ Usuário ${usuarioId} deletado de auth.users:`, result)
        } else {
          console.warn(`Aviso: Erro ao deletar de auth (${authResponse.status}). Continuando...`)
        }
      } catch (authErr) {
        console.warn(`Aviso: Não foi possível chamar API de delete do auth:`, authErr.message)
      }
    }
    
    // PASSO 2: Deletar do admin_users com log detalhado
    console.log(`[DELETE] Executando DELETE query em admin_users para id=${usuarioId}`)
    
    const { data: deletedData, error: dbError, count } = await supabase
      .from("admin_users")
      .delete()
      .eq("id", usuarioId)
      .select()
    
    console.log(`[DELETE] Response:`, { deletedData, dbError, count })
    
    if (dbError) {
      console.error(`[DELETE] Erro RLS ao deletar usuário ${usuarioId}:`, dbError)
      throw new Error(`Erro ao deletar usuário (RLS bloqueou): ${dbError.message}`)
    }
    
    if (!deletedData || deletedData.length === 0) {
      console.error(`[DELETE] RLS silenciosamente bloqueou o DELETE - nenhum registro foi removido`)
      throw new Error(`Política RLS bloqueou a deleção. Verifique as políticas no Supabase.`)
    }
    
    console.log(`✓ Usuário ${usuarioId} deletado com sucesso de admin_users`, deletedData)
    
  } catch (error) {
    console.error("Erro ao deletar usuário:", error)
    throw error
  }
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

export async function desabilitarInstituicaoComMembros(instituicaoId) {
  if (!supabase || !instituicaoId) return
  
  try {
    // Primeiro, desabilitar todos os usuários dessa instituição
    const { error: errorUsers } = await supabase
      .from("admin_users")
      .update({ active: false })
      .eq("institution_id", instituicaoId)
    
    if (errorUsers) throw errorUsers
    
    // Depois, desabilitar a instituição
    const { error: errorInst } = await supabase
      .from("admin_institutions")
      .update({ active: false })
      .eq("id", instituicaoId)
    
    if (errorInst) throw errorInst
  } catch (error) {
    console.error("Erro ao desabilitar instituição com membros:", error)
    throw error
  }
}

export async function habilitarInstituicaoComMembros(instituicaoId) {
  if (!supabase || !instituicaoId) return
  
  try {
    // Primeiro, habilitar todos os usuários dessa instituição
    const { error: errorUsers } = await supabase
      .from("admin_users")
      .update({ active: true })
      .eq("institution_id", instituicaoId)
    
    if (errorUsers) throw errorUsers
    
    // Depois, habilitar a instituição
    const { error: errorInst } = await supabase
      .from("admin_institutions")
      .update({ active: true })
      .eq("id", instituicaoId)
    
    if (errorInst) throw errorInst
  } catch (error) {
    console.error("Erro ao habilitar instituição com membros:", error)
    throw error
  }
}

export async function desabilitarUsuarioComInstituicao(usuarioId, instituicaoId = null) {
  if (!supabase || !usuarioId) return
  
  try {
    // Desabilitar o usuário
    const { error: errorUser } = await supabase
      .from("admin_users")
      .update({ active: false })
      .eq("id", usuarioId)
    
    if (errorUser) throw errorUser
    
    // Se o usuário tem uma instituição, desabilitar todos os membros dessa instituição
    if (instituicaoId) {
      const { error: errorMembers } = await supabase
        .from("admin_users")
        .update({ active: false })
        .eq("institution_id", instituicaoId)
      
      if (errorMembers) throw errorMembers
    }
  } catch (error) {
    console.error("Erro ao desabilitar usuário com instituição:", error)
    throw error
  }
}

export async function habilitarUsuarioComInstituicao(usuarioId, instituicaoId = null) {
  if (!supabase || !usuarioId) return
  
  try {
    // Habilitar o usuário
    const { error: errorUser } = await supabase
      .from("admin_users")
      .update({ active: true })
      .eq("id", usuarioId)
    
    if (errorUser) throw errorUser
    
    // Se o usuário tem uma instituição, habilitar todos os membros dessa instituição
    if (instituicaoId) {
      const { error: errorMembers } = await supabase
        .from("admin_users")
        .update({ active: true })
        .eq("institution_id", instituicaoId)
      
      if (errorMembers) throw errorMembers
    }
  } catch (error) {
    console.error("Erro ao habilitar usuário com instituição:", error)
    throw error
  }
}

export async function verificarStatusUsuario(userId, userEmail) {
  if (!supabase || (!userId && !userEmail)) {
    return { bloqueado: false, motivo: "" }
  }
  
  try {
    // Procurar o usuário em admin_users
    let query = supabase.from("admin_users").select("*")
    
    if (userId) {
      query = query.eq("id", userId)
    } else {
      query = query.eq("email", userEmail)
    }
    
    const { data: usuarios, error: errorUser } = await query.limit(1).maybeSingle()
    
    if (errorUser) {
      console.error("Erro ao verificar status do usuário:", errorUser)
      return { bloqueado: false, motivo: "" }
    }
    
    // Se o usuário não foi encontrado em admin_users, ele não está bloqueado
    if (!usuarios) {
      return { bloqueado: false, motivo: "" }
    }
    
    // Verificar se o usuário está inativo
    if (!usuarios.active) {
      return { bloqueado: true, motivo: "Sua conta foi bloqueada pelo administrador." }
    }
    
    // Se o usuário tem instituição, verificar se a instituição está bloqueada
    if (usuarios.institution_id) {
      const { data: instituicao, error: errorInst } = await supabase
        .from("admin_institutions")
        .select("*")
        .eq("id", usuarios.institution_id)
        .limit(1)
        .maybeSingle()
      
      if (errorInst) {
        console.error("Erro ao verificar status da instituição:", errorInst)
        return { bloqueado: false, motivo: "" }
      }
      
      // Se a instituição não está ativa, o usuário está bloqueado
      if (instituicao && !instituicao.active) {
        return { bloqueado: true, motivo: "A instituição foi bloqueada pelo administrador." }
      }
    }
    
    // Usuário e instituição estão ativos
    return { bloqueado: false, motivo: "" }
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error)
    return { bloqueado: false, motivo: "" }
  }
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

