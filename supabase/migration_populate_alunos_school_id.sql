-- =============================================================================
-- MIGRATION: Populate school_id for existing alunos
-- Execute no Supabase: SQL Editor → New query → Run
-- IMPORTANT: Run this AFTER migration_populate_school_members.sql
-- =============================================================================

-- This migration fills school_id for existing alunos based on their creator's institution
-- This is necessary to enable sharing between school members

UPDATE public.alunos a
SET school_id = (
  SELECT au.instituicao_id
  FROM public.instituicao_usuarios au
  WHERE au.user_id = a.user_id
    AND au.instituicao_id IS NOT NULL
  LIMIT 1
)
WHERE a.school_id IS NULL
  AND EXISTS (
    SELECT 1 FROM public.instituicao_usuarios au
    WHERE au.user_id = a.user_id
      AND au.instituicao_id IS NOT NULL
  );

-- Verify the updates
SELECT 
  'Alunos with school_id populated:' as status,
  COUNT(*) as total_alunos,
  COUNT(CASE WHEN school_id IS NOT NULL THEN 1 END) as with_school_id,
  COUNT(CASE WHEN school_id IS NULL THEN 1 END) as without_school_id
FROM public.alunos;

-- Show alunos by school
SELECT 
  school_id,
  COUNT(*) as alunos_count
FROM public.alunos
WHERE school_id IS NOT NULL
GROUP BY school_id
ORDER BY alunos_count DESC;
