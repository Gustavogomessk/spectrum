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
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

async function parseMultipartForm(req) {
  const contentType = req.headers["content-type"] || ""
  
  // If JSON, parse as JSON
  if (contentType.includes("application/json")) {
    return JSON.parse(req.body || "{}")
  }
  
  // If FormData/multipart, parse manually
  if (contentType.includes("multipart/form-data")) {
    const boundary = contentType.split("boundary=")[1]
    if (!boundary) throw new Error("Invalid multipart boundary")
    
    const body = typeof req.body === "string" ? req.body : req.body.toString("utf-8")
    const parts = body.split(`--${boundary}`)
    const formData = {}
    
    for (const part of parts) {
      if (!part.includes("Content-Disposition")) continue
      
      const lines = part.split("\r\n")
      let fieldName = ""
      let filename = ""
      let content = ""
      let isFile = false
      let startContent = false
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        if (line.includes("Content-Disposition")) {
          const nameMatch = line.match(/name="([^"]+)"/)
          const fileMatch = line.match(/filename="([^"]+)"/)
          if (nameMatch) fieldName = nameMatch[1]
          if (fileMatch) {
            filename = fileMatch[1]
            isFile = true
          }
        } else if (line === "" && !startContent) {
          startContent = true
          // Content starts from next line
          content = lines.slice(i + 1).join("\r\n")
          // Remove trailing CRLF
          if (content.endsWith("\r\n")) {
            content = content.slice(0, -2)
          }
          break
        }
      }
      
      if (fieldName) {
        if (isFile) {
          formData[fieldName] = {
            filename,
            content: Buffer.from(content, "binary")
          }
        } else {
          formData[fieldName] = content
        }
      }
    }
    
    return formData
  }
  
  throw new Error("Unsupported content-type")
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  try {
    let fileBuffer, filename, schoolId, alunoId, storagePath

    const contentType = req.headers["content-type"] || ""
    
    if (contentType.includes("application/json")) {
      // JSON body with base64
      const { fileBase64, filename: fname, schoolId: sid, alunoId: aid, storagePath: sp } = req.body || {}
      
      if (!fileBase64) {
        res.status(400).json({ error: "missing_file" })
        return
      }
      
      if (!fname?.toLowerCase().endsWith(".pdf")) {
        res.status(400).json({ error: "only_pdf_allowed" })
        return
      }
      
      fileBuffer = Buffer.from(fileBase64, "base64")
      filename = fname
      schoolId = sid
      alunoId = aid
      storagePath = sp
    } else if (contentType.includes("multipart/form-data")) {
      // FormData with file
      const formData = await parseMultipartForm(req)
      const fileField = formData.file
      
      if (!fileField?.content) {
        res.status(400).json({ error: "missing_file" })
        return
      }
      
      const fname = fileField.filename || formData.filename || "arquivo.pdf"
      if (!fname.toLowerCase().endsWith(".pdf")) {
        res.status(400).json({ error: "only_pdf_allowed" })
        return
      }
      
      fileBuffer = fileField.content
      filename = fname
      schoolId = formData.schoolId
      alunoId = formData.alunoId
      storagePath = formData.storagePath
    } else {
      res.status(400).json({ error: "unsupported_content_type" })
      return
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      res.status(400).json({ error: "file_empty" })
      return
    }

    // Build storage path
    const schoolIdSafe = sanitizeStorageSegment(schoolId || "trial")
    const finalStoragePath =
      storagePath ||
      `escola-${schoolIdSafe}/user-${user.id}/aluno-${alunoId || "general"}-${sanitizeFilename(filename)}`

    // Upload to storage using admin client (bypasses RLS)
    const { error: upErr, data: upData } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(finalStoragePath, fileBuffer, {
        upsert: true,
        contentType: "application/pdf",
      })

    if (upErr) {
      console.error("Upload error:", upErr)
      res.status(500).json({ error: "upload_failed", details: upErr.message })
      return
    }

    // Validate school_id: only use if it's a valid UUID, otherwise pass null
    const validSchoolId = schoolId && isValidUUID(schoolId) ? schoolId : null

    // Insert file metadata using admin client (bypasses RLS)
    const { data: row, error: dbErr } = await supabaseAdmin
      .from("files")
      .insert({
        school_id: validSchoolId,
        user_id: user.id,
        filename: filename,
        storage_path: finalStoragePath,
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
