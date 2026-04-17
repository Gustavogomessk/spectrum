import { useMemo, useState } from "react"
import { useSpectrum } from "../../context/SpectrumContext"

export default function AdminGlobalSection({ active }) {
  const { adminData, criarInstituicao, criarSubadmin, enviarNotificacaoAdmin, atualizarStatusBoleto, toast } = useSpectrum()
  const [inst, setInst] = useState({ nome: "", cnpj: "", plano: "" })
  const [sub, setSub] = useState({ instituicaoId: "", nome: "", email: "" })
  const [mensagem, setMensagem] = useState("")

  const instituicoes = adminData?.instituicoes || []
  const boletos = adminData?.boletos || []
  const notificacoes = adminData?.notificacoes || []
  const usuarios = adminData?.usuarios || []
  const iaMetrics = adminData?.iaMetrics || {}

  const instituicoesPorUsuario = useMemo(
    () =>
      instituicoes.map((inst) => ({
        ...inst,
        usuarios: usuarios.filter((u) => u.instituicaoId === inst.id).length,
      })),
    [instituicoes, usuarios],
  )

  const resumo = useMemo(
    () => ({
      totalInstituicoes: instituicoes.length,
      totalUsuarios: usuarios.length,
      boletosPendentes: boletos.filter((b) => b.status === "pendente").length,
      notificacoesEnviadas: notificacoes.length,
      totalTokens: iaMetrics.totalTokens || 0,
      custoEstimado: iaMetrics.custoEstimado || 0,
    }),
    [instituicoes, usuarios, boletos, notificacoes, iaMetrics],
  )

  if (!active) return <section className="secao" />

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-admin-global" aria-label="Painel admin global">
      <div className="secao-corpo">
        <div className="metricas-grid">
          <div className="metrica-card">
            <div className="metrica-label">Instituições</div>
            <div className="metrica-valor">{resumo.totalInstituicoes}</div>
          </div>
          <div className="metrica-card">
            <div className="metrica-label">Usuários</div>
            <div className="metrica-valor">{resumo.totalUsuarios}</div>
          </div>
          <div className="metrica-card">
            <div className="metrica-label">Boletos pendentes</div>
            <div className="metrica-valor">{resumo.boletosPendentes}</div>
          </div>
          <div className="metrica-card">
            <div className="metrica-label">Tokens IA usados</div>
            <div className="metrica-valor">{resumo.totalTokens.toLocaleString()}</div>
          </div>
        </div>

        <div className="card mb-3">
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
                <div className="metrica-label">Adaptações</div>
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

        <div className="card mb-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Gestão de clientes</span>
          </div>
          <div className="tabela-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Plano</th>
                  <th>Usuários</th>
                  <th>Status boleto</th>
                </tr>
              </thead>
              <tbody>
                {instituicoesPorUsuario.map((i) => (
                  <tr key={i.id}>
                    <td>{i.nome}</td>
                    <td>{i.cnpj}</td>
                    <td>{i.plano || "Trial Institucional"}</td>
                    <td>{i.usuarios}</td>
                    <td>
                      <span className={`badge ${i.statusBoleto === "pago" ? "badge-verde" : "badge-ambar"}`}>
                        {i.statusBoleto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mb-3">
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
                      <td>
                        <button
                          type="button"
                          className="btn btn-secundario btn-sm"
                          onClick={() => atualizarStatusBoleto(b.id, b.status === "pago" ? "pendente" : "pago")}
                        >
                          Marcar {b.status === "pago" ? "pendente" : "pago"}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Criar instituição</span>
          </div>
          <div className="card-corpo">
            <div className="linha-campos">
              <input className="campo" placeholder="Nome da instituição" value={inst.nome} onChange={(e) => setInst((s) => ({ ...s, nome: e.target.value }))} />
              <input className="campo" placeholder="CNPJ" value={inst.cnpj} onChange={(e) => setInst((s) => ({ ...s, cnpj: e.target.value }))} />
            </div>
            <input className="campo" placeholder="Plano (ex.: Enterprise 120)" value={inst.plano} onChange={(e) => setInst((s) => ({ ...s, plano: e.target.value }))} />
            <button
              type="button"
              className="btn btn-primario"
              onClick={() => {
                if (!inst.nome || !inst.cnpj) return toast("Preencha nome e CNPJ.", "erro")
                criarInstituicao(inst)
                setInst({ nome: "", cnpj: "", plano: "" })
                toast("Instituição criada.", "sucesso")
              }}
            >
              Criar instituição
            </button>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Criar SubAdmin</span>
          </div>
          <div className="card-corpo">
            <select className="campo" value={sub.instituicaoId} onChange={(e) => setSub((s) => ({ ...s, instituicaoId: e.target.value }))}>
              <option value="">Selecione a instituição</option>
              {instituicoes.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome}
                </option>
              ))}
            </select>
            <div className="linha-campos">
              <input className="campo" placeholder="Nome do SubAdmin" value={sub.nome} onChange={(e) => setSub((s) => ({ ...s, nome: e.target.value }))} />
              <input className="campo" placeholder="Email do SubAdmin" value={sub.email} onChange={(e) => setSub((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <button
              type="button"
              className="btn btn-primario"
              onClick={() => {
                if (!sub.instituicaoId || !sub.nome || !sub.email) return toast("Preencha todos os campos.", "erro")
                criarSubadmin(sub)
                setSub({ instituicaoId: "", nome: "", email: "" })
                toast("SubAdmin criado.", "sucesso")
              }}
            >
              Criar SubAdmin
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-cabecalho">
            <span className="card-titulo">Enviar notificação de acesso</span>
          </div>
          <div className="card-corpo">
            <textarea className="campo" rows={3} placeholder="Mensagem para admins de instituições..." value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
            <button
              type="button"
              className="btn btn-primario"
              onClick={() => {
                if (!mensagem.trim()) return toast("Escreva uma mensagem.", "erro")
                enviarNotificacaoAdmin({ mensagem: mensagem.trim() })
                setMensagem("")
                toast("Notificação enviada.", "sucesso")
              }}
            >
              Enviar notificação
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

