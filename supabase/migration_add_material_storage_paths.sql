-- Adiciona paths no Storage para visualizar original/adaptado
alter table public.materiais add column if not exists pdf_original_path text;
alter table public.materiais add column if not exists pdf_adaptado_path text;

