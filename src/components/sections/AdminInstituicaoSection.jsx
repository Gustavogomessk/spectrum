import { useMemo, useState } from "react"
import { useSpectrum } from "../../context/SpectrumContext"
import { QRCodeSVG } from "qrcode.react"

const USUARIO_LICENCAS = ["PRO", "Basic", "Secretaria"]

export default function AdminInstituicaoSection({ active }) {
  const {
    usuario,
    adminData,
    criarUsuarioInstituicao,
    editarUsuario,
    toast,
    pagamentosSubadmin,
    criarPagamentoSubadmin,
    confirmarPagamentoSubadmin,
    notificacoesSubadmin,
    marcarNotificacaoLida,
  } = useSpectrum()
  const [novo, setNovo] = useState({ nome: "", email: "", papel: "professor", licencas: 1, tipoLicenca: "Basic" })
  const [pagamento, setPagamento] = useState({ referencia: "", valor: "" })

  const instituicaoId = usuario?.schoolId || "inst-1"

  const usuarios = useMemo(() => (adminData?.usuarios || []).filter((u) => u.instituicaoId === instituicaoId), [adminData, instituicaoId])
  const pagamentoAtual = pagamentosSubadmin[0] || null
  const qrMock = `MOCK-PIX|subadmin:${usuario?.id || "anon"}|instituicao:${instituicaoId}|${new Date().toISOString().slice(0, 10)}`
  const qrValue = pagamentoAtual?.qrCodePayload || qrMock

  if (!active) return <section className="secao" />

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-admin-instituicao" aria-label="Painel da instituição">
      <div className="secao-corpo">
        <div className="card mb-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Criar usuário da instituição</span>
          </div>
          <div className="card-corpo">
            <div className="linha-campos">
              <input className="campo" placeholder="Nome" value={novo.nome} onChange={(e) => setNovo((s) => ({ ...s, nome: e.target.value }))} />
              <input className="campo" placeholder="Email" value={novo.email} onChange={(e) => setNovo((s) => ({ ...s, email: e.target.value }))} />
            </div>
            <div className="linha-campos">
              <select className="campo" value={novo.papel} onChange={(e) => setNovo((s) => ({ ...s, papel: e.target.value }))}>
                <option value="secretaria">Secretário</option>
                <option value="psicopedagogo">Psicopedagogo</option>
                <option value="professor">Professor</option>
              </select>
              <select className="campo" value={novo.tipoLicenca} onChange={(e) => setNovo((s) => ({ ...s, tipoLicenca: e.target.value }))}>
                {USUARIO_LICENCAS.map((lic) => (
                  <option key={lic} value={lic}>
                    {lic}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-primario"
              onClick={async () => {
                if (!novo.nome || !novo.email) return toast("Preencha nome e email.", "erro")
                await criarUsuarioInstituicao({ ...novo, instituicaoId })
                setNovo({ nome: "", email: "", papel: "professor", licencas: 1, tipoLicenca: "Basic" })
                toast("Usuário criado.", "sucesso")
              }}
            >
              Criar usuário
            </button>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Gestão de licenças</span>
          </div>
          <div className="tabela-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Papel</th>
                  <th>Licença</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td>{u.nome}</td>
                    <td>{u.email}</td>
                    <td>{u.papel}</td>
                    <td>
                      <select
                        className="campo"
                        value={u.tipoLicenca || "Basic"}
                        onChange={async (e) => editarUsuario(u.id, { tipoLicenca: e.target.value })}
                      >
                        {USUARIO_LICENCAS.map((lic) => (
                          <option key={lic} value={lic}>
                            {lic}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-cabecalho">
            <span className="card-titulo">Pagamentos e QRCode</span>
          </div>
          <div className="card-corpo">
            <div className="linha-campos">
              <input
                className="campo"
                placeholder="Referência (ex: 05/2026)"
                value={pagamento.referencia}
                onChange={(e) => setPagamento((s) => ({ ...s, referencia: e.target.value }))}
              />
              <input
                className="campo"
                type="number"
                min="0"
                step="0.01"
                placeholder="Valor"
                value={pagamento.valor}
                onChange={(e) => setPagamento((s) => ({ ...s, valor: e.target.value }))}
              />
            </div>
            <button
              type="button"
              className="btn btn-primario"
              onClick={async () => {
                if (!pagamento.referencia || !pagamento.valor) return toast("Informe referência e valor.", "erro")
                await criarPagamentoSubadmin({ referencia: pagamento.referencia, valor: pagamento.valor })
                setPagamento({ referencia: "", valor: "" })
                toast("Pagamento criado com status pendente.", "sucesso")
              }}
            >
              Gerar QRCode
            </button>

            <div style={{ marginTop: "1rem", border: "1px solid var(--cor-borda)", borderRadius: "0.5rem", padding: "1rem" }}>
              <div style={{ marginBottom: "0.75rem", fontWeight: 600 }}>
                Cobrança atual: {pagamentoAtual?.referencia || "Cobrança mock de demonstração"}
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                Status:{" "}
                <span className={`badge ${pagamentoAtual?.status === "pago" ? "badge-verde" : "badge-ambar"}`}>
                  {pagamentoAtual?.status === "pago" ? "PAGO" : "PENDENTE"}
                </span>
              </div>
              <div style={{ marginBottom: "0.75rem", color: "var(--cor-texto-secundario)" }}>
                {pagamentoAtual?.status === "pago" ? "Pagamento confirmado" : "Pagamento pendente"}
              </div>
              <QRCodeSVG value={qrValue} size={180} includeMargin />
              <div style={{ marginTop: "0.75rem" }}>
                <button
                  type="button"
                  className="btn btn-secundario btn-sm"
                  onClick={async () => {
                    if (!pagamentoAtual?.id) {
                      toast("Crie uma cobrança para habilitar confirmação real.", "info")
                      return
                    }
                    await confirmarPagamentoSubadmin(pagamentoAtual.id)
                    toast("Pagamento confirmado via webhook simulado.", "sucesso")
                  }}
                  disabled={pagamentoAtual?.status === "pago"}
                >
                  Confirmar pagamento (simular webhook)
                </button>
              </div>
            </div>
          </div>
          <div className="tabela-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Referência</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosSubadmin.map((b) => (
                  <tr key={b.id}>
                    <td>{b.referencia}</td>
                    <td>R$ {Number(b.valor).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${b.status === "pago" ? "badge-verde" : "badge-ambar"}`}>{b.status === "pago" ? "PAGO" : "PENDENTE"}</span>
                    </td>
                  </tr>
                ))}
                {pagamentosSubadmin.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="texto-mudo">
                      Nenhum pagamento criado.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card mt-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Notificações</span>
          </div>
          <div className="tabela-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {notificacoesSubadmin.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{n.titulo}</div>
                      <div className="texto-mudo" style={{ fontSize: "0.8rem" }}>
                        {n.conteudo}
                      </div>
                    </td>
                    <td>{n.tipo}</td>
                    <td>
                      <span className={`badge ${n.lida ? "badge-verde" : "badge-ambar"}`}>{n.lida ? "Lida" : "Não lida"}</span>
                    </td>
                    <td>
                      {!n.lida ? (
                        <button type="button" className="btn btn-secundario btn-sm" onClick={() => marcarNotificacaoLida(n.id)}>
                          Marcar como lida
                        </button>
                      ) : (
                        <span className="texto-mudo">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {notificacoesSubadmin.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="texto-mudo">
                      Sem notificações no momento.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

