import { useEffect } from "react"
import { useSpectrum } from "../context/SpectrumContext"
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
import AdminGlobalSection from "../components/sections/AdminGlobalSection"
import AdminInstituicaoSection from "../components/sections/AdminInstituicaoSection"
import { isEducador } from "../utils/perfil"
import AppIcon from "../components/ui/AppIcon"
import { Sparkles } from "lucide-react"
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
}

export default function AppShell() {
  const {
    usuario,
    activeSection,
    setActiveSection,
    sidebarOpen,
    setSidebarOpen,
    toasts,
    planosPopup,
    fecharPlanosPopup,
  } = useSpectrum()
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
          <AdminGlobalSection active={activeSection === "admin-global" || activeSection === "admin-notificacoes"} />
          <AdminInstituicaoSection active={activeSection === "admin-instituicao"} />
        </main>
      </div>

      <ToastContainer toasts={toasts} />
      <PlanosPopup aberto={planosPopup.aberto} motivo={planosPopup.motivo} onFechar={fecharPlanosPopup} />
    </>
  )
}
