import { useSpectrum } from "../../context/SpectrumContext"
import { isAdminInstituicao, isAdminMaster, isEducador, isSecretaria } from "../../utils/perfil"
import AppIcon from "../ui/AppIcon"
import { Bell, Bot, Building2, FileText, Gauge, LayoutDashboard, MessageSquare, Settings, ShieldCheck, Users } from "lucide-react"

export default function Sidebar({ aberta, onNavigate, onPerfil }) {
  const { usuario, activeSection } = useSpectrum()
  const secretaria = isSecretaria(usuario)
  const educador = isEducador(usuario)
  const adminMaster = isAdminMaster(usuario)
  const adminInstituicao = isAdminInstituicao(usuario)

  function Item({ id, icon, label, badge }) {
    const ativo = activeSection === id
    return (
      <button
        type="button"
        className={`nav-item ${ativo ? "ativo" : ""}`}
        aria-current={ativo ? "page" : undefined}
        onClick={() => onNavigate(id)}
        aria-label={label}
      >
        <span className="nav-icon" aria-hidden="true">
          {icon}
        </span>{" "}
        {label}
        {badge ? (
          <span className="nav-badge" aria-label="Novo">
            {badge}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <nav className={`sidebar ${aberta ? "aberta" : ""}`} id="sidebar" role="navigation" aria-label="Menu principal">
      <div className="sidebar-logo" aria-label="Spectrum logo">
        <div className="logo-icon" aria-hidden="true">
          <AppIcon icon={Bot} size={20} />
        </div>
        Spectrum
      </div>

      <div className="sidebar-nav">
        {educador ? (
          <>
            <Item id="dashboard" icon={<AppIcon icon={LayoutDashboard} />} label="Dashboard" />

            <p className="nav-secao">Adaptação</p>
            <Item id="adaptar" icon={<AppIcon icon={Gauge} />} label="Adaptar Material" badge="Novo" />
            <Item id="historico" icon={<AppIcon icon={FileText} />} label="Materiais" />

            <p className="nav-secao">Gestão</p>
            <Item id="alunos" icon={<AppIcon icon={Users} />} label="Alunos" />
            <Item id="chatbot" icon={<AppIcon icon={MessageSquare} />} label="Chatbot IA" />
          </>
        ) : null}

        {secretaria ? (
          <>
            <p className="nav-secao">Gestão escolar</p>
            <Item id="alunos" icon={<AppIcon icon={Users} />} label="Alunos e laudos" />
            <p className="texto-mudo" style={{ padding: "0.5rem 0.75rem", fontSize: "0.78rem", lineHeight: 1.5 }}>
              Acesso restrito: cadastro de matrícula e anexo do laudo médico (PDF), conforme regras do projeto.
            </p>
          </>
        ) : null}

        {adminMaster ? (
          <>
            <p className="nav-secao">Administração Global</p>
            <Item id="admin-global" icon={<AppIcon icon={ShieldCheck} />} label="Admin Global" />
            <Item id="admin-notificacoes" icon={<AppIcon icon={Bell} />} label="Notificações" />
          </>
        ) : null}

        {adminInstituicao ? (
          <>
            <p className="nav-secao">Admin Instituição</p>
            <Item id="admin-instituicao" icon={<AppIcon icon={Building2} />} label="Gestão da Instituição" />
          </>
        ) : null}
      </div>

      <div className="sidebar-footer">
        <div
          className="perfil-card"
          onClick={onPerfil}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onPerfil()
          }}
          aria-label="Meu perfil"
        >
          <div className="avatar" aria-hidden="true">
            {usuario?.iniciais || "NI"}
          </div>
          <div className="perfil-info">
            <div className="perfil-nome">{usuario?.nome || "—"}</div>
            <div className="perfil-papel">{usuario?.papel || "—"}</div>
          </div>
          <span aria-hidden="true" style={{ fontSize: "0.9rem", color: "var(--cor-texto-mudo)" }}>
            <AppIcon icon={Settings} size={18} />
          </span>
        </div>
      </div>
    </nav>
  )
}
