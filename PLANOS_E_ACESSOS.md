# Planos e Acessos - Spectrum

## Definição de Planos de Licença

### Plano Secretaria
- **Descrição**: Acesso restrito para secretários da instituição
- **Funções Permitidas**:
  - ✅ Cadastro de Alunos
  - ✅ Anexo de Laudos Médicos (PDF)
  - ❌ Adaptar Materiais
  - ❌ Chatbot IA
  - ❌ Histórico de Adaptações
  - ❌ Dashboard

**Seções Acessíveis**:
- Alunos e laudos
- Meu Perfil

---

### Plano Basic
- **Descrição**: Plano básico para educadores
- **Funções Permitidas**:
  - ✅ Dashboard
  - ✅ Cadastro de Alunos
  - ✅ Visualizar Histórico de Adaptações
  - ❌ Adaptar Materiais
  - ❌ Chatbot IA

**Seções Acessíveis**:
- Dashboard
- Alunos
- Materiais (Histórico apenas)
- Meu Perfil

---

### Plano PRO
- **Descrição**: Plano completo com todas as funcionalidades
- **Funções Permitidas**:
  - ✅ Dashboard
  - ✅ Adaptar Materiais
  - ✅ Histórico de Adaptações
  - ✅ Cadastro de Alunos
  - ✅ Chatbot IA
  - ✅ Todas as demais funcionalidades

**Seções Acessíveis**:
- Dashboard
- Adaptar Material
- Materiais
- Alunos
- Chatbot IA
- Meu Perfil

---

## Implementação Técnica

### Arquivos Modificados

1. **src/utils/perfil.js**
   - Adicionadas funções de validação de acesso por licença
   - `canAccessSection(usuario, sectionId)` - Validação geral
   - `getDefaultSection(usuario)` - Retorna seção padrão por tipo de usuário
   - `getAccessibleSections(usuario)` - Lista de seções acessíveis

2. **src/pages/AppShell.jsx**
   - Adiciona validação de acesso ao alternar seções
   - Redireciona automaticamente se usuário tentar acessar seção sem permissão

3. **src/components/layout/Sidebar.jsx**
   - Mostra ícone de cadeado para seções bloqueadas
   - Desabilita cliques em seções não acessíveis
   - Exibe licença atual no perfil do usuário

4. **src/styles/neuroinclude.css**
   - Estilos para elementos `.nav-item.desabilitado`
   - Ícone de cadeado `.nav-icon-bloqueado`

### Como Funciona o Redirecionamento

1. **Login**: Usuário faz login com sua licença atribuída
2. **Acesso à Seção**: Ao acessar uma seção, é verificado:
   - Se é seção de admin (bloqueia se não for admin)
   - Se é seção de educador (bloqueia secretária)
   - Se é seção PRO (bloqueia Basic e Secretaria)
3. **Redirecionamento**: Se sem permissão, redireciona para:
   - Admin: `admin-usuarios`
   - Secretária: `alunos`
   - Basic: `dashboard`
   - PRO: `dashboard`

## Como Testar

1. Criar usuários com diferentes `tipoLicenca`: "Secretaria", "Basic", "PRO"
2. Fazer login com cada usuário
3. Verificar que:
   - Secretária só vê "Alunos e laudos"
   - Basic vê "Dashboard", "Alunos", "Materiais" (sem Adaptar/Chatbot)
   - PRO vê todas as opções

## Futuras Melhorias

- [ ] Adicionar mensagem de popup ao tentar acessar seção bloqueada
- [ ] Adicionar "upgrade" dentro da seção bloqueada
- [ ] Implementar limite de materiais por plano
- [ ] Adicionar trial period para PRO
