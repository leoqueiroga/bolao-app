-- Seed dos jogos do Palmeiras no Campeonato Paulista 2026
-- Baseado em: https://ge.globo.com/sp/futebol/campeonato-paulista/noticia/2025/11/27/paulistao-2026-fpf-divulga-tabela-veja-datas-e-jogos-da-primeira-fase.ghtml
-- Atualizado em: 14/01/2026

-- Primeiro, criar a competição Campeonato Paulista 2026 (se não existir)
INSERT INTO competitions (id, name, slug, year, score_multiplier, is_active)
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

-- Inserir jogos do Palmeiras na primeira fase do Paulistão 2026
-- Usando a variável da competição criada acima

-- Rodada 1 - 11 de janeiro de 2026 (Domingo)
-- Portuguesa x Palmeiras (Fora)
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Portuguesa',
    '2026-01-11 16:00:00-03:00',
    'away',
    'Estádio do Canindé',
    false,
    false,
    1.00,
    'finished'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 2 - 14 de janeiro de 2026 (Quarta-feira)
-- Palmeiras x Santos (Casa) - Clássico da Saudade
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Santos',
    '2026-01-14 21:35:00-03:00',
    'home',
    'Arena Barueri',
    true,
    false,
    1.50,
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 3 - 18 de janeiro de 2026 (Domingo)
-- Palmeiras x Mirassol (Casa)
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Mirassol',
    '2026-01-18 18:30:00-03:00',
    'home',
    'Arena Barueri',
    false,
    false,
    1.00,
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 4 - 21 de janeiro de 2026 (Quarta-feira)
-- Novorizontino x Palmeiras (Fora)
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Novorizontino',
    '2026-01-21 19:30:00-03:00',
    'away',
    'Estádio Jorge Ismael de Biasi',
    false,
    false,
    1.00,
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 5 - 25 de janeiro de 2026 (Domingo - Aniversário de SP)
-- Palmeiras x São Paulo (Casa) - Choque-Rei!
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'São Paulo',
    '2026-01-25 18:30:00-03:00',
    'home',
    'Allianz Parque',
    true,
    false,
    2.00,
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 6 - 1º de fevereiro de 2026 (Domingo)
-- Botafogo-SP x Palmeiras (Fora)
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'Botafogo-SP',
    '2026-02-01 16:00:00-03:00',
    'away',
    'Estádio Santa Cruz',
    false,
    false,
    1.00,
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 7 - 8 de fevereiro de 2026 (Domingo)
-- Corinthians x Palmeiras (Fora) - DERBY!!!
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000001',
    'Corinthians',
    '2026-02-08 18:30:00-03:00',
    'away',
    'Neo Química Arena',
    true,
    false,
    2.50,
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Rodada 8 - 15 de fevereiro de 2026 (Domingo)
-- Palmeiras x Guarani (Casa)
INSERT INTO games (
    id,
    competition_id,
    opponent,
    match_date,
    location,
    stadium,
    is_classic,
    is_knockout,
    score_multiplier,
    status
) VALUES (
    'b0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000001',
    'Guarani',
    '2026-02-15 18:30:00-03:00',
    'home',
    'Allianz Parque',
    false,
    false,
    1.00,
    'scheduled'
) ON CONFLICT (id) DO NOTHING;

-- Criar índice para busca por competição (se não existir)
CREATE INDEX IF NOT EXISTS idx_games_competition_id ON games(competition_id);

-- Criar índice para busca por status (se não existir)
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);

-- Criar índice para busca por data (se não existir)
CREATE INDEX IF NOT EXISTS idx_games_match_date ON games(match_date);
