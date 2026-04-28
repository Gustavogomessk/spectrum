-- =============================================================================
-- MIGRATION: Fix institution to school linking
-- Execute no Supabase: SQL Editor → New query → Run
-- IMPORTANT: Execute this to properly link institutions to users
-- =============================================================================

-- Step 1: Ensure institution 6dd8d5f5-738a-4911-9361-7aa7bbe5f124 exists in schools table
INSERT INTO public.schools (id, name, slug, is_public)
SELECT 
  i.id,
  i.nome,
  lower(replace(i.nome, ' ', '-')),
  true
FROM public.instituicoes i
WHERE i.id = '6dd8d5f5-738a-4911-9361-7aa7bbe5f124'
  AND NOT EXISTS (
    SELECT 1 FROM public.schools s WHERE s.id = i.id
  )
ON CONFLICT DO NOTHING;

-- Step 2: Check users in instituicao_usuarios for this institution
SELECT 
  'Users in this institution:' as status,
  iu.id,
  iu.nome,
  iu.email,
  iu.user_id,
  iu.papel,
  au.id as auth_user_id,
  au.email as auth_email
FROM public.instituicao_usuarios iu
LEFT JOIN auth.users au ON au.email = iu.email
WHERE iu.instituicao_id = '6dd8d5f5-738a-4911-9361-7aa7bbe5f124'
ORDER BY iu.nome;

-- Step 3: Update instituicao_usuarios with correct user_id if missing
UPDATE public.instituicao_usuarios iu
SET user_id = au.id
FROM auth.users au
WHERE iu.instituicao_id = '6dd8d5f5-738a-4911-9361-7aa7bbe5f124'
  AND iu.user_id IS NULL
  AND iu.email = au.email;

-- Step 4: Now populate school_members for this institution
INSERT INTO public.school_members (school_id, user_id, role)
SELECT DISTINCT
  iu.instituicao_id AS school_id,
  iu.user_id,
  CASE
    WHEN iu.papel = 'subadmin' THEN 'admin'::public.school_role
    WHEN iu.papel = 'secretaria' THEN 'secretaria'::public.school_role
    WHEN iu.papel = 'psicopedagogo' THEN 'psicopedagogo'::public.school_role
    WHEN iu.papel = 'professor' THEN 'professor'::public.school_role
    ELSE 'professor'::public.school_role
  END AS role
FROM public.instituicao_usuarios iu
WHERE iu.instituicao_id = '6dd8d5f5-738a-4911-9361-7aa7bbe5f124'
  AND iu.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.school_members sm
    WHERE sm.school_id = iu.instituicao_id
      AND sm.user_id = iu.user_id
  )
ON CONFLICT (school_id, user_id) DO NOTHING;

-- Step 5: Verify results
SELECT 
  'School Members for institution:' as status,
  COUNT(*) as count,
  string_agg(sm.user_id::text, ', ') as user_ids
FROM public.school_members sm
WHERE sm.school_id = '6dd8d5f5-738a-4911-9361-7aa7bbe5f124';

-- Step 6: Create institution_school_mapping if not exists
INSERT INTO public.institution_school_mapping (institution_id, school_id)
VALUES ('6dd8d5f5-738a-4911-9361-7aa7bbe5f124', '6dd8d5f5-738a-4911-9361-7aa7bbe5f124')
ON CONFLICT DO NOTHING;

SELECT 'Migration complete!' as status;
