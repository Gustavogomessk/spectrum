-- Estruturas para remover dados fake do painel administrativo
-- Execute no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.admin_institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  plan text not null default 'Trial Institucional',
  user_limit int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  institution_id uuid references public.admin_institutions (id) on delete set null,
  full_name text not null,
  email text,
  password_hash text,
  role text not null default 'usuario',
  licenses int not null default 1,
  license_type text not null default 'Basic',
  account_type text not null default 'institution' check (account_type in ('trial', 'institution', 'personal')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid references auth.users (id) on delete set null,
  institution_id uuid references public.admin_institutions (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'alerta', 'aviso', 'sucesso')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.admin_institutions (id) on delete cascade,
  subadmin_user_id uuid references auth.users (id) on delete set null,
  reference text not null,
  amount numeric(12, 2) not null,
  payment_method text not null default 'pix',
  status text not null default 'pendente' check (status in ('pendente', 'confirmado', 'pago', 'cancelado')),
  qr_code_payload text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create table if not exists public.trial_usage (
  user_id uuid primary key references auth.users (id) on delete cascade,
  adaptacoes_usadas int not null default 0,
  perguntas_chat_usadas int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  provider text not null default 'cohere',
  model text,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  estimated_cost numeric(12, 6) not null default 0,
  request_kind text not null default 'chat',
  created_at timestamptz not null default now()
);

create table if not exists public.generated_pdfs (
  id uuid primary key default gen_random_uuid(),
  material_id uuid references public.materiais (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  pdf_url text not null,
  generated_at timestamptz not null default now()
);

create table if not exists public.admin_notification_reads (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.admin_notifications (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  read_at timestamptz not null default now(),
  unique(notification_id, user_id)
);

create index if not exists idx_admin_users_institution on public.admin_users (institution_id);
create index if not exists idx_admin_payments_institution on public.admin_payments (institution_id, created_at desc);
create index if not exists idx_admin_notifications_created_at on public.admin_notifications (created_at desc);
create index if not exists idx_ai_usage_logs_created_at on public.ai_usage_logs (created_at desc);
create index if not exists idx_generated_pdfs_user on public.generated_pdfs (user_id, generated_at desc);
create index if not exists idx_notification_reads_user on public.admin_notification_reads (user_id, read_at desc);

alter table public.admin_institutions enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_payments enable row level security;
alter table public.trial_usage enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.generated_pdfs enable row level security;
alter table public.admin_notification_reads enable row level security;

drop policy if exists "admin institutions authenticated read" on public.admin_institutions;
create policy "admin institutions authenticated read" on public.admin_institutions
for select using (auth.role() = 'authenticated');

drop policy if exists "admin institutions authenticated write" on public.admin_institutions;
create policy "admin institutions authenticated write" on public.admin_institutions
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin users authenticated read" on public.admin_users;
create policy "admin users authenticated read" on public.admin_users
for select using (auth.role() = 'authenticated');

drop policy if exists "admin users authenticated write" on public.admin_users;
create policy "admin users authenticated write" on public.admin_users
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin notifications authenticated read" on public.admin_notifications;
create policy "admin notifications authenticated read" on public.admin_notifications
for select using (auth.role() = 'authenticated');

drop policy if exists "admin notifications authenticated write" on public.admin_notifications;
create policy "admin notifications authenticated write" on public.admin_notifications
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "admin payments authenticated read" on public.admin_payments;
create policy "admin payments authenticated read" on public.admin_payments
for select using (auth.role() = 'authenticated');

drop policy if exists "admin payments authenticated write" on public.admin_payments;
create policy "admin payments authenticated write" on public.admin_payments
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "trial usage own access" on public.trial_usage;
create policy "trial usage own access" on public.trial_usage
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "ai usage authenticated read" on public.ai_usage_logs;
create policy "ai usage authenticated read" on public.ai_usage_logs
for select using (auth.role() = 'authenticated');

drop policy if exists "ai usage authenticated write" on public.ai_usage_logs;
create policy "ai usage authenticated write" on public.ai_usage_logs
for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "generated pdfs own access" on public.generated_pdfs;
create policy "generated pdfs own access" on public.generated_pdfs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notification reads own access" on public.admin_notification_reads;
create policy "notification reads own access" on public.admin_notification_reads
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
