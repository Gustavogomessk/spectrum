-- =============================================================================
-- MIGRATION: Disable materiais sharing - only alunos should be shared
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- Remove materiais sharing policy - only owner can see their materiais
alter table public.materiais enable row level security;

drop policy if exists "materiais owner or school" on public.materiais;
create policy "materiais owner only" on public.materiais
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Materiais are personal to each user
comment on policy "materiais owner only" on public.materiais is 
'Materiais are visible only to the user who created them. Not shared between school members.';
