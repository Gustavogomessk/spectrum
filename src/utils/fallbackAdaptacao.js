export function gerarFallbackAdaptacao({ nomeMaterial, aluno, tipo }) {
  return `## ${nomeMaterial} — Versão Adaptada

### O que você vai aprender?

- O material foi simplificado especialmente para você
- As ideias foram divididas em partes pequenas
- Cada parte tem uma tarefa clara

### Principais conceitos

- **Conceito 1:** Explicação curta e direta usando palavras simples
- **Conceito 2:** Outro ponto importante em linguagem acessível
- **Conceito 3:** Ideia central resumida em uma frase

### Como estudar esse material?

1. Leia uma parte de cada vez
2. Faça uma pausa depois de cada seção
3. Marque o que você entendeu
4. Peça ajuda se tiver dúvida

BOX IMPORTANTE: A ideia mais importante deste material é aprender passo a passo, sem pressa. Você consegue! 🌟

### Atividade rápida

Tente responder: Qual foi a parte mais fácil de entender?

Adaptado especialmente para ${aluno.nome} • Perfil: ${aluno.diagnostico} • Tipo: ${tipo}`
}
