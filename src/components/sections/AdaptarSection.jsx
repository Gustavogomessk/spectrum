import { useMemo, useState } from "react"
import { jsPDF } from "jspdf"
import html2pdf from "html2pdf.js"
import { useSpectrum } from "../../context/SpectrumContext"
import { adaptarMaterialCohere } from "../../services/cohere"
import { extrairTextoPdf } from "../../services/pdfText"
import { supabase, isSupabaseConfigured } from "../../services/supabaseClient"
import { markdownParaHTML } from "../../utils/markdown"
import { gerarFallbackAdaptacao } from "../../utils/fallbackAdaptacao"
import { badgeDiag, corAvatar } from "../../utils/badges"
import UploadZone from "../upload/UploadZone"
import { sanitizeStorageSegment } from "../../services/files"
import AppIcon from "../ui/AppIcon"
import { Clipboard, Download, FileText, Sparkles, Upload, User } from "lucide-react"
import { canAccessFeature } from "../../utils/perfil"

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} bytes`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function htmlParaTexto(html) {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return (doc.body?.textContent || "").replace(/\n{3,}/g, "\n\n").trim()
}

async function gerarPdfFormatado(html, nomeBase, aluno, perfil) {
  // Criar elemento com o conteúdo formatado
  const elemento = document.createElement("div")
  elemento.style.padding = "20px"
  elemento.style.fontFamily = "Arial, sans-serif"
  elemento.style.fontSize = "12px"
  elemento.style.lineHeight = "1.6"
  elemento.style.color = "#333"
  
  // Cabeçalho com metadados
  const cabecalho = document.createElement("div")
  cabecalho.style.marginBottom = "20px"
  cabecalho.style.paddingBottom = "10px"
  cabecalho.style.borderBottom = "2px solid #4dabf7"
  cabecalho.innerHTML = `
    <div style="font-size: 14px; font-weight: bold; margin-bottom: 8px; color: #1971c2;">${nomeBase}</div>
    <div style="font-size: 11px; color: #666;">
      Aluno: <strong>${aluno || "—"}</strong> | 
      Perfil: <strong>${perfil || "—"}</strong> | 
      Data: <strong>${new Date().toLocaleDateString("pt-BR")}</strong>
    </div>
  `
  
  // Conteúdo adaptado
  const conteudo = document.createElement("div")
  conteudo.innerHTML = html
  
  // Aplicar estilos ao conteúdo HTML
  conteudo.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el) => {
    el.style.marginTop = "16px"
    el.style.marginBottom = "8px"
    el.style.color = "#1971c2"
    el.style.fontWeight = "bold"
  })
  
  conteudo.querySelectorAll("h1").forEach((el) => {
    el.style.fontSize = "18px"
  })
  
  conteudo.querySelectorAll("h2").forEach((el) => {
    el.style.fontSize = "16px"
  })
  
  conteudo.querySelectorAll("h3").forEach((el) => {
    el.style.fontSize = "14px"
  })
  
  conteudo.querySelectorAll("p, li").forEach((el) => {
    el.style.marginBottom = "6px"
    el.style.fontSize = "12px"
  })
  
  conteudo.querySelectorAll("ul, ol").forEach((el) => {
    el.style.marginLeft = "20px"
    el.style.marginBottom = "10px"
  })
  
  conteudo.querySelectorAll("strong, b").forEach((el) => {
    el.style.fontWeight = "bold"
    el.style.color = "#1971c2"
  })
  
  conteudo.querySelectorAll("em, i").forEach((el) => {
    el.style.fontStyle = "italic"
    el.style.color = "#555"
  })
  
  conteudo.querySelectorAll("table").forEach((el) => {
    el.style.borderCollapse = "collapse"
    el.style.width = "100%"
    el.style.marginBottom = "10px"
    el.style.fontSize = "11px"
  })
  
  conteudo.querySelectorAll("th, td").forEach((el) => {
    el.style.border = "1px solid #ddd"
    el.style.padding = "8px"
    el.style.textAlign = "left"
  })
  
  conteudo.querySelectorAll("th").forEach((el) => {
    el.style.backgroundColor = "#f0f0f0"
    el.style.fontWeight = "bold"
  })
  
  elemento.appendChild(cabecalho)
  elemento.appendChild(conteudo)
  
  return new Promise((resolve, reject) => {
    const opcoes = {
      margin: [10, 10, 10, 10],
      filename: `${nomeBase}-adaptado.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, logging: false, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    }
    
    html2pdf()
      .set(opcoes)
      .from(elemento)
      .output("blob")
      .then((blob) => {
        resolve(blob)
      })
      .catch((err) => {
        console.error("Erro ao gerar PDF:", err)
        reject(err)
      })
  })
}

export default function AdaptarSection({ active }) {
  const { alunos, toast, salvarMaterialApi, usuario, isTrialAtivo, trialUso, trialLimites, registrarUsoTrial, registrarMetricasIa, registrarPdfGerado } = useSpectrum()

  const [arquivo, setArquivo] = useState(null)
  const [selecionados, setSelecionados] = useState(() => new Set())
  const [obs, setObs] = useState("")
  const [tipoAdaptacao, setTipoAdaptacao] = useState("tdah")
  const [progresso, setProgresso] = useState({ visivel: false, texto: "", pct: 0 })
  const [resultado, setResultado] = useState({
    visivel: false,
    html: "",
    sub: "",
    nomeArquivo: "",
    perfilLabel: "",
  })
  const [adaptando, setAdaptando] = useState(false)

  const alunoPrincipal = useMemo(() => {
    const id = [...selecionados][0]
    return alunos.find((a) => String(a.id) === String(id))
  }, [alunos, selecionados])

  function processarArquivo(file) {
    if (!file?.name?.toLowerCase().endsWith(".pdf")) {
      toast("Por favor, envie apenas arquivos PDF.", "erro")
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast("Arquivo muito grande. Máximo 20MB.", "erro")
      return
    }
    setArquivo(file)
    toast("Arquivo carregado com sucesso!", "sucesso")
  }

  function removerArquivo() {
    setArquivo(null)
  }

  function toggleAluno(id) {
    setSelecionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function iniciarAdaptacao() {
    const access = canAccessFeature(usuario, "adaptar")
    if (!access?.allowed) {
      toast(access?.reason || "Seu plano atual não permite acessar esta funcionalidade. Faça upgrade para liberar o acesso.", "info")
      return
    }
    if (!arquivo) {
      toast("Selecione um PDF antes de continuar.", "erro")
      return
    }
    if (selecionados.size === 0) {
      toast("Selecione ao menos um aluno.", "erro")
      return
    }
    const aluno = alunoPrincipal
    if (!aluno) {
      toast("Selecione um aluno.", "erro")
      return
    }
    if (!registrarUsoTrial("adaptacao")) return

    setAdaptando(true)
    setResultado((r) => ({ ...r, visivel: false }))
    setProgresso({ visivel: true, texto: "Lendo o conteúdo do PDF...", pct: 15 })

    const etapas = [
      { texto: "Analisando perfil do aluno...", pct: 35 },
      { texto: "Aplicando estratégias pedagógicas...", pct: 55 },
      { texto: "Chamando a IA (Cohere)...", pct: 75 },
    ]

    let textoFonte = ""
    try {
      textoFonte = await extrairTextoPdf(arquivo)
      for (const e of etapas) {
        setProgresso({ visivel: true, texto: e.texto, pct: e.pct })
        await sleep(350)
      }

      const perfilAluno = `${aluno.nome}. Diagnóstico: ${aluno.diagnostico}. Observações: ${aluno.obs || "—"}`

      let textoMd = ""
      let usageMeta = null
      try {
        const ai = await adaptarMaterialCohere({
          textoFonte: textoFonte || `Material: ${arquivo.name}`,
          perfilAluno,
          tipoAdaptacao,
          observacoes: obs,
        })
        textoMd = typeof ai === "string" ? ai : ai?.text || ""
        usageMeta = typeof ai === "object" ? ai : null
      } catch (err) {
        console.error(err)
        textoMd = gerarFallbackAdaptacao({
          nomeMaterial: arquivo.name.replace(/\.pdf$/i, ""),
          aluno,
          tipo: tipoAdaptacao,
        })
        toast("Usamos um modelo offline porque a IA não respondeu. Verifique a chave no .env.", "info")
      }

      setProgresso({ visivel: true, texto: "Concluído!", pct: 100 })
      await sleep(300)

      const html = markdownParaHTML(textoMd)
      const nomeBase = arquivo.name
      setResultado({
        visivel: true,
        html,
        sub: `Adaptado para ${aluno.nome} • ${aluno.diagnostico} • ${new Date().toLocaleDateString("pt-BR")}`,
        nomeArquivo: `${nomeBase} — Adaptado`,
        perfilLabel: aluno.diagnostico,
      })

      const nomeSemExt = nomeBase.replace(/\.pdf$/i, "")
      let pdfOriginalPath = null
      let pdfAdaptadoPath = null

      // Salva original e versão adaptada no Storage (quando Supabase estiver ativo)
      if (isSupabaseConfigured() && supabase && usuario?.id) {
        const schoolId = usuario.schoolId || "trial"
        const uid = usuario.id
        const base = crypto.randomUUID()
        pdfOriginalPath = `escola-${schoolId}/user-${uid}/materiais/${base}-original-${sanitizeStorageSegment(nomeBase)}`
        pdfAdaptadoPath = `escola-${schoolId}/user-${uid}/materiais/${base}-adaptado-${sanitizeStorageSegment(nomeSemExt)}.pdf`

        const { error: up1 } = await supabase.storage.from("uploads-files").upload(pdfOriginalPath, arquivo, { upsert: true, contentType: "application/pdf" })
        if (up1) throw up1

        try {
          // Gerar PDF com formatação HTML mantendo o conteúdo adaptado
          const pdfBlob = await gerarPdfFormatado(html, nomeBase, aluno.nome, aluno.diagnostico)
          const { error: up2 } = await supabase.storage.from("uploads-files").upload(pdfAdaptadoPath, pdfBlob, { upsert: true, contentType: "application/pdf" })
          if (up2) throw up2
        } catch (pdfErr) {
          console.warn("Erro ao gerar PDF formatado, usando fallback com texto:", pdfErr)
          // Fallback: gerar PDF simples com texto
          const pdf = new jsPDF({ unit: "pt", format: "a4" })
          const textoLimpo = htmlParaTexto(html) || "Material adaptado sem conteúdo textual."
          const linhas = pdf.splitTextToSize(textoLimpo, 500)
          let y = 48
          pdf.setFont("helvetica", "normal")
          pdf.setFontSize(11)
          linhas.forEach((linha) => {
            if (y > 780) {
              pdf.addPage()
              y = 48
            }
            pdf.text(linha, 48, y)
            y += 16
          })
          const pdfBlob = pdf.output("blob")
          const { error: up2 } = await supabase.storage.from("uploads-files").upload(pdfAdaptadoPath, pdfBlob, { upsert: true, contentType: "application/pdf" })
          if (up2) throw up2
        }
      }

      const created = await salvarMaterialApi({
        nome: nomeSemExt,
        aluno: aluno.nome,
        perfil: aluno.diagnostico,
        conteudo_html: html,
        aluno_id: /^[0-9a-f-]{36}$/i.test(String(aluno.id)) ? aluno.id : null,
        pdf_original_nome: nomeBase,
        pdf_adaptado_nome: `${nomeSemExt}-adaptado.pdf`,
        pdf_original_path: pdfOriginalPath,
        pdf_adaptado_path: pdfAdaptadoPath,
      })
      if (created?.id && pdfAdaptadoPath) {
        await registrarPdfGerado({ materialId: created.id, pdfUrl: pdfAdaptadoPath })
      }
      if (usageMeta?.usage?.totalTokens) {
        await registrarMetricasIa({ model: usageMeta.model, usage: usageMeta.usage, requestKind: "adaptacao" })
      }

      toast("Material adaptado com sucesso!", "sucesso")
    } catch (e) {
      console.error(e)
      toast(e.message || "Erro na adaptação.", "erro")
    } finally {
      setProgresso((p) => ({ ...p, visivel: false }))
      setAdaptando(false)
    }
  }

  async function copiarConteudo() {
    const el = document.getElementById("conteudo-adaptado")
    const texto = el?.innerText || ""
    try {
      await navigator.clipboard.writeText(texto)
      toast("Conteúdo copiado para a área de transferência!", "sucesso")
    } catch {
      toast("Selecione o texto manualmente para copiar.", "info")
    }
  }

  async function baixarPDF() {
    try {
      if (!resultado.html) {
        toast("Nenhum material adaptado para baixar.", "erro")
        return
      }
      
      toast("Gerando PDF formatado...", "info")
      const pdfBlob = await gerarPdfFormatado(resultado.html, resultado.nomeArquivo, alunoPrincipal?.nome || "Material", alunoPrincipal?.diagnostico || "")
      
      // Criar link de download
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${resultado.nomeArquivo}-adaptado.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast("PDF baixado com sucesso!", "sucesso")
    } catch (erro) {
      console.error("Erro ao baixar PDF:", erro)
      toast("Erro ao gerar PDF. Tente novamente.", "erro")
    }
  }

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-adaptar" aria-label="Adaptação de material">
      <div className="secao-corpo">
        <h2 className="sr-only">Adaptar novo material</h2>
        {isTrialAtivo ? (
          <p className="texto-mudo mb-2">
            Plano trial: <strong>{trialUso.adaptacoes}</strong> de <strong>{trialLimites.adaptacoes}</strong> adaptações usadas.
          </p>
        ) : null}

        <div className="card mb-3" id="step-upload">
          <div className="card-cabecalho">
            <span style={{ fontSize: "1.2rem" }} aria-hidden="true">
              <AppIcon icon={Upload} size={18} />
            </span>
            <span className="card-titulo">Passo 1 — Enviar PDF</span>
            <span className="badge badge-azul">Obrigatório</span>
          </div>
          <div className="card-corpo">
            {!arquivo ? (
              <UploadZone onFile={processarArquivo} />
            ) : null}

            <div className={`arquivo-selecionado ${arquivo ? "visivel" : ""}`} aria-live="polite">
              <div className="arquivo-icone" aria-hidden="true">
                <AppIcon icon={FileText} size={18} />
              </div>
              <div className="arquivo-info">
                <div className="arquivo-nome">{arquivo?.name || "—"}</div>
                <div className="arquivo-tamanho">{arquivo ? formatarTamanho(arquivo.size) : "—"}</div>
              </div>
              <button type="button" className="btn btn-perigo btn-sm" onClick={removerArquivo} aria-label="Remover arquivo selecionado">
                Remover
              </button>
            </div>
          </div>
        </div>

        <div className="card mb-3" id="step-aluno">
          <div className="card-cabecalho">
            <span style={{ fontSize: "1.2rem" }} aria-hidden="true">
              <AppIcon icon={User} size={18} />
            </span>
            <span className="card-titulo">Passo 2 — Selecionar Aluno(s)</span>
          </div>
          <div className="card-corpo">
            <p className="texto-mudo mb-1">Selecione para quem este material será adaptado. O perfil do aluno personaliza a adaptação.</p>
            <div className="alunos-grid" role="list" aria-label="Lista de alunos disponíveis">
              {alunos.map((aluno) => {
                const sel = selecionados.has(aluno.id)
                return (
                  <div
                    key={aluno.id}
                    className={`aluno-card ${sel ? "selecionado" : ""}`}
                    role="listitem"
                    tabIndex={0}
                    aria-pressed={sel}
                    aria-label={`${aluno.nome} — ${aluno.diagnostico}`}
                    onClick={() => toggleAluno(aluno.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") toggleAluno(aluno.id)
                    }}
                  >
                    <div className="check" aria-hidden="true">
                      ✓
                    </div>
                    <div className={`avatar ${corAvatar(aluno.diagnostico)}`} aria-hidden="true">
                      {aluno.nome
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .substring(0, 2)}
                    </div>
                    <div className="aluno-nome">{aluno.nome}</div>
                    <div className="aluno-laudo">
                      <span className={`badge ${badgeDiag(aluno.diagnostico)}`}>{aluno.diagnostico}</span>
                      {aluno.laudo ? (
                        <span>
                          &nbsp;<span className="badge badge-verde">Laudo</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="card mb-3">
          <div className="card-cabecalho">
            <span style={{ fontSize: "1.2rem" }} aria-hidden="true">
              <AppIcon icon={FileText} size={18} />
            </span>
            <span className="card-titulo">Passo 3 — Observações (opcional)</span>
          </div>
          <div className="card-corpo">
            <label className="campo-label" htmlFor="obs-campo">
              Instruções especiais para a IA
            </label>
            <textarea
              id="obs-campo"
              className="campo"
              rows={3}
              placeholder="Ex: Simplificar palavras difíceis, usar exemplos do cotidiano, evitar textos longos..."
              aria-label="Observações para a adaptação"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
            />

            <label className="campo-label" htmlFor="tipo-adaptacao">
              Tipo de adaptação
            </label>
            <select
              id="tipo-adaptacao"
              className="campo"
              aria-label="Selecione o tipo de adaptação"
              value={tipoAdaptacao}
              onChange={(e) => setTipoAdaptacao(e.target.value)}
            >
              <option value="tdah">TDAH — Foco em objetividade e listas</option>
              <option value="tea">TEA Nível 1 — Linguagem literal e previsível</option>
              <option value="ambos">Ambos — Combinação das estratégias</option>
              <option value="geral">Simplificação Geral</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sucesso btn-bloco btn-lg"
          id="btn-adaptar"
          disabled={adaptando}
          onClick={iniciarAdaptacao}
          aria-label="Iniciar adaptação com IA"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <AppIcon icon={Sparkles} size={18} />
            {adaptando ? "Adaptando..." : "Adaptar com IA"}
          </span>
        </button>

        <div className={`progresso-ia card mt-3 ${progresso.visivel ? "visivel" : ""}`} aria-live="polite" aria-label="Progresso da adaptação">
          <div className="card-corpo">
            <div className="progresso-etapa" id="etapa-texto">
              <div className="spinner" aria-hidden="true" />
              <span>{progresso.texto}</span>
            </div>
            <div className="progresso-barra-container" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progresso.pct}>
              <div className="progresso-barra" id="progresso-barra" style={{ width: `${progresso.pct}%` }} />
            </div>
          </div>
        </div>

        <div className={`resultado-wrapper mt-3 ${resultado.visivel ? "visivel" : ""}`} aria-live="polite">
          <div className="resultado-cabecalho" role="status">
            <div className="resultado-icone" aria-hidden="true">
              <AppIcon icon={Sparkles} size={18} />
            </div>
            <div>
              <div className="resultado-titulo">Material adaptado com sucesso!</div>
              <div className="resultado-sub" id="resultado-sub">
                {resultado.sub}
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              <button type="button" className="btn btn-sucesso btn-sm" onClick={baixarPDF} aria-label="Baixar PDF do material adaptado">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  <AppIcon icon={Download} size={16} />
                  Baixar
                </span>
              </button>
              <button type="button" className="btn btn-secundario btn-sm" onClick={copiarConteudo} aria-label="Copiar conteúdo adaptado">
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                  <AppIcon icon={Clipboard} size={16} />
                  Copiar
                </span>
              </button>
            </div>
          </div>

          <div className="material-adaptado">
            <div className="material-cabecalho" aria-label="Controles do material">
              <AppIcon icon={FileText} size={18} /> <span id="nome-material-resultado">{resultado.nomeArquivo}</span>
              <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
                <span className="badge badge-azul" id="badge-perfil-resultado">
                  {resultado.perfilLabel}
                </span>
                <span className="badge badge-verde">IA Validada</span>
              </div>
            </div>
            <div className="material-conteudo" id="conteudo-adaptado" tabIndex={0} aria-label="Conteúdo do material adaptado" dangerouslySetInnerHTML={{ __html: resultado.html }} />
          </div>
        </div>
      </div>
    </section>
  )
}
