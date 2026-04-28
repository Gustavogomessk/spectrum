-- =============================================================================
-- DEBUG: Understand the data structure
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- 1. Check how many users are in each school_members
SELECT 
  'School Members by School:' as info,
  school_id,
  COUNT(*) as user_count
FROM public.school_members
GROUP BY school_id
ORDER BY user_count DESC;

-- 2. Check users in instituicao_usuarios
SELECT 
  'Instituicao Usuarios Count:' as info,
  COUNT(*) as total,
  COUNT(DISTINCT instituicao_id) as institutions,
  COUNT(DISTINCT user_id) as users_with_id,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as users_without_id
FROM public.instituicao_usuarios;

-- 3. Check alunos status
SELECT 
  'Alunos Status:' as info,
  COUNT(*) as total_alunos,
  COUNT(school_id) as with_school_id,
  COUNT(CASE WHEN school_id IS NULL THEN 1 END) as without_school_id,
  COUNT(DISTINCT user_id) as creators_count
FROM public.alunos;

-- 4. Check if alunos creators are in instituicao_usuarios
SELECT 
  COUNT(*) as alunos_by_institutional_users
FROM public.alunos a
WHERE EXISTS (
  SELECT 1 FROM public.instituicao_usuarios iu
  WHERE iu.user_id = a.user_id
);

-- 5. Check a sample of alunos and their creators
SELECT 
  'Sample Alunos:' as info,
  a.id,
  a.nome,
  a.user_id as aluno_creator_id,
  a.school_id,
  iu.user_id as iu_user_id,
  iu.nome as iu_nome,
  iu.instituicao_id
FROM public.alunos a
LEFT JOIN public.instituicao_usuarios iu ON iu.user_id = a.user_id
LIMIT 10;

-- 6. Check which instituicao_usuarios are in school_members
SELECT 
  COUNT(*) as iu_in_school_members
FROM public.instituicao_usuarios iu
WHERE EXISTS (
  SELECT 1 FROM public.school_members sm
  WHERE sm.user_id = iu.user_id
);
