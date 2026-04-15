-- Se você já criou as tabelas sem matricula / pdf_* , execute no SQL Editor:

alter table public.alunos add column if not exists matricula text;

alter table public.materiais add column if not exists pdf_original_nome text;
alter table public.materiais add column if not exists pdf_adaptado_nome text;
