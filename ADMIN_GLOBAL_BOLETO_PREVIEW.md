# 🎯 Atualização - Admin Global: Prévia de Valor para Boletos

## O que mudou?

Agora no **Admin Global → Aba de Boletos**, quando você:

1. **Seleciona uma Instituição** → O sistema calcula **automaticamente** o valor do boleto
2. **Valor aparece em prévia** → Exibido em destaque com explicação
3. **Você pode editar** → O valor sugerido é apenas uma recomendação, pode alterar quando quiser

---

## 📊 Como Funciona

### Fluxo Visual

```
┌─────────────────────────────────┐
│ Admin Global - Aba Boletos      │
├─────────────────────────────────┤
│                                 │
│ Selecione a instituição         │
│ [▼ Escola XYZ            ]      │
│                                 │
│ ┌───────────────────────────┐   │
│ │ 📊 Prévia calculada:      │   │  ← NOVA!
│ │ R$ 160,00                 │   │
│ │ (Baseado no tipo de       │   │
│ │  instituição e licenças)  │   │
│ └───────────────────────────┘   │
│                                 │
│ Referência: [04/2026      ]     │
│ Valor (R$): [160.00       ]     │  ← Editável!
│                                 │
│ [Criar boleto]                  │
│                                 │
└─────────────────────────────────┘
```

---

## ⚙️ Como é Calculado

A prévia usa a mesma lógica de pricing:

```
Valor Base (Enterprise/Pessoal)
+ ∑ (Licenças de cada usuário ativo)
= VALOR SUGERIDO
```

### Exemplo

**Instituição:** Escola ABC (Enterprise)  
**Usuários Ativos:**
- Prof. João (PRO)
- Psic. Maria (Basic)
- Sec. Ana (Secretaria)

**Cálculo:**
```
Preço Base (Enterprise)     R$ 100,00
+ Prof. João (PRO)          +R$ 30,00
+ Psic. Maria (Basic)       +R$ 20,00
+ Sec. Ana (Secretaria)     +R$ 10,00
───────────────────────────────────────
Prévia: R$ 160,00 ✓
```

---

## 🎛️ Recursos

✅ **Cálculo Automático** - Acontece ao selecionar instituição  
✅ **Prévia Editável** - Você pode alterar o valor  
✅ **Limpeza Inteligente** - Limpa valor ao mudar de instituição  
✅ **Precisão** - Suporta centavos (step 0.01)  
✅ **Feedback Visual** - Caixa destacada com explicação  

---

## 💡 Casos de Uso

### 1️⃣ Usar Prévia Calculada
- Selecionou instituição → Aceita o valor sugerido → Coloca referência → Cria boleto

### 2️⃣ Ajustar Valor
- Selecionou instituição → Vê prévia de R$ 100 → Muda para R$ 95 → Cria boleto com R$ 95

### 3️⃣ Trocar Instituição
- Mudou de instituição → Valor volta vazio → Novo cálculo → Mostra nova prévia

---

## 📝 Detalhes Técnicos

**Arquivo Modificado:** `src/components/sections/AdminGlobalSection.jsx`

**Novas Funcionalidades:**
```javascript
// 1. Import de função de pricing
import { calcularValorBoleto } from "../../utils/pricing"

// 2. useMemo que calcula a prévia
const valorSugeridoBoleto = useMemo(() => {
  if (!boleto.instituicaoId) return ""
  const instituicao = instituicoes.find((i) => i.id === boleto.instituicaoId)
  const usuariosDaInstituicao = usuarios.filter((u) => u.instituicaoId === boleto.instituicaoId && u.ativo)
  const valor = calcularValorBoleto(instituicao.tipoInstituicao || "Pessoal", usuariosDaInstituicao)
  return valor.toString()
}, [boleto.instituicaoId, instituicoes, usuarios])

// 3. useEffect que preenche o campo automaticamente
useEffect(() => {
  if (valorSugeridoBoleto && !boleto.valor) {
    setBoleto((s) => ({ ...s, valor: valorSugeridoBoleto }))
  }
}, [valorSugeridoBoleto, boleto.instituicaoId])
```

---

## ✅ Checklist de Teste

- [ ] Acessar Admin Global
- [ ] Ir para aba "Boletos"
- [ ] Selecionar uma instituição
- [ ] Conferir se caixa de prévia aparece
- [ ] Conferir valor calculado está correto
- [ ] Editar o valor manualmente
- [ ] Trocar para outra instituição
- [ ] Conferir se valor é recalculado
- [ ] Criar um boleto
- [ ] Verificar no banco de dados se valor foi salvo corretamente

---

## 📞 Dúvidas Frequentes

**P: Posso ignorar a prévia?**  
R: Sim! A prévia é apenas uma sugestão. Você pode editar o valor antes de criar.

**P: A prévia muda se eu adicionar/remover usuários?**  
R: Sim! A prévia é recalculada em tempo real quando há mudanças nos usuários.

**P: E se selecionar uma instituição e depois limpar?**  
R: A prévia desaparece e o campo de valor fica vazio.

**P: O sistema valida se o valor está correto?**  
R: Por enquanto não. A prévia é apenas informativa. Você é responsável por validar.

---

## 🔄 Integração com AdminInstituicaoSection

Note que há **duas formas** de emitir boletos agora:

1. **AdminInstituicaoSection** (Subadmin)
   - Vê apenas sua própria instituição
   - Calcula automaticamente com caixa visual detalhada
   - Mostra tabela de usuários e custos por licença

2. **AdminGlobalSection** (Admin Global)
   - Seleciona qualquer instituição
   - Vê prévia rápida editável
   - Mais direto para criar rápidamente

---

**Última atualização:** 22 de Abril de 2026  
**Status:** ✅ Pronto para Uso
