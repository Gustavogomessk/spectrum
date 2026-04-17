import { createClient } from "@supabase/supabase-js"

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url) throw new Error("Missing env SUPABASE_URL")
if (!serviceRoleKey) throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY")

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

