-- =============================================================================
-- MIGRATION: Populate school_members for institution users
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- This migration links institution users to schools via school_members table
-- Required for RLS sharing of alunos between school members

-- First, ensure we have schools created for each institution
-- Map institutions to schools via institution_school_mapping
INSERT INTO public.schools (id, name, slug, is_public)
SELECT DISTINCT
  sm.instituicao_id,
  i.nome,
  lower(replace(i.nome, ' ', '-')),
  true
FROM (
  SELECT DISTINCT instituicao_id FROM public.instituicao_usuarios WHERE instituicao_id IS NOT NULL
) sm
LEFT JOIN public.instituicoes i ON i.id = sm.instituicao_id
WHERE i.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.schools s WHERE s.id = sm.instituicao_id
  )
ON CONFLICT DO NOTHING;

-- Create mapping between institutions and schools (if not exists)
INSERT INTO public.institution_school_mapping (institution_id, school_id)
SELECT DISTINCT
  instituicao_id,
  instituicao_id
FROM public.instituicao_usuarios
WHERE instituicao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.institution_school_mapping m
    WHERE m.institution_id = instituicao_usuarios.instituicao_id
  )
ON CONFLICT DO NOTHING;

-- Add all institution users to school_members
INSERT INTO public.school_members (school_id, user_id, role)
SELECT DISTINCT
  au.instituicao_id AS school_id,
  au.user_id,
  CASE
    WHEN au.papel = 'subadmin' THEN 'admin'::public.school_role
    WHEN au.papel = 'secretaria' THEN 'secretaria'::public.school_role
    WHEN au.papel = 'psicopedagogo' THEN 'psicopedagogo'::public.school_role
    WHEN au.papel = 'professor' THEN 'professor'::public.school_role
    ELSE 'professor'::public.school_role
  END AS role
FROM public.instituicao_usuarios au
WHERE au.user_id IS NOT NULL
  AND au.instituicao_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.school_members sm
    WHERE sm.school_id = au.instituicao_id
      AND sm.user_id = au.user_id
  )
ON CONFLICT (school_id, user_id) DO NOTHING;

-- Verify the function is executable by authenticated users
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid) TO authenticated;

-- Check results
SELECT 'School Members Created:' as status, COUNT(*) as count FROM public.school_members;
SELECT 'Institutions mapped to Schools:' as status, COUNT(*) as count FROM public.institution_school_mapping;
