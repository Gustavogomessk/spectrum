import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" })
    return
  }

  const user = await requireUser(req, res)
  if (!user) return

  const { institutionId } = req.body || {}

  if (!institutionId) {
    return res.status(400).json({ error: "missing_institutionId" })
  }

  try {
    // Check if mapping already exists
    const { data: existingMapping, error: mappingErr } = await supabaseAdmin
      .from("institution_school_mapping")
      .select("school_id")
      .eq("institution_id", institutionId)
      .maybeSingle()

    if (existingMapping) {
      console.log("[sync-to-schools] Mapping found:", existingMapping.school_id)
      return res.status(200).json({ success: true, schoolId: existingMapping.school_id })
    }

    // Check if school already exists (fallback)
    const { data: existingSchool, error: schoolErr } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("id", institutionId)
      .maybeSingle()

    if (existingSchool) {
      console.log("[sync-to-schools] School already exists:", institutionId)
      // Create mapping
      await supabaseAdmin
        .from("institution_school_mapping")
        .insert({ institution_id: institutionId, school_id: institutionId })
        .single()
      return res.status(200).json({ success: true, schoolId: institutionId })
    }

    // Fetch institution details
    const { data: institution, error: instErr } = await supabaseAdmin
      .from("admin_institutions")
      .select("id, name")
      .eq("id", institutionId)
      .maybeSingle()

    if (instErr || !institution) {
      console.error("[sync-to-schools] Institution not found:", institutionId, instErr)
      return res.status(404).json({ error: "institution_not_found" })
    }

    // Create new school with the same ID as institution (direct mapping)
    const { data: newSchool, error: createErr } = await supabaseAdmin
      .from("schools")
      .insert({
        id: institutionId, // Use institution ID directly
        name: institution.name,
        slug: slugify(institution.name) + "-" + institutionId.substring(0, 8),
        is_public: true,
      })
      .select()
      .single()

    if (createErr) {
      console.error("[sync-to-schools] Create school error:", createErr)
      return res.status(500).json({ error: "create_school_failed", details: createErr.message })
    }

    // Create mapping
    const { data: mapping, error: mapErr } = await supabaseAdmin
      .from("institution_school_mapping")
      .insert({
        institution_id: institutionId,
        school_id: newSchool.id,
      })
      .select()
      .single()

    if (mapErr) {
      console.error("[sync-to-schools] Create mapping error:", mapErr)
      // School was created but mapping failed - not critical, log and continue
      console.log("[sync-to-schools] School created but mapping failed - using direct ID")
      return res.status(200).json({ success: true, schoolId: newSchool.id })
    }

    console.log(`[sync-to-schools] School created and mapped: ${institutionId}`)
    res.status(200).json({ success: true, schoolId: newSchool.id })
  } catch (err) {
    console.error("[sync-to-schools] Unhandled error:", err)
    res.status(500).json({ error: "internal_error", details: err.message })
  }
}

function slugify(text) {
  if (!text) return "school"
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50)
}
