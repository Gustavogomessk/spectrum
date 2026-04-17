import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  const { alunoId, expiresIn = 120 } = req.body || {}
  if (!alunoId) {
    res.status(400).json({ error: "missing_alunoId" })
    return
  }

  const { data: aluno, error: aluErr } = await supabaseAdmin
    .from("alunos")
    .select("id, user_id, school_id, laudo_url")
    .eq("id", alunoId)
    .single()

  if (aluErr || !aluno) {
    res.status(404).json({ error: "aluno_not_found" })
    return
  }

  if (!aluno.laudo_url) {
    res.status(404).json({ error: "no_laudo" })
    return
  }

  // Authorization: owner OR same school membership.
  if (aluno.user_id !== user.id) {
    if (!aluno.school_id) {
      res.status(403).json({ error: "forbidden" })
      return
    }
    const { data: membership } = await supabaseAdmin
      .from("school_members")
      .select("id")
      .eq("school_id", aluno.school_id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!membership) {
      res.status(403).json({ error: "forbidden" })
      return
    }
  }

  const bucket = "uploads-files"
  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(aluno.laudo_url, Number(expiresIn))
  if (error) {
    res.status(500).json({ error: "sign_error", details: error.message })
    return
  }

  res.status(200).json({ signedUrl: data?.signedUrl, expiresIn: Number(expiresIn) })
}

