-- =============================================================================
-- MIGRATION: Ensure alunos sharing policy is correctly set up
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- Verify RLS is enabled on alunos
alter table public.alunos enable row level security;

-- Ensure policy exists for sharing alunos between school members
drop policy if exists "alunos owner or school" on public.alunos;
create policy "alunos owner or school" on public.alunos
  for all
  using (auth.uid() = user_id or (school_id is not null and public.is_school_member(school_id)))
  with check (auth.uid() = user_id and (school_id is null or public.is_school_member(school_id)));

-- Verify the is_school_member function exists
create or replace function public.is_school_member(sid uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.school_members m
    where m.school_id = sid and m.user_id = auth.uid()
  );
$$;

-- Grant execute permission to authenticated users
grant execute on function public.is_school_member(uuid) to authenticated;

-- Comment for clarity
comment on policy "alunos owner or school" on public.alunos is 
'Alunos are visible to: (1) the owner who created them, or (2) any member of the associated school';
