-- =============================================================================
-- MIGRATION: Ensure files table has correct RLS policy
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- Enable RLS on files table
alter table public.files enable row level security;

-- Files are only visible to the owner (not shared between school members)
drop policy if exists "files owner only" on public.files;
create policy "files owner only" on public.files
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on policy "files owner only" on public.files is 
'Files are only visible to the user who uploaded them. Not shared between school members.';
