import { supabaseAdmin } from "./supabaseAdmin.js"

export function getBearerToken(req) {
  const raw = req.headers?.authorization || req.headers?.Authorization
  if (!raw || typeof raw !== "string") return null
  const m = raw.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}

export async function requireUser(req, res) {
  const token = getBearerToken(req)
  if (!token) {
    res.status(401).json({ error: "missing_bearer_token" })
    return null
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) {
    res.status(401).json({ error: "invalid_token" })
    return null
  }

  return data.user
}

