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

    const newUserId = data.user.id

    // If schoolId provided, add user to school_members automatically
    if (schoolId) {
      try {
        const { error: memberErr } = await supabaseAdmin
          .from("school_members")
          .insert({
            school_id: schoolId,
            user_id: newUserId,
            role: "member",
          })
          .select()
          .single()

        if (memberErr && !memberErr.message?.includes("duplicate")) {
          console.error("[CREATE USER] Warning: Failed to add user to school_members:", memberErr)
          // Don't fail the whole request - user was created successfully in auth
        } else if (!memberErr) {
          console.log(`[CREATE USER] User ${newUserId} added to school_members for school ${schoolId}`)
        }
      } catch (err) {
        console.error("[CREATE USER] Unexpected error adding to school_members:", err)
        // Continue - user was created successfully
      }
    }

    return res.status(200).json({
      success: true,
      message: "Usuário criado com sucesso.",
      data: {
        userId: newUserId,
        email: data.user.email,
      },
    })
  } catch (err) {
    console.error("[CREATE USER] Erro:", err)
    return res.status(500).json({ success: false, error: err.message })
  }
}

