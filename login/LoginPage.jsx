import { useState } from "react"
import { useSpectrum } from "../context/SpectrumContext"


/* ─────────────────────────────────────────────
   Estilos embutidos — mesclagem de login_novo.html
   com os tokens de neuroinclude.css
───────────────────────────────────────────── */
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Syne:wght@700;800&family=Nunito:wght@700;800&family=Quicksand:wght@400;500;600;700&display=swap');

  :root {
    --blue:   #3A86FF;
    --purple: #8338EC;
    --teal:   #2EC4B6;
    --yellow: #FFBE0B;
    --white:  #ffffff;
    --bg:     #f0f4ff;
    --text:   #1a1a2e;
    --muted:  #7b82a0;
    --input-bg: #eef1fb;
    --dur:  680ms;
    --ease: cubic-bezier(0.76, 0, 0.24, 1);

    /* neuroinclude tokens */
    --cor-primaria:        #5B8DEF;
    --cor-primaria-escura: #3A6DD8;
    --cor-primaria-clara:  #EEF3FE;
    --cor-secundaria:      #7EC8A4;
    --cor-acento:          #F5A623;
    --cor-perigo:          #E05C5C;
    --cor-fundo:           #F7F9FC;
    --cor-superficie:      #FFFFFF;
    --cor-texto-principal: #1A2340;
    --cor-texto-secundario:#5A6580;
    --cor-texto-mudo:      #9BA8BE;
    --cor-borda:           #E4EAF4;
    --raio-sm:   8px;
    --raio-md:   12px;
    --raio-lg:   16px;
    --raio-xl:   24px;
    --raio-full: 9999px;
    --sombra-sm: 0 2px 8px rgba(91,141,239,0.08);
    --sombra-md: 0 4px 20px rgba(91,141,239,0.12);
    --fonte-titulo: 'Nunito', 'Syne', sans-serif;
    --fonte-corpo:  'Quicksand', 'Plus Jakarta Sans', sans-serif;
    --transicao: 0.22s ease;
  }

  /* ── SKIP LINK ── */
  .skip-link {
    position: absolute; top: -50px; left: 1rem; z-index: 9999;
    background: var(--cor-primaria); color: #fff;
    padding: 0.5rem 1rem; border-radius: var(--raio-sm);
    font-weight: 700; transition: top var(--transicao);
  }
  .skip-link:focus { top: 1rem; }

  /* ── BODY / WRAPPER ── */
  .login-page-root {
    font-family: var(--fonte-corpo);
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }
  .login-page-root::before {
    content: '';
    position: fixed; inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 10% 20%, rgba(58,134,255,0.10) 0%, transparent 70%),
      radial-gradient(ellipse 50% 40% at 90% 80%, rgba(131,56,236,0.09) 0%, transparent 70%);
    pointer-events: none;
  }

  /* ── AUTH WRAPPER ── */
  .auth-wrapper {
    position: relative;
    width: min(980px, 97vw);
    height: min(620px, 95vh);
    border-radius: 28px;
    overflow: hidden;
    box-shadow:
      0 40px 100px rgba(58,134,255,0.15),
      0 8px 32px rgba(131,56,236,0.10);
    display: flex;
  }

  /* ── PANELS ── */
  .panel {
    position: absolute;
    top: 0; bottom: 0; width: 50%;
    transition: transform var(--dur) var(--ease);
    will-change: transform;
  }

  /* FORM PANEL */
  .form-panel {
    background: var(--white);
    left: 0; z-index: 2; overflow: hidden;
  }
  .auth-wrapper.to-register .form-panel {
    transform: translateX(100%);
  }

  /* CARD PANEL (hero) */
  .card-panel {
    right: 0; z-index: 3;
    background: linear-gradient(145deg, var(--blue) 0%, var(--purple) 100%);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
  }
  .auth-wrapper.to-register .card-panel {
    transform: translateX(-100%);
  }

  /* blobs */
  .blob1, .blob2, .blob3 {
    position: absolute; border-radius: 50%; pointer-events: none;
  }
  .blob1 { width:300px; height:300px; background:rgba(255,255,255,0.07); top:-80px; right:-80px; }
  .blob2 { width:180px; height:180px; background:rgba(46,196,182,0.18); bottom:-50px; left:-40px; }
  .blob3 { width:90px;  height:90px;  background:rgba(255,190,11,0.22); top:50%; left:18%; transform:translateY(-50%); }

  /* ── CARD CONTENT ── */
  .card-content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 48px 40px; text-align: center; z-index: 2;
    transition: opacity 0.32s var(--ease), transform 0.32s var(--ease);
  }
  .card-content.hidden {
    opacity: 0; pointer-events: none; transform: translateY(14px);
  }

  .card-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.14);
    border: 1px solid rgba(255,255,255,0.22);
    border-radius: 24px; padding: 6px 16px;
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.9); letter-spacing: 0.5px;
    margin-bottom: 20px;
  }
  .dot-b { width:6px; height:6px; border-radius:50%; background:var(--yellow); flex-shrink:0; }

  .card-title {
    font-family: var(--fonte-titulo);
    font-size: 30px; font-weight: 800; color: var(--white);
    line-height: 1.15; margin-bottom: 12px;
  }
  .card-title span { color: var(--yellow); }

  .card-tagline {
    font-size: 13px; color: rgba(255,255,255,0.75);
    line-height: 1.65; max-width: 220px; margin-bottom: 14px;
  }
  .card-meta {
    font-size: 11.5px; color: rgba(255,255,255,0.55);
    margin-bottom: 20px;
  }

  /* stat pill */
  .card-stat {
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.20);
    border-radius: var(--raio-md);
    padding: 10px 18px; margin-bottom: 28px;
    text-align: center;
  }
  .card-stat strong {
    font-family: var(--fonte-titulo); font-size: 22px;
    font-weight: 800; color: var(--yellow); display: block;
  }
  .card-stat span { font-size: 11px; color: rgba(255,255,255,0.70); }

  .btn-card {
    background: var(--white); color: var(--blue); border: none;
    padding: 12px 32px; border-radius: 50px;
    font-family: var(--fonte-corpo); font-size: 14px; font-weight: 700;
    cursor: pointer; transition: background 0.2s, transform 0.12s, box-shadow 0.2s, color 0.2s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  }
  .btn-card:hover {
    background: var(--yellow); color: #1a1a2e;
    transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,190,11,0.35);
  }
  .btn-card:active { transform: scale(0.97); }

  /* dots */
  .card-dots {
    position: absolute; bottom: 24px; left: 50%;
    transform: translateX(-50%);
    display: flex; gap: 7px; z-index: 3;
  }
  .cdot {
    height: 6px; width: 6px; border-radius: 3px;
    background: rgba(255,255,255,0.28);
    transition: width 0.35s var(--ease), background 0.35s;
  }
  .cdot.on { width: 22px; background: var(--yellow); }

  /* ── FORMS ── */
  .form-login, .form-register {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; justify-content: center;
    padding: 36px 48px;
    transition: opacity 0.32s var(--ease), transform 0.32s var(--ease);
  }
  .form-register {
    opacity: 0; pointer-events: none; transform: translateY(16px);
  }
  .auth-wrapper.to-register .form-login {
    opacity: 0; pointer-events: none; transform: translateY(-16px);
  }
  .auth-wrapper.to-register .form-register {
    opacity: 1; pointer-events: all; transform: translateY(0);
  }

  /* logo */
  .logo {
    display: flex; align-items: center; gap: 10px; margin-bottom: 26px;
  }
  .logo-image {
    width: 42px; height: 42px; object-fit: cover;
    border-radius: 12px; box-shadow: 0 4px 14px rgba(91,141,239,0.25);
  }
  .logo-mark {
    width: 42px; height: 42px; border-radius: 12px;
    background: linear-gradient(135deg, var(--blue), var(--purple));
    display: flex; align-items: center; justify-content: center;
  }
  .logo-mark svg { width: 22px; height: 22px; }
  .logo-text {
    font-family: var(--fonte-titulo);
    font-size: 18px; font-weight: 800; color: var(--text);
  }

  /* form typography */
  .form-heading {
    font-family: var(--fonte-titulo);
    font-size: 24px; font-weight: 800; color: var(--text); margin-bottom: 4px;
  }
  .form-sub {
    font-size: 13px; color: var(--muted); margin-bottom: 22px; line-height: 1.5;
  }

  /* demo notice */
  .demo-notice {
    padding: 10px 14px; margin-bottom: 16px;
    background: var(--cor-fundo);
    border-radius: var(--raio-md);
    border: 1px solid var(--cor-borda);
    font-size: 12px; color: var(--cor-texto-secundario); line-height: 1.55;
  }
  .demo-notice code { font-size: 0.9em; background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 4px; }
  .supabase-notice {
    padding: 10px 14px; margin-bottom: 16px;
    background: var(--cor-primaria-clara);
    border-radius: var(--raio-md);
    font-size: 12px; color: var(--cor-texto-secundario); line-height: 1.55;
  }

  /* fields */
  .field { margin-bottom: 12px; }
  .field label {
    display: block; font-size: 11px; font-weight: 700;
    color: var(--text); letter-spacing: 0.7px;
    text-transform: uppercase; margin-bottom: 5px;
  }
  .field input {
    width: 100%; height: 44px;
    background: var(--input-bg);
    border: 1.5px solid transparent;
    border-radius: var(--raio-md);
    padding: 0 14px;
    font-family: var(--fonte-corpo); font-size: 14px; color: var(--text);
    outline: none;
    transition: border-color 0.22s, background 0.22s, box-shadow 0.22s;
  }
  .field input:focus {
    border-color: var(--teal); background: #fff;
    box-shadow: 0 0 0 3px rgba(46,196,182,0.15);
  }
  .field input::placeholder { color: #b0b6cc; font-size: 13px; }

  /* primary button */
  .btn-primary {
    width: 100%; height: 46px;
    background: linear-gradient(90deg, var(--blue) 0%, var(--purple) 100%);
    color: var(--white); border: none; border-radius: var(--raio-md);
    font-family: var(--fonte-corpo); font-size: 15px; font-weight: 700;
    cursor: pointer; margin-top: 6px;
    transition: transform 0.14s, box-shadow 0.22s, filter 0.22s;
    box-shadow: 0 6px 24px rgba(58,134,255,0.30);
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 32px rgba(131,56,236,0.35);
    filter: brightness(1.07);
  }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; pointer-events: none; }

  /* switch hint */
  .switch-hint {
    text-align: center; font-size: 13px; color: var(--muted); margin-top: 16px;
  }
  .switch-hint button {
    background: none; border: none; color: var(--blue);
    font-family: var(--fonte-corpo); font-size: 13px; font-weight: 700;
    cursor: pointer; padding: 0;
    text-decoration: underline; text-underline-offset: 2px;
    text-decoration-color: rgba(58,134,255,0.4);
    transition: color 0.2s;
  }
  .switch-hint button:hover { color: var(--purple); }

  /* accent bar */
  .accent-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--blue), var(--teal), var(--yellow));
  }

  /* ── MODAL ── */
  .modal-overlay {
    display: none; position: fixed; inset: 0; z-index: 1000;
    background: rgba(26,35,64,0.45); backdrop-filter: blur(4px);
    align-items: center; justify-content: center; padding: 1rem;
  }
  .modal-overlay.aberto { display: flex; }
  .modal {
    background: #fff; border-radius: var(--raio-xl);
    width: 100%; max-width: 480px; max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(26,35,64,0.2);
    animation: fadeSlide 0.25s ease;
  }
  @keyframes fadeSlide {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .modal-cabecalho {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--cor-borda);
    display: flex; align-items: center; gap: 1rem;
  }
  .modal-titulo {
    font-family: var(--fonte-titulo); font-size: 1.1rem;
    font-weight: 800; flex: 1; color: var(--cor-texto-principal);
  }
  .modal-fechar {
    background: none; border: none; font-size: 1.4rem;
    cursor: pointer; color: var(--cor-texto-mudo);
    padding: 0.25rem; transition: color var(--transicao); line-height: 1;
  }
  .modal-fechar:hover { color: var(--cor-perigo); }
  .modal-corpo { padding: 1.5rem; }

  /* modal fields reuse .field */
  .modal-campo-label {
    display: block; font-size: 0.82rem; font-weight: 700;
    color: var(--cor-texto-secundario); margin-bottom: 0.35rem;
    text-transform: uppercase; letter-spacing: 0.05em;
  }
  .modal-campo {
    width: 100%; padding: 0.7rem 1rem; margin-bottom: 1rem;
    border: 1.5px solid var(--cor-borda);
    border-radius: var(--raio-md); font-family: var(--fonte-corpo);
    font-size: 0.95rem; color: var(--cor-texto-principal); background: #fff;
    transition: border-color var(--transicao);
    outline: none;
  }
  .modal-campo:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(46,196,182,0.12); }
  .modal-campo::placeholder { color: var(--cor-texto-mudo); font-size: 0.9rem; }

  .modal-rodape {
    padding: 1rem 1.5rem 1.5rem;
    display: flex; gap: 0.75rem; justify-content: flex-end;
  }
  .btn-modal-cancel {
    padding: 0.65rem 1.4rem; border: none; border-radius: var(--raio-full);
    font-family: var(--fonte-corpo); font-size: 0.9rem; font-weight: 700;
    cursor: pointer; background: var(--cor-primaria-clara); color: var(--cor-primaria);
    transition: background var(--transicao);
  }
  .btn-modal-cancel:hover { background: #dce9fd; }
  .btn-modal-submit {
    padding: 0.65rem 1.6rem; border: none; border-radius: var(--raio-full);
    font-family: var(--fonte-corpo); font-size: 0.9rem; font-weight: 700;
    cursor: pointer;
    background: linear-gradient(90deg, var(--blue), var(--purple));
    color: #fff; box-shadow: 0 4px 16px rgba(91,141,239,0.3);
    transition: filter 0.2s, transform 0.12s;
  }
  .btn-modal-submit:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .btn-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }

  /* ── TOAST ── */
  .toast-container {
    position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
    display: flex; flex-direction: column; gap: 0.5rem;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 680px) {
    .auth-wrapper {
      width: 100vw; height: 100vh; border-radius: 0;
    }
    .card-panel { display: none; }
    .form-panel { width: 100%; }
    .auth-wrapper.to-register .form-panel { transform: none; }
    .form-login, .form-register { padding: 32px 28px; }
  }
`

export default function LoginPage() {
  const {
    loginDemo, loginSupabase, cadastroSupabase,
    isSupabase, perfilRole, setPerfilRole, toast,
  } = useSpectrum()

  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [cadOpen, setCadOpen] = useState(false)
  const [cad, setCad] = useState({ nome: "", email: "", senha: "" })
  const [carregandoLogin, setCarregandoLogin] = useState(false)
  const [carregandoCadastro, setCarregandoCadastro] = useState(false)

  // panel state: 'login' | 'register'
  const [mode, setMode] = useState("login")
  const [locked, setLocked] = useState(false)

  function switchTo(newMode) {
    if (newMode === mode || locked) return
    setLocked(true)
    setMode(newMode)
    setTimeout(() => setLocked(false), 700)
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (carregandoLogin) return
    if (isSupabase) {
      setCarregandoLogin(true)
      try { await loginSupabase(email, senha) }
      finally { setCarregandoLogin(false) }
    } else {
      loginDemo(email, senha, perfilRole)
    }
  }

  async function criarConta(e) {
    e.preventDefault()
    if (carregandoCadastro) return
    if (!cad.nome?.trim() || !cad.email?.trim() || !cad.senha) {
      toast("Preencha nome, e-mail e senha.", "erro"); return
    }
    if (cad.senha.length < 6) {
      toast("A senha deve ter no mínimo 6 caracteres.", "erro"); return
    }
    if (isSupabase) {
      setCarregandoCadastro(true)
      try {
        const res = await cadastroSupabase({
          nome: cad.nome.trim(), email: cad.email.trim(),
          senha: cad.senha, papel: "Professor(a)", escola: "",
        })
        if (res?.ok) {
          setCadOpen(false)
          if (res.email) { setEmail(res.email); setSenha("") }
          setCad({ nome: "", email: "", senha: "" })
        }
      } finally { setCarregandoCadastro(false) }
    } else {
      setCadOpen(false)
      toast("Conta criada (modo demonstração). Use o mesmo e-mail e senha no login.", "sucesso")
    }
  }

  const isRegister = mode === "register"

  return (
    <>
      <style>{styles}</style>

      <a href="#login-conteudo" className="skip-link">
        Ir para o conteúdo principal
      </a>

      <div className="login-page-root" role="main" aria-label="Tela de login">
        <div className={`auth-wrapper${isRegister ? " to-register" : ""}`}>

          {/* ── FORM PANEL ── */}
          <div className="panel form-panel">
            <div className="accent-bar" />

            {/* ── LOGIN FORM ── */}
            <div className="form-login" id="login-conteudo">
              <div className="logo">
                {projectLogo
                  ? <img src={projectLogo} alt="Logo Spectrum" className="logo-image" />
                  : (
                    <div className="logo-mark">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L3 7.5V12C3 16.14 7.02 20.11 12 21C16.98 20.11 21 16.14 21 12V7.5L12 3Z"
                          fill="white" fillOpacity="0.95" />
                        <path d="M9 12l2 2 4-4" stroke="#3A86FF" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                <span className="logo-text">Spectrum</span>
              </div>

              <div className="form-heading">Bem-vindo de volta</div>
              <p className="form-sub">Acesse com suas credenciais institucionais</p>

              {!isSupabase ? (
                <div className="demo-notice">
                  <strong>Modo demonstração:</strong> sem variáveis do Supabase no{" "}
                  <code>.env</code>. Login usa dados locais. Para cadastro real, configure{" "}
                  <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.
                </div>
              ) : (
                <div className="supabase-notice">
                  Conta conectada ao Supabase. Após o cadastro, se não entrar sozinho,
                  desative a confirmação por e-mail em{" "}
                  <strong>Authentication → Providers → Email</strong>.
                </div>
              )}

              <form onSubmit={onSubmit} noValidate>
                <div className="field">
                  <label htmlFor="email">E-mail Institucional</label>
                  <input
                    id="email" type="email"
                    placeholder="professor@escola.edu.br"
                    autoComplete="email" required aria-required="true"
                    value={email} onChange={e => setEmail(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="senha">Senha</label>
                  <input
                    id="senha" type="password"
                    placeholder="••••••••"
                    autoComplete="current-password" required aria-required="true"
                    value={senha} onChange={e => setSenha(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={carregandoLogin}>
                  {carregandoLogin ? "Entrando…" : "Entrar na plataforma"}
                </button>
              </form>

              <p className="switch-hint">
                Não tem conta?&nbsp;
                <button type="button" onClick={() => switchTo("register")}>
                  Cadastre-se aqui
                </button>
              </p>
            </div>

            {/* ── REGISTER FORM ── */}
            <div className="form-register" aria-hidden={!isRegister}>
              <div className="logo">
                {projectLogo
                  ? <img src={projectLogo} alt="Logo Spectrum" className="logo-image" />
                  : (
                    <div className="logo-mark">
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 3L3 7.5V12C3 16.14 7.02 20.11 12 21C16.98 20.11 21 16.14 21 12V7.5L12 3Z"
                          fill="white" fillOpacity="0.95" />
                        <path d="M9 12l2 2 4-4" stroke="#3A86FF" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                <span className="logo-text">Spectrum</span>
              </div>

              <div className="form-heading">Criar sua conta</div>
              <p className="form-sub">Preencha os dados para seu cadastro docente</p>

              <form onSubmit={criarConta} noValidate>
                <div className="field">
                  <label htmlFor="cad-nome">Nome Completo</label>
                  <input
                    id="cad-nome" type="text"
                    placeholder="Dr. Ana Paula Souza"
                    value={cad.nome}
                    onChange={e => setCad(c => ({ ...c, nome: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cad-email">E-mail Institucional</label>
                  <input
                    id="cad-email" type="email"
                    placeholder="nome@instituicao.edu.br"
                    value={cad.email}
                    onChange={e => setCad(c => ({ ...c, email: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cad-senha">Senha</label>
                  <input
                    id="cad-senha" type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={cad.senha}
                    onChange={e => setCad(c => ({ ...c, senha: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary" disabled={carregandoCadastro}>
                  {carregandoCadastro ? "Criando…" : "Criar minha conta"}
                </button>
              </form>

              <p className="switch-hint">
                Já tem conta?&nbsp;
                <button type="button" onClick={() => switchTo("login")}>
                  Fazer login
                </button>
              </p>
            </div>
          </div>

          {/* ── CARD PANEL (hero) ── */}
          <div className="panel card-panel">
            <div className="blob1" /><div className="blob2" /><div className="blob3" />

            {/* Card — Login state */}
            <div className={`card-content${isRegister ? " hidden" : ""}`}>
              <div className="card-badge">
                <span className="dot-b" />Portal Institucional
              </div>
              <div className="card-title">Seja<br /><span>Bem-vindo!</span></div>
              <p className="card-tagline">
                IA que adapta materiais acadêmicos para crianças neurodivergentes em segundos.
              </p>
              <p className="card-meta">
                Grupo: Boyband, Nicole &amp; Julia • Adaptação em massa, em segundos
              </p>
              <div className="card-stat">
                <strong>2h → 30s</strong>
                <span>Tempo médio de adaptação</span>
              </div>
              <button className="btn-card" onClick={() => switchTo("register")}>
                Não tenho conta
              </button>
            </div>

            {/* Card — Register state */}
            <div className={`card-content${!isRegister ? " hidden" : ""}`}>
              <div className="card-badge">
                <span className="dot-b" />Novo Docente
              </div>
              <div className="card-title">Junte-se<br /><span>a nós!</span></div>
              <p className="card-tagline">
                IA que adapta materiais acadêmicos para crianças neurodivergentes em segundos.
              </p>
              <p className="card-meta">
                Grupo: Boyband, Nicole &amp; Julia • Adaptação em massa, em segundos
              </p>
              <div className="card-stat">
                <strong>2h → 30s</strong>
                <span>Tempo médio de adaptação</span>
              </div>
              <button className="btn-card" onClick={() => switchTo("login")}>
                Já tenho conta
              </button>
            </div>

            {/* dots */}
            <div className="card-dots">
              <div className={`cdot${!isRegister ? " on" : ""}`} />
              <div className={`cdot${isRegister ? " on" : ""}`} />
            </div>
          </div>

        </div>
      </div>

      {/* ── CADASTRO MODAL (fallback / extra entry point) ── */}
      <div
        className={`modal-overlay${cadOpen ? " aberto" : ""}`}
        role="dialog" aria-modal="true" aria-labelledby="modal-cadastro-titulo"
        onClick={e => { if (e.target === e.currentTarget) setCadOpen(false) }}
      >
        <div className="modal">
          <div className="modal-cabecalho">
            <span className="modal-titulo" id="modal-cadastro-titulo">Criar Conta</span>
            <button type="button" className="modal-fechar"
              onClick={() => setCadOpen(false)} aria-label="Fechar">×</button>
          </div>
          <form className="modal-corpo" onSubmit={criarConta}>
            <label className="modal-campo-label" htmlFor="m-cad-nome">Nome</label>
            <input id="m-cad-nome" type="text" className="modal-campo"
              placeholder="Seu nome completo"
              value={cad.nome} onChange={e => setCad(c => ({ ...c, nome: e.target.value }))} />

            <label className="modal-campo-label" htmlFor="m-cad-email">E-mail Institucional</label>
            <input id="m-cad-email" type="email" className="modal-campo"
              placeholder="email@escola.edu.br"
              value={cad.email} onChange={e => setCad(c => ({ ...c, email: e.target.value }))} />

            <label className="modal-campo-label" htmlFor="m-cad-senha">Senha</label>
            <input id="m-cad-senha" type="password" className="modal-campo"
              placeholder="Mínimo 6 caracteres"
              value={cad.senha} onChange={e => setCad(c => ({ ...c, senha: e.target.value }))} />

            <div className="modal-rodape">
              <button type="button" className="btn-modal-cancel" onClick={() => setCadOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-modal-submit" disabled={carregandoCadastro}>
                {carregandoCadastro ? "Criando…" : "Criar Conta"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
