import { useSpectrum } from "../../context/SpectrumContext"
import { isSecretaria } from "../../utils/perfil"

export default function PerfilSection({ active }) {
  const { usuario, logout } = useSpectrum()
  const secretaria = isSecretaria(usuario)

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-perfil" aria-label="Meu perfil">
      <div className="secao-corpo">
        <h2 className="sr-only">Meu perfil</h2>
        <div className="card" style={{ maxWidth: "520px" }}>
          <div className="card-cabecalho">
            <span className="card-titulo">Sua conta</span>
          </div>
          <div className="card-corpo">
            <p className="mb-2">
              <strong>Nome:</strong> {usuario?.nome}
            </p>
            <p className="mb-2">
              <strong>E-mail:</strong> {usuario?.email}
            </p>
            <p className="mb-2">
              <strong>Função:</strong> {usuario?.papel}
            </p>
            <p className="texto-mudo mb-2">
              {secretaria
                ? "Perfil secretaria: acesso à gestão de alunos e anexo de laudos (PDF)."
                : "Perfil educador: adaptação de materiais, histórico e chatbot pedagógico."}
            </p>
            <div className="mt-3">
              <button type="button" className="btn btn-perigo" onClick={logout}>
                Sair da plataforma
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
