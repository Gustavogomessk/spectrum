import { useEffect, useId, useState } from "react"

export default function ModalAluno({ aberto, onFechar, onSalvar, inicial }) {
  const baseId = useId()
  const [matricula, setMatricula] = useState("")
  const [nome, setNome] = useState("")
  const [nascimento, setNascimento] = useState("")
  const [diagnostico, setDiagnostico] = useState("")
  const [obs, setObs] = useState("")
  const [laudoNome, setLaudoNome] = useState("")

  useEffect(() => {
    if (!aberto) return
    if (inicial) {
      setMatricula(inicial.matricula || "")
      setNome(inicial.nome || "")
      setNascimento(inicial.nascimento || "")
      setDiagnostico(inicial.diagnostico || "")
      setObs(inicial.obs || "")
      setLaudoNome("")
    } else {
      setMatricula("")
      setNome("")
      setNascimento("")
      setDiagnostico("")
      setObs("")
      setLaudoNome("")
    }
  }, [aberto, inicial])

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onFechar()
    }
    if (aberto) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [aberto, onFechar])

  if (!aberto) return null

  async function salvar() {
    if (!nome.trim()) return
    if (!diagnostico) return
    await onSalvar({
      id: inicial?.id,
      matricula: matricula.trim(),
      nome: nome.trim(),
      nascimento,
      diagnostico,
      obs,
      laudo: inicial?.laudo || Boolean(laudoNome),
      laudo_url: null,
    })
  }

  return (
    <div
      className="modal-overlay aberto"
      id="modal-aluno"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${baseId}-titulo`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <div className="modal">
        <div className="modal-cabecalho">
          <span className="card-titulo" id={`${baseId}-titulo`}>
            {inicial ? "Editar Aluno" : "Cadastrar Novo Aluno"}
          </span>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar modal">
            ×
          </button>
        </div>
        <div className="modal-corpo">
          <label className="campo-label" htmlFor={`${baseId}-mat`}>
            Matrícula escolar
          </label>
          <input
            id={`${baseId}-mat`}
            type="text"
            className="campo"
            placeholder="Ex: 2026-01234"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            aria-label="Matrícula do aluno"
          />

          <div className="linha-campos">
            <div>
              <label className="campo-label" htmlFor={`${baseId}-nome`}>
                Nome completo
              </label>
              <input id={`${baseId}-nome`} type="text" className="campo" placeholder="Nome do aluno" required value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <label className="campo-label" htmlFor={`${baseId}-nasc`}>
                Data de nascimento
              </label>
              <input id={`${baseId}-nasc`} type="date" className="campo" value={nascimento} onChange={(e) => setNascimento(e.target.value)} />
            </div>
          </div>

          <label className="campo-label" htmlFor={`${baseId}-diag`}>
            Diagnóstico
          </label>
          <select id={`${baseId}-diag`} className="campo" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)}>
            <option value="">Selecione o diagnóstico</option>
            <option value="TDAH">TDAH — Transtorno de Déficit de Atenção e Hiperatividade</option>
            <option value="TEA Nível 1">TEA Nível 1 — Transtorno do Espectro Autista</option>
            <option value="TDAH+TEA">TDAH + TEA</option>
            <option value="Dislexia">Dislexia</option>
            <option value="Outro">Outro</option>
          </select>

          <label className="campo-label" htmlFor={`${baseId}-obs`}>
            Observações pedagógicas
          </label>
          <textarea id={`${baseId}-obs`} className="campo" rows={3} placeholder="Ex: Dificuldade com leitura longa..." value={obs} onChange={(e) => setObs(e.target.value)} />

          <div>
            <label className="campo-label">Laudo Médico (PDF)</label>
            <div
              style={{
                border: "2px dashed var(--cor-borda)",
                borderRadius: "var(--raio-md)",
                padding: "1.25rem",
                textAlign: "center",
                cursor: "pointer",
              }}
              role="button"
              tabIndex={0}
              onClick={() => document.getElementById(`${baseId}-laudo`)?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") document.getElementById(`${baseId}-laudo`)?.click()
              }}
            >
              <span style={{ fontSize: "1.5rem" }} aria-hidden="true">
                📋
              </span>
              <p style={{ fontSize: "0.85rem", color: "var(--cor-texto-secundario)", marginTop: "0.35rem" }}>Clique para anexar o laudo</p>
            </div>
            <input
              id={`${baseId}-laudo`}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                setLaudoNome(f ? f.name : "")
              }}
            />
            <p className="texto-mudo mt-1" aria-live="polite">
              {laudoNome ? `📋 ${laudoNome}` : ""}
            </p>
          </div>
        </div>
        <div className="modal-rodape">
          <button type="button" className="btn btn-secundario" onClick={onFechar}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primario" onClick={salvar}>
            Salvar Aluno
          </button>
        </div>
      </div>
    </div>
  )
}
