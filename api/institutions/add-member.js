import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  const { userId, schoolId, role = "member" } = req.body || {}

  if (!userId || !schoolId) {
    return res.status(400).json({ error: "missing_userId_or_schoolId" })
  }

  try {
    // Verify the current user is an admin of the school
    const { data: isAdmin, error: adminErr } = await supabaseAdmin
      .rpc("is_school_admin", { sid: schoolId })

    if (adminErr || !isAdmin) {
      console.error("[add-member] Not admin of school:", adminErr)
      return res.status(403).json({ error: "not_school_admin" })
    }

    // Check if member already exists
    const { data: existing, error: checkErr } = await supabaseAdmin
      .from("school_members")
      .select("id")
      .eq("school_id", schoolId)
      .eq("user_id", userId)
      .maybeSingle()

    if (checkErr) {
      console.error("[add-member] Check error:", checkErr)
      return res.status(500).json({ error: "check_failed", details: checkErr.message })
    }

    if (existing) {
      console.log(`[add-member] User ${userId} already member of school ${schoolId}`)
      return res.status(200).json({ success: true, message: "user_already_member" })
    }

    // Add user to school_members
    const { data, error } = await supabaseAdmin
      .from("school_members")
      .insert({
        school_id: schoolId,
        user_id: userId,
        role: role,
      })
      .select()
      .single()

    if (error) {
      console.error("[add-member] Insert error:", error)
      return res.status(500).json({ error: "insert_failed", details: error.message })
    }

    console.log(`[add-member] User ${userId} added to school ${schoolId}`)
    res.status(200).json({ success: true, member: data })
  } catch (err) {
    console.error("[add-member] Unhandled error:", err)
    res.status(500).json({ error: "internal_error", details: err.message })
  }
}
