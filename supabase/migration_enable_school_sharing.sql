-- =============================================================================
-- MIGRATION: Ensure professors can view students from their school
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- 1. Verify RLS is enabled on critical tables
alter table public.alunos enable row level security;
alter table public.materiais enable row level security;
alter table public.school_members enable row level security;

-- 2. Ensure school_members policy allows reading
drop policy if exists "memberships owner read" on public.school_members;
create policy "memberships owner read" on public.school_members
  for select using (auth.uid() = user_id);

-- 3. Ensure is_school_member function exists and works
create or replace function public.is_school_member(sid uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.school_members m
    where m.school_id = sid and m.user_id = auth.uid()
  );
$$;

-- 4. Verify alunos policy allows school members to read
drop policy if exists "alunos owner or school" on public.alunos;
create policy "alunos owner or school" on public.alunos
  for all
  using (
    auth.uid() = user_id 
    or (school_id is not null and public.is_school_member(school_id))
  )
  with check (
    auth.uid() = user_id 
    and (school_id is null or public.is_school_member(school_id))
  );

-- 5. Verify materiais policy allows school members to read
drop policy if exists "materiais owner or school" on public.materiais;
create policy "materiais owner or school" on public.materiais
  for all
  using (
    auth.uid() = user_id 
    or (school_id is not null and public.is_school_member(school_id))
  )
  with check (
    auth.uid() = user_id 
    and (school_id is null or public.is_school_member(school_id))
  );

-- 6. Create index on school_id for performance
create index if not exists alunos_school_id_idx on public.alunos(school_id);
create index if not exists materiais_school_id_idx on public.materiais(school_id);
create index if not exists school_members_school_id_idx on public.school_members(school_id);
create index if not exists school_members_user_id_idx on public.school_members(user_id);
