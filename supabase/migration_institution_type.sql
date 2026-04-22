-- Migration: Adicionar campo institution_type à tabela admin_institutions
-- Permite categorizar instituições como Enterprise ou Pessoal

ALTER TABLE public.admin_institutions
ADD COLUMN IF NOT EXISTS institution_type text DEFAULT 'Pessoal' CHECK (institution_type IN ('Enterprise', 'Pessoal'));

-- Criar índice para melhor performance em filtros
CREATE INDEX IF NOT EXISTS idx_admin_institutions_type ON public.admin_institutions(institution_type);
