-- =============================================================================
-- FIX: Limpar e corrigir políticas RLS para DELETE em admin_users
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- PASSO 1: Remover TODAS as políticas antigas
drop policy if exists "admin users authenticated write" on public.admin_users;
drop policy if exists "admin users authenticated insert" on public.admin_users;
drop policy if exists "admin users authenticated update" on public.admin_users;
drop policy if exists "admin users authenticated delete" on public.admin_users;
drop policy if exists "admin users authenticated read" on public.admin_users;

-- PASSO 2: Criar políticas novas separadas
-- SELECT - ler registros
create policy "admin users authenticated read" on public.admin_users
for select using (auth.role() = 'authenticated');

-- INSERT - inserir registros
create policy "admin users authenticated insert" on public.admin_users
for insert with check (auth.role() = 'authenticated');

-- UPDATE - atualizar registros
create policy "admin users authenticated update" on public.admin_users
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- DELETE - deletar registros (sem WITH CHECK!)
create policy "admin users authenticated delete" on public.admin_users
for delete using (auth.role() = 'authenticated');

-- PASSO 3: Fazer o mesmo para admin_institutions
drop policy if exists "admin institutions authenticated write" on public.admin_institutions;
drop policy if exists "admin institutions authenticated insert" on public.admin_institutions;
drop policy if exists "admin institutions authenticated update" on public.admin_institutions;
drop policy if exists "admin institutions authenticated delete" on public.admin_institutions;
drop policy if exists "admin institutions authenticated read" on public.admin_institutions;

create policy "admin institutions authenticated read" on public.admin_institutions
for select using (auth.role() = 'authenticated');

create policy "admin institutions authenticated insert" on public.admin_institutions
for insert with check (auth.role() = 'authenticated');

create policy "admin institutions authenticated update" on public.admin_institutions
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin institutions authenticated delete" on public.admin_institutions
for delete using (auth.role() = 'authenticated');

-- PASSO 4: Fazer o mesmo para admin_payments
drop policy if exists "admin payments authenticated write" on public.admin_payments;
drop policy if exists "admin payments authenticated insert" on public.admin_payments;
drop policy if exists "admin payments authenticated update" on public.admin_payments;
drop policy if exists "admin payments authenticated delete" on public.admin_payments;
drop policy if exists "admin payments authenticated read" on public.admin_payments;

create policy "admin payments authenticated read" on public.admin_payments
for select using (auth.role() = 'authenticated');

create policy "admin payments authenticated insert" on public.admin_payments
for insert with check (auth.role() = 'authenticated');

create policy "admin payments authenticated update" on public.admin_payments
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin payments authenticated delete" on public.admin_payments
for delete using (auth.role() = 'authenticated');
