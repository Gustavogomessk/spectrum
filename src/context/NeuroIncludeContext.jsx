import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { createClient } from "@supabase/supabase-js"
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
import { hash } from "bcryptjs"
import {
  atualizarLicenca,
  atualizarStatusBoleto as atualizarStatusBoletoApi,
  confirmarPagamentoViaWebhook,
  createInstituicao,
  createUsuarioInstituicao,
  criarBoleto,
  criarPagamentoSubadmin,
  deletarBoleto,
  deletarInstituicao,
  deletarUsuario,
  desabilitarInstituicao,
  desabilitarInstituicaoComMembros,
  desabilitarUsuario,
  desabilitarUsuarioComInstituicao,
  editarInstituicao as editarInstituicaoStore,
  editarUsuario,
  enviarNotificacao,
  getAdminData,
  habilitarInstituicao,
  habilitarInstituicaoComMembros,
  habilitarUsuario,
  habilitarUsuarioComInstituicao,
  listarNotificacoesSubadmin,
  listarPagamentosSubadmin,
  listarPagamentosPorInstituicao,
  marcarNotificacaoComoLida,
  obterTokensCohere,
  registrarUsoIa,
  salvarPdfGerado,
  verificarStatusUsuario,
} from "../services/adminData"
import { mensagemErroSupabaseAuth } from "../utils/authErrors"
import { isErroRelacionamentoPostgrest, isErroTabelaAusente, resumoErroSupabase } from "../utils/supabaseErrors"
import { funcaoMetadataDePapelCadastro, isAdmin, PERFIL, SECOES_SO_EDUCADOR, perfilCodigoDeMetadata } from "../utils/perfil"

const SpectrumContext = createContext(null)

function createEphemeralSupabaseClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
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
  const [adminData, setAdminData] = useState({
    instituicoes: [],
    usuarios: [],
    notificacoes: [],
    boletos: [],
    iaMetrics: { totalTokens: 0, adaptacoesRealizadas: 0, perguntasChat: 0, custoEstimado: 0 },
  })
  const [trialUso, setTrialUso] = useState({ adaptacoes: 0, chatPerguntas: 0 })
  const [planosPopup, setPlanosPopup] = useState({ aberto: false, motivo: "" })
  const [notificacoesSubadmin, setNotificacoesSubadmin] = useState([])
  const [pagamentosSubadmin, setPagamentosSubadmin] = useState([])
  const toastSyncJaExibido = useRef(false)

  const userId = usuario?.id || "local-demo"

  const toast = useCallback((msg, tipo = "info") => {
    const id = crypto.randomUUID()
    setToasts((t) => [...t, { id, msg, tipo }])
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 3500)
  }, [])

  const trialLimites = { adaptacoes: 5, chatPerguntas: 5 }
  const isTrialAtivo = Boolean(usuario && !usuario.schoolId && !isAdmin(usuario))

  useEffect(() => {
    if (!usuario) return
    if (!isSupabaseConfigured() || !supabase || !isTrialAtivo) {
      setTrialUso({ adaptacoes: 0, chatPerguntas: 0 })
      return
    }
    let ativo = true
    supabase
      .from("trial_usage")
      .select("adaptacoes_usadas, perguntas_chat_usadas")
      .eq("user_id", usuario.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!ativo) return
        setTrialUso({
          adaptacoes: Number(data?.adaptacoes_usadas || 0),
          chatPerguntas: Number(data?.perguntas_chat_usadas || 0),
        })
      })
      .catch(() => {
        if (!ativo) return
        setTrialUso({ adaptacoes: 0, chatPerguntas: 0 })
      })
    return () => {
      ativo = false
    }
  }, [isTrialAtivo, usuario])

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
      if (isSupabaseConfigured() && supabase && usuario?.id) {
        supabase
          .from("trial_usage")
          .upsert({
            user_id: usuario.id,
            adaptacoes_usadas: atual.adaptacoes,
            perguntas_chat_usadas: atual.chatPerguntas,
          })
          .then(({ error }) => {
            if (error) {
              console.error("Erro ao salvar trial_usage:", error)
            }
          })
          .catch((err) => {
            console.error("Erro ao salvar trial_usage:", err)
          })
      }
      return true
    },
    [isTrialAtivo, trialUso, usuario?.id],
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

  const refreshAdminData = useCallback(async () => {
    const data = await getAdminData()
    setAdminData(data)
  }, [])

  const refreshNotificacoesSubadmin = useCallback(async () => {
    if (!usuario?.id || !usuario?.schoolId) {
      setNotificacoesSubadmin([])
      return
    }
    const rows = await listarNotificacoesSubadmin({
      userId: usuario.id,
      instituicaoId: usuario.schoolId,
    })
    setNotificacoesSubadmin(rows)
  }, [usuario?.id, usuario?.schoolId])

  const refreshPagamentosSubadmin = useCallback(async () => {
    if (!usuario?.schoolId) {
      setPagamentosSubadmin([])
      return
    }
    const rows = await listarPagamentosPorInstituicao(usuario.schoolId)
    setPagamentosSubadmin(rows)
  }, [usuario?.schoolId])

  useEffect(() => {
    if (!usuario) return
    refresh()
  }, [usuario, refresh])

  useEffect(() => {
    if (!usuario) return
    refreshAdminData()
  }, [usuario, refreshAdminData])

  useEffect(() => {
    if (!usuario) return
    refreshNotificacoesSubadmin()
    refreshPagamentosSubadmin()
  }, [usuario, refreshNotificacoesSubadmin, refreshPagamentosSubadmin])

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
  }, [usuario, activeSection])

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session
      if (!s?.user) return
      const meta = s.user.user_metadata || {}
      console.log("Metadata do usuário logado:", meta)
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

  // Verificar se usuário está bloqueado (efeito separado para não bloquear o login)
  useEffect(() => {
    if (!usuario || !isSupabaseConfigured() || !supabase) return
    
    let ativo = true
    
    const verificarBloqueio = async () => {
      try {
        const statusVerificacao = await verificarStatusUsuario(usuario.id, usuario.email)
        if (!ativo) return
        
        if (statusVerificacao.bloqueado) {
          // Fazer logout se o usuário estiver bloqueado
          await supabase.auth.signOut()
          toast(statusVerificacao.motivo || "Seu acesso foi revogado.", "erro")
          setUsuario(null)
        }
      } catch (err) {
        console.error("Erro ao verificar status do usuário:", err)
        // Não fazer logout em caso de erro, apenas log
      }
    }
    
    verificarBloqueio()
    
    return () => {
      ativo = false
    }
  }, [usuario?.id, usuario?.email, toast])

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
    async ({ nome, email, senha, papel, escola, schoolId, licencas, tipoLicenca }) => {
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
            schoolId: schoolId || escola,
            funcao: funcaoMetadataDePapelCadastro(papel),
          },
        },
      })

      if (error) {
        toast(mensagemErroSupabaseAuth(error), "erro")
        return { ok: false }
      }

      // Registrar o usuário em admin_users para que apareça na gestão
      if (data.user) {
        try {
          await supabase.from("admin_users").insert({
            id: data.user.id,
            full_name: nome,
            email: email.trim(),
            role: papel || "usuario",
            institution_id: schoolId || null,
            account_type: schoolId ? "institution" : "trial",
            active: true,
            licenses: Number(licencas || 1),
            license_type: tipoLicenca || "Basic",
          }).select().single()
        } catch (err) {
          console.error("Erro ao registrar usuário em admin_users:", err)
          // Continuar mesmo se falhar, pois o usuário já foi criado em auth
        }
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
      const created = await insertMaterial(userId, row)
      await refresh()
      return created
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

  const criarInstituicao = useCallback(async (payload) => {
    await createInstituicao(payload)
    await refreshAdminData()
  }, [refreshAdminData])

  const editarInstituicao = useCallback(async (instituicaoId, dados) => {
    await editarInstituicaoStore(instituicaoId, dados)
    await refreshAdminData()
  }, [refreshAdminData])

  const criarSubadmin = useCallback(
    async (payload) => {
      console.log("Criando SubAdmin:", payload)
      if (isSupabaseConfigured() && supabase) {
        const senhaLimpa = payload.senha || ""
        if (senhaLimpa.length < 6) {
          toast("A senha deve ter no mínimo 6 caracteres (exigência do Supabase).", "erro")
          return false
        }

        // Criar o usuário SEM trocar a sessão atual (cliente efêmero sem persistência)
        const ephemeral = createEphemeralSupabaseClient()
        if (!ephemeral) {
          toast("Supabase não configurado. Verifique .env e reinicie o servidor.", "erro")
          return false
        }

        const { data: created, error: createError } = await ephemeral.auth.signUp({
          email: String(payload.email || "").trim(),
          password: senhaLimpa,
          options: {
            data: {
              nome: payload.nome,
              papel: "subadmin",
              escola: payload.instituicaoId,
              schoolId: payload.instituicaoId,
              funcao: funcaoMetadataDePapelCadastro("subadmin"),
            },
          },
        })

        if (createError || !created?.user) {
          toast("Erro ao criar SubAdmin: " + (createError?.message || "falha ao criar usuário"), "erro")
          return false
        }

        const newUserId = created.user.id

        // Registrar no admin_users para aparecer na gestão (sem trocar a sessão atual)
        try {
          await supabase.from("admin_users").insert({
            id: newUserId,
            full_name: payload.nome,
            email: String(payload.email || "").trim(),
            role: "subadmin",
            institution_id: payload.instituicaoId || null,
            account_type: payload.instituicaoId ? "institution" : "trial",
            active: true,
            licenses: 1,
            license_type: payload.tipoLicenca || "Basic",
          })
        } catch (err) {
          console.error("Erro ao registrar SubAdmin em admin_users:", err)
        }

        await refreshAdminData()
        toast("SubAdmin criado com sucesso (sem alterar sua sessão).", "sucesso")
        return true
      }

      const passwordHash = await hash(payload.senha, 10)
      await createUsuarioInstituicao({ ...payload, papel: "subadmin", licencas: 1, passwordHash })
      await refreshAdminData()
      return true
    },
    [refreshAdminData, toast],
  )

  const criarUsuarioInstituicao = useCallback(async (payload) => {
    if (isSupabaseConfigured() && supabase) {
      const senhaLimpa = payload.senha || ""
      if (senhaLimpa.length < 6) {
        toast("A senha deve ter no mínimo 6 caracteres (exigência do Supabase).", "erro")
        return
      }
      const res = await cadastroSupabase({
        nome: payload.nome,
        email: payload.email,
        senha: senhaLimpa,
        papel: payload.papel || "usuario",
        escola: payload.instituicaoId,
        schoolId: payload.instituicaoId,
        licencas: payload.licencas,
        tipoLicenca: payload.tipoLicenca,
      })
      if (!res?.ok) return
      await refreshAdminData()
      return
    }

    const passwordHash = payload.senha ? await hash(payload.senha, 10) : null
    await createUsuarioInstituicao({ ...payload, passwordHash })
    await refreshAdminData()
  }, [cadastroSupabase, refreshAdminData, toast])

  const atualizarLicencasUsuario = useCallback(async (usuarioId, licencas) => {
    await atualizarLicenca(usuarioId, licencas)
    await refreshAdminData()
  }, [refreshAdminData])

  const enviarNotificacaoAdmin = useCallback(async (payload) => {
    await enviarNotificacao(payload)
    await refreshAdminData()
  }, [refreshAdminData])

  const atualizarStatusBoleto = useCallback(async (boletoId, status) => {
    await atualizarStatusBoletoApi(boletoId, status)
    await refreshAdminData()
  }, [refreshAdminData])

  const desabilitarInstituicaoFn = useCallback(async (instituicaoId) => {
    await desabilitarInstituicao(instituicaoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const habilitarInstituicaoFn = useCallback(async (instituicaoId) => {
    await habilitarInstituicao(instituicaoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const desabilitarUsuarioFn = useCallback(async (usuarioId) => {
    await desabilitarUsuario(usuarioId)
    await refreshAdminData()
  }, [refreshAdminData])

  const habilitarUsuarioFn = useCallback(async (usuarioId) => {
    await habilitarUsuario(usuarioId)
    await refreshAdminData()
  }, [refreshAdminData])

  const desabilitarInstituicaoComMembrosFn = useCallback(async (instituicaoId) => {
    await desabilitarInstituicaoComMembros(instituicaoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const habilitarInstituicaoComMembrosFn = useCallback(async (instituicaoId) => {
    await habilitarInstituicaoComMembros(instituicaoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const desabilitarUsuarioComInstituicaoFn = useCallback(async (usuarioId, instituicaoId = null) => {
    await desabilitarUsuarioComInstituicao(usuarioId, instituicaoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const habilitarUsuarioComInstituicaoFn = useCallback(async (usuarioId, instituicaoId = null) => {
    await habilitarUsuarioComInstituicao(usuarioId, instituicaoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const criarBoletoFn = useCallback(async (payload) => {
    await criarBoleto(payload)
    await refreshAdminData()
  }, [refreshAdminData])

  const deletarBoletoFn = useCallback(async (boletoId) => {
    await deletarBoleto(boletoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const deletarUsuarioFn = useCallback(async (usuarioId) => {
    await deletarUsuario(usuarioId)
    await refreshAdminData()
  }, [refreshAdminData])

  const editarUsuarioFn = useCallback(async (usuarioId, dados) => {
    await editarUsuario(usuarioId, dados)
    await refreshAdminData()
  }, [refreshAdminData])

  const deletarInstituicaoFn = useCallback(async (instituicaoId) => {
    await deletarInstituicao(instituicaoId)
    await refreshAdminData()
  }, [refreshAdminData])

  const atualizarTokensCohere = useCallback(async () => {
    const tokens = await obterTokensCohere()
    setAdminData((prev) => ({ ...prev, iaMetrics: { ...prev.iaMetrics, totalTokens: tokens } }))
  }, [])

  const registrarMetricasIa = useCallback(
    async ({ model, usage, requestKind }) => {
      if (!usuario?.id || !usage?.totalTokens) return
      await registrarUsoIa({
        userId: usuario.id,
        model,
        tokensUsados: usage.totalTokens,
        promptTokens: usage.promptTokens,
        completionTokens: usage.completionTokens,
        requestKind: requestKind || "chat",
      })
      await refreshAdminData()
    },
    [refreshAdminData, usuario?.id],
  )

  const registrarPdfGeradoFn = useCallback(
    async ({ materialId, pdfUrl }) => {
      if (!usuario?.id) return
      await salvarPdfGerado({ materialId, userId: usuario.id, pdfUrl })
    },
    [usuario?.id],
  )

  const criarPagamentoSubadminFn = useCallback(
    async ({ referencia, valor }) => {
      if (!usuario?.id || !usuario?.schoolId) throw new Error("subadmin_sem_instituicao")
      await criarPagamentoSubadmin({
        referencia,
        valor,
        instituicaoId: usuario.schoolId,
        subadminUserId: usuario.id,
      })
      await refreshPagamentosSubadmin()
      await refreshAdminData()
    },
    [refreshAdminData, refreshPagamentosSubadmin, usuario?.id, usuario?.schoolId],
  )

  const confirmarPagamentoSubadmin = useCallback(
    async (paymentId) => {
      await confirmarPagamentoViaWebhook(paymentId)
      await refreshPagamentosSubadmin()
      await refreshAdminData()
    },
    [refreshAdminData, refreshPagamentosSubadmin],
  )

  const marcarNotificacaoLida = useCallback(
    async (notificationId) => {
      if (!usuario?.id) return
      await marcarNotificacaoComoLida({ notificationId, userId: usuario.id })
      await refreshNotificacoesSubadmin()
    },
    [refreshNotificacoesSubadmin, usuario?.id],
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
      desabilitarInstituicaoComMembros: desabilitarInstituicaoComMembrosFn,
      habilitarInstituicaoComMembros: habilitarInstituicaoComMembrosFn,
      desabilitarUsuario: desabilitarUsuarioFn,
      habilitarUsuario: habilitarUsuarioFn,
      desabilitarUsuarioComInstituicao: desabilitarUsuarioComInstituicaoFn,
      habilitarUsuarioComInstituicao: habilitarUsuarioComInstituicaoFn,
      criarBoleto: criarBoletoFn,
      deletarBoleto: deletarBoletoFn,
      deletarUsuario: deletarUsuarioFn,
      editarUsuario: editarUsuarioFn,
      deletarInstituicao: deletarInstituicaoFn,
      atualizarTokensCohere,
      registrarMetricasIa,
      registrarPdfGerado: registrarPdfGeradoFn,
      trialUso,
      trialLimites,
      isTrialAtivo,
      registrarUsoTrial,
      planosPopup,
      abrirPlanosPopup,
      fecharPlanosPopup,
      refresh,
      notificacoesSubadmin,
      pagamentosSubadmin,
      refreshNotificacoesSubadmin,
      refreshPagamentosSubadmin,
      marcarNotificacaoLida,
      criarPagamentoSubadmin: criarPagamentoSubadminFn,
      confirmarPagamentoSubadmin,
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
      atualizarTokensCohere,
      registrarMetricasIa,
      registrarPdfGeradoFn,
      trialUso,
      trialLimites,
      isTrialAtivo,
      registrarUsoTrial,
      planosPopup,
      abrirPlanosPopup,
      fecharPlanosPopup,
      refresh,
      notificacoesSubadmin,
      pagamentosSubadmin,
      refreshNotificacoesSubadmin,
      refreshPagamentosSubadmin,
      marcarNotificacaoLida,
      criarPagamentoSubadminFn,
      confirmarPagamentoSubadmin,
    ],
  )

  return <SpectrumContext.Provider value={value}>{children}</SpectrumContext.Provider>
}

export function useSpectrum() {
  const ctx = useContext(SpectrumContext)
  if (!ctx) throw new Error("useSpectrum fora do provider")
  return ctx
}
