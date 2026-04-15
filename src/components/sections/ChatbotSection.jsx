import { useRef, useState } from "react"
import { chatCohere } from "../../services/cohere"
import { formatarMensagemChat } from "../../utils/markdown"
import { useNeuroInclude } from "../../context/NeuroIncludeContext"

const SUGESTOES = [
  "Quais estratégias usar com alunos com TDAH?",
  "Como adaptar texto para TEA Nível 1?",
  "Dicas de atividades inclusivas",
  "Como estruturar uma prova adaptada?",
]

const FALLBACKS = {
  tdah: `Para alunos com **TDAH**, recomendo:\n\n• **Instrução em blocos curtos** — no máximo 3 passos por vez\n• **Listas visuais** em vez de parágrafos longos\n• **Pausas programadas** a cada 15-20 minutos\n• **Feedback imediato** e positivo\n• **Material colorido** para organizar informações\n\nO NeuroInclude aplica automaticamente essas estratégias na adaptação! 🧠`,
  tea: `Para alunos com **TEA Nível 1**, as principais estratégias são:\n\n• **Linguagem literal** — evitar metáforas, sarcasmo e ironia\n• **Sequência previsível** — sempre a mesma estrutura\n• **Rotina visual** — cronogramas e passo a passo\n• **Explícito é melhor** — nunca subentender nada\n• **Antecipação** — avisar mudanças com antecedência\n\nO perfil do aluno no sistema já personaliza tudo isso! ✨`,
}

function detectarTema(msg) {
  const m = msg.toLowerCase()
  if (m.includes("tdah") || m.includes("atenção") || m.includes("hiperativ")) return "tdah"
  if (m.includes("tea") || m.includes("autis") || m.includes("literal")) return "tea"
  return null
}

function toCohereHistory(mensagens) {
  const h = []
  for (const m of mensagens) {
    if (m.papel === "usuario") h.push({ role: "USER", message: m.texto })
    if (m.papel === "ia") h.push({ role: "CHATBOT", message: m.texto })
  }
  return h
}

export default function ChatbotSection({ active }) {
  const { usuario, toast } = useNeuroInclude()
  const [mensagens, setMensagens] = useState([])
  const [input, setInput] = useState("")
  const [digitando, setDigitando] = useState(false)
  const fimRef = useRef(null)

  function scrollFim() {
    requestAnimationFrame(() => {
      fimRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    })
  }

  async function enviar(textoOpt) {
    const msg = (textoOpt ?? input).trim()
    if (!msg) return
    setInput("")
    const userMsg = { id: crypto.randomUUID(), papel: "usuario", texto: msg }
    setMensagens((m) => [...m, userMsg])
    setDigitando(true)
    scrollFim()

    const historicoAntes = toCohereHistory(mensagens)

    try {
      const system = `Você é um assistente educacional especializado em educação inclusiva para crianças neurodivergentes (TDAH, TEA nível 1, dislexia).
Ajude professores e psicopedagogos com estratégias pedagógicas, adaptações de material e dicas práticas.
Seja objetivo, empático e prático. Use listas e formatação clara. Responda em português do Brasil.
Mencione que o NeuroInclude pode automatizar adaptações quando relevante.`

      const respostaTexto = await chatCohere({
        message: `${system}\n\nPergunta do educador:\n${msg}`,
        chatHistory: historicoAntes,
      })

      setMensagens((m) => [...m, { id: crypto.randomUUID(), papel: "ia", texto: respostaTexto }])
    } catch (e) {
      console.error(e)
      const tema = detectarTema(msg)
      const fallback =
        (tema && FALLBACKS[tema]) ||
        `Obrigado pela pergunta! 🧠\n\nPosso ajudar com estratégias para TDAH, TEA nível 1, dislexia e outras condições neurodivergentes.\n\nTente perguntar sobre:\n• Estratégias para TDAH\n• Como adaptar textos para TEA\n• Atividades inclusivas\n• Provas adaptadas\n\nOu use o módulo "Adaptar Material" para adaptar PDFs automaticamente! ✨`
      toast("Chat offline ou chave ausente — mostrando resposta de apoio.", "info")
      setMensagens((m) => [...m, { id: crypto.randomUUID(), papel: "ia", texto: fallback }])
    } finally {
      setDigitando(false)
      scrollFim()
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  function ajustarAltura(el) {
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const welcomeText =
    "Olá! Sou o assistente educacional do NeuroInclude. 🧠\n\nPosso ajudar com **estratégias pedagógicas** para alunos com TDAH e TEA, tirar dúvidas sobre adaptações, ou dar sugestões de atividades inclusivas.\n\nComo posso ajudar você hoje?"

  return (
    <section className={`secao ${active ? "ativa" : ""}`} id="secao-chatbot" aria-label="Chatbot educacional com IA">
      <div className="chat-container">
        <h2 className="sr-only">Assistente virtual educacional</h2>
        <div className="chat-mensagens" id="chat-mensagens" aria-live="polite" aria-label="Conversa com a IA">
          <div className="mensagem ia" role="article" aria-label="Mensagem da IA">
            <div className="mensagem-avatar ia" aria-hidden="true">
              IA
            </div>
            <div className="mensagem-balao" dangerouslySetInnerHTML={{ __html: formatarMensagemChat(welcomeText) }} />
          </div>

          {mensagens.map((m) => (
            <div key={m.id} className={`mensagem ${m.papel === "ia" ? "ia" : "usuario"}`} role="article" aria-label={m.papel === "ia" ? "Mensagem da IA" : "Sua mensagem"}>
              <div className={`mensagem-avatar ${m.papel === "ia" ? "ia" : "usr"}`} aria-hidden="true">
                {m.papel === "ia" ? "IA" : usuario?.iniciais || "EU"}
              </div>
              <div className="mensagem-balao" dangerouslySetInnerHTML={{ __html: formatarMensagemChat(m.texto) }} />
            </div>
          ))}
          {digitando ? (
            <div className="mensagem ia" aria-label="IA está digitando">
              <div className="mensagem-avatar ia" aria-hidden="true">
                IA
              </div>
              <div className="mensagem-balao">
                <div className="digitando">
                  <div className="dot" />
                  <div className="dot" />
                  <div className="dot" />
                </div>
              </div>
            </div>
          ) : null}
          <div ref={fimRef} />
        </div>

        <div className="sugestoes-chat" aria-label="Sugestões de perguntas rápidas">
          {SUGESTOES.map((s) => (
            <button key={s} type="button" className="sugestao-btn" onClick={() => enviar(s)}>
              {s.length > 40 ? `${s.slice(0, 37)}…` : s}
            </button>
          ))}
        </div>

        <div className="chat-input-area">
          <label htmlFor="chat-input" className="sr-only">
            Escreva sua mensagem para o assistente
          </label>
          <textarea
            id="chat-input"
            className="chat-input"
            placeholder="Pergunte sobre estratégias pedagógicas, adaptações..."
            rows={1}
            aria-label="Campo de mensagem"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              ajustarAltura(e.target)
            }}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="chat-enviar" onClick={() => enviar()} aria-label="Enviar mensagem">
            ➤
          </button>
        </div>
      </div>
    </section>
  )
}
