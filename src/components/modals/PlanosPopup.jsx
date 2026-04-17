export default function PlanosPopup({ aberto, onFechar, motivo }) {
  if (!aberto) return null
  return (
    <div className="modal-overlay aberto" role="dialog" aria-modal="true" aria-label="Planos individuais">
      <div className="modal">
        <div className="modal-cabecalho">
          <span className="card-titulo">Limite da versão trial atingido</span>
          <button type="button" className="modal-fechar" onClick={onFechar} aria-label="Fechar">
            ×
          </button>
        </div>
        <div className="modal-corpo">
          <p className="texto-mudo mb-2">
            {motivo || "Você já utilizou seus limites gratuitos (5 adaptações e 5 perguntas com IA)."}
          </p>
          <div className="card" style={{ marginBottom: "0.75rem" }}>
            <div className="card-corpo">
              <strong>Plano Individual Start</strong>
              <p className="texto-mudo">30 adaptações + 120 perguntas IA / mês</p>
            </div>
          </div>
          <div className="card">
            <div className="card-corpo">
              <strong>Plano Individual Pro</strong>
              <p className="texto-mudo">Uso ampliado + prioridade no suporte</p>
            </div>
          </div>
        </div>
        <div className="modal-rodape">
          <button type="button" className="btn btn-secundario" onClick={onFechar}>
            Fechar
          </button>
          <button type="button" className="btn btn-primario" onClick={onFechar}>
            Quero assinar
          </button>
        </div>
      </div>
    </div>
  )
}

