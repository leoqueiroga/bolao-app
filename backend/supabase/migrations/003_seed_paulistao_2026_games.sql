-- Seed dos jogos do Palmeiras no Campeonato Paulista 2026
-- Baseado em: https://ge.globo.com/sp/futebol/campeonato-paulista/noticia/2025/11/27/paulistao-2026-fpf-divulga-tabela-veja-datas-e-jogos-da-primeira-fase.ghtml

-- Criar competição
INSERT INTO public.competitions (id, name, slug, year, score_multiplier, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Campeonato Paulista',
    'paulistao-2026',
    2026,
    1.00,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    year = EXCLUDED.year,
    is_active = EXCLUDED.is_active;

-- Rodada 1 - Portuguesa x Palmeiras (Fora) — já finalizado
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Portuguesa',
    'Palmeiras',
    '2026-01-11 16:00:00-03:00',
    'Estádio do Canindé',
    false, 1.00, 'finished'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 2 - Palmeiras x Santos — Clássico da Saudade
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Palmeiras',
    'Santos',
    '2026-01-14 21:35:00-03:00',
    'Arena Barueri',
    false, 1.50, 'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 3 - Palmeiras x Mirassol
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Palmeiras',
    'Mirassol',
    '2026-01-18 18:30:00-03:00',
    'Arena Barueri',
    false, 1.00, 'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 4 - Novorizontino x Palmeiras
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Novorizontino',
    'Palmeiras',
    '2026-01-21 19:30:00-03:00',
    'Estádio Jorge Ismael de Biasi',
    false, 1.00, 'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 5 - Palmeiras x São Paulo — Choque-Rei (Aniversário de SP)
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'Palmeiras',
    'São Paulo',
    '2026-01-25 18:30:00-03:00',
    'Allianz Parque',
    false, 2.00, 'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 6 - Botafogo-SP x Palmeiras
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'Botafogo-SP',
    'Palmeiras',
    '2026-02-01 16:00:00-03:00',
    'Estádio Santa Cruz',
    false, 1.00, 'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 7 - Corinthians x Palmeiras — DERBY
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'Corinthians',
    'Palmeiras',
    '2026-02-08 18:30:00-03:00',
    'Neo Química Arena',
    false, 2.50, 'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 8 - Palmeiras x Guarani
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status)
VALUES (
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'Palmeiras',
    'Guarani',
    '2026-02-15 18:30:00-03:00',
    'Allianz Parque',
    false, 1.00, 'scheduled'
) ON CONFLICT (id) DO NOTHING;
