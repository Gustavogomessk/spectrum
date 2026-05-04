-- =============================================================================
-- DEBUG: Check and fix alunos school_id mapping
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- 1. Check current institutions and schools
SELECT 'INSTITUTIONS' as section;
SELECT id, name FROM public.admin_institutions LIMIT 10;

-- 2. Check schools
SELECT 'SCHOOLS' as section;
SELECT id, name FROM public.schools LIMIT 10;

-- 3. Check mapping
SELECT 'INSTITUTION_SCHOOL_MAPPING' as section;
SELECT institution_id, school_id FROM public.institution_school_mapping LIMIT 10;

-- 4. Check alunos with NULL school_id
SELECT 'ALUNOS WITH NULL SCHOOL_ID' as section;
SELECT id, user_id, nome, school_id FROM public.alunos WHERE school_id IS NULL LIMIT 20;

-- 5. Check alunos with school_id
SELECT 'ALUNOS WITH SCHOOL_ID' as section;
SELECT id, user_id, nome, school_id FROM public.alunos WHERE school_id IS NOT NULL LIMIT 20;

-- 6. Check school_members
SELECT 'SCHOOL_MEMBERS' as section;
SELECT school_id, user_id, role FROM public.school_members LIMIT 20;

-- 7. Rebuild mapping if admin_institutions exist but mapping is empty
-- This will create mappings for all institutions
INSERT INTO public.institution_school_mapping (institution_id, school_id)
SELECT 
  ai.id,
  s.id
FROM public.admin_institutions ai
LEFT JOIN public.schools s ON s.id = ai.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.institution_school_mapping ism 
  WHERE ism.institution_id = ai.id
)
ON CONFLICT (institution_id) DO NOTHING;

SELECT 'MAPPING REPAIRED' as section;
