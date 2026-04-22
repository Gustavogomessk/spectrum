import { useEffect } from "react"
import { useSpectrum } from "../context/SpectrumContext"
import Sidebar from "../components/layout/Sidebar"
import Topbar from "../components/layout/Topbar"
import MobileOverlay from "../components/layout/MobileOverlay"
import DashboardSection from "../components/sections/DashboardSection"
import AdaptarSection from "../components/sections/AdaptarSection"
import HistoricoSection from "../components/sections/HistoricoSection"
import AlunosSection from "../components/sections/AlunosSection"
import ChatbotSection from "../components/sections/ChatbotSection"
import PerfilSection from "../components/sections/PerfilSection"
import AdminGlobalSection from "../components/sections/AdminGlobalSection"
import AdminInstituicaoSection from "../components/sections/AdminInstituicaoSection"
import AdminSubadminUsersSection from "../components/sections/AdminSubadminUsersSection"
import { isAdminInstituicao, isEducador, canAccessSection, getDefaultSection, isSecretaria } from "../utils/perfil"
import AppIcon from "../components/ui/AppIcon"
import { AlertCircle, Sparkles } from "lucide-react"
import PlanosPopup from "../components/modals/PlanosPopup"

const TITULOS = {
  dashboard: "Dashboard",
  adaptar: "Adaptar Material",
  historico: "Materiais Adaptados",
  alunos: "Alunos",
  chatbot: "Chatbot IA",
  perfil: "Meu Perfil",
  "admin-global": "Admin Global",
  "admin-notificacoes": "Notificações",
  "admin-instituicao": "Instituição",
  "admin-usuarios": "Gerenciar Usuários",
}

export default function AppShell() {
  const {
    usuario,
    activeSection,
    setActiveSection,
    sidebarOpen,
    setSidebarOpen,
    toasts,
    notificacoesSubadmin,
    planosPopup,
    fecharPlanosPopup,
  } = useSpectrum()
  const podeAdaptar = isEducador(usuario)
  const isSubadmin = isAdminInstituicao(usuario)
  const notificacoesNaoLidas = (notificacoesSubadmin || []).filter((n) => !n.lida)
  
  // Determinar a cor do ícone baseado no tipo de notificação mais urgente
  const obterCorNotificacao = () => {
    if (notificacoesNaoLidas.length === 0) return "var(--cor-texto-secundario)"
    
    const temAlerta = notificacoesNaoLidas.some((n) => n.tipo === "alerta")
    if (temAlerta) return "var(--cor-perigo)" // Vermelho
    
    const temSucesso = notificacoesNaoLidas.some((n) => n.tipo === "sucesso")
    if (temSucesso) return "var(--cor-sucesso)" // Verde
    
    return "var(--cor-primaria)" // Azul para info
  }

  // Redirecionar SUBADMIN para gerenciar usuários por padrão
  useEffect(() => {
    if (isSubadmin && activeSection === "dashboard") {
      setActiveSection("admin-usuarios")
    }
  }, [isSubadmin, activeSection, setActiveSection])

  // Validar acesso à seção atual baseado na licença do usuário
  useEffect(() => {
    if (!usuario) return

    // Se a seção atual não é acessível, redirecionar para a seção padrão
    if (!canAccessSection(usuario, activeSection)) {
      const defaultSection = getDefaultSection(usuario)
      setActiveSection(defaultSection)
    }
  }, [usuario, activeSection, setActiveSection])

  function ir(secao) {
    setActiveSection(secao)
    setSidebarOpen(false)
  }

  return (
    <>
      <a href="#conteudo-principal" className="skip-link">
        Ir para o conteúdo principal
      </a>

      <MobileOverlay visivel={sidebarOpen} onFechar={() => setSidebarOpen(false)} />

      <div id="tela-app" className="tela ativa" role="application" aria-label="Plataforma Spectrum" style={{ display: "flex" }}>
        <Sidebar aberta={sidebarOpen} onNavigate={ir} onPerfil={() => ir("perfil")} />

        <main className="conteudo-principal" id="conteudo-principal" tabIndex={-1}>
          <Topbar
            titulo={TITULOS[activeSection] || "Spectrum"}
            onMenu={() => setSidebarOpen(true)}
            menuAberto={sidebarOpen}
          >
            {podeAdaptar ? (
              <button type="button" className="btn btn-primario btn-sm" onClick={() => ir("adaptar")} aria-label="Adaptar novo material">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <AppIcon icon={Sparkles} size={16} />
                  Novo Material
                </span>
              </button>
            ) : null}
            {isSubadmin ? (
              <button
                type="button"
                className="btn btn-secundario btn-sm"
                onClick={() => ir("admin-instituicao")}
                aria-label="Abrir notificações"
                style={{ position: "relative" }}
              >
                <span style={{ color: obterCorNotificacao(), display: "inline-flex", alignItems: "center" }}>
                  <AppIcon icon={AlertCircle} size={16} />
                </span>
                {notificacoesNaoLidas.length > 0 ? (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "999px",
                      background: obterCorNotificacao(),
                      color: "#fff",
                      fontSize: "0.7rem",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                    }}
                  >
                    {notificacoesNaoLidas.length}
                  </span>
                ) : null}
              </button>
            ) : null}
          </Topbar>

          <DashboardSection
            active={activeSection === "dashboard"}
            onVerHistorico={() => ir("historico")}
            onAdaptar={() => ir("adaptar")}
          />
          <AdaptarSection active={activeSection === "adaptar"} />
          <HistoricoSection active={activeSection === "historico"} />
          <AlunosSection active={activeSection === "alunos"} />
          <ChatbotSection active={activeSection === "chatbot"} />
          <PerfilSection active={activeSection === "perfil"} />
          <AdminGlobalSection active={activeSection === "admin-global" || activeSection === "admin-notificacoes"} activeSection={activeSection} />
          <AdminInstituicaoSection active={activeSection === "admin-instituicao"} />
          <AdminSubadminUsersSection active={activeSection === "admin-usuarios"} />
        </main>
      </div>

      <PlanosPopup aberto={planosPopup.aberto} motivo={planosPopup.motivo} onFechar={fecharPlanosPopup} />
    </>
  )
}
