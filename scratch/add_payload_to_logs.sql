-- Adiciona a coluna payload para armazenar detalhes das alterações no formato JSON
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS payload JSONB;
