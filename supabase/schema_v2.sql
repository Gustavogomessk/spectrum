-- =============================================================================
-- NEUROINCLUDE — SCHEMA V2 (escolas, papéis, chatbot, arquivos)
-- Execute no Supabase: SQL Editor → New query → Run
-- Bucket esperado no Storage: uploads-files
-- =============================================================================

-- Extensions
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Schools / Membership / Settings
-- -----------------------------------------------------------------------------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.school_settings (
  school_id uuid primary key references public.schools (id) on delete cascade,
  allow_users_change_password boolean not null default true,
  created_at timestamptz not null default now()
);

-- Roles inside a school
do $$
begin
  if not exists (select 1 from pg_type where typname = 'school_role') then
    create type public.school_role as enum ('admin', 'secretaria', 'psicopedagogo', 'professor');
  end if;
end $$;

create table if not exists public.school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.school_role not null,
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

-- -----------------------------------------------------------------------------
-- User profile (CPF + trial)
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_type') then
    create type public.account_type as enum ('trial', 'institution');
  end if;
end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  cpf text,
  account_type public.account_type not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_cpf_idx on public.profiles (cpf);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Existing tables: alunos / materiais (kept; add school_id + created_by)
-- -----------------------------------------------------------------------------
create table if not exists public.alunos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  matricula text,
  nome text not null,
  nascimento date,
  diagnostico text not null,
  observacoes text,
  laudo_url text,
  materiais_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  aluno_id uuid references public.alunos (id) on delete set null,
  nome text not null,
  perfil text,
  pdf_original_nome text,
  pdf_adaptado_nome text,
  conteudo_html text,
  created_at timestamptz not null default now()
);

alter table public.alunos add column if not exists school_id uuid references public.schools (id) on delete set null;
alter table public.materiais add column if not exists school_id uuid references public.schools (id) on delete set null;

-- -----------------------------------------------------------------------------
-- Trial limit: max 5 materiais per user when account_type='trial'
-- -----------------------------------------------------------------------------
create or replace function public.enforce_trial_material_limit()
returns trigger
language plpgsql
as $$
declare
  t public.account_type;
  cnt int;
begin
  select account_type into t from public.profiles where user_id = auth.uid();
  if t = 'trial' then
    select count(*) into cnt from public.materiais where user_id = auth.uid();
    if cnt >= 5 then
      raise exception 'trial_limit_reached';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_trial_material_limit on public.materiais;
create trigger trg_trial_material_limit
before insert on public.materiais
for each row execute function public.enforce_trial_material_limit();

-- -----------------------------------------------------------------------------
-- Chat: conversations + messages (Markdown content)
-- -----------------------------------------------------------------------------
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Nova conversa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_chat_conversations_updated_at on public.chat_conversations;
create trigger trg_chat_conversations_updated_at
before update on public.chat_conversations
for each row execute function public.set_updated_at();

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations (id) on delete cascade,
  school_id uuid references public.schools (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content_markdown text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_idx on public.chat_messages (conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- Files metadata (Storage bucket: uploads-files)
-- -----------------------------------------------------------------------------
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references public.schools (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  filename text not null,
  storage_path text not null,
  public_url text,
  created_at timestamptz not null default now()
);

create index if not exists files_school_idx on public.files (school_id, created_at desc);
create index if not exists files_user_idx on public.files (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.schools enable row level security;
alter table public.school_settings enable row level security;
alter table public.school_members enable row level security;
alter table public.profiles enable row level security;
alter table public.alunos enable row level security;
alter table public.materiais enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.files enable row level security;

-- Public schools list (for login selection)
drop policy if exists "schools public read" on public.schools;
create policy "schools public read" on public.schools
  for select using (is_public = true);

-- Profiles: owner read/write
drop policy if exists "profiles owner" on public.profiles;
create policy "profiles owner" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Membership: user can read their memberships
drop policy if exists "memberships owner read" on public.school_members;
create policy "memberships owner read" on public.school_members
  for select using (auth.uid() = user_id);

-- Membership: admins can manage membership of their school
create or replace function public.is_school_admin(sid uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.school_members m
    where m.school_id = sid and m.user_id = auth.uid() and m.role = 'admin'
  );
$$;

drop policy if exists "memberships admin manage" on public.school_members;
create policy "memberships admin manage" on public.school_members
  for all using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));

-- School settings: admins manage; members read
create or replace function public.is_school_member(sid uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.school_members m
    where m.school_id = sid and m.user_id = auth.uid()
  );
$$;

drop policy if exists "school_settings member read" on public.school_settings;
create policy "school_settings member read" on public.school_settings
  for select using (public.is_school_member(school_id) or public.is_school_admin(school_id));

drop policy if exists "school_settings admin manage" on public.school_settings;
create policy "school_settings admin manage" on public.school_settings
  for all using (public.is_school_admin(school_id)) with check (public.is_school_admin(school_id));

-- Alunos/materiais: owner OR same-school member (so equipe escolar consegue trabalhar)
drop policy if exists "alunos owner or school" on public.alunos;
create policy "alunos owner or school" on public.alunos
  for all
  using (auth.uid() = user_id or (school_id is not null and public.is_school_member(school_id)))
  with check (auth.uid() = user_id and (school_id is null or public.is_school_member(school_id)));

drop policy if exists "materiais owner or school" on public.materiais;
create policy "materiais owner or school" on public.materiais
  for all
  using (auth.uid() = user_id or (school_id is not null and public.is_school_member(school_id)))
  with check (auth.uid() = user_id and (school_id is null or public.is_school_member(school_id)));

-- Chat: only owner (or member of same school if school_id is set)
drop policy if exists "chat_conversations owner or school" on public.chat_conversations;
create policy "chat_conversations owner or school" on public.chat_conversations
  for all
  using (auth.uid() = user_id or (school_id is not null and public.is_school_member(school_id)))
  with check (auth.uid() = user_id and (school_id is null or public.is_school_member(school_id)));

drop policy if exists "chat_messages owner or school" on public.chat_messages;
create policy "chat_messages owner or school" on public.chat_messages
  for all
  using (auth.uid() = user_id or (school_id is not null and public.is_school_member(school_id)))
  with check (auth.uid() = user_id and (school_id is null or public.is_school_member(school_id)));

-- Files metadata: owner OR same school member
drop policy if exists "files owner or school" on public.files;
create policy "files owner or school" on public.files
  for all
  using (auth.uid() = user_id or (school_id is not null and public.is_school_member(school_id)))
  with check (auth.uid() = user_id and (school_id is null or public.is_school_member(school_id)));

