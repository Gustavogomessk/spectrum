-- =============================================================================
-- FIX: Adicionar política específica para DELETE em admin_users
-- Execute no Supabase: SQL Editor → New query → Run
-- =============================================================================

-- Remover a política genérica de write que causa problema com DELETE
drop policy if exists "admin users authenticated write" on public.admin_users;

-- Criar políticas específicas para cada operação
-- Para INSERT e UPDATE: usar a política antiga com with check
create policy "admin users authenticated insert_update" on public.admin_users
for insert with check (auth.role() = 'authenticated');

create policy "admin users authenticated update" on public.admin_users
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Para DELETE: usar apenas USING (sem WITH CHECK) para não bloquear silenciosamente
create policy "admin users authenticated delete" on public.admin_users
for delete using (auth.role() = 'authenticated');

-- Fazer o mesmo para admin_institutions se necessário
drop policy if exists "admin institutions authenticated write" on public.admin_institutions;

create policy "admin institutions authenticated insert_update" on public.admin_institutions
for insert with check (auth.role() = 'authenticated');

create policy "admin institutions authenticated update" on public.admin_institutions
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin institutions authenticated delete" on public.admin_institutions
for delete using (auth.role() = 'authenticated');

-- Fazer o mesmo para admin_payments se necessário
drop policy if exists "admin payments authenticated write" on public.admin_payments;

create policy "admin payments authenticated insert_update" on public.admin_payments
for insert with check (auth.role() = 'authenticated');

create policy "admin payments authenticated update" on public.admin_payments
for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "admin payments authenticated delete" on public.admin_payments
for delete using (auth.role() = 'authenticated');
