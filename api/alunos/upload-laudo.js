import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

const BUCKET = "uploads-files"

function sanitizeFilename(name) {
  return (name || "arquivo.pdf")
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function sanitizeStorageSegment(seg) {
  return (seg || "")
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  const { fileBase64, filename, schoolId, alunoId, storagePath: storagePathOpt } = req.body || {}

  if (!fileBase64) {
    res.status(400).json({ error: "missing_fileBase64" })
    return
  }

  if (!filename?.toLowerCase().endsWith(".pdf")) {
    res.status(400).json({ error: "only_pdf_allowed" })
    return
  }

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(fileBase64, "base64")

    // Build storage path
    const schoolIdSafe = sanitizeStorageSegment(schoolId || "trial")
    const storagePath =
      storagePathOpt ||
      `escola-${schoolIdSafe}/user-${user.id}/aluno-${alunoId || "general"}-${sanitizeFilename(filename)}`

    // Upload to storage using admin client (bypasses RLS)
    const { error: upErr, data: upData } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: "application/pdf",
      })

    if (upErr) {
      console.error("Upload error:", upErr)
      res.status(500).json({ error: "upload_failed", details: upErr.message })
      return
    }

    // Insert file metadata using admin client (bypasses RLS)
    const { data: row, error: dbErr } = await supabaseAdmin
      .from("files")
      .insert({
        school_id: schoolId || null,
        user_id: user.id,
        filename: filename,
        storage_path: storagePath,
        public_url: null,
      })
      .select("id, filename, storage_path, created_at")
      .single()

    if (dbErr) {
      console.error("Database insert error:", dbErr)
      res.status(500).json({ error: "db_insert_failed", details: dbErr.message })
      return
    }

    res.status(200).json({ success: true, file: row, uploadPath: upData?.path })
  } catch (err) {
    console.error("Upload handler error:", err)
    res.status(500).json({ error: "internal_error", details: err.message })
  }
}
