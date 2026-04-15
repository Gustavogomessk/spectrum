export default function AlunoCard({ aluno, selecionado, onClick }) {
  return (
    <div
      className={`aluno-card ${selecionado ? "selecionado" : ""}`}
      onClick={onClick}
    >
      <div className="check">✔</div>
      <div className="aluno-nome">{aluno.nome}</div>
      <div className="aluno-laudo">{aluno.laudo}</div>
    </div>
  )
}