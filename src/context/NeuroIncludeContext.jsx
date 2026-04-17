import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { supabase, isSupabaseConfigured } from "../services/supabaseClient"
import {
  deleteAluno as apiDeleteAluno,
  deleteMaterial as apiDeleteMaterial,
  fetchAlunos,
  fetchMateriais,
  insertAluno,
  insertMaterial,
  patchAluno,
  updateAluno,
} from "../services/supabaseData"
import { sanitizeStorageSegment, uploadPdf } from "../services/files"
import { atualizarLicenca, atualizarLicencasUsuario, atualizarStatusBoleto as atualizarStatusBoletoApi, createInstituicao, editarInstituicao as editarInstituicaoStore, createUsuarioInstituicao, enviarNotificacao, getAdminData, desabilitarInstituicao, habilitarInstituicao, desabilitarUsuario, habilitarUsuario, criarBoleto, deletarBoleto, deletarUsuario, editarUsuario, deletarInstituicao, obterTokensCohere } from "../services/adminData"
import { mensagemErroSupabaseAuth } from "../utils/authErrors"
import { isErroRelacionamentoPostgrest, isErroTabelaAusente, resumoErroSupabase } from "../utils/supabaseErrors"
import { funcaoMetadataDePapelCadastro, isAdmin, PERFIL, SECOES_SO_EDUCADOR, perfilCodigoDeMetadata } from "../utils/perfil"

const SpectrumContext = createContext(null)

const PAPEL_MAP = {
  professor: "Professora",
  psico: "Psicopedagoga",
  secretaria: "Secretaria",
  admin_master: "Admin Master",
  admin_instituicao: "SubAdmin Instituição",
}

const NOME_MAP = {
  professor: "Prof. Ana Lima",
  psico: "Psicopedagoga Carla",
  secretaria: "Sec. João Pedro",
  admin_master: "Admin Master",
  admin_instituicao: "SubAdmin Instituição",
}

function iniciaisDe(nome) {
  return nome
    .split(" ")
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

export function SpectrumProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfilRole, setPerfilRole] = useState("professor")
  const [alunos, setAlunos] = useState([])
  const [materiais, setMateriais] = useState([])
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const [adminData, setAdminData] = useState(() => getAdminData())
  const [trialUso, setTrialUso] = useState({ adaptacoes: 0, chatPerguntas: 0 })
  const [planosPopup, setPlanosPopup] = useState({ aberto: false, motivo: "" })
  const toastSyncJaExibido = useRef(false)

  const userId = usuario?.id || "local-demo"

  const toast = useCallback((msg, tipo = "info") => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, msg, tipo }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3500)
  }, [])

  const trialKey = `trial_usage_${userId}`
  const trialLimites = { adaptacoes: 5, chatPerguntas: 5 }
  const isTrialAtivo = Boolean(usuario && !usuario.schoolId && !isAdmin(usuario))

  useEffect(() => {
    if (!usuario) return
    const raw = sessionStorage.getItem(trialKey)
    if (!raw) {
      setTrialUso({ adaptacoes: 0, chatPerguntas: 0 })
      return
    }
    try {
      setTrialUso(JSON.parse(raw))
    } catch {
      setTrialUso({ adaptacoes: 0, chatPerguntas: 0 })
    }
  }, [trialKey, usuario])

  const registrarUsoTrial = useCallback(
    (tipo) => {
      if (!isTrialAtivo) return true
      const atual = { ...trialUso }
      if (tipo === "adaptacao") {
        if (atual.adaptacoes >= trialLimites.adaptacoes) {
          setPlanosPopup({ aberto: true, motivo: "Você atingiu 5 adaptações gratuitas no plano trial." })
          return false
        }
        atual.adaptacoes += 1
      }
      if (tipo === "chat") {
        if (atual.chatPerguntas >= trialLimites.chatPerguntas) {
          setPlanosPopup({ aberto: true, motivo: "Você atingiu 5 perguntas com IA no plano trial." })
          return false
        }
        atual.chatPerguntas += 1
      }
      setTrialUso(atual)
      sessionStorage.setItem(trialKey, JSON.stringify(atual))
      return true
    },
    [isTrialAtivo, trialUso, trialKey],
  )

  const abrirPlanosPopup = useCallback((motivo) => {
    setPlanosPopup({ aberto: true, motivo: motivo || "" })
  }, [])

  const fecharPlanosPopup = useCallback(() => {
    setPlanosPopup({ aberto: false, motivo: "" })
  }, [])

  const refresh = useCallback(async () => {
    if (!usuario) return
    try {
      const [a, m] = await Promise.all([fetchAlunos(userId), fetchMateriais(userId)])
      setAlunos(a)
      setMateriais(m)
      toastSyncJaExibido.current = false
    } catch (e) {
      console.error("[Spectrum sync]", resumoErroSupabase(e), e)
      if (isErroTabelaAusente(e)) {
        if (!toastSyncJaExibido.current) {
          toastSyncJaExibido.current = true
          toast(
            "Tabelas não encontradas neste projeto Supabase. Abra SQL Editor, cole e execute o arquivo supabase/schema.sql (mesmo projeto do .env). Confira em Table Editor se existem public.alunos e public.materiais.",
            "erro",
          )
        }
      } else if (isErroRelacionamentoPostgrest(e)) {
        toast("Erro de relacionamento no PostgREST. Atualize o app ou execute de novo o schema.sql (FK aluno_id → alunos).", "erro")
      } else if (!toastSyncJaExibido.current) {
        toastSyncJaExibido.current = true
        toast("Não foi possível sincronizar: " + (e?.message || "erro desconhecido"), "erro")
      }
    }
  }, [usuario, userId, toast])

  useEffect(() => {
    if (!usuario) return
    refresh()
  }, [usuario, refresh])

  useEffect(() => {
    if (!usuario) return
    if (usuario.perfilCodigo === PERFIL.SECRETARIA && SECOES_SO_EDUCADOR.has(activeSection)) {
      setActiveSection("alunos")
      return
    }
    if (usuario.perfilCodigo === PERFIL.ADMIN_MASTER && activeSection === "dashboard") {
      setActiveSection("admin-global")
      return
    }
    if (usuario.perfilCodigo === PERFIL.ADMIN_INSTITUICAO && activeSection === "dashboard") {
      setActiveSection("admin-instituicao")
    }
  }, [usuario, activeSection])

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session
      if (!s?.user) return
      const meta = s.user.user_metadata || {}
      setUsuario({
        id: s.user.id,
        email: s.user.email,
        nome: meta.nome || s.user.email?.split("@")[0] || "Usuário",
        papel: meta.papel || "Educador(a)",
        perfilCodigo: perfilCodigoDeMetadata(meta),
        schoolId: meta.schoolId || null,
        iniciais: iniciaisDe(meta.nome || s.user.email || "NI"),
      })
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) {
        setUsuario(null)
        return
      }
      const meta = session.user.user_metadata || {}
      setUsuario({
        id: session.user.id,
        email: session.user.email,
        nome: meta.nome || session.user.email?.split("@")[0] || "Usuário",
        papel: meta.papel || "Educador(a)",
        perfilCodigo: perfilCodigoDeMetadata(meta),
        schoolId: meta.schoolId || null,
        iniciais: iniciaisDe(meta.nome || session.user.email || "NI"),
      })
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loginDemo = useCallback(
    (email, senha, role) => {
      if (!email?.trim() || !senha) {
        toast("Preencha e-mail e senha para continuar.", "erro")
        return
      }
      const nome = NOME_MAP[role] || NOME_MAP.professor
      setUsuario({
        id: "local-demo",
        email: email.trim(),
        nome,
        papel: PAPEL_MAP[role] || PAPEL_MAP.professor,
        perfilCodigo: role in PAPEL_MAP ? role : PERFIL.PROFESSOR,
        schoolId: role === PERFIL.ADMIN_INSTITUICAO ? "inst-1" : null,
        iniciais: iniciaisDe(nome),
      })
      setPerfilRole(role)
      toast(`Bem-vindo(a), ${nome}!`, "sucesso")
    },
    [toast],
  )

  const loginSupabase = useCallback(
    async (email, senha) => {
      if (!supabase) {
        toast("Supabase não configurado. Crie o arquivo .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.", "erro")
        return
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (error) {
        toast(mensagemErroSupabaseAuth(error), "erro")
        return
      }
      toast("Login realizado com sucesso.", "sucesso")
    },
    [toast],
  )

  const logout = useCallback(async () => {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut()
    }
    toastSyncJaExibido.current = false
    setUsuario(null)
    setActiveSection("dashboard")
  }, [])

  const cadastroSupabase = useCallback(
    async ({ nome, email, senha, papel, escola }) => {
      if (!supabase) {
        toast("Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env e reinicie o servidor.", "erro")
        return { ok: false }
      }
      const senhaLimpa = senha || ""
      if (senhaLimpa.length < 6) {
        toast("A senha deve ter no mínimo 6 caracteres (exigência do Supabase).", "erro")
        return { ok: false }
      }

      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senhaLimpa,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            nome,
            papel,
            escola,
            funcao: funcaoMetadataDePapelCadastro(papel),
          },
        },
      })

      if (error) {
        toast(mensagemErroSupabaseAuth(error), "erro")
        return { ok: false }
      }

      if (data.session) {
        toast("Conta criada! Você já está conectado.", "sucesso")
        return { ok: true, session: true, email: email.trim() }
      }

      if (data.user) {
        toast(
          "Conta criada. Se o projeto exige confirmação por e-mail, abra o link que o Supabase enviou. Para testes locais, desative «Confirm email» em Authentication → Providers → Email no painel Supabase.",
          "info",
        )
        return { ok: true, session: false, email: email.trim() }
      }

      toast("Cadastro enviado. Tente fazer login em instantes.", "info")
      return { ok: true, session: false, email: email.trim() }
    },
    [toast],
  )

  const salvarAlunoApi = useCallback(
    async (payload) => {
      const schoolId = usuario?.schoolId || "trial"
      if (payload.id) {
        await updateAluno(userId, { ...payload, id: payload.id })
        if (payload.laudoFile) {
          const storagePath = `escola-${schoolId}/user-${userId}/aluno-${payload.id}-${sanitizeStorageSegment(payload.laudoFile.name)}`
          const row = await uploadPdf({ file: payload.laudoFile, schoolId: usuario?.schoolId || null, userId, storagePath })
          await patchAluno(userId, payload.id, { laudo_url: row.storage_path })
        }
      } else {
        const created = await insertAluno(userId, payload)
        if (payload.laudoFile && created?.id) {
          const storagePath = `escola-${schoolId}/user-${userId}/aluno-${created.id}-${sanitizeStorageSegment(payload.laudoFile.name)}`
          const row = await uploadPdf({ file: payload.laudoFile, schoolId: usuario?.schoolId || null, userId, storagePath })
          await patchAluno(userId, created.id, { laudo_url: row.storage_path })
        }
      }
      await refresh()
    },
    [userId, refresh, usuario?.schoolId],
  )

  const verLaudoAluno = useCallback(
    async (alunoId) => {
      if (!supabase) throw new Error("supabase_not_configured")
      const aluno = alunos.find((a) => String(a.id) === String(alunoId))
      const path = aluno?.laudo_url
      if (!path) throw new Error("no_laudo")

      // Dev: Vite não serve /api (Vercel Functions). Preferimos assinar direto no client.
      const { data, error } = await supabase.storage.from("uploads-files").createSignedUrl(path, 180)
      if (error) {
        throw error
      }
      window.open(data?.signedUrl, "_blank", "noopener,noreferrer")
    },
    [alunos],
  )

  const removerAlunoApi = useCallback(
    async (id) => {
      await apiDeleteAluno(userId, id)
      await refresh()
    },
    [userId, refresh],
  )

  const salvarMaterialApi = useCallback(
    async (row) => {
      await insertMaterial(userId, row)
      await refresh()
    },
    [userId, refresh],
  )

  const removerMaterialApi = useCallback(
    async (id) => {
      await apiDeleteMaterial(userId, id)
      await refresh()
    },
    [userId, refresh],
  )

  const criarInstituicao = useCallback((payload) => {
    createInstituicao(payload)
    setAdminData(getAdminData())
  }, [])

  const editarInstituicao = useCallback((instituicaoId, dados) => {
    editarInstituicaoStore(instituicaoId, dados)
    setAdminData(getAdminData())
  }, [])

  const criarSubadmin = useCallback(
    async (payload) => {
      if (isSupabaseConfigured() && supabase) {
        const senhaLimpa = payload.senha || ""
        if (senhaLimpa.length < 6) {
          toast("A senha deve ter no mínimo 6 caracteres (exigência do Supabase).", "erro")
          return false
        }

        const res = await cadastroSupabase({
          nome: payload.nome,
          email: payload.email,
          senha: senhaLimpa,
          papel: "subadmin",
          escola: payload.instituicaoId,
        })

        if (!res?.ok) {
          return false
        }
      }

      createUsuarioInstituicao({ ...payload, papel: "subadmin", licencas: 1 })
      setAdminData(getAdminData())
      return true
    },
    [cadastroSupabase, toast],
  )

  const criarUsuarioInstituicao = useCallback((payload) => {
    createUsuarioInstituicao(payload)
    setAdminData(getAdminData())
  }, [])

  const atualizarLicencasUsuario = useCallback((usuarioId, licencas) => {
    atualizarLicenca(usuarioId, licencas)
    setAdminData(getAdminData())
  }, [])

  const enviarNotificacaoAdmin = useCallback((payload) => {
    enviarNotificacao(payload)
    setAdminData(getAdminData())
  }, [])

  const atualizarStatusBoleto = useCallback((boletoId, status) => {
    atualizarStatusBoletoApi(boletoId, status)
    setAdminData(getAdminData())
  }, [])

  const desabilitarInstituicaoFn = useCallback((instituicaoId) => {
    desabilitarInstituicao(instituicaoId)
    setAdminData(getAdminData())
  }, [])

  const habilitarInstituicaoFn = useCallback((instituicaoId) => {
    habilitarInstituicao(instituicaoId)
    setAdminData(getAdminData())
  }, [])

  const desabilitarUsuarioFn = useCallback((usuarioId) => {
    desabilitarUsuario(usuarioId)
    setAdminData(getAdminData())
  }, [])

  const habilitarUsuarioFn = useCallback((usuarioId) => {
    habilitarUsuario(usuarioId)
    setAdminData(getAdminData())
  }, [])

  const criarBoletoFn = useCallback((payload) => {
    criarBoleto(payload)
    setAdminData(getAdminData())
  }, [])

  const deletarBoletoFn = useCallback((boletoId) => {
    deletarBoleto(boletoId)
    setAdminData(getAdminData())
  }, [])

  const deletarUsuarioFn = useCallback((usuarioId) => {
    deletarUsuario(usuarioId)
    setAdminData(getAdminData())
  }, [])

  const editarUsuarioFn = useCallback((usuarioId, dados) => {
    editarUsuario(usuarioId, dados)
    setAdminData(getAdminData())
  }, [])

  const deletarInstituicaoFn = useCallback((instituicaoId) => {
    deletarInstituicao(instituicaoId)
    setAdminData(getAdminData())
  }, [])

  const atualizarTokensCohere = useCallback(async () => {
    const tokens = await obterTokensCohere()
    const data = getAdminData()
    data.iaMetrics.totalTokens = tokens
    sessionStorage.setItem("spectrum_admin_data_v1", JSON.stringify(data))
    setAdminData(data)
  }, [])

  const value = useMemo(
    () => ({
      usuario,
      perfilRole,
      setPerfilRole,
      alunos,
      materiais,
      activeSection,
      setActiveSection,
      sidebarOpen,
      setSidebarOpen,
      toasts,
      toast,
      loginDemo,
      loginSupabase,
      logout,
      cadastroSupabase,
      salvarAlunoApi,
      removerAlunoApi,
      salvarMaterialApi,
      removerMaterialApi,
      verLaudoAluno,
      adminData,
      criarInstituicao,
      editarInstituicao,
      criarSubadmin,
      criarUsuarioInstituicao,
      atualizarLicencasUsuario,
      enviarNotificacaoAdmin,
      atualizarStatusBoleto,
      desabilitarInstituicao: desabilitarInstituicaoFn,
      habilitarInstituicao: habilitarInstituicaoFn,
      desabilitarUsuario: desabilitarUsuarioFn,
      habilitarUsuario: habilitarUsuarioFn,
      criarBoleto: criarBoletoFn,
      deletarBoleto: deletarBoletoFn,
      deletarUsuario: deletarUsuarioFn,
      editarUsuario: editarUsuarioFn,
      deletarInstituicao: deletarInstituicaoFn,
      atualizarTokensCohere,
      trialUso,
      trialLimites,
      isTrialAtivo,
      registrarUsoTrial,
      planosPopup,
      abrirPlanosPopup,
      fecharPlanosPopup,
      refresh,
      isSupabase: isSupabaseConfigured(),
    }),
    [
      usuario,
      perfilRole,
      alunos,
      materiais,
      activeSection,
      sidebarOpen,
      toasts,
      toast,
      loginDemo,
      loginSupabase,
      logout,
      cadastroSupabase,
      salvarAlunoApi,
      removerAlunoApi,
      salvarMaterialApi,
      removerMaterialApi,
      verLaudoAluno,
      adminData,
      criarInstituicao,
      criarSubadmin,
      criarUsuarioInstituicao,
      atualizarLicencasUsuario,
      enviarNotificacaoAdmin,
      atualizarStatusBoleto,
      desabilitarInstituicaoFn,
      habilitarInstituicaoFn,
      desabilitarUsuarioFn,
      habilitarUsuarioFn,
      trialUso,
      trialLimites,
      isTrialAtivo,
      registrarUsoTrial,
      planosPopup,
      abrirPlanosPopup,
      fecharPlanosPopup,
      refresh,
    ],
  )

  return <SpectrumContext.Provider value={value}>{children}</SpectrumContext.Provider>
}

export function useSpectrum() {
  const ctx = useContext(SpectrumContext)
  if (!ctx) throw new Error("useSpectrum fora do provider")
  return ctx
}

// Compatibilidade temporária para imports antigos.
export const useNeuroInclude = useSpectrum
