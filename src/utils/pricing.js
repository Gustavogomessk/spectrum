/**
 * Cálculo de preços para boletos de instituições e licenças
 */

// Preços base por tipo de instituição
const INSTITUTION_BASE_PRICES = {
  Enterprise: 100.0,
  Pessoal: 50.0,
}

// Preços adicionais por tipo de licença
const LICENSE_ADDITIONAL_PRICES = {
  PRO: 30.0,
  Basic: 20.0,
  Secretaria: 10.0,
}

/**
 * Calcula o preço total de um boleto baseado no tipo de instituição e licenças
 * @param {string} institutionType - Tipo de instituição (Enterprise ou Pessoal)
 * @param {Array} usuarios - Array de usuários com suas licenças
 * @returns {number} Valor total do boleto
 */
export function calcularValorBoleto(institutionType, usuarios = []) {
  // Preço base da instituição (padrão: Pessoal se não encontrado)
  const basePrice = INSTITUTION_BASE_PRICES[institutionType] || INSTITUTION_BASE_PRICES["Pessoal"] || 50.0

  // Soma dos custos adicionais por licença
  const licensesCost = (usuarios || []).reduce((total, usuario) => {
    const licenseType = usuario.tipoLicenca
    const additionalPrice = LICENSE_ADDITIONAL_PRICES[licenseType] || 0
    return total + additionalPrice
  }, 0)

  return basePrice + licensesCost
  
  
}

/**
 * Retorna um resumo detalhado do cálculo do boleto
 * @param {string} institutionType - Tipo de instituição
 * @param {Array} usuarios - Array de usuários
 * @returns {object} Objeto com detalhes do cálculo
 */
export function gerarDetalhesBoleto(institutionType, usuarios = []) {
  const basePrice = INSTITUTION_BASE_PRICES[institutionType] || INSTITUTION_BASE_PRICES["Pessoal"] || 50.0

  const licenseBreakdown = (usuarios || []).map((usuario) => {
    const licenseType = usuario.tipoLicenca || "Basic"
    const additionalPrice = LICENSE_ADDITIONAL_PRICES[licenseType] || 0
    return {
      usuarioNome: usuario.nome,
      tipoLicenca: licenseType,
      valor: additionalPrice,
    }
  })

  const licensesCost = licenseBreakdown.reduce((total, item) => total + item.valor, 0)
  const totalValue = basePrice + licensesCost

  return {
    tipoInstituicao: institutionType,
    precoBase: basePrice,
    usuarios: usuarios.length,
    detalhesLicencas: licenseBreakdown,
    totalLicencas: licensesCost,
    valorTotal: totalValue,
  }
}

/**
 * Formata um valor monetário em Real brasileiro
 * @param {number} value - Valor em reais
 * @returns {string} String formatada (ex: R$ 100,00)
 */
export function formatarMoeda(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}
