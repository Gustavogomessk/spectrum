-- =============================================================================
-- MIGRATION: Fix backend-managed tables RLS
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================
-- Problem: Triggers try to INSERT into schools and institution_school_mapping
-- but RLS blocks them because there are no INSERT policies.
-- Solution: Disable RLS on backend-managed tables (managed only by triggers/admin)

-- Disable RLS on backend-managed tables
-- (these are not accessed directly by users, only by triggers and backend)
alter table public.schools disable row level security;
alter table public.institution_school_mapping disable row level security;
alter table public.school_settings disable row level security;

-- Keep RLS enabled for user-facing tables (they have proper policies)
-- - school_members (has admin manage policies)
-- - profiles (has owner policies)  
-- - alunos, materiais, chat_conversations, chat_messages, files (have owner/school policies)
