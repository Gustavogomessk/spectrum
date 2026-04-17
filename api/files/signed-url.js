import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  const { fileId, expiresIn = 60 } = req.body || {}
  if (!fileId) {
    res.status(400).json({ error: "missing_fileId" })
    return
  }

  const { data: fileRow, error: fileErr } = await supabaseAdmin
    .from("files")
    .select("id, storage_path, school_id, user_id")
    .eq("id", fileId)
    .single()

  if (fileErr) {
    res.status(404).json({ error: "file_not_found" })
    return
  }

  // Authorization: owner OR same school membership.
  if (fileRow.user_id !== user.id) {
    const { data: membership, error: memErr } = await supabaseAdmin
      .from("school_members")
      .select("id")
      .eq("school_id", fileRow.school_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (memErr || !membership) {
      res.status(403).json({ error: "forbidden" })
      return
    }
  }

  const bucket = "uploads-files"
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(fileRow.storage_path, Number(expiresIn))
  if (error) {
    res.status(500).json({ error: "sign_error", details: error.message })
    return
  }

  res.status(200).json({
    file: { id: fileRow.id },
    signedUrl: data?.signedUrl,
    expiresIn: Number(expiresIn),
  })
}

