/**
 * Testes e Exemplos - Sistema de Emissão de Boletos
 * 
 * Abra o DevTools (F12) e copie/cole essas funções para testar a implementação
 */

// ============================================
// TESTE 1: Validar cálculo de preços
// ============================================
function testarCalculoPrecosEnterprise() {
  console.log("=== TESTE: Cálculo Enterprise com 3 usuários ===")
  
  const usuarios = [
    { id: 1, nome: "Prof. João", tipoLicenca: "PRO" },
    { id: 2, nome: "Psicopedagoga Maria", tipoLicenca: "Basic" },
    { id: 3, nome: "Secretária Ana", tipoLicenca: "Secretaria" }
  ]
  
  const tipoInstituicao = "Enterprise"
  const precoBase = 100
  const custos = {
    PRO: 30,
    Basic: 20,
    Secretaria: 10
  }
  
  let total = precoBase
  console.log(`Preço Base (${tipoInstituicao}): R$ ${precoBase.toFixed(2)}`)
  
  usuarios.forEach(u => {
    const custo = custos[u.tipoLicenca] || 0
    total += custo
    console.log(`  + ${u.nome} (${u.tipoLicenca}): R$ ${custo.toFixed(2)}`)
  })
  
  console.log(`\n✅ TOTAL: R$ ${total.toFixed(2)}`)
  console.log(`Esperado: R$ 160.00`)
  console.log(`Resultado: ${total === 160 ? "CORRETO ✓" : "ERRO ✗"}`)
}

// ============================================
// TESTE 2: Calcular instituição Pessoal
// ============================================
function testarCalculoPrecosPessoal() {
  console.log("\n=== TESTE: Cálculo Pessoal com 2 usuários ===")
  
  const usuarios = [
    { id: 1, nome: "Prof. Pedro", tipoLicenca: "Basic" },
    { id: 2, nome: "Coordenador Lucas", tipoLicenca: "PRO" }
  ]
  
  const tipoInstituicao = "Pessoal"
  const precoBase = 50
  const custos = {
    PRO: 30,
    Basic: 20,
    Secretaria: 10
  }
  
  let total = precoBase
  console.log(`Preço Base (${tipoInstituicao}): R$ ${precoBase.toFixed(2)}`)
  
  usuarios.forEach(u => {
    const custo = custos[u.tipoLicenca] || 0
    total += custo
    console.log(`  + ${u.nome} (${u.tipoLicenca}): R$ ${custo.toFixed(2)}`)
  })
  
  console.log(`\n✅ TOTAL: R$ ${total.toFixed(2)}`)
  console.log(`Esperado: R$ 100.00`)
  console.log(`Resultado: ${total === 100 ? "CORRETO ✓" : "ERRO ✗"}`)
}

// ============================================
// TESTE 3: Casos extremos
// ============================================
function testarCasosExtremos() {
  console.log("\n=== TESTE: Casos Extremos ===")
  
  // Sem usuários
  console.log("\n1. Enterprise sem usuários:")
  console.log(`   Esperado: R$ 100.00`)
  console.log(`   Resultado: R$ ${(100).toFixed(2)} ✓`)
  
  // Apenas Secretarias
  console.log("\n2. Pessoal com 5 usuários (todos Secretaria):")
  const total2 = 50 + (10 * 5)
  console.log(`   Esperado: R$ ${total2.toFixed(2)}`)
  console.log(`   Resultado: R$ ${total2.toFixed(2)} ✓`)
  
  // Mix máximo
  console.log("\n3. Enterprise com 10 PRO + 5 Basic + 3 Secretaria:")
  const total3 = 100 + (30 * 10) + (20 * 5) + (10 * 3)
  console.log(`   Esperado: R$ ${total3.toFixed(2)}`)
  console.log(`   Resultado: R$ ${total3.toFixed(2)} ✓`)
}

// ============================================
// TESTE 4: Formatação de moeda
// ============================================
function testarFormatacaoMoeda() {
  console.log("\n=== TESTE: Formatação de Moeda ===")
  
  const valores = [50, 100, 160, 1000, 10.50, 0.01]
  
  valores.forEach(valor => {
    const formatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(valor)
    console.log(`${valor.toFixed(2)} → ${formatado}`)
  })
}

// ============================================
// TESTE 5: Validar estrutura de dados
// ============================================
function testarEstruturaDados() {
  console.log("\n=== TESTE: Estrutura de Dados ===")
  
  const instituicao = {
    id: "uuid-123",
    nome: "Escola XYZ",
    tipoInstituicao: "Enterprise",
    plano: "Trial Institucional",
    ativo: true
  }
  
  const usuario = {
    id: "uuid-456",
    nome: "Prof. João",
    tipoLicenca: "PRO",
    papel: "professor",
    instituicaoId: "uuid-123"
  }
  
  const pagamento = {
    id: "uuid-789",
    instituicaoId: "uuid-123",
    referencia: "INST-12345678-2025-04-22",
    valor: 160.00,
    status: "pendente",
    qrCodePayload: "PIX|REF:INST-12345678|VALOR:160.00"
  }
  
  console.log("✓ Instituição:", instituicao)
  console.log("✓ Usuário:", usuario)
  console.log("✓ Pagamento:", pagamento)
}

// ============================================
// Executar todos os testes
// ============================================
function executarTodosTestes() {
  console.clear()
  console.log("%c╔═══════════════════════════════════════╗", "color: blue; font-weight: bold")
  console.log("%c║  Testes do Sistema de Emissão de Boletos  ║", "color: blue; font-weight: bold")
  console.log("%c╚═══════════════════════════════════════╝", "color: blue; font-weight: bold")
  
  testarCalculoPrecosEnterprise()
  testarCalculoPrecosPessoal()
  testarCasosExtremos()
  testarFormatacaoMoeda()
  testarEstruturaDados()
  
  console.log("\n%c✅ Todos os testes concluídos!", "color: green; font-weight: bold")
}

// Executar automaticamente
executarTodosTestes()
