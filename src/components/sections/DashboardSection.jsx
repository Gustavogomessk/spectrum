import { useSpectrum } from "../../context/SpectrumContext"
import AppIcon from "../ui/AppIcon"
import { Bot, Clock, FileText, Users } from "lucide-react"

export default function DashboardSection({ active, onVerHistorico, onAdaptar }) {
  const { materiais, alunos } = useSpectrum()
  const recentes = materiais.slice(0, 5)

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-dashboard" aria-label="Painel de controle">
      <div className="secao-corpo">
        <h2 className="sr-only">Resumo de atividades</h2>

        <div className="metricas-grid" role="list" aria-label="Métricas da plataforma">
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              <AppIcon icon={FileText} size={20} />
            </div>
            <div className="metrica-label">Materiais Adaptados</div>
            <div className="metrica-valor">{materiais.length}</div>
            <div className="metrica-sub">Total registrado</div>
          </div>
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              <AppIcon icon={Users} size={20} />
            </div>
            <div className="metrica-label">Alunos Ativos</div>
            <div className="metrica-valor">{alunos.length}</div>
            <div className="metrica-sub">Com perfil cadastrado</div>
          </div>
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              <AppIcon icon={Clock} size={20} />
            </div>
            <div className="metrica-label">Tempo Economizado</div>
            <div className="metrica-valor">24h</div>
            <div className="metrica-sub">Comparado ao manual</div>
          </div>
          <div className="metrica-card" role="listitem">
            <div className="metrica-icone" aria-hidden="true">
              <AppIcon icon={Bot} size={20} />
            </div>
            <div className="metrica-label">IA (Cohere)</div>
            <div className="metrica-valor">✓</div>
            <div className="metrica-sub">Modelo configurável</div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-cabecalho">
            <span className="card-titulo">Gráfico de Adaptações (últimos 7 dias)</span>
          </div>
          <div className="card-corpo">
            <svg width="100%" height="200" viewBox="0 0 400 200" style={{ maxWidth: "100%" }}>
              {/* Eixos */}
              <line x1="40" y1="160" x2="390" y2="160" stroke="var(--cor-borda)" strokeWidth="1" />
              <line x1="40" y1="20" x2="40" y2="160" stroke="var(--cor-borda)" strokeWidth="1" />

              {/* Barras */}
              {[45, 52, 38, 65, 72, 55, 48].map((valor, i) => (
                <g key={i}>
                  <rect x={50 + i * 48} y={160 - (valor * 1.2)} width="38" height={valor * 1.2} fill="var(--cor-primaria)" rx="4" />
                  <text x={69 + i * 48} y="175" textAnchor="middle" fontSize="12" fill="var(--cor-texto-mudo)">
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"][i]}
                  </text>
                  <text x={69 + i * 48} y={155 - (valor * 1.2) - 5} textAnchor="middle" fontSize="11" fill="var(--cor-texto-principal)" fontWeight="600">
                    {valor}
                  </text>
                </g>
              ))}
            </svg>
            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--cor-borda)" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--cor-texto-secundario)" }}>
                <strong>Média:</strong> 53 adaptações/dia • <strong>Total:</strong> 375 adaptações
              </div>
            </div>
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
                  <AppIcon icon={FileText} size={28} />
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
                  <AppIcon icon={Users} size={28} />
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
                  <AppIcon icon={Bot} size={28} />
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>3. IA adapta</div>
                <div className="texto-mudo" style={{ fontSize: "0.8rem" }}>
                  Em segundos
                </div>
              </div>
            </div>
            <div className="mt-2">
              <button type="button" className="btn btn-primario" onClick={onAdaptar}>
                Adaptar Material Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
