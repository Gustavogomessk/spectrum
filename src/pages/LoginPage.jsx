import { useState } from "react"
import { useSpectrum } from "../context/SpectrumContext"
import AppIcon from "../components/ui/AppIcon"
import { Bot } from "lucide-react"

export default function LoginPage() {
  const { loginDemo, loginSupabase, cadastroSupabase, isSupabase, perfilRole, setPerfilRole, toast } = useSpectrum()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [cadOpen, setCadOpen] = useState(false)
  const [cad, setCad] = useState({ nome: "", email: "", senha: "" })
  const [carregandoLogin, setCarregandoLogin] = useState(false)
  const [carregandoCadastro, setCarregandoCadastro] = useState(false)

  function selecionarTab(role) {
    setPerfilRole(role)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (carregandoLogin) return
    if (isSupabase) {
      setCarregandoLogin(true)
      try {
        await loginSupabase(email, senha)
      } finally {
        setCarregandoLogin(false)
      }
    } else {
      loginDemo(email, senha, perfilRole)
    }
  }

  async function criarConta(e) {
    e.preventDefault()
    if (carregandoCadastro) return
    if (!cad.nome?.trim() || !cad.email?.trim() || !cad.senha) {
      toast("Preencha nome, e-mail e senha.", "erro")
      return
    }
    if (cad.senha.length < 6) {
      toast("A senha deve ter no mínimo 6 caracteres.", "erro")
      return
    }
    if (isSupabase) {
      setCarregandoCadastro(true)
      try {
        const res = await cadastroSupabase({
          nome: cad.nome.trim(),
          email: cad.email.trim(),
          senha: cad.senha,
          papel: "Professor(a)",
          escola: "",
        })
        if (res?.ok) {
          setCadOpen(false)
          if (res.email) {
            setEmail(res.email)
            setSenha("")
          }
          setCad({ nome: "", email: "", senha: "" })
        }
      } finally {
        setCarregandoCadastro(false)
      }
    } else {
      setCadOpen(false)
      toast("Conta criada (modo demonstração — sem banco). Use a mesma senha e e-mail fictícios no login.", "sucesso")
    }
  }

  return (
    <>
      <a href="#login-conteudo" className="skip-link">
        Ir para o conteúdo principal
      </a>

      <div id="tela-login" className="tela ativa" role="main" aria-label="Tela de login">
        <div className="login-hero" role="img" aria-label="Ilustração decorativa Spectrum">
          <div className="login-logo logo-animado">
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <AppIcon icon={Bot} size={22} />
              Spectrum
            </span>
          </div>
          <p className="login-tagline">IA que adapta materiais acadêmicos para crianças neurodivergentes em segundos.</p>
          <p style={{ fontSize: "0.88rem", opacity: 0.85, marginBottom: "1.5rem", position: "relative", zIndex: 1 }}>
            Grupo: Boyband, Nicole & Julia • Adaptação em massa, em segundos
          </p>
          <div className="login-stat" aria-label="O que antes levava 2 horas, agora leva segundos">
            <strong>2h → 30s</strong>
            <span>Tempo médio de adaptação</span>
          </div>
        </div>

        <div className="login-form-area" id="login-conteudo">
          <h1 className="login-titulo">Bem-vindo de volta</h1>
          <p className="login-sub">Acesse com seu perfil para continuar</p>

          {!isSupabase ? (
            <p className="texto-mudo mb-2" style={{ padding: "0.75rem", background: "var(--cor-fundo)", borderRadius: "var(--raio-md)", border: "1px solid var(--cor-borda)" }}>
              <strong>Modo demonstração:</strong> sem variáveis do Supabase no <code style={{ fontSize: "0.85em" }}>.env</code>. O login usa dados locais. Para cadastro real, configure{" "}
              <code style={{ fontSize: "0.85em" }}>VITE_SUPABASE_URL</code> e <code style={{ fontSize: "0.85em" }}>VITE_SUPABASE_ANON_KEY</code> e reinicie o <code style={{ fontSize: "0.85em" }}>npm run dev</code>.
            </p>
          ) : (
            <p className="texto-mudo mb-2" style={{ padding: "0.75rem", background: "var(--cor-primaria-clara)", borderRadius: "var(--raio-md)", fontSize: "0.88rem" }}>
              Conta conectada ao Supabase. Após o cadastro, se não entrar sozinho, confira se a confirmação por e-mail está desativada em <strong>Authentication → Providers → Email</strong> (ideal para testes).
            </p>
          )}

         {/* <div className="perfil-tabs" role="tablist" aria-label="Tipo de perfil">
            <button
              type="button"
              className={`tab-btn ${perfilRole === "professor" ? "ativo" : ""}`}
              role="tab"
              aria-selected={perfilRole === "professor"}
              onClick={() => selecionarTab("professor")}
            >
              Professor
            </button>
            <button
              type="button"
              className={`tab-btn ${perfilRole === "psico" ? "ativo" : ""}`}
              role="tab"
              aria-selected={perfilRole === "psico"}
              onClick={() => selecionarTab("psico")}
            >
              Psicopedagogo
            </button>
            <button
              type="button"
              className={`tab-btn ${perfilRole === "secretaria" ? "ativo" : ""}`}
              role="tab"
              aria-selected={perfilRole === "secretaria"}
              onClick={() => selecionarTab("secretaria")}
            >
              Secretaria
            </button>
            <button
              type="button"
              className={`tab-btn ${perfilRole === "admin_instituicao" ? "ativo" : ""}`}
              role="tab"
              aria-selected={perfilRole === "admin_instituicao"}
              onClick={() => selecionarTab("admin_instituicao")}
            >
              SubAdmin
            </button>
            <button
              type="button"
              className={`tab-btn ${perfilRole === "admin_master" ? "ativo" : ""}`}
              role="tab"
              aria-selected={perfilRole === "admin_master"}
              onClick={() => selecionarTab("admin_master")}
            >
              Admin Master
            </button>
         </div> */}

          <form onSubmit={onSubmit} noValidate>
            <label className="campo-label" htmlFor="email">
              E-mail institucional
            </label>
            <input
              id="email"
              type="email"
              className="campo"
              placeholder="professor@escola.edu.br"
              autoComplete="email"
              required
              aria-required="true"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="campo-label" htmlFor="senha">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              className="campo"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              aria-required="true"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            <button type="submit" className="btn btn-primario btn-bloco btn-lg" id="btn-login" disabled={carregandoLogin}>
              <span>{carregandoLogin ? "Entrando…" : "Entrar na plataforma"}</span>
            </button>
          </form>

          <p className="texto-mudo mt-2" style={{ textAlign: "center" }}>
            Primeiro acesso?{" "}
            <button
              type="button"
              onClick={() => setCadOpen(true)}
              style={{ color: "var(--cor-primaria)", fontWeight: 700, background: "none", border: "none", cursor: "pointer", font: "inherit" }}
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>

      {cadOpen ? (
        <div
          className="modal-overlay aberto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cadastro-titulo"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCadOpen(false)
          }}
        >
          <div className="modal">
            <div className="modal-cabecalho">
              <span className="card-titulo" id="modal-cadastro-titulo">
                Criar Conta
              </span>
              <button type="button" className="modal-fechar" onClick={() => setCadOpen(false)} aria-label="Fechar">
                ×
              </button>
            </div>
            <form className="modal-corpo" onSubmit={criarConta}>
              <label className="campo-label" htmlFor="cad-nome">
                Nome
              </label>
              <input id="cad-nome" type="text" className="campo" placeholder="Seu nome" value={cad.nome} onChange={(e) => setCad((c) => ({ ...c, nome: e.target.value }))} />
              <label className="campo-label" htmlFor="cad-email">
                E-mail institucional
              </label>
              <input id="cad-email" type="email" className="campo" placeholder="email@escola.edu.br" value={cad.email} onChange={(e) => setCad((c) => ({ ...c, email: e.target.value }))} />
              <label className="campo-label" htmlFor="cad-senha">
                Senha
              </label>
              <input id="cad-senha" type="password" className="campo" placeholder="Mínimo 8 caracteres" value={cad.senha} onChange={(e) => setCad((c) => ({ ...c, senha: e.target.value }))} />
              <div className="modal-rodape" style={{ border: "none", padding: "1rem 0 0" }}>
                <button type="button" className="btn btn-secundario" onClick={() => setCadOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primario" disabled={carregandoCadastro}>
                  {carregandoCadastro ? "Criando…" : "Criar Conta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
