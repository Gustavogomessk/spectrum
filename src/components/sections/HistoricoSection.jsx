import { useState } from "react"
import { useNeuroInclude } from "../../context/NeuroIncludeContext"
import { badgeDiag } from "../../utils/badges"

export default function HistoricoSection({ active }) {
  const { materiais, toast, removerMaterialApi } = useNeuroInclude()
  const [q, setQ] = useState("")

  const filtrados = materiais.filter((m) => {
    const t = q.toLowerCase()
    return (
      !t ||
      `${m.nome} ${m.aluno} ${m.perfil} ${m.data} ${m.pdf_original_nome || ""} ${m.pdf_adaptado_nome || ""}`
        .toLowerCase()
        .includes(t)
    )
  })

  async function excluir(id) {
    if (!confirm("Excluir este material?")) return
    try {
      await removerMaterialApi(id)
      toast("Material removido.", "info")
    } catch (e) {
      toast(e.message || "Erro ao excluir.", "erro")
    }
  }

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-historico" aria-label="Histórico de materiais adaptados">
      <div className="secao-corpo">
        <h2 className="sr-only">Histórico de materiais</h2>
        <div className="card">
          <p className="texto-mudo mb-2" style={{ padding: "0 1.5rem", paddingTop: "1rem" }}>
            Cada registro associa o <strong>PDF original</strong> enviado pelo professor ao <strong>material adaptado</strong> gerado pela IA (nomes de arquivo; download completo no backend em evolução).
          </p>
          <div className="card-cabecalho">
            <span className="card-titulo">📄 Todos os Materiais Adaptados</span>
            <input
              type="search"
              className="campo"
              placeholder="Buscar material..."
              style={{ margin: 0, width: "200px", padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
              aria-label="Buscar material"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="tabela-wrapper">
            <table aria-label="Lista de materiais adaptados">
              <thead>
                <tr>
                  <th scope="col">Material (título)</th>
                  <th scope="col">PDF original</th>
                  <th scope="col">PDF adaptado</th>
                  <th scope="col">Aluno</th>
                  <th scope="col">Perfil</th>
                  <th scope="col">Data</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="texto-mudo">
                      Nenhum material encontrado.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((mat) => (
                    <tr key={mat.id}>
                      <td>
                        <span style={{ fontWeight: 600 }}>📄 {mat.nome}</span>
                      </td>
                      <td>
                        <span className="badge badge-cinza">{mat.pdf_original_nome || "—"}</span>
                      </td>
                      <td>
                        <span className="badge badge-verde">{mat.pdf_adaptado_nome || "—"}</span>
                      </td>
                      <td>{mat.aluno}</td>
                      <td>
                        <span className={`badge ${badgeDiag(mat.perfil)}`}>{mat.perfil}</span>
                      </td>
                      <td>{mat.data}</td>
                      <td>
                        <div className="acoes-td">
                          <button
                            type="button"
                            className="btn btn-secundario btn-sm"
                            onClick={() => toast("Download em desenvolvimento.", "info")}
                            aria-label={`Baixar ${mat.nome}`}
                          >
                            ⬇ Baixar
                          </button>
                          <button type="button" className="btn btn-perigo btn-sm" onClick={() => excluir(mat.id)} aria-label={`Excluir ${mat.nome}`}>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
