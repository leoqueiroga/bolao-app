-- Migration 005: Corrigir permissões das tabelas
-- O service_role e authenticated precisam de GRANT para acessar as tabelas

-- Grants para service_role (admin backend) — acesso total
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.competitions TO service_role;
GRANT ALL ON public.games TO service_role;
GRANT ALL ON public.bets TO service_role;
GRANT ALL ON public.bet_types TO service_role;
GRANT ALL ON public.scoring_rules TO service_role;
GRANT ALL ON public.ranking_snapshots TO service_role;

-- Grants para authenticated (usuários logados) — acesso controlado por RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.competitions TO authenticated;
GRANT SELECT ON public.games TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bets TO authenticated;
GRANT SELECT ON public.bet_types TO authenticated;
GRANT SELECT ON public.scoring_rules TO authenticated;
GRANT SELECT ON public.ranking_snapshots TO authenticated;

-- Grants para anon (leitura pública mínima)
GRANT SELECT ON public.competitions TO anon;
GRANT SELECT ON public.games TO anon;
GRANT SELECT ON public.bet_types TO anon;
GRANT SELECT ON public.ranking_snapshots TO anon;
