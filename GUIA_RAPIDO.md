# 🚀 Guia Rápido - Sistema de Emissão de Boletos

## ⚡ Setup Inicial (5 minutos)

### 1️⃣ Executar Migration no Supabase
Abra o Supabase → SQL Editor → Novo Query
```sql
-- Copie e execute:
ALTER TABLE public.admin_institutions
ADD COLUMN IF NOT EXISTS institution_type text DEFAULT 'Pessoal' 
CHECK (institution_type IN ('Enterprise', 'Pessoal'));

CREATE INDEX IF NOT EXISTS idx_admin_institutions_type 
ON public.admin_institutions(institution_type);
```

### 2️⃣ Recarregar Navegador
- F5 ou Ctrl+R
- Limpar cache se necessário: Ctrl+Shift+Delete

### 3️⃣ Pronto! ✅

---

## 💡 Como Usar

### Alterar Tipo de Instituição
1. Painel Admin → Instituição
2. Seção **"Tipo de Instituição"**
3. Selecione: Enterprise ou Pessoal
4. Clique: **"Atualizar tipo"**

### Emitir Boleto com Cálculo Automático
1. Painel Admin → Instituição
2. Seção **"Emissão de Boleto"**
3. Clique: **"Visualizar cálculo e emitir"**
4. Revise o cálculo detalhado
5. Clique: **"Emitir Boleto"**

---

## 💰 Preços (Reference)

**Base:**
- Enterprise: R$ 100,00
- Pessoal: R$ 50,00

**Por Licença (adicional):**
- PRO: R$ 30,00
- Basic: R$ 20,00
- Secretaria: R$ 10,00

---

## 📝 Exemplo Real

**Cenário:** Escola XYZ (Enterprise)
- 3 professores PRO: 3 × R$ 30 = R$ 90
- 2 psicopedagogos Basic: 2 × R$ 20 = R$ 40
- 1 secretária Secretaria: 1 × R$ 10 = R$ 10

**Boleto:**
```
Preço Base        R$ 100,00
Licenças          R$ 140,00
─────────────────────────────
TOTAL             R$ 240,00
```

---

## 🎯 O que mudou?

### ✅ Novo
- Sistema de pricing automático
- Seção "Tipo de Instituição" 
- Seção "Emissão de Boleto" com cálculo visual
- Arquivo `/src/utils/pricing.js`
- Migration para banco de dados

### 🔄 Atualizado
- `AdminInstituicaoSection.jsx`
- `adminData.js`
- `NeuroIncludeContext.jsx` (importações)

### ℹ️ Documentação
- `/SISTEMA_EMISSAO_BOLETOS.md` - Completo
- `/IMPLEMENTACAO_RESUMO.md` - Resumido
- `/TESTES_BOLETOS.js` - Testes

---

## ❓ FAQ

**P: Posso mudar o tipo de instituição depois de criar?**  
R: Sim! Vá em "Tipo de Instituição" e mude quando quiser.

**P: O cálculo é automático?**  
R: Sim! O sistema calcula automaticamente quando você clica em "Visualizar cálculo".

**P: Posso editar os preços?**  
R: Edite em `/src/utils/pricing.js` nas constantes:
```javascript
const INSTITUTION_BASE_PRICES = { ... }
const LICENSE_ADDITIONAL_PRICES = { ... }
```

**P: Como testar sem emitir boleto real?**  
R: Use o arquivo `/TESTES_BOLETOS.js` no console do navegador.

**P: E se não houver usuários cadastrados?**  
R: O sistema mostra apenas o preço base da instituição.

---

## 🔗 Links Úteis

- 📖 Documentação Completa: `SISTEMA_EMISSAO_BOLETOS.md`
- 📊 Resumo Técnico: `IMPLEMENTACAO_RESUMO.md`
- 🧪 Testes: `TESTES_BOLETOS.js`
- 🗄️ Migration: `supabase/migration_institution_type.sql`

---

## ✅ Checklist de Verificação

- [ ] Migration executada no Supabase
- [ ] Página recarregada
- [ ] Seção "Tipo de Instituição" visível
- [ ] Seção "Emissão de Boleto" visível
- [ ] Cálculo aparece corretamente
- [ ] Boleto pode ser emitido
- [ ] Nenhum erro no console (F12)

---

## 🆘 Troubleshooting

**Erro: "institution_type column not found"**
→ Execute a migration novamente no Supabase

**Erro: "editarInstituicao is not a function"**
→ Recarregue a página (F5)

**Cálculo incorreto?**
→ Abra F12 → Console → Execute `executarTodosTestes()`

**Seção não aparece?**
→ Verifique se é usuário subadmin
→ Verifique se tem instituição associada

---

## 📧 Suporte

Qualquer dúvida, revise:
1. A documentação em `SISTEMA_EMISSAO_BOLETOS.md`
2. Os testes em `TESTES_BOLETOS.js`
3. O resumo em `IMPLEMENTACAO_RESUMO.md`

---

**Última atualização:** 22 de Abril de 2026  
**Status:** ✅ Pronto para Produção
