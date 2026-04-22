import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

/**
 * Endpoint: POST /api/alunos/register-laudo
 * 
 * After client uploads file directly to Supabase Storage,
 * this endpoint registers the file metadata in the database.
 * 
 * This approach avoids Vercel's 6MB body limit by using direct Supabase Storage upload.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  try {
    const { filename, storagePath, schoolId, alunoId } = req.body || {}

    if (!filename || !storagePath) {
      return res.status(400).json({ error: "missing_filename_or_storagePath" })
    }

    function isValidUUID(uuid) {
      if (!uuid) return false
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(String(uuid))
    }

    // Validate school_id: only use if it's a valid UUID
    const validSchoolId = isValidUUID(schoolId) ? schoolId : null

    console.log(`[register-laudo] Registering file: schoolId=${validSchoolId}, alunoId=${alunoId}, path=${storagePath}`)

    // Register file metadata
    const { data: fileData, error: fileErr } = await supabaseAdmin
      .from("files")
      .insert({
        school_id: validSchoolId,
        user_id: user.id,
        filename: filename,
        storage_path: storagePath,
        public_url: null,
      })
      .select("id, filename, storage_path, created_at")
      .single()

    if (fileErr) {
      console.error("[register-laudo] File insert error:", fileErr)
      return res.status(500).json({ error: "file_insert_failed", details: fileErr.message })
    }

    console.log(`[register-laudo] File registered: ${fileData.id}`)
    res.status(200).json({ success: true, file: fileData })
  } catch (err) {
    console.error("[register-laudo] Unhandled error:", err)
    res.status(500).json({ error: "internal_error", details: err.message })
  }
}
