/**
 * Traduz mensagens comuns do Supabase Auth para português.
 */
export function mensagemErroSupabaseAuth(error) {
  if (!error) return "Erro desconhecido. Tente novamente."
  const m = (error.message || String(error)).toLowerCase()

  if (m.includes("invalid login credentials") || m.includes("invalid_grant")) {
    return "E-mail ou senha incorretos."
  }
  if (m.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar (link na caixa de entrada ou spam)."
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Este e-mail já está cadastrado. Use «Entrar» ou recuperação de senha."
  }
  if (m.includes("password") && (m.includes("short") || m.includes("least"))) {
    return "A senha deve ter pelo menos 6 caracteres (regra do Supabase)."
  }
  if (m.includes("signup_disabled") || m.includes("signups not allowed")) {
    return "Cadastro desativado no projeto. Ative em Authentication no painel Supabase."
  }
  return error.message || "Erro ao autenticar. Verifique os dados e tente de novo."
}
