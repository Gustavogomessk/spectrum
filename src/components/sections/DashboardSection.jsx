import { useNeuroInclude } from "../../context/NeuroIncludeContext"

export default function DashboardSection({ active, onVerHistorico, onAdaptar }) {
  const { materiais, alunos } = useNeuroInclude()
  const recentes = materiais.slice(0, 5)

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-dashboard" aria-label="Painel de controle">
      <div className="secao-corpo">
        <h2 className="sr-only">Resumo de atividades</h2>

        <div className="metricas-grid" role="list" aria-label="Métricas da plataforma">
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              📄
            </div>
            <div className="metrica-label">Materiais Adaptados</div>
            <div className="metrica-valor">{materiais.length}</div>
            <div className="metrica-sub">Total registrado</div>
          </div>
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              👥
            </div>
            <div className="metrica-label">Alunos Ativos</div>
            <div className="metrica-valor">{alunos.length}</div>
            <div className="metrica-sub">Com perfil cadastrado</div>
          </div>
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              ⏱️
            </div>
            <div className="metrica-label">Tempo Economizado</div>
            <div className="metrica-valor">24h</div>
            <div className="metrica-sub">Comparado ao manual</div>
          </div>
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              🤖
            </div>
            <div className="metrica-label">IA (Cohere)</div>
            <div className="metrica-valor">✓</div>
            <div className="metrica-sub">Modelo configurável</div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Atividade Recente</span>
            <button type="button" className="btn btn-secundario btn-sm" onClick={onVerHistorico}>
              Ver tudo
            </button>
          </div>
          <div className="tabela-wrapper">
            <table aria-label="Últimas adaptações realizadas">
              <thead>
                <tr>
                  <th scope="col">Material</th>
                  <th scope="col">Aluno</th>
                  <th scope="col">Perfil</th>
                  <th scope="col">Data</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="texto-mudo">
                      Nenhum material ainda. Adapte o primeiro na seção &quot;Adaptar Material&quot;.
                    </td>
                  </tr>
                ) : (
                  recentes.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nome}</td>
                      <td>{m.aluno}</td>
                      <td>
                        <span className="badge badge-azul">{m.perfil}</span>
                      </td>
                      <td>{m.data}</td>
                      <td>
                        <span className="badge badge-verde">✓ Pronto</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-cabecalho">
            <span className="card-titulo">Começar Agora</span>
          </div>
          <div className="card-corpo">
            <p className="texto-mudo mb-2">Adapte um novo material em 3 passos simples:</p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div
                style={{
                  flex: 1,
                  minWidth: "160px",
                  textAlign: "center",
                  padding: "1.25rem",
                  background: "var(--cor-fundo)",
                  borderRadius: "var(--raio-md)",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }} aria-hidden="true">
                  📤
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>1. Envie o PDF</div>
                <div className="texto-mudo" style={{ fontSize: "0.8rem" }}>
                  Arraste ou selecione
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: "160px",
                  textAlign: "center",
                  padding: "1.25rem",
                  background: "var(--cor-fundo)",
                  borderRadius: "var(--raio-md)",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }} aria-hidden="true">
                  👤
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>2. Escolha o aluno</div>
                <div className="texto-mudo" style={{ fontSize: "0.8rem" }}>
                  Perfil personalizado
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: "160px",
                  textAlign: "center",
                  padding: "1.25rem",
                  background: "var(--cor-fundo)",
                  borderRadius: "var(--raio-md)",
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }} aria-hidden="true">
                  ✨
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>3. IA adapta</div>
                <div className="texto-mudo" style={{ fontSize: "0.8rem" }}>
                  Em segundos
                </div>
              </div>
            </div>
            <div className="mt-2">
              <button type="button" className="btn btn-primario" onClick={onAdaptar}>
                ✨ Adaptar Material Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
