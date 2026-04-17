import { useMemo, useState } from "react"
import { useSpectrum } from "../../context/SpectrumContext"

const USUARIO_LICENCAS = ["PRO", "Basic", "Secretaria"]

export default function AdminInstituicaoSection({ active }) {
  const { usuario, adminData, criarUsuarioInstituicao, editarUsuario, toast } = useSpectrum()
  const [novo, setNovo] = useState({ nome: "", email: "", papel: "professor", licencas: 1, tipoLicenca: "Basic" })

  const instituicaoId = usuario?.schoolId || "inst-1"

  const usuarios = useMemo(() => (adminData?.usuarios || []).filter((u) => u.instituicaoId === instituicaoId), [adminData, instituicaoId])
  const boletos = useMemo(() => (adminData?.boletos || []).filter((b) => b.instituicaoId === instituicaoId), [adminData, instituicaoId])

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
              onClick={() => {
                if (!novo.nome || !novo.email) return toast("Preencha nome e email.", "erro")
                criarUsuarioInstituicao({ ...novo, instituicaoId })
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
                        onChange={(e) => editarUsuario(u.id, { tipoLicenca: e.target.value })}
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
            <span className="card-titulo">Boletos da instituição (apenas admin)</span>
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
                {boletos.map((b) => (
                  <tr key={b.id}>
                    <td>{b.referencia}</td>
                    <td>R$ {Number(b.valor).toFixed(2)}</td>
                    <td>
                      <span className={`badge ${b.status === "pago" ? "badge-verde" : "badge-ambar"}`}>{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

