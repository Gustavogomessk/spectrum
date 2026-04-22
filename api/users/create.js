import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" })
  }

  // Require authentication (only authenticated users can call; authorization is app-side)
  const user = await requireUser(req, res)
  if (!user) return

  const { email, password, user_metadata } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: "missing_email_or_password" })
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
      user_metadata: user_metadata && typeof user_metadata === "object" ? user_metadata : {},
    })

    if (error || !data?.user) {
      return res.status(400).json({ error: error?.message || "create_user_failed" })
    }

    return res.status(200).json({
      userId: data.user.id,
      email: data.user.email,
    })
  } catch (err) {
    console.error("[CREATE USER] Erro:", err)
    return res.status(500).json({ error: err.message })
  }
}

