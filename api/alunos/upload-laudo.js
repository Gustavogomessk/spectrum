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

function isValidUUID(uuid) {
  if (!uuid) return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(String(uuid))
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  try {
    const { fileBase64, filename, schoolId, alunoId, storagePath: storagePathOpt } = req.body || {}

    if (!fileBase64 || typeof fileBase64 !== "string") {
      return res.status(400).json({ error: "missing_or_invalid_fileBase64" })
    }

    if (!filename || typeof filename !== "string" || !filename.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "invalid_filename_must_be_pdf" })
    }

    // Convert base64 to buffer
    let buffer
    try {
      buffer = Buffer.from(fileBase64, "base64")
      if (buffer.length === 0) {
        return res.status(400).json({ error: "file_is_empty" })
      }
    } catch (parseErr) {
      console.error("Base64 parse error:", parseErr.message)
      return res.status(400).json({ error: "invalid_base64_encoding" })
    }

    // Build storage path
    const schoolIdSafe = sanitizeStorageSegment(schoolId || "trial")
    const storagePath =
      storagePathOpt ||
      `escola-${schoolIdSafe}/user-${user.id}/aluno-${alunoId || "general"}-${sanitizeFilename(filename)}`

    console.log(`[upload-laudo] Starting upload: path=${storagePath}, size=${buffer.length}`)

    // Upload to storage using admin client (bypasses RLS)
    const { error: upErr, data: upData } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        upsert: true,
        contentType: "application/pdf",
      })

    if (upErr) {
      console.error("[upload-laudo] Storage upload error:", upErr)
      return res.status(500).json({ error: "storage_upload_failed", details: upErr.message })
    }

    console.log(`[upload-laudo] Upload success: ${storagePath}`)

    // Validate school_id: only use if it's a valid UUID, otherwise pass null
    const validSchoolId = isValidUUID(schoolId) ? schoolId : null

    console.log(`[upload-laudo] Inserting DB record: schoolId=${validSchoolId}, userId=${user.id}`)

    // Insert file metadata using admin client (bypasses RLS)
    const { data: row, error: dbErr } = await supabaseAdmin
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

    if (dbErr) {
      console.error("[upload-laudo] DB insert error:", dbErr)
      return res.status(500).json({ error: "db_insert_failed", details: dbErr.message })
    }

    console.log(`[upload-laudo] Success: file_id=${row.id}`)
    res.status(200).json({ success: true, file: row, uploadPath: upData?.path })
  } catch (err) {
    console.error("[upload-laudo] Unhandled error:", err)
    res.status(500).json({ error: "internal_error", details: err.message, stack: err.stack })
  }
}
