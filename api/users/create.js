import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "method_not_allowed" })
  }

  // Require authentication (only authenticated users can call; authorization is app-side)
  const user = await requireUser(req, res)
  if (!user) return

  const { email, password, user_metadata, schoolId } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "missing_email_or_password" })
  }

  try {
    // Enforce institution user limits (only when schoolId is provided)
    if (schoolId) {
      const { data: inst, error: instErr } = await supabaseAdmin
        .from("admin_institutions")
        .select("id, user_limit")
        .eq("id", schoolId)
        .maybeSingle()

      if (instErr) {
        console.error("[CREATE USER] Failed fetching institution:", instErr)
        return res.status(500).json({ success: false, error: "institution_lookup_failed" })
      }

      // If institution exists and has a numeric limit, enforce it.
      const limitRaw = inst?.user_limit
      const limit = limitRaw === null || limitRaw === undefined ? null : Number(limitRaw)

      if (limit !== null && !Number.isNaN(limit)) {
        const { count, error: countErr } = await supabaseAdmin
          .from("admin_users")
          .select("id", { count: "exact", head: true })
          .eq("institution_id", schoolId)
          .eq("active", true)

        if (countErr) {
          console.error("[CREATE USER] Failed counting users:", countErr)
          return res.status(500).json({ success: false, error: "user_count_failed" })
        }

        if (count >= limit) {
          return res.status(409).json({ success: false, error: "user_limit_reached", limit, count })
        }
      }
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: String(email).trim(),
      password: String(password),
      email_confirm: true,
      user_metadata: user_metadata && typeof user_metadata === "object" ? user_metadata : {},
    })

    if (error || !data?.user) {
      return res.status(400).json({ success: false, error: error?.message || "create_user_failed" })
    }

    return res.status(200).json({
      success: true,
      message: "Usuário criado com sucesso.",
      data: {
        userId: data.user.id,
        email: data.user.email,
      },
    })
  } catch (err) {
    console.error("[CREATE USER] Erro:", err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

