import { useEffect } from "react"
import { useNeuroInclude } from "../context/NeuroIncludeContext"
import Sidebar from "../components/layout/Sidebar"
import Topbar from "../components/layout/Topbar"
import MobileOverlay from "../components/layout/MobileOverlay"
import ToastContainer from "../components/ui/ToastContainer"
import DashboardSection from "../components/sections/DashboardSection"
import AdaptarSection from "../components/sections/AdaptarSection"
import HistoricoSection from "../components/sections/HistoricoSection"
import AlunosSection from "../components/sections/AlunosSection"
import ChatbotSection from "../components/sections/ChatbotSection"
import PerfilSection from "../components/sections/PerfilSection"
import { isEducador } from "../utils/perfil"

const TITULOS = {
  dashboard: "Dashboard",
  adaptar: "Adaptar Material",
  historico: "Materiais Adaptados",
  alunos: "Alunos",
  chatbot: "Chatbot IA",
  perfil: "Meu Perfil",
}

export default function AppShell() {
  const {
    usuario,
    activeSection,
    setActiveSection,
    sidebarOpen,
    setSidebarOpen,
    toasts,
  } = useNeuroInclude()
  const podeAdaptar = isEducador(usuario)

  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    document.addEventListener("keydown", onEsc)
    return () => document.removeEventListener("keydown", onEsc)
  }, [setSidebarOpen])

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

      <div id="tela-app" className="tela ativa" role="application" aria-label="Plataforma NeuroInclude" style={{ display: "flex" }}>
        <Sidebar aberta={sidebarOpen} onNavigate={ir} onPerfil={() => ir("perfil")} />

        <main className="conteudo-principal" id="conteudo-principal" tabIndex={-1}>
          <Topbar
            titulo={TITULOS[activeSection] || "NeuroInclude"}
            onMenu={() => setSidebarOpen(true)}
            menuAberto={sidebarOpen}
          >
            {podeAdaptar ? (
              <button type="button" className="btn btn-primario btn-sm" onClick={() => ir("adaptar")} aria-label="Adaptar novo material">
                ✨ Novo Material
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
        </main>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  )
}
