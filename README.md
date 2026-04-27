# Spectrum — Plataforma de Adaptação de Materiais com Inteligência Artificial

Este projeto apresenta uma plataforma educacional focada na adaptação automatizada de materiais didáticos para alunos neurodivergentes, utilizando inteligência artificial para reduzir o tempo de adaptação de horas para segundos.

---

## Visão Geral

A solução é composta por dois pilares principais:

- **Solução de automação:** responsável por processar dados, integrar serviços e executar fluxos automatizados (IA, arquivos, usuários, pagamentos).
- **Solução de desenvolvimento:** aplicação web com interface navegável para interação com o sistema.

---

## Ecossistema da Solução

- Interface Web (Frontend)
- API e lógica de negócio (Backend)
- Banco de dados (Supabase)
- Armazenamento de arquivos (Supabase Storage)
- Integração com Inteligência Artificial
- Sistema de autenticação e controle de acesso
- Sistema de gestão de usuários e licenças

---

## Perfis de Usuário

### Admin Global
- Gerencia licenças (Basic, PRO, Secretaria, Sem licença)
- Gestão de usuários
- Gestão de boletos

### Administrador da Escola
- Cadastro de usuários
- Definição de papéis (Professor, Psicopedagogo, Secretaria)
- Gerenciamento de permissões
- Controle de licenças

### Secretaria
- Cadastro de alunos
- Upload de laudos médicos (PDF)
- Associação do laudo ao aluno
- Sem acesso à IA

### Professor e Psicopedagogo
- Upload de materiais didáticos
- Uso da IA para adaptação
- Acesso aos materiais adaptados
- Uso do chatbot

---

## Funcionalidades

### Gestão de Alunos
- Cadastro por matrícula
- Upload de laudo médico
- Associação de laudo ao aluno

### Chatbot com IA
- Interface conversacional
- Suporte a Markdown
- Histórico de conversas
- Múltiplas sessões

### Adaptação de Conteúdo
A IA realiza:
- Simplificação de linguagem
- Reorganização do conteúdo
- Inclusão de tópicos, exemplos e destaques

### Gestão de Arquivos
- Upload de PDFs
- Armazenamento seguro
- Listagem, visualização e download
- URLs assinadas

Estrutura de armazenamento:

uploads-files/
escola-{schoolId}/
user-{userId}/
arquivo.pdf


### Sistema de Avaliação
- Perfil de teste (Professor)
- Limite de 5 adaptações gratuitas
- Sem necessidade de vínculo com instituição

### Sistema Multi-Escola
- Login com seleção de instituição
- Isolamento de dados por escola

---

## Fluxo de Automação

1. Professor envia um PDF
2. Seleciona aluno(s)
3. Sistema analisa o laudo médico
4. IA adapta o conteúdo automaticamente
5. Retorno:
   - PDF adaptado
   - Plano didático estruturado

---

## Arquitetura

### Frontend
- React + Vite

### Backend
- Node.js (serverless)

### Banco de Dados
- PostgreSQL (Supabase)

### Storage
- Supabase Storage

### IA
- Modelos de linguagem (LLM)

---

## Diagrama do Ecossistema

```mermaid
graph LR
  A[Usuário] --> B[Frontend]
  B --> C[Backend]
  C --> D[IA]
  C --> E[Banco de Dados]
  C --> F[Storage]
  C --> G[Pagamentos]
  D --> H[Conteúdo Adaptado]
Memorial de Construção


##Problema

A adaptação de materiais para alunos neurodivergentes é manual, demorada e pouco escalável.

##Objetivo

Automatizar a adaptação de conteúdos educacionais utilizando inteligência artificial.

##Público-Alvo
-Professores
-Psicopedagogos
-Instituições de ensino
-Secretarias escolares

##Ferramentas Utilizadas
-React + Vite (Frontend)
-Node.js (Backend)
-Supabase (Banco e Storage)
-Vercel (Deploy)

##Papel da IA
-Interpretação de PDFs
-Análise de laudos
-Adaptação automática de conteúdos

##Estratégias de Prompt
-Personalização por perfil do aluno
-Estruturação didática
-Simplificação de linguagem

##Limitações
-Dependência da qualidade do PDF
-Interpretação de laudos pode variar
-Limitações de APIs de IA


/frontend
/images
/api
/src
/docs
/login
/supabase
/dist

##Execução Local
````bash
Variáveis de Ambiente
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_COHERE_API_KEY=
VITE_COHERE_MODEL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_URL=
````

##Instalação
````bash
npm install
````
##Execução
````bash
npm run dev
````


 **:contentReference[oaicite:0]{index=0}** ou o **:contentReference[oaicite:1]{index=1}**.