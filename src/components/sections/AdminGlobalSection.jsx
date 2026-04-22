import { useMemo, useState, useRef, useEffect } from "react"
import { supabase } from "../../services/supabaseClient"
import { useSpectrum } from "../../context/SpectrumContext"
import { AlertCircle, BarChart3, Users, CreditCard, Mail, Building2, QrCode, Trash2, Info, CheckCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import JsBarcode from "jsbarcode"
import AppIcon from "../ui/AppIcon"
import { calcularValorBoleto } from "../../utils/pricing"

export default function AdminGlobalSection({ active, activeSection }) {
  const {
    adminData,
    usuario,
    criarInstituicao,
    editarInstituicao,
    criarSubadmin,
    enviarNotificacaoAdmin,
    atualizarStatusBoleto,
    desabilitarInstituicao,
    habilitarInstituicao,
    desabilitarInstituicaoComMembros,
    habilitarInstituicaoComMembros,
    desabilitarUsuario,
    habilitarUsuario,
    desabilitarUsuarioComInstituicao,
    habilitarUsuarioComInstituicao,
    criarBoleto,
    deletarBoleto,
    deletarUsuario,
    editarUsuario,
    deletarInstituicao,
    atualizarTokensCohere,
    toast,
  } = useSpectrum()

  // Helpers para ícones e cores de notificação
  const getIconForNotificationType = (tipo) => {
    switch (tipo) {
      case "alerta":
        return AlertCircle
      case "info":
        return Info
      case "sucesso":
        return CheckCircle
      default:
        return AlertCircle
    }
  }

  const getColorForNotificationType = (tipo) => {
    switch (tipo) {
      case "alerta":
        return "#ff6b6b"
      case "info":
        return "#4dabf7"
      case "sucesso":
        return "#51cf66"
      default:
        return "#4dabf7"
    }
  }

  const [activeTab, setActiveTab] = useState("dashboard")
  const [inst, setInst] = useState({ nome: "", cnpj: "", plano: "Enterprise", limiteUsuarios: "" })
  const [editInstId, setEditInstId] = useState(null)
  const [sub, setSub] = useState({ instituicaoId: "", nome: "", email: "", senha: "" })
  const [mensagem, setMensagem] = useState({ titulo: "", conteudo: "", tipo: "info" })
  const [boleto, setBoleto] = useState({ instituicaoId: "", referencia: "", valor: "" })
  const [usuarioEdit, setUsuarioEdit] = useState(null)
  const [boletoModal, setBoletoModal] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [reauthOpen, setReauthOpen] = useState(false)
  const [reauthPassword, setReauthPassword] = useState("")
  const [reauthLoading, setReauthLoading] = useState(false)
  const [filtroConta, setFiltroConta] = useState("todos")
  const [buscaUsuario, setBuscaUsuario] = useState("")
  const barcodeRef = useRef(null)

  const PIX_KEY = "gugomes6@gmail.com"
  const PIX_MERCHANT_NAME = "Gustavo Gomes Silva"
  const PIX_MERCHANT_CITY = "Santo André"

  const LICENCA_DESCRIPTIONS = {
    Enterprise: "Instituição com recursos completos, suporte prioritário e maior limite de usuários.",
    Personal: "Instituição embarca com recursos básicos para uso individual ou pequenas equipes.",
  }

  const USUARIO_LICENCAS = ["PRO", "Basic", "Secretaria", "Sem Licença"]

  const formatPixAmount = (value) => {
    const amount = Number(value) || 0
    return amount.toFixed(2)
  }

  const buildPixPayload = (key, amount, merchantName, merchantCity, reference = "") => {
    const encoder = new TextEncoder()
    const payloadTag = (tag, value) => {
      const encoded = encoder.encode(String(value || ""))
      return `${tag}${String(encoded.length).padStart(2, "0")}${value}`
    }
    const cleanedKey = String(key || "").trim()
    const amountValue = Number(amount)
    const formattedAmount = amountValue > 0 ? formatPixAmount(amountValue) : ""
    const merchantNameValue = String(merchantName || "").toUpperCase().slice(0, 25)
    const merchantCityValue = String(merchantCity || "").toUpperCase().slice(0, 15)
    const transactionId = String(reference || "PIXREF").slice(0, 25)
    const initiationMethod = formattedAmount ? "12" : "11"

    const merchantAccountInfo = [
      payloadTag("00", "br.gov.bcb.pix"),
      payloadTag("01", cleanedKey),
    ].join("")

    const payload = [
      payloadTag("00", "01"),
      payloadTag("01", initiationMethod),
      payloadTag("26", merchantAccountInfo),
      payloadTag("52", "0000"),
      payloadTag("53", "986"),
      formattedAmount ? payloadTag("54", formattedAmount) : "",
      payloadTag("58", "BR"),
      payloadTag("59", merchantNameValue),
      payloadTag("60", merchantCityValue),
      payloadTag("62", payloadTag("05", transactionId)),
    ]
      .filter(Boolean)
      .join("")

    const payloadWithCRC = `${payload}6304`
    const crc = calculateCRC16(payloadWithCRC)
    return `${payloadWithCRC}${crc}`
  }

  const calculateCRC16 = (payload) => {
    let crc = 0xFFFF
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0")
  }

  const buildBoletoBarcode = (reference, amount) => {
    const numericReference = reference.replace(/\D/g, "").padStart(10, "0").slice(0, 10)
    const amountValue = String(Math.round((Number(amount) || 0) * 100)).padStart(10, "0")
    const base = `0019${amountValue}${numericReference}`.padEnd(44, "0")
    return base.slice(0, 44)
  }

  const pixPayload = boletoModal ? buildPixPayload(PIX_KEY, boletoModal.valor, PIX_MERCHANT_NAME, PIX_MERCHANT_CITY, boletoModal.referencia) : ""
  const barcodeValue = boletoModal ? buildBoletoBarcode(boletoModal.referencia, boletoModal.valor) : ""

  // Gerar código de barras quando o modal de boleto é aberto
  useEffect(() => {
    if (boletoModal && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
        })
      } catch (err) {
        console.error("Erro ao gerar código de barras:", err)
      }
    }
  }, [boletoModal, barcodeValue])

  const instituicoes = adminData?.instituicoes || []
  const boletos = adminData?.boletos || []
  const notificacoes = adminData?.notificacoes || []
  const usuarios = adminData?.usuarios || []
  const iaMetrics = adminData?.iaMetrics || {}

  const instituicoesPorUsuario = useMemo(
    () =>
      instituicoes.map((inst) => ({
        ...inst,
        usuarios: usuarios.filter((u) => u.instituicaoId === inst.id && u.ativo).length,
        usuariosTotal: usuarios.filter((u) => u.instituicaoId === inst.id).length,
        limiteUsuarios: inst.limiteUsuarios || 0,
      })),
    [instituicoes, usuarios],
  )

  const resumo = useMemo(
    () => ({
      totalInstituicoes: instituicoes.length,
      instituicoesAticas: instituicoes.filter((i) => i.ativo).length,
      totalUsuarios: usuarios.filter((u) => u.ativo).length,
      usuariosTotal: usuarios.length,
      boletosPendentes: boletos.filter((b) => b.status === "pendente").length,
      boletosPagos: boletos.filter((b) => b.status === "pago").length,
      notificacoesEnviadas: notificacoes.length,
      totalTokens: iaMetrics.totalTokens || 0,
      custoEstimado: iaMetrics.custoEstimado || 0,
    }),
    [instituicoes, usuarios, boletos, notificacoes, iaMetrics],
  )

  // Calcular valor sugerido do boleto baseado na instituição selecionada
  const valorSugeridoBoleto = useMemo(() => {
    if (!boleto.instituicaoId) return ""
    const instituicaoSelecionada = instituicoes.find((i) => i.id === boleto.instituicaoId)
    if (!instituicaoSelecionada) return ""
    const usuariosDaInstituicao = usuarios.filter((u) => u.instituicaoId === boleto.instituicaoId && u.ativo)
    const valor = calcularValorBoleto(instituicaoSelecionada.plano || "Pessoal", usuariosDaInstituicao)
    return valor.toString()
  }, [boleto.instituicaoId, instituicoes, usuarios])

  // Atualizar o valor sugerido automaticamente quando a instituição muda
  useEffect(() => {
    if (valorSugeridoBoleto && !boleto.valor) {
      setBoleto((s) => ({ ...s, valor: valorSugeridoBoleto }))
    }
  }, [valorSugeridoBoleto, boleto.instituicaoId])

  const senhaForte = (senha) =>
    typeof senha === "string" && senha.length >= 8 && /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /\d/.test(senha) && /[^A-Za-z0-9]/.test(senha)

  const usuariosFiltrados = useMemo(() => {
    const termo = buscaUsuario.trim().toLowerCase()
    return usuarios.filter((u) => {
      const tipoConta = u.trial ? "trial" : u.contaPessoal ? "pessoal" : "institucional"
      const passaConta = filtroConta === "todos" || filtroConta === tipoConta
      const passaBusca = !termo || `${u.nome} ${u.email} ${u.papel}`.toLowerCase().includes(termo)
      return passaConta && passaBusca
    })
  }, [usuarios, filtroConta, buscaUsuario])

  useEffect(() => {
    if (!active) return
    if (activeSection === "admin-notificacoes") {
      setActiveTab("notificacoes")
      return
    }
    if (activeSection === "admin-global") {
      setActiveTab((prev) => (prev === "notificacoes" ? "dashboard" : prev))
    }
  }, [active, activeSection])

  if (!active) return <section className="secao" />

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-admin-global" aria-label="Painel admin global">
      <div className="secao-corpo">
        {/* Abas */}
        <div className="tabs-admin" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--cor-borda)", paddingBottom: "0.75rem", overflowX: "auto" }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart3 },
            { id: "clientes", label: "Clientes", icon: Building2 },
            { id: "boletos", label: "Boletos", icon: CreditCard },
            { id: "notificacoes", label: "Notificações", icon: Mail },
            { id: "usuarios", label: "Usuários", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-admin-btn ${activeTab === tab.id ? "ativo" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: "none",
                border: "none",
                padding: "0.75rem 1rem",
                color: activeTab === tab.id ? "var(--cor-primaria)" : "var(--cor-texto-secundario)",
                borderBottom: activeTab === tab.id ? "2px solid var(--cor-primaria)" : "none",
                cursor: "pointer",
                fontWeight: activeTab === tab.id ? "600" : "400",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
                transition: "all var(--transicao)",
              }}
            >
              <AppIcon icon={tab.icon} size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div className="metricas-grid">
              <div className="metrica-card">
                <div className="metrica-label">Instituições ativas</div>
                <div className="metrica-valor">{resumo.instituicoesAticas}</div>
                <div className="metrica-label" style={{ fontSize: "0.75rem", color: "var(--cor-texto-secundario)" }}>
                  de {resumo.totalInstituicoes}
                </div>
              </div>
              <div className="metrica-card">
                <div className="metrica-label">Usuários ativos</div>
                <div className="metrica-valor">{resumo.totalUsuarios}</div>
                <div className="metrica-label" style={{ fontSize: "0.75rem", color: "var(--cor-texto-secundario)" }}>
                  de {resumo.usuariosTotal}
                </div>
              </div>
              <div className="metrica-card">
                <div className="metrica-label">Boletos pendentes</div>
                <div className="metrica-valor">{resumo.boletosPendentes}</div>
                <div className="metrica-label" style={{ fontSize: "0.75rem", color: "var(--cor-texto-secundario)" }}>
                  {resumo.boletosPagos} pagos
                </div>
              </div>
              <div className="metrica-card">
                <div className="metrica-label">Tokens IA usados</div>
                <div className="metrica-valor">{(resumo.totalTokens / 1000).toFixed(1)}k</div>
                <div className="metrica-label" style={{ fontSize: "0.75rem", color: "var(--cor-texto-secundario)" }}>
                  R$ {resumo.custoEstimado.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="card mb-3" style={{ marginTop: "1.5rem" }}>
              <div className="card-cabecalho">
                <span className="card-titulo">Resumo de uso da IA</span>
              </div>
              <div className="card-corpo">
                <div className="linha-campos" style={{ gap: "1rem" }}>
                  <div>
                    <div className="metrica-label">Total de tokens</div>
                    <div className="metrica-valor">{iaMetrics.totalTokens?.toLocaleString() ?? "0"}</div>
                  </div>
                  <div>
                    <div className="metrica-label">Adaptações realizadas</div>
                    <div className="metrica-valor">{iaMetrics.adaptacoesRealizadas ?? 0}</div>
                  </div>
                  <div>
                    <div className="metrica-label">Perguntas chat</div>
                    <div className="metrica-valor">{iaMetrics.perguntasChat ?? 0}</div>
                  </div>
                  <div>
                    <div className="metrica-label">Custo estimado</div>
                    <div className="metrica-valor">R$ {Number(iaMetrics.custoEstimado ?? 0).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CLIENTES */}
        {activeTab === "clientes" && (
          <div>
            <div className="card mb-3">
              <div className="card-cabecalho">
                <span className="card-titulo">Criar instituição</span>
              </div>
              <div className="card-corpo">
                <div className="linha-campos">
                  <input className="campo" placeholder="Nome da instituição" value={inst.nome} onChange={(e) => setInst((s) => ({ ...s, nome: e.target.value }))} />
                  <input className="campo" placeholder="CNPJ" value={inst.cnpj} onChange={(e) => setInst((s) => ({ ...s, cnpj: e.target.value }))} />
                </div>
                <div className="linha-campos">
                  <select className="campo" value={inst.plano} onChange={(e) => setInst((s) => ({ ...s, plano: e.target.value }))}>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Personal">Personal</option>
                  </select>
                  <input
                    className="campo"
                    type="number"
                    min="0"
                    placeholder="Limite de usuários"
                    value={inst.limiteUsuarios}
                    onChange={(e) => setInst((s) => ({ ...s, limiteUsuarios: e.target.value }))}
                  />
                </div>
                <div className="texto-mudo" style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
                  {LICENCA_DESCRIPTIONS[inst.plano]}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-primario"
                    onClick={async () => {
                      if (!inst.nome || !inst.cnpj || !inst.plano) return toast("Preencha nome, CNPJ e tipo de licença.", "erro")
                      if (!inst.limiteUsuarios || Number(inst.limiteUsuarios) < 0) return toast("Defina um limite válido de usuários.", "erro")
                      if (editInstId) {
                        await editarInstituicao(editInstId, {
                          nome: inst.nome,
                          cnpj: inst.cnpj,
                          plano: inst.plano,
                          limiteUsuarios: Number(inst.limiteUsuarios),
                        })
                        toast("Instituição atualizada.", "sucesso")
                      } else {
                        await criarInstituicao(inst)
                        toast("Instituição criada.", "sucesso")
                      }
                      setInst({ nome: "", cnpj: "", plano: "Enterprise", limiteUsuarios: "" })
                      setEditInstId(null)
                    }}
                  >
                    {editInstId ? "Salvar alterações" : "Criar instituição"}
                  </button>
                  {editInstId ? (
                    <button
                      type="button"
                      className="btn btn-secundario"
                      onClick={() => {
                        setInst({ nome: "", cnpj: "", plano: "Enterprise", limiteUsuarios: "" })
                        setEditInstId(null)
                      }}
                    >
                      Cancelar edição
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-cabecalho">
                <span className="card-titulo">Gestão de clientes</span>
              </div>
              <div className="tabela-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>CNPJ</th>
                      <th>Licença</th>
                      <th>Usuários</th>
                      <th>Limite</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instituicoesPorUsuario.map((i) => (
                      <tr key={i.id}>
                        <td>{i.nome}</td>
                        <td>{i.cnpj}</td>
                        <td>{i.plano || "Trial Institucional"}</td>
                        <td>
                          {i.usuarios}/{i.usuariosTotal}
                        </td>
                        <td>{i.limiteUsuarios || 0}</td>
                        <td>
                          <span className={`badge ${i.ativo ? "badge-verde" : "badge-vermelho"}`}>
                            {i.ativo ? "Ativa" : "Inativa"}
                          </span>
                        </td>
                        <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="btn btn-secundario btn-sm"
                            onClick={() => {
                              setEditInstId(i.id)
                              setInst({
                                nome: i.nome,
                                cnpj: i.cnpj,
                                plano: i.plano || "PRO",
                                limiteUsuarios: String(i.limiteUsuarios || ""),
                              })
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={`btn ${i.ativo ? "btn-perigo" : "btn-secundario"} btn-sm`}
                            onClick={async () => {
                              if (i.ativo) {
                                await desabilitarInstituicaoComMembros(i.id)
                                toast("Instituição e seus membros foram bloqueados.", "sucesso")
                              } else {
                                await habilitarInstituicaoComMembros(i.id)
                                toast("Instituição e seus membros foram desbloqueados.", "sucesso")
                              }
                            }}
                          >
                            {i.ativo ? "Desabilitar" : "Habilitar"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-perigo btn-sm"
                            onClick={() => setConfirmDelete({ tipo: "cliente", id: i.id, nome: i.nome })}
                          >
                            <AppIcon icon={Trash2} size={14} style={{ marginRight: "0.25rem" }} />
                            Excluir cliente
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BOLETOS */}
        {activeTab === "boletos" && (
          <div>
            <div className="card mb-3">
              <div className="card-cabecalho">
                <span className="card-titulo">Criar boleto</span>
              </div>
              <div className="card-corpo">
                <select className="campo" value={boleto.instituicaoId} onChange={(e) => setBoleto((s) => ({ ...s, instituicaoId: e.target.value, valor: "" }))}>
                  <option value="">Selecione a instituição</option>
                  {instituicoes.filter((i) => i.ativo).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                    </option>
                  ))}
                </select>
                {boleto.instituicaoId && valorSugeridoBoleto && (
                  <div style={{ padding: "0.75rem", backgroundColor: "var(--cor-fundo-secundario)", borderRadius: "0.5rem", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                    <strong>📊 Prévia calculada:</strong> R$ {parseFloat(valorSugeridoBoleto).toFixed(2)} 
                    <div style={{ fontSize: "0.85rem", color: "var(--cor-texto-secundario)", marginTop: "0.25rem" }}>
                      (Baseado no tipo de instituição e licenças dos usuários - Você pode alterar)
                    </div>
                  </div>
                )}
                <div className="linha-campos">
                  <input className="campo" placeholder="Referência (ex: 04/2026)" value={boleto.referencia} onChange={(e) => setBoleto((s) => ({ ...s, referencia: e.target.value }))} />
                  <input className="campo" placeholder="Valor (R$)" type="number" step="0.01" value={boleto.valor} onChange={(e) => setBoleto((s) => ({ ...s, valor: e.target.value }))} />
                </div>
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={async () => {
                    if (!boleto.instituicaoId || !boleto.referencia || !boleto.valor) return toast("Preencha todos os campos.", "erro")
                    await criarBoleto(boleto)
                    setBoleto({ instituicaoId: "", referencia: "", valor: "" })
                    toast("Boleto criado com sucesso.", "sucesso")
                  }}
                >
                  Criar boleto
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-cabecalho">
                <span className="card-titulo">Boletos</span>
              </div>
              <div className="tabela-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Instituição</th>
                      <th>Referência</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boletos.map((b) => {
                      const inst = instituicoes.find((i) => i.id === b.instituicaoId)
                      return (
                        <tr key={b.id}>
                          <td>{inst?.nome || "-"}</td>
                          <td>{b.referencia}</td>
                          <td>R$ {Number(b.valor).toFixed(2)}</td>
                          <td>
                            <span className={`badge ${b.status === "pago" ? "badge-verde" : "badge-ambar"}`}>{b.status}</span>
                          </td>
                          <td style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              className="btn btn-secundario btn-sm"
                              onClick={() => setBoletoModal(b)}
                            >
                              <AppIcon icon={QrCode} size={14} style={{ marginRight: "0.25rem" }} />
                              QR/Código
                            </button>
                            <button
                              type="button"
                              className="btn btn-secundario btn-sm"
                              onClick={async () => atualizarStatusBoleto(b.id, b.status === "pago" ? "pendente" : "pago")}
                            >
                              {b.status === "pago" ? "Marcar pendente" : "Marcar pago"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-perigo btn-sm"
                              onClick={() => setConfirmDelete({ tipo: "boleto", id: b.id, referencia: b.referencia })}
                            >
                              <AppIcon icon={Trash2} size={14} style={{ marginRight: "0.25rem" }} />
                              Deletar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICAÇÕES */}
        {activeTab === "notificacoes" && (
          <div>
            <div className="card mb-3">
              <div className="card-cabecalho">
                <span className="card-titulo">Enviar notificação</span>
              </div>
              <div className="card-corpo">
                <label className="campo-label">Título</label>
                <input
                  className="campo"
                  placeholder="Ex: Atualização de sistema"
                  value={mensagem.titulo}
                  onChange={(e) => setMensagem((s) => ({ ...s, titulo: e.target.value }))}
                />
                <label className="campo-label" style={{ marginTop: "1rem" }}>
                  Tipo
                </label>
                <select
                  className="campo"
                  value={mensagem.tipo}
                  onChange={(e) => setMensagem((s) => ({ ...s, tipo: e.target.value }))}
                >
                  <option value="info">Informação</option>
                  <option value="alerta">Alerta</option>
                  <option value="sucesso">Sucesso</option>
                </select>
                <label className="campo-label" style={{ marginTop: "1rem" }}>
                  Mensagem
                </label>
                <textarea
                  className="campo"
                  rows={4}
                  placeholder="Conteúdo da notificação para admins..."
                  value={mensagem.conteudo}
                  onChange={(e) => setMensagem((s) => ({ ...s, conteudo: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn btn-primario"
                  style={{ marginTop: "1rem" }}
                  onClick={async () => {
                    if (!mensagem.titulo || !mensagem.conteudo) return toast("Preencha título e mensagem.", "erro")
                    await enviarNotificacaoAdmin({ titulo: mensagem.titulo, conteudo: mensagem.conteudo, tipo: mensagem.tipo, dataCriacao: new Date().toISOString() })
                    setMensagem({ titulo: "", conteudo: "", tipo: "info" })
                    toast("Notificação enviada.", "sucesso")
                  }}
                >
                  Enviar notificação
                </button>
              </div>
            </div>

            {notificacoes.length > 0 && (
              <div className="card">
                <div className="card-cabecalho">
                  <span className="card-titulo">Notificações enviadas</span>
                </div>
                <div className="card-corpo">
                  {notificacoes.slice(0, 10).map((n) => {
                    const IconComponent = getIconForNotificationType(n.tipo)
                    const color = getColorForNotificationType(n.tipo)
                    return (
                      <div key={n.id} style={{ padding: "1rem", borderBottom: "1px solid var(--cor-borda)", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                        <AppIcon icon={IconComponent} size={20} style={{ color, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "600", color: "var(--cor-texto-principal)" }}>{n.titulo}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--cor-texto-secundario)", marginTop: "0.25rem" }}>{n.conteudo}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--cor-texto-mudo)", marginTop: "0.5rem" }}>
                            {new Date(n.dataCriacao).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* USUÁRIOS */}
        {activeTab === "usuarios" && (
          <div>
            <div className="card mb-3">
              <div className="card-cabecalho">
                <span className="card-titulo">Criar SubAdmin</span>
              </div>
              <div className="card-corpo">
                <select className="campo" value={sub.instituicaoId} onChange={(e) => setSub((s) => ({ ...s, instituicaoId: e.target.value }))}>
                  <option value="">Selecione a instituição</option>
                  {instituicoes.filter((i) => i.ativo).map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                    </option>
                  ))}
                </select>
                <div className="linha-campos">
                  <input className="campo" placeholder="Nome do SubAdmin" value={sub.nome} onChange={(e) => setSub((s) => ({ ...s, nome: e.target.value }))} />
                  <input className="campo" placeholder="Email do SubAdmin" value={sub.email} onChange={(e) => setSub((s) => ({ ...s, email: e.target.value }))} />
                </div>
                <label className="campo-label">Senha (definida manualmente)</label>
                <input
                  className="campo"
                  type="password"
                  placeholder="Mínimo 8, com maiúscula, minúscula, número e símbolo"
                  value={sub.senha}
                  onChange={(e) => setSub((s) => ({ ...s, senha: e.target.value }))}
                />
                <button
                  type="button"
                  className="btn btn-primario"
                  style={{ marginTop: "1rem" }}
                  onClick={async () => {
                    if (!sub.instituicaoId || !sub.nome || !sub.email || !sub.senha) return toast("Preencha todos os campos.", "erro")
                    if (!senhaForte(sub.senha)) return toast("Senha fraca. Use ao menos 8 caracteres com maiúscula, minúscula, número e símbolo.", "erro")
                    const created = await criarSubadmin({ ...sub })
                    if (!created) return
                    setSub({ instituicaoId: "", nome: "", email: "", senha: "" })
                    toast("SubAdmin criado com sucesso. A senha é armazenada com hash seguro pelo provedor de autenticação.", "sucesso")
                  }}
                >
                  Criar SubAdmin
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-cabecalho">
                <span className="card-titulo">Gestão de usuários</span>
              </div>
              <div className="card-corpo">
                <div className="linha-campos">
                  <input
                    className="campo"
                    placeholder="Buscar por nome/email/papel"
                    value={buscaUsuario}
                    onChange={(e) => setBuscaUsuario(e.target.value)}
                  />
                  <select className="campo" value={filtroConta} onChange={(e) => setFiltroConta(e.target.value)}>
                    <option value="todos">Todos os tipos de conta</option>
                    <option value="trial">TRIAL</option>
                    <option value="institucional">INSTITUCIONAL</option>
                    <option value="pessoal">PESSOAL</option>
                  </select>
                </div>
              </div>
              <div className="tabela-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Tipo de conta</th>
                      <th>Instituição</th>
                      <th>Papel</th>
                      <th>Licença</th>
                      <th>Status</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((u) => {
                      const inst = instituicoes.find((i) => i.id === u.instituicaoId)
                      const tipoConta = u.trial ? "TRIAL" : u.contaPessoal ? "PESSOAL" : "INSTITUCIONAL"
                      return (
                        <tr key={u.id} style={{ opacity: !u.ativo ? 0.6 : 1 }}>
                          <td>{u.nome}</td>
                          <td>{u.email}</td>
                          <td>{tipoConta}</td>
                          <td>{inst?.nome || "-"}</td>
                          <td>{u.papel}</td>
                          <td>{u.tipoLicenca || "Basic"}</td>
                          <td>
                            <span className={`badge ${u.ativo ? "badge-verde" : "badge-vermelho"}`}>
                              {u.ativo ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className={`btn ${u.ativo ? "btn-perigo" : "btn-secundario"} btn-sm`}
                              onClick={async () => {
                                if (u.ativo) {
                                  await desabilitarUsuarioComInstituicao(u.id, u.instituicaoId)
                                  toast("Usuário e membros da instituição foram bloqueados.", "sucesso")
                                } else {
                                  await habilitarUsuarioComInstituicao(u.id, u.instituicaoId)
                                  toast("Usuário e membros da instituição foram desbloqueados.", "sucesso")
                                }
                              }}
                            >
                              {u.ativo ? "Bloquear" : "Desbloquear"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secundario btn-sm"
                              onClick={() => setUsuarioEdit(u)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-perigo btn-sm"
                              onClick={() => setConfirmDelete({ tipo: "usuario", id: u.id, nome: u.nome })}
                            >
                              <AppIcon icon={Trash2} size={14} style={{ marginRight: "0.25rem" }} />
                              Deletar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {usuarioEdit && (
              <div style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}>
                <div className="card" style={{ width: "90%", maxWidth: "400px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span className="card-titulo">Editar Usuário</span>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
                      onClick={() => setUsuarioEdit(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="card-corpo">
                    <label className="campo-label">Nome</label>
                    <input
                      className="campo"
                      value={usuarioEdit.nome}
                      onChange={(e) => setUsuarioEdit((u) => ({ ...u, nome: e.target.value }))}
                    />
                    <label className="campo-label" style={{ marginTop: "1rem" }}>
                      Email
                    </label>
                    <input
                      className="campo"
                      value={usuarioEdit.email}
                      onChange={(e) => setUsuarioEdit((u) => ({ ...u, email: e.target.value }))}
                    />
                    <label className="campo-label" style={{ marginTop: "1rem" }}>
                      Papel
                    </label>
                    <select
                      className="campo"
                      value={usuarioEdit.papel}
                      onChange={(e) => setUsuarioEdit((u) => ({ ...u, papel: e.target.value }))}
                    >
                      <option value="professor">Professor</option>
                      <option value="psico">Psicopedagogo</option>
                      <option value="secretaria">Secretária</option>
                      <option value="subadmin">SubAdmin</option>
                    </select>
                    <label className="campo-label" style={{ marginTop: "1rem" }}>
                      Licença
                    </label>
                    <select
                      className="campo"
                      value={usuarioEdit.tipoLicenca || "Basic"}
                      onChange={(e) => setUsuarioEdit((u) => ({ ...u, tipoLicenca: e.target.value }))}
                    >
                      {USUARIO_LICENCAS.map((lic) => (
                        <option key={lic} value={lic}>
                          {lic}
                        </option>
                      ))}
                    </select>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem" }}>
                      <button
                        type="button"
                        className="btn btn-primario"
                        style={{ flex: 1 }}
                        onClick={async () => {
                          await editarUsuario(usuarioEdit.id, {
                            nome: usuarioEdit.nome,
                            email: usuarioEdit.email,
                            papel: usuarioEdit.papel,
                            tipoLicenca: usuarioEdit.tipoLicenca || "Basic",
                          })
                          setUsuarioEdit(null)
                          toast("Usuário atualizado.", "sucesso")
                        }}
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="btn btn-secundario"
                        style={{ flex: 1 }}
                        onClick={() => setUsuarioEdit(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
        {boletoModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}>
            <div className="card" style={{ width: "90%", maxWidth: "500px", maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <span className="card-titulo">QR Code & Código de Barras</span>
                <button
                  type="button"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem" }}
                  onClick={() => setBoletoModal(null)}
                >
                  ✕
                </button>
              </div>
              <div className="card-corpo">
                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--cor-texto-secundario)", marginBottom: "0.5rem" }}>
                    <strong>Referência:</strong> {boletoModal.referencia}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--cor-texto-secundario)", marginBottom: "1rem" }}>
                    <strong>Valor:</strong> R$ {Number(boletoModal.valor).toFixed(2)}
                  </div>
                </div>

                <div style={{ 
                  border: "1px solid var(--cor-borda)", 
                  padding: "1.5rem", 
                  borderRadius: "0.5rem",
                  backgroundColor: "#f8f8f8",
                  marginBottom: "1.5rem",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--cor-texto-secundario)", marginBottom: "0.75rem" }}>
                    QR Code Pix
                  </div>
                  <div style={{
                    background: "white",
                    padding: "1rem",
                    borderRadius: "0.25rem",
                    display: "inline-block",
                  }}>
                    <QRCodeSVG 
                      value={pixPayload}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--cor-texto-mudo)", marginTop: "0.75rem" }}>
                    Aponte a câmera para pagar com Pix
                  </div>
                </div>

                <div style={{ 
                  border: "1px solid var(--cor-borda)", 
                  padding: "1.5rem", 
                  borderRadius: "0.5rem",
                  backgroundColor: "#f8f8f8",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--cor-texto-secundario)", marginBottom: "0.75rem" }}>
                    Código de Barras
                  </div>
                  <div style={{
                    background: "white",
                    padding: "1rem",
                    borderRadius: "0.25rem",
                    overflowX: "auto",
                  }}>
                    <svg ref={barcodeRef}></svg>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--cor-texto-mudo)", marginTop: "0.75rem" }}>
                    Use este código em pagamentos por boleto
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secundario"
                  style={{ width: "100%", marginTop: "1.5rem" }}
                  onClick={() => setBoletoModal(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmDelete && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}>
            <div className="card" style={{ width: "90%", maxWidth: "400px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <AppIcon icon={Trash2} size={24} style={{ color: "var(--cor-perigo)" }} />
                <span className="card-titulo">Confirmar Exclusão</span>
              </div>
              <div className="card-corpo">
                {confirmDelete.tipo === "cliente" && (
                  <div>
                    <p style={{ marginBottom: "1rem", color: "var(--cor-texto-principal)" }}>
                      Tem certeza que deseja excluir o cliente <strong>{confirmDelete.nome}</strong>?
                    </p>
                    <div style={{ 
                      background: "rgba(255, 0, 0, 0.1)", 
                      padding: "0.75rem", 
                      borderRadius: "0.25rem",
                      borderLeft: "3px solid var(--cor-perigo)",
                      marginBottom: "1rem",
                      fontSize: "0.85rem",
                      color: "var(--cor-texto-secundario)"
                    }}>
                      ⚠️ Isso também excluirá todos os <strong>usuários</strong> e <strong>boletos</strong> deste cliente. A ação é irreversível.
                    </div>
                  </div>
                )}
                {confirmDelete.tipo === "boleto" && (
                  <div>
                    <p style={{ marginBottom: "1rem", color: "var(--cor-texto-principal)" }}>
                      Tem certeza que deseja deletar o boleto <strong>{confirmDelete.referencia}</strong>?
                    </p>
                    <div style={{ 
                      background: "rgba(255, 0, 0, 0.1)", 
                      padding: "0.75rem", 
                      borderRadius: "0.25rem",
                      borderLeft: "3px solid var(--cor-perigo)",
                      marginBottom: "1rem",
                      fontSize: "0.85rem",
                      color: "var(--cor-texto-secundario)"
                    }}>
                      ⚠️ Esta ação é irreversível.
                    </div>
                  </div>
                )}
                {confirmDelete.tipo === "usuario" && (
                  <div>
                    <p style={{ marginBottom: "1rem", color: "var(--cor-texto-principal)" }}>
                      Tem certeza que deseja deletar o usuário <strong>{confirmDelete.nome}</strong>?
                    </p>
                    <div style={{ 
                      background: "rgba(255, 0, 0, 0.1)", 
                      padding: "0.75rem", 
                      borderRadius: "0.25rem",
                      borderLeft: "3px solid var(--cor-perigo)",
                      marginBottom: "1rem",
                      fontSize: "0.85rem",
                      color: "var(--cor-texto-secundario)"
                    }}>
                      ⚠️ Esta ação é irreversível.
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                          <button
                    type="button"
                    className="btn btn-perigo"
                    style={{ flex: 1 }}
                    onClick={async () => {
                        try {
                          if (confirmDelete.tipo === "usuario") {
                            // abrir modal de reauth para confirmar senha
                            setReauthOpen(true)
                            return
                          }

                          if (confirmDelete.tipo === "cliente") {
                            await deletarInstituicao(confirmDelete.id)
                            toast("Cliente deletado com sucesso.", "sucesso")
                          } else if (confirmDelete.tipo === "boleto") {
                            await deletarBoleto(confirmDelete.id)
                            toast("Boleto deletado com sucesso.", "sucesso")
                          }
                          setConfirmDelete(null)
                        } catch (erro) {
                          console.error("Erro ao deletar:", erro)
                          toast("Erro ao deletar. Tente novamente.", "erro")
                        }
                    }}
                  >
                    Sim, deletar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secundario"
                    style={{ flex: 1 }}
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Re-auth modal: confirmar senha do admin antes de deletar usuário */}
        {reauthOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}>
            <div className="card" style={{ width: "90%", maxWidth: "360px" }}>
              <div className="card-corpo">
                <h3 className="card-titulo">Confirme sua senha</h3>
                <p style={{ marginBottom: "1rem" }}>Digite sua senha para confirmar a exclusão do usuário <strong>{confirmDelete?.nome}</strong>.</p>
                <input
                  className="campo"
                  type="password"
                  placeholder="Senha"
                  value={reauthPassword}
                  onChange={(e) => setReauthPassword(e.target.value)}
                  disabled={reauthLoading}
                />
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    className="btn btn-perigo"
                    style={{ flex: 1 }}
                    onClick={async () => {
                      try {
                        setReauthLoading(true)
                        const email = usuario?.email
                        if (!email) throw new Error('Usuário admin não encontrado. Faça login novamente.')
                        const { error, data } = await supabase.auth.signInWithPassword({ email: String(email).trim(), password: reauthPassword })
                        console.log('[REAUTH] signInWithPassword result', { error, data })
                        if (error) {
                          throw error
                        }
                        // Garantir que a sessão retornada seja aplicada ao cliente
                        try {
                          if (data?.session) {
                            await supabase.auth.setSession({
                              access_token: data.session.access_token,
                              refresh_token: data.session.refresh_token,
                            })
                          }
                        } catch (setErr) {
                          console.warn('Não foi possível setSession:', setErr)
                        }
                        const sessAfter = await supabase.auth.getSession()
                        console.log('[REAUTH] session after setSession/getSession', sessAfter)
                        // Após reauth, efetuar a deleção (com sessão aplicada)
                        await deletarUsuario(confirmDelete.id)
                        toast('Usuário deletado com sucesso.', 'sucesso')
                        setReauthOpen(false)
                        setConfirmDelete(null)
                        setReauthPassword('')
                      } catch (err) {
                        console.error('Reauth falhou:', err)
                        toast(err?.message || 'Falha ao reautenticar. Tente novamente.', 'erro')
                      } finally {
                        setReauthLoading(false)
                      }
                    }}
                    disabled={reauthLoading}
                  >
                    Confirmar e deletar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secundario"
                    style={{ flex: 1 }}
                    onClick={() => { setReauthOpen(false); setReauthPassword('') }}
                    disabled={reauthLoading}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
