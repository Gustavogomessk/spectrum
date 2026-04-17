# Integração de APIs Externas - Spectrum

## 1. Tokens Cohere (IA)

### Objetivo
Trazer a quantidade real de tokens consumidos da API Cohere.

### Implementação Atual
- Arquivo: `src/services/adminData.js`
- Função: `obterTokensCohere()`
- Status: Estrutura pronta, aguardando integração

### Como Integrar

**Passo 1:** Configure as variáveis de ambiente no `.env`
```env
VITE_COHERE_API_KEY=sua_chave_cohere_aqui
```

**Passo 2:** Atualize a função `obterTokensCohere()` em `src/services/adminData.js`:

```javascript
export async function obterTokensCohere() {
  try {
    const apiKey = import.meta.env.VITE_COHERE_API_KEY
    
    // Chamada à API Cohere para obter uso de tokens
    const response = await fetch("https://api.cohere.ai/v1/usage", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })
    
    if (!response.ok) throw new Error("Erro ao obter tokens da Cohere")
    
    const data = await response.json()
    return data.tokens_used || 0
  } catch (error) {
    console.error("Erro ao obter tokens Cohere:", error)
    return 0
  }
}
```

**Passo 3:** Chame a função no Dashboard
```javascript
// No AdminGlobalSection.jsx, adicione um botão para atualizar tokens:
<button onClick={() => atualizarTokensCohere()}>
  Atualizar Tokens Cohere
</button>
```

---

## 2. QR Code Pix

### Objetivo
Gerar QR Codes dinamicamente para receber pagamentos via Pix.

### Implementação Atual
- Bibliotecas: `qrcode.react`, `jsbarcode`
- Arquivo: `src/components/sections/AdminGlobalSection.jsx`
- Status: Estrutura pronta com QR simulado

### Como Integrar com Pix Real

**Passo 1:** Obtenha as credenciais do seu banco Pix
- Ex: Banco XYZ com chave Pix registrada

**Passo 2:** Atualize a geração do QR no modal de boleto:

```javascript
{boletoModal && (
  <QRCode 
    value={`00020126580014br.gov.bcb.pix0136${suaChavePix}52040000530398654061${boletoModal.valor.toFixed(2).replace(".", "")}5802BR5913SPECTRUM6009SAO PAULO62410503***63041D12`}
    size={200}
    level="H"
    includeMargin={true}
    renderAs="svg"
  />
)}
```

**Dados necessários:**
- `suaChavePix`: Sua chave Pix registrada (CPF, CNPJ, email ou telefone)
- `valor`: Será preenchido automaticamente
- `CNPJ do beneficiário`: 12345678000100 (substitua pelo seu)

---

## 3. Código de Barras para Boletos

### Objetivo
Gerar códigos de barras (CODE128) para pagamentos tradicionais.

### Implementação Atual
- Biblioteca: `jsbarcode`
- Arquivo: `src/components/sections/AdminGlobalSection.jsx`
- Status: Ativo e funcional

### Como Funciona

O código é gerado automaticamente quando você abre o modal de boleto:

```javascript
useEffect(() => {
  if (boletoModal && barcodeRef.current) {
    JsBarcode(barcodeRef.current, codigoNumerico, {
      format: "CODE128",
      width: 2,
      height: 50,
      displayValue: true,
    })
  }
}, [boletoModal])
```

### Impressão

Para imprimir o código de barras:
```javascript
<button onClick={() => window.print()}>
  Imprimir Boleto
</button>
```

---

## 4. API Cohere para Adaptações

### Função Existente
Arquivo: `src/services/cohere.js`

### Para rastrear real-time:
```javascript
// Adicione após cada chamada à Cohere:
const tokensUsados = response.usage?.input_tokens + response.usage?.output_tokens
atualizarTokensCohere() // Atualiza no dashboard
```

---

## Próximas Etapas

- [ ] Integrar API real do Cohere
- [ ] Conectar com banco para gerar QR Pix real
- [ ] Criar sistema de webhook para confirmar pagamentos
- [ ] Adicionar histórico de transações
- [ ] Implementar retry automático para falhas

## Suporte

Para dúvidas:
1. Cohere Docs: https://docs.cohere.com/
2. Pix Docs: https://www.bcb.gov.br/ (Banco Central)
3. jsBarcode: https://github.com/lindell/JsBarcode
