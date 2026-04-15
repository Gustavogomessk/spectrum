export function corAvatar(diagnostico) {
  const d = diagnostico || ""
  if (d.includes("TEA")) return "ambar"
  if (d.includes("TDAH")) return ""
  return "verde"
}

export function badgeDiag(diagnostico) {
  const d = diagnostico || ""
  if (d.includes("TEA")) return "badge-ambar"
  if (d.includes("TDAH")) return "badge-azul"
  return "badge-cinza"
}
