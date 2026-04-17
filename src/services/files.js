import { supabase, isSupabaseConfigured } from "./supabaseClient"
import { apiFetch } from "./api"

const BUCKET = "uploads-files"

function sanitizeFilename(name) {
  return (name || "arquivo.pdf")
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function sanitizeStorageSegment(seg) {
  return (seg || "")
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export function buildStoragePath({ schoolId, userId, filename }) {
  const safe = sanitizeFilename(filename)
  return `escola-${schoolId}/user-${userId}/${safe}`
}

export async function uploadPdf({ file, schoolId, userId, storagePath: storagePathOpt } = {}) {
  if (!isSupabaseConfigured() || !supabase) throw new Error("supabase_not_configured")
  if (!file) throw new Error("missing_file")
  if (!file.name?.toLowerCase().endsWith(".pdf")) throw new Error("only_pdf_allowed")

  const storagePath = storagePathOpt || buildStoragePath({ schoolId, userId, filename: file.name })

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    upsert: true,
    contentType: "application/pdf",
  })
  if (upErr) throw upErr

  const { data: row, error: dbErr } = await supabase
    .from("files")
    .insert({
      school_id: schoolId || null,
      user_id: userId,
      filename: file.name,
      storage_path: storagePath,
      public_url: null,
    })
    .select("id, filename, storage_path, created_at")
    .single()

  if (dbErr) throw dbErr
  return row
}

export async function listFiles({ schoolId } = {}) {
  if (!isSupabaseConfigured() || !supabase) return []
  const q = supabase.from("files").select("id, filename, storage_path, created_at, user_id, school_id").order("created_at", { ascending: false })
  const { data, error } = schoolId ? await q.eq("school_id", schoolId) : await q
  if (error) throw error
  return data || []
}

export async function getSignedUrl({ fileId, expiresIn = 120 }) {
  if (!isSupabaseConfigured() || !supabase) throw new Error("supabase_not_configured")
  const { data: sess } = await supabase.auth.getSession()
  const token = sess?.session?.access_token
  if (!token) throw new Error("not_authenticated")
  const data = await apiFetch("/api/files/signed-url", { method: "POST", token, body: { fileId, expiresIn } })
  return data?.signedUrl
}

