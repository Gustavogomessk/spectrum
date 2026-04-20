import { useState } from "react"
import { useSpectrum } from "../../context/SpectrumContext"
import { badgeDiag } from "../../utils/badges"
import { downloadString, wrapHtmlDocument } from "../../utils/download"
import { supabase } from "../../services/supabaseClient"
import AppIcon from "../ui/AppIcon"
import { Download } from "lucide-react"

export default function HistoricoSection({ active }) {
  const { materiais, toast, removerMaterialApi } = useSpectrum()
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

  async function baixar(mat) {
    if (mat?.pdf_adaptado_path) {
      await abrirPath(mat.pdf_adaptado_path)
      toast("Download do PDF iniciado.", "sucesso")
      return
    }
    const nomeBase = (mat?.nome || "material").toString().trim() || "material"
    const filename = `${nomeBase}-adaptado.html`.replace(/[\\/:*?"<>|]+/g, "-")
    const html = wrapHtmlDocument({
      title: `Material adaptado — ${nomeBase}`,
      bodyHtml: `<h1>${nomeBase}</h1><div class="meta">Aluno: ${mat.aluno || "—"} • Perfil: ${mat.perfil || "—"} • Data: ${mat.data || "—"}</div>${mat.conteudo_html || "<p>(Sem conteúdo salvo)</p>"}`,
    })
    downloadString(filename, html, "text/html;charset=utf-8")
    toast("Download iniciado (HTML).", "sucesso")
  }

  async function abrirPath(path) {
    if (!supabase) {
      toast("Supabase não configurado.", "erro")
      return
    }
    if (!path) {
      toast("Arquivo não disponível para este material.", "info")
      return
    }
    const { data, error } = await supabase.storage.from("uploads-files").createSignedUrl(path, 180)
    if (error || !data?.signedUrl) {
      toast("Não foi possível gerar link seguro.", "erro")
      return
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer")
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
            <span className="card-titulo">Todos os Materiais Adaptados</span>
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
                        <span style={{ fontWeight: 600 }}>{mat.nome}</span>
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
                          <button type="button" className="btn btn-secundario btn-sm" onClick={() => abrirPath(mat.pdf_original_path)} aria-label={`Ver original ${mat.nome}`}>
                            Ver original
                          </button>
                          <button type="button" className="btn btn-secundario btn-sm" onClick={() => abrirPath(mat.pdf_adaptado_path)} aria-label={`Ver adaptado ${mat.nome}`}>
                            Ver adaptado
                          </button>
                          <button
                            type="button"
                            className="btn btn-secundario btn-sm"
                            onClick={() => baixar(mat)}
                            aria-label={`Baixar ${mat.nome}`}
                          >
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                              <AppIcon icon={Download} size={16} />
                              Baixar
                            </span>
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
