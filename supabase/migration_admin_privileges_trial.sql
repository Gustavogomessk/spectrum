-- Admin global + admin instituição + limite trial

create table if not exists public.instituicoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text not null unique,
  plano text,
  created_at timestamptz not null default now()
);

create table if not exists public.instituicao_usuarios (
  id uuid primary key default gen_random_uuid(),
  instituicao_id uuid not null references public.instituicoes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  papel text not null check (papel in ('subadmin','secretaria','psicopedagogo','professor')),
  licencas int not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.instituicao_boletos (
  id uuid primary key default gen_random_uuid(),
  instituicao_id uuid not null references public.instituicoes(id) on delete cascade,
  referencia text not null,
  valor numeric(10,2) not null,
  status text not null check (status in ('pago','pendente')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notificacoes (
  id uuid primary key default gen_random_uuid(),
  instituicao_id uuid references public.instituicoes(id) on delete cascade,
  mensagem text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.user_trial_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  adaptacoes_usadas int not null default 0,
  perguntas_chat_usadas int not null default 0,
  updated_at timestamptz not null default now()
);

