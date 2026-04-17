const KEY = "spectrum_admin_data_v1"

const DEFAULT_DATA = {
  instituicoes: [
    { id: "inst-1", nome: "Colégio Horizonte", cnpj: "12.345.678/0001-90", plano: "Enterprise", limiteUsuarios: 50, statusBoleto: "pago", ativo: true },
    { id: "inst-2", nome: "Escola Nova Geração", cnpj: "98.765.432/0001-11", plano: "Personal", limiteUsuarios: 20, statusBoleto: "pendente", ativo: true },
  ],
  usuarios: [
    { id: "u-1", instituicaoId: "inst-1", nome: "Carla Souza", email: "carla@horizonte.edu.br", papel: "subadmin", licencas: 12, tipoLicenca: "PRO", ativo: true },
    { id: "u-2", instituicaoId: "inst-1", nome: "Lucas Lima", email: "lucas@horizonte.edu.br", papel: "professor", licencas: 1, tipoLicenca: "Basic", ativo: true },
    { id: "u-3", instituicaoId: "inst-2", nome: "Renata Alves", email: "renata@novageracao.edu.br", papel: "subadmin", licencas: 5, tipoLicenca: "PRO", ativo: true },
  ],
  notificacoes: [],
  boletos: [
    { id: "b-1", instituicaoId: "inst-1", referencia: "04/2026", valor: 1290, status: "pago" },
    { id: "b-2", instituicaoId: "inst-2", referencia: "04/2026", valor: 590, status: "pendente" },
  ],
  iaMetrics: {
    totalTokens: 125000,
    adaptacoesRealizadas: 450,
    perguntasChat: 1200,
    custoEstimado: 25.50,
  },
}

function readStore() {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) {
    sessionStorage.setItem(KEY, JSON.stringify(DEFAULT_DATA))
    return DEFAULT_DATA
  }
  try {
    return JSON.parse(raw)
  } catch {
    sessionStorage.setItem(KEY, JSON.stringify(DEFAULT_DATA))
    return DEFAULT_DATA
  }
}

function writeStore(data) {
  sessionStorage.setItem(KEY, JSON.stringify(data))
}

export function getAdminData() {
  return readStore()
}

export function createInstituicao(payload) {
  const data = readStore()
  const inst = {
    id: crypto.randomUUID(),
    nome: payload.nome,
    cnpj: payload.cnpj,
    plano: payload.plano || "Trial Institucional",
    limiteUsuarios: Number(payload.limiteUsuarios || 0),
    statusBoleto: "pendente",
    ativo: true,
  }
  data.instituicoes.unshift(inst)
  writeStore(data)
  return inst
}

export function createUsuarioInstituicao(payload) {
  const data = readStore()
  const user = {
    id: crypto.randomUUID(),
    instituicaoId: payload.instituicaoId,
    nome: payload.nome,
    email: payload.email,
    papel: payload.papel,
    licencas: Number(payload.licencas || 1),
    tipoLicenca: payload.tipoLicenca || "Basic",
    ativo: true,
  }
  data.usuarios.unshift(user)
  writeStore(data)
  return user
}

export function enviarNotificacao(payload) {
  const data = readStore()
  const notif = {
    id: crypto.randomUUID(),
    instituicaoId: payload.instituicaoId || null,
    mensagem: payload.mensagem,
    createdAt: new Date().toISOString(),
  }
  data.notificacoes.unshift(notif)
  writeStore(data)
  return notif
}

export function atualizarLicenca(usuarioId, licencas) {
  const data = readStore()
  data.usuarios = data.usuarios.map((u) => (u.id === usuarioId ? { ...u, licencas: Number(licencas) } : u))
  writeStore(data)
}

export function atualizarStatusBoleto(boletoId, status) {
  const data = readStore()
  data.boletos = data.boletos.map((b) => (b.id === boletoId ? { ...b, status } : b))
  writeStore(data)
}

export function atualizarLicencasUsuario(usuarioId, licencas) {
  const data = readStore()
  data.usuarios = data.usuarios.map((u) => (u.id === usuarioId ? { ...u, licencas: Number(licencas) } : u))
  writeStore(data)
}

export function gerarSenhaAleatoria() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
  let senha = ""
  for (let i = 0; i < 12; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

export function desabilitarInstituicao(instituicaoId) {
  const data = readStore()
  // Desabilita a instituição
  data.instituicoes = data.instituicoes.map((i) => (i.id === instituicaoId ? { ...i, ativo: false } : i))
  // Desabilita todos os usuários desta instituição
  data.usuarios = data.usuarios.map((u) => (u.instituicaoId === instituicaoId ? { ...u, ativo: false } : u))
  writeStore(data)
}

export function habilitarInstituicao(instituicaoId) {
  const data = readStore()
  data.instituicoes = data.instituicoes.map((i) => (i.id === instituicaoId ? { ...i, ativo: true } : i))
  // Habilita todos os usuários desta instituição novamente
  data.usuarios = data.usuarios.map((u) => (u.instituicaoId === instituicaoId ? { ...u, ativo: true } : u))
  writeStore(data)
}

export function desabilitarUsuario(usuarioId) {
  const data = readStore()
  data.usuarios = data.usuarios.map((u) => (u.id === usuarioId ? { ...u, ativo: false } : u))
  writeStore(data)
}

export function habilitarUsuario(usuarioId) {
  const data = readStore()
  data.usuarios = data.usuarios.map((u) => (u.id === usuarioId ? { ...u, ativo: true } : u))
  writeStore(data)
}

export function criarBoleto(payload) {
  const data = readStore()
  const boleto = {
    id: crypto.randomUUID(),
    instituicaoId: payload.instituicaoId,
    referencia: payload.referencia,
    valor: Number(payload.valor),
    status: "pendente",
  }
  data.boletos.unshift(boleto)
  writeStore(data)
  return boleto
}

export function deletarBoleto(boletoId) {
  const data = readStore()
  data.boletos = data.boletos.filter((b) => b.id !== boletoId)
  writeStore(data)
}

export function deletarUsuario(usuarioId) {
  const data = readStore()
  data.usuarios = data.usuarios.filter((u) => u.id !== usuarioId)
  writeStore(data)
}

export function editarUsuario(usuarioId, dados) {
  const data = readStore()
  data.usuarios = data.usuarios.map((u) => 
    u.id === usuarioId ? { ...u, ...dados } : u
  )
  writeStore(data)
}

export function editarInstituicao(instituicaoId, dados) {
  const data = readStore()
  data.instituicoes = data.instituicoes.map((inst) =>
    inst.id === instituicaoId ? { ...inst, ...dados } : inst
  )
  writeStore(data)
}

export function deletarInstituicao(instituicaoId) {
  const data = readStore()
  // Deleta a instituição
  data.instituicoes = data.instituicoes.filter((i) => i.id !== instituicaoId)
  // Deleta todos os usuários desta instituição
  data.usuarios = data.usuarios.filter((u) => u.instituicaoId !== instituicaoId)
  // Deleta todos os boletos desta instituição
  data.boletos = data.boletos.filter((b) => b.instituicaoId !== instituicaoId)
  writeStore(data)
}

export async function obterTokensCohere() {
  try {
    const response = await fetch("/api/cohere/tokens")
    if (!response.ok) throw new Error("Erro ao obter tokens da Cohere")
    const data = await response.json()
    return data.totalTokens || 0
  } catch (error) {
    console.error("Erro ao obter tokens Cohere:", error)
    return 0
  }
}

export function gerarQRCodePix(valor, chave, nome) {
  // Gerar dados do QR Code Pix (formato EMV)
  // Essa é uma simplificação - em produção usar biblioteca profissional
  const pixData = `00020126580014br.gov.bcb.pix`
  return {
    tipo: "pix",
    chave,
    valor,
    nome,
    qrData: pixData,
  }
}

export function gerarCodigoBarras(referencia, valor) {
  // Retorna dados para gerar código de barras
  // Usar biblioteca como jsbarcode para renderizar
  return {
    tipo: "boleto",
    referencia,
    valor,
    codigo: referencia.replace(/\D/g, ""), // remove caracteres não numéricos
  }
}

