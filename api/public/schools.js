import { supabaseAdmin } from "../_lib/supabaseAdmin.js"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("id, name, slug")
    .eq("is_public", true)
    .order("name", { ascending: true })

  if (error) {
    res.status(500).json({ error: "db_error", details: error.message })
    return
  }

  res.status(200).json({ schools: data || [] })
}

