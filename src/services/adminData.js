const KEY = "spectrum_admin_data_v1"

const DEFAULT_DATA = {
  instituicoes: [
    { id: "inst-1", nome: "Colégio Horizonte", cnpj: "12.345.678/0001-90", plano: "Enterprise 120", statusBoleto: "pago" },
    { id: "inst-2", nome: "Escola Nova Geração", cnpj: "98.765.432/0001-11", plano: "Business 40", statusBoleto: "pendente" },
  ],
  usuarios: [
    { id: "u-1", instituicaoId: "inst-1", nome: "Carla Souza", email: "carla@horizonte.edu.br", papel: "subadmin", licencas: 12 },
    { id: "u-2", instituicaoId: "inst-1", nome: "Lucas Lima", email: "lucas@horizonte.edu.br", papel: "professor", licencas: 1 },
    { id: "u-3", instituicaoId: "inst-2", nome: "Renata Alves", email: "renata@novageracao.edu.br", papel: "subadmin", licencas: 5 },
  ],
  notificacoes: [],
  boletos: [
    { id: "b-1", instituicaoId: "inst-1", referencia: "04/2026", valor: 1290, status: "pago" },
    { id: "b-2", instituicaoId: "inst-2", referencia: "04/2026", valor: 590, status: "pendente" },
  ],
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
    statusBoleto: "pendente",
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

