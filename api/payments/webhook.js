import { supabaseAdmin } from "../_lib/supabaseAdmin.js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ error: "method_not_allowed" })
  }

  try {
    const { paymentId, status } = req.body || {}
    if (!paymentId) return res.status(400).json({ error: "missing_payment_id" })
    const normalized = String(status || "pago").toLowerCase()
    if (!["pendente", "pago", "confirmado", "cancelado"].includes(normalized)) {
      return res.status(400).json({ error: "invalid_status" })
    }

    const update = {
      status: normalized,
      confirmed_at: normalized === "pago" || normalized === "confirmado" ? new Date().toISOString() : null,
    }
    const { data, error } = await supabaseAdmin
      .from("admin_payments")
      .update(update)
      .eq("id", paymentId)
      .select("id, status, confirmed_at")
      .single()

    if (error) throw error
    return res.status(200).json({ ok: true, payment: data })
  } catch (error) {
    return res.status(500).json({ error: "webhook_update_failed", message: error?.message || "unknown_error" })
  }
}
