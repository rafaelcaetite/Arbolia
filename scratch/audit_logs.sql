-- Criação da tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE
    entity TEXT NOT NULL, -- Tree, Client, Service
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- Apenas admin pode ver todos os logs
CREATE POLICY "Admins podem ver todos os logs" 
ON public.audit_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Qualquer usuário autenticado (ou melhor, role no perfil) pode inserir um log
CREATE POLICY "Qualquer usuário pode inserir logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Para garantir que possamos inserir de forma simplificada caso o auth.uid não esteja totalmente amarrado na API (se estiver, a policy acima resolve)
-- Se precisar que usuários anon/bypass insiram:
-- CREATE POLICY "Insert freely" ON public.audit_logs FOR INSERT WITH CHECK (true);
