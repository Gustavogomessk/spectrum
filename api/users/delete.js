import { supabaseAdmin } from "../_lib/supabaseAdmin.js"
import { requireUser } from "../_lib/auth.js"

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "method_not_allowed" })
  }

  // Require authentication (only admin can delete users)
  const user = await requireUser(req, res)
  if (!user) return

  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: "missing_userId" })
  }

  try {
    // Delete user from auth (this will cascade delete related data due to ON DELETE CASCADE)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      console.error("Erro ao deletar usuário do auth:", error)
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: "Usuário deletado com sucesso" })
  } catch (err) {
    console.error("Erro ao deletar usuário:", err)
    return res.status(500).json({ error: err.message })
  }
}
