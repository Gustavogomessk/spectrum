import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { supabase, isSupabaseConfigured } from "../services/supabaseClient"
import {
  deleteAluno as apiDeleteAluno,
  deleteMaterial as apiDeleteMaterial,
  fetchAlunos,
  fetchMateriais,
  insertAluno,
  insertMaterial,
  updateAluno,
} from "../services/supabaseData"
import { mensagemErroSupabaseAuth } from "../utils/authErrors"
import { isErroRelacionamentoPostgrest, isErroTabelaAusente, resumoErroSupabase } from "../utils/supabaseErrors"
import { funcaoMetadataDePapelCadastro, PERFIL, SECOES_SO_EDUCADOR, perfilCodigoDeMetadata } from "../utils/perfil"

const NeuroIncludeContext = createContext(null)

const PAPEL_MAP = {
  professor: "Professora",
  psico: "Psicopedagoga",
  secretaria: "Secretaria",
}

const NOME_MAP = {
  professor: "Prof. Ana Lima",
  psico: "Psicopedagoga Carla",
  secretaria: "Sec. João Pedro",
}

function iniciaisDe(nome) {
  return nome
    .split(" ")
    .map((p) => p[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

export function NeuroIncludeProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfilRole, setPerfilRole] = useState("professor")
  const [alunos, setAlunos] = useState([])
  const [materiais, setMateriais] = useState([])
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastSyncJaExibido = useRef(false)

  const userId = usuario?.id || "local-demo"

  const toast = useCallback((msg, tipo = "info") => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, msg, tipo }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3500)
  }, [])

  const refresh = useCallback(async () => {
    if (!usuario) return
    try {
      const [a, m] = await Promise.all([fetchAlunos(userId), fetchMateriais(userId)])
      setAlunos(a)
      setMateriais(m)
      toastSyncJaExibido.current = false
    } catch (e) {
      console.error("[NeuroInclude sync]", resumoErroSupabase(e), e)
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
        iniciais: iniciaisDe(nome),
      })
      setPerfilRole(role)
      toast(`Bem-vindo(a), ${nome}! 👋`, "sucesso")
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
      if (payload.id) {
        await updateAluno(userId, { ...payload, id: payload.id })
      } else {
        await insertAluno(userId, payload)
      }
      await refresh()
    },
    [userId, refresh],
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
      refresh,
    ],
  )

  return <NeuroIncludeContext.Provider value={value}>{children}</NeuroIncludeContext.Provider>
}

export function useNeuroInclude() {
  const ctx = useContext(NeuroIncludeContext)
  if (!ctx) throw new Error("useNeuroInclude fora do provider")
  return ctx
}
