-- =============================================================================
-- MIGRATION: Add institution to schools table
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- Insert the institution into schools table
INSERT INTO public.schools (id, name, slug, is_public)
SELECT 
  i.id,
  i.nome,
  lower(replace(replace(replace(i.nome, ' ', '-'), 'á', 'a'), 'ã', 'a')),
  true
FROM public.instituicoes i
WHERE i.id = '6dd8d5f5-738a-4911-9361-7aa7bbe5f124'
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 
  'Schools after insert:' as status,
  COUNT(*) as total,
  MAX(created_at) as newest
FROM public.schools;

-- Check specific school
SELECT * FROM public.schools WHERE id = '6dd8d5f5-738a-4911-9361-7aa7bbe5f124';
