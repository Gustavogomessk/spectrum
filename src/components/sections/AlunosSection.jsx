import { useState } from "react"
import { useSpectrum } from "../../context/SpectrumContext"
import { badgeDiag, corAvatar } from "../../utils/badges"
import { isSecretaria } from "../../utils/perfil"
import ModalAluno from "../modals/ModalAluno"

function calcularIdade(nascimento) {
  if (!nascimento) return "?"
  const hoje = new Date()
  const nasc = new Date(nascimento)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  if (hoje < new Date(hoje.getFullYear(), nasc.getMonth(), nasc.getDate())) idade--
  return idade
}

export default function AlunosSection({ active }) {
  const { usuario, alunos, toast, salvarAlunoApi, removerAlunoApi, verLaudoAluno } = useSpectrum()
  const apenasLaudo = isSecretaria(usuario)
  const [q, setQ] = useState("")
  const [modal, setModal] = useState({ aberto: false, editando: null })

  const filtrados = alunos.filter((a) => {
    const t = q.toLowerCase()
    return !t || `${a.nome} ${a.diagnostico}`.toLowerCase().includes(t)
  })

  async function excluir(id) {
    if (!confirm("Tem certeza que deseja excluir este aluno?")) return
    try {
      await removerAlunoApi(id)
      toast("Aluno removido.", "info")
    } catch (e) {
      toast(e.message || "Erro ao excluir.", "erro")
    }
  }

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-alunos" aria-label="Gestão de alunos">
      <div className="secao-corpo">
        <h2 className="sr-only">Gestão de alunos</h2>
        {apenasLaudo ? (
          <p className="texto-mudo mb-2" style={{ maxWidth: "720px" }}>
            <strong>Secretaria:</strong> cadastre a matrícula e anexe o laudo médico em PDF para cada aluno. Professores e psicopedagogos utilizam esses dados na adaptação dos materiais.
          </p>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <input
              type="search"
              className="campo"
              placeholder="Buscar aluno..."
              style={{ margin: 0 }}
              aria-label="Buscar aluno"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primario" onClick={() => setModal({ aberto: true, editando: null })} aria-label="Cadastrar novo aluno">
            + Novo Aluno
          </button>
        </div>

        <div className="card">
          <div className="tabela-wrapper">
            <table aria-label="Lista de alunos cadastrados">
              <thead>
                <tr>
                  <th scope="col">Matrícula</th>
                  <th scope="col">Aluno</th>
                  <th scope="col">Diagnóstico</th>
                  <th scope="col">Laudo</th>
                  <th scope="col">Materiais</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((aluno) => (
                  <tr key={aluno.id}>
                    <td style={{ fontWeight: 600 }}>{aluno.matricula || "—"}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className={`avatar ${corAvatar(aluno.diagnostico)}`} style={{ width: "32px", height: "32px", fontSize: "0.75rem" }} aria-hidden="true">
                          {aluno.nome
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .substring(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{aluno.nome}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--cor-texto-mudo)" }}>{calcularIdade(aluno.nascimento)} anos</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${badgeDiag(aluno.diagnostico)}`}>{aluno.diagnostico}</span>
                    </td>
                    <td>{aluno.laudo ? <span className="badge badge-verde">✓ Cadastrado</span> : <span className="badge badge-cinza">Pendente</span>}</td>
                    <td>
                      <span className="badge badge-cinza">{aluno.materiais} materiais</span>
                    </td>
                    <td>
                      <div className="acoes-td">
                        <button type="button" className="btn btn-secundario btn-sm" onClick={() => setModal({ aberto: true, editando: aluno })} aria-label={`Editar ${aluno.nome}`}>
                          Editar
                        </button>
                        <button type="button" className="btn btn-perigo btn-sm" onClick={() => excluir(aluno.id)} aria-label={`Excluir ${aluno.nome}`}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ModalAluno
        aberto={modal.aberto}
        inicial={modal.editando}
        onFechar={() => setModal({ aberto: false, editando: null })}
        onVerLaudo={async (alunoId) => {
          try {
            await verLaudoAluno(alunoId)
          } catch (e) {
            toast(e.message || "Erro ao abrir laudo.", "erro")
          }
        }}
        onSalvar={async (payload) => {
          await salvarAlunoApi(payload)
          toast(`Aluno ${payload.nome} salvo!`, "sucesso")
          setModal({ aberto: false, editando: null })
        }}
      />
    </section>
  )
}
