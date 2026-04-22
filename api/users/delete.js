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
    console.log(`[DELETE USER] Iniciando deleção do usuário: ${userId}`)
    
    // Delete user from auth (this will cascade delete related data due to ON DELETE CASCADE)
    console.log('[DELETE USER] calling supabaseAdmin.auth.admin.deleteUser with service role')
    let deleteResult = null
    let lastError = null

    const tryDelete = async (arg) => {
      try {
        console.log('[DELETE USER] trying deleteUser with arg:', arg)
        return await supabaseAdmin.auth.admin.deleteUser(arg)
      } catch (err) {
        console.warn('[DELETE USER] deleteUser threw for arg:', arg, err?.message || err)
        lastError = err
        return null
      }
    }

    // Try multiple possible signatures (first the common one)
    deleteResult = await tryDelete(userId)
    if (!deleteResult) deleteResult = await tryDelete({ userId })
    if (!deleteResult) deleteResult = await tryDelete({ user_id: userId })
    if (!deleteResult) deleteResult = await tryDelete({ id: userId })

    console.log('[DELETE USER] deleteResult (final):', deleteResult, 'lastError:', lastError)

    const { error } = deleteResult || {}
    if (error) {
      console.error(`[DELETE USER] Erro ao deletar usuário ${userId}:`, error)
      return res.status(400).json({ 
        error: error.message,
        details: error.status || error.code,
        raw: error
      })
    }
    if (!deleteResult && lastError) {
      console.error(`[DELETE USER] deleteUser failed for all tried signatures. lastError:`, lastError)
      return res.status(500).json({ error: 'delete_user_failed', message: lastError?.message || String(lastError), stack: lastError?.stack })
    }

    console.log(`[DELETE USER] ✓ Usuário ${userId} deletado com sucesso de auth.users`)
    return res.status(200).json({ 
      message: "Usuário deletado com sucesso",
      userId: userId
    })
  } catch (err) {
    console.error(`[DELETE USER] Erro crítico ao deletar ${userId}:`, err)
    return res.status(500).json({ 
      error: err.message,
      stack: err.stack
    })
  }
}
