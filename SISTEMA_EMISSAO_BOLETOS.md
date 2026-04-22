# Sistema de Emissão de Boletos com Cálculo de Preços

## Descrição

Este sistema permite emitir boletos para instituições com cálculo automático baseado em:
1. **Tipo de Instituição** (Enterprise ou Pessoal)
2. **Tipos de Licenças** dos usuários cadastrados

## Preços

### Preço Base da Instituição
- **Enterprise**: R$ 100,00
- **Pessoal**: R$ 50,00

### Custos Adicionais por Licença (por usuário)
- **PRO**: +R$ 30,00
- **Basic**: +R$ 20,00
- **Secretaria**: +R$ 10,00

## Exemplo de Cálculo

### Cenário: Instituição Enterprise com 3 usuários
- Preço Base (Enterprise): R$ 100,00
- Usuário 1 (Licença PRO): +R$ 30,00
- Usuário 2 (Licença Basic): +R$ 20,00
- Usuário 3 (Licença Secretaria): +R$ 10,00

**Total: R$ 160,00**

## Como Usar

### 1. Definir Tipo de Instituição

Na seção "Tipo de Instituição" do painel AdminInstituicaoSection:
1. Selecione o tipo (Enterprise ou Pessoal)
2. Clique em "Atualizar tipo"

### 2. Emitir Boleto

Na seção "Emissão de Boleto":
1. Clique em "Visualizar cálculo e emitir"
2. Revise o cálculo detalhado mostrando:
   - Preço base da instituição
   - Cada usuário e seu tipo de licença
   - Valor adicional por usuário
   - **Valor total do boleto**
3. Clique em "Emitir Boleto"

O sistema automaticamente:
- Calcula o valor total baseado no tipo de instituição
- Soma os custos adicionais das licenças
- Gera um código de referência único
- Cria um QR code PIX
- Salva o boleto no banco de dados

## Arquivos Modificados

### `/src/utils/pricing.js` (NOVO)
Funções utilitárias para cálculo de preços:
- `calcularValorBoleto()` - Calcula o valor total
- `gerarDetalhesBoleto()` - Gera resumo detalhado
- `formatarMoeda()` - Formata valores em Real

### `/src/services/adminData.js`
- Atualizado `toInstituicao()` - Inclui campo `tipoInstituicao`
- Atualizado `createInstituicao()` - Salva tipo de instituição
- Atualizado `editarInstituicao()` - Permite editar tipo
- Adicionado `atualizarInstituicao()` - Nova função para updates

### `/src/components/sections/AdminInstituicaoSection.jsx`
- Adicionada seção "Tipo de Instituição"
- Adicionada seção "Emissão de Boleto" com cálculo visual
- Importações de funções de pricing

### `/supabase/migration_institution_type.sql` (NOVO)
Migration para adicionar campo `institution_type` na tabela `admin_institutions`

## Banco de Dados

### Adição ao Schema
Após executar a migration no Supabase:

```sql
ALTER TABLE public.admin_institutions
ADD COLUMN IF NOT EXISTS institution_type text DEFAULT 'Pessoal' 
CHECK (institution_type IN ('Enterprise', 'Pessoal'));
```

## Próximas Melhorias (Sugestões)

1. **Relatórios** - Listar historicamente todos os boletos emitidos
2. **Agendamento** - Agendar emissão mensal/trimestral automática
3. **Webhooks** - Integração real com sistema de pagamentos
4. **Descontos** - Implementar descontos por volume ou período
5. **Multi-moeda** - Suportar outras moedas além de Real
6. **Relatórios de Pagamento** - Dashboard com resumo de receitas
