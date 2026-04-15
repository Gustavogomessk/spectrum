-- Execute no SQL Editor do Supabase (projeto → SQL → New query).
-- Pode rodar de novo: políticas são recriadas com segurança.

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

alter table public.alunos enable row level security;
alter table public.materiais enable row level security;

drop policy if exists "alunos do usuário" on public.alunos;
create policy "alunos do usuário" on public.alunos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "materiais do usuário" on public.materiais;
create policy "materiais do usuário" on public.materiais
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
