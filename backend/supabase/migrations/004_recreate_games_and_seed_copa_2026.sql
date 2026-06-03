-- Migration 004: Recria tabela games com schema correto + seed Copa do Mundo 2026
-- Necessário pois o schema anterior usava colunas opponent/location

-- =========================================
-- RECRIAR TABELA GAMES
-- =========================================

-- Remover tabela antiga (e dependentes via CASCADE)
DROP TABLE IF EXISTS public.bets CASCADE;
DROP TABLE IF EXISTS public.scoring_rules CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;

-- Recriar games com schema correto
CREATE TABLE public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID REFERENCES public.competitions(id),
    home_team TEXT NOT NULL,
    home_logo_url TEXT,
    away_team TEXT NOT NULL,
    away_logo_url TEXT,
    match_date TIMESTAMPTZ NOT NULL,
    stadium TEXT,
    is_knockout BOOLEAN DEFAULT false,
    score_multiplier NUMERIC DEFAULT 1,
    home_score INTEGER,
    away_score INTEGER,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'postponed', 'cancelled')),
    bets_locked BOOLEAN DEFAULT false,
    bets_unlock_until TIMESTAMPTZ,
    points_calculated BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_games_status ON public.games(status);
CREATE INDEX IF NOT EXISTS idx_games_match_date ON public.games(match_date);
CREATE INDEX IF NOT EXISTS idx_games_competition ON public.games(competition_id);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_read_all" ON public.games FOR SELECT USING (true);
CREATE POLICY "games_admin_write" ON public.games FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Recriar bets
CREATE TABLE public.bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    bet_type_id UUID NOT NULL REFERENCES public.bet_types(id),
    prediction JSONB NOT NULL,
    points_earned INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'correct', 'incorrect')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, game_id, bet_type_id)
);

CREATE INDEX IF NOT EXISTS idx_bets_user ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game ON public.bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON public.bets(status);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bets_select_own" ON public.bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bets_insert_own" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bets_update_own" ON public.bets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bets_delete_own" ON public.bets FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "bets_admin_all" ON public.bets FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Recriar scoring_rules
CREATE TABLE public.scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bet_type_id UUID NOT NULL REFERENCES public.bet_types(id),
    competition_id UUID REFERENCES public.competitions(id),
    game_id UUID REFERENCES public.games(id),
    points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scoring_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scoring_rules_read_all" ON public.scoring_rules FOR SELECT USING (true);
CREATE POLICY "scoring_rules_admin_write" ON public.scoring_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =========================================
-- COMPETIÇÃO
-- =========================================
INSERT INTO public.competitions (id, name, slug, year, score_multiplier, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Copa do Mundo 2026',
    'copa-mundo-2026',
    2026,
    1.00,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    year = EXCLUDED.year,
    is_active = EXCLUDED.is_active;

-- =========================================
-- FASE DE GRUPOS — Rodada 1
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Mexico',           'South Africa',          '2026-06-11 19:00:00Z', 'Mexico City Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Korea Republic',   'Czechia',               '2026-06-12 02:00:00Z', 'Guadalajara Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Canada',           'Bosnia and Herzegovina', '2026-06-12 19:00:00Z', 'Toronto Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'USA',              'Paraguay',              '2026-06-13 01:00:00Z', 'Los Angeles Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Qatar',            'Switzerland',           '2026-06-13 19:00:00Z', 'San Francisco Bay Area Stadium', false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Brazil',           'Morocco',               '2026-06-13 22:00:00Z', 'New York/New Jersey Stadium',    false, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Haiti',            'Scotland',              '2026-06-14 01:00:00Z', 'Boston Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Australia',        'Türkiye',               '2026-06-14 04:00:00Z', 'BC Place Vancouver',             false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Germany',          'Curaçao',               '2026-06-14 17:00:00Z', 'Houston Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Netherlands',      'Japan',                 '2026-06-14 20:00:00Z', 'Dallas Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Côte d''Ivoire',   'Ecuador',               '2026-06-14 23:00:00Z', 'Philadelphia Stadium',           false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'Sweden',           'Tunisia',               '2026-06-15 02:00:00Z', 'Monterrey Stadium',              false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'Spain',            'Cabo Verde',            '2026-06-15 16:00:00Z', 'Atlanta Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'Belgium',          'Egypt',                 '2026-06-15 19:00:00Z', 'Seattle Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'Saudi Arabia',     'Uruguay',               '2026-06-15 22:00:00Z', 'Miami Stadium',                  false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'IR Iran',          'New Zealand',           '2026-06-16 01:00:00Z', 'Los Angeles Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'France',           'Senegal',               '2026-06-16 19:00:00Z', 'New York/New Jersey Stadium',    false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'Iraq',             'Norway',                '2026-06-16 22:00:00Z', 'Boston Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000001', 'Argentina',        'Algeria',               '2026-06-17 01:00:00Z', 'Kansas City Stadium',            false, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000001', 'Austria',          'Jordan',                '2026-06-17 04:00:00Z', 'San Francisco Bay Area Stadium', false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000001', 'Portugal',         'Congo DR',              '2026-06-17 17:00:00Z', 'Houston Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000022', 'a0000000-0000-0000-0000-000000000001', 'England',          'Croatia',               '2026-06-17 20:00:00Z', 'Dallas Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000023', 'a0000000-0000-0000-0000-000000000001', 'Ghana',            'Panama',                '2026-06-17 23:00:00Z', 'Toronto Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000024', 'a0000000-0000-0000-0000-000000000001', 'Uzbekistan',       'Colombia',              '2026-06-18 02:00:00Z', 'Mexico City Stadium',            false, 1.0, 'scheduled');

-- =========================================
-- FASE DE GRUPOS — Rodada 2
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000025', 'a0000000-0000-0000-0000-000000000001', 'Czechia',               'South Africa',          '2026-06-18 16:00:00Z', 'Atlanta Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000026', 'a0000000-0000-0000-0000-000000000001', 'Switzerland',           'Bosnia and Herzegovina', '2026-06-18 19:00:00Z', 'Los Angeles Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000027', 'a0000000-0000-0000-0000-000000000001', 'Canada',                'Qatar',                 '2026-06-18 22:00:00Z', 'BC Place Vancouver',             false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000028', 'a0000000-0000-0000-0000-000000000001', 'Mexico',                'Korea Republic',         '2026-06-19 01:00:00Z', 'Guadalajara Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000029', 'a0000000-0000-0000-0000-000000000001', 'USA',                   'Australia',             '2026-06-19 19:00:00Z', 'Seattle Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000030', 'a0000000-0000-0000-0000-000000000001', 'Scotland',              'Morocco',               '2026-06-19 22:00:00Z', 'Boston Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000031', 'a0000000-0000-0000-0000-000000000001', 'Brazil',                'Haiti',                 '2026-06-20 01:00:00Z', 'Philadelphia Stadium',           false, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000032', 'a0000000-0000-0000-0000-000000000001', 'Türkiye',               'Paraguay',              '2026-06-20 04:00:00Z', 'San Francisco Bay Area Stadium', false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000033', 'a0000000-0000-0000-0000-000000000001', 'Netherlands',           'Sweden',                '2026-06-20 17:00:00Z', 'Houston Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000034', 'a0000000-0000-0000-0000-000000000001', 'Germany',               'Côte d''Ivoire',         '2026-06-20 20:00:00Z', 'Toronto Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000035', 'a0000000-0000-0000-0000-000000000001', 'Ecuador',               'Curaçao',               '2026-06-21 00:00:00Z', 'Kansas City Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000036', 'a0000000-0000-0000-0000-000000000001', 'Tunisia',               'Japan',                 '2026-06-21 04:00:00Z', 'Monterrey Stadium',              false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000037', 'a0000000-0000-0000-0000-000000000001', 'Spain',                 'Saudi Arabia',           '2026-06-21 16:00:00Z', 'Atlanta Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000038', 'a0000000-0000-0000-0000-000000000001', 'Belgium',               'IR Iran',               '2026-06-21 19:00:00Z', 'Los Angeles Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000039', 'a0000000-0000-0000-0000-000000000001', 'Uruguay',               'Cabo Verde',            '2026-06-21 22:00:00Z', 'Miami Stadium',                  false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000040', 'a0000000-0000-0000-0000-000000000001', 'New Zealand',           'Egypt',                 '2026-06-22 01:00:00Z', 'BC Place Vancouver',             false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000041', 'a0000000-0000-0000-0000-000000000001', 'Argentina',             'Austria',               '2026-06-22 17:00:00Z', 'Dallas Stadium',                 false, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000042', 'a0000000-0000-0000-0000-000000000001', 'France',                'Iraq',                  '2026-06-22 21:00:00Z', 'Philadelphia Stadium',           false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000043', 'a0000000-0000-0000-0000-000000000001', 'Norway',                'Senegal',               '2026-06-23 00:00:00Z', 'New York/New Jersey Stadium',    false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000044', 'a0000000-0000-0000-0000-000000000001', 'Jordan',                'Algeria',               '2026-06-23 03:00:00Z', 'San Francisco Bay Area Stadium', false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000045', 'a0000000-0000-0000-0000-000000000001', 'Portugal',              'Uzbekistan',            '2026-06-23 17:00:00Z', 'Houston Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000046', 'a0000000-0000-0000-0000-000000000001', 'England',               'Ghana',                 '2026-06-23 20:00:00Z', 'Boston Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000047', 'a0000000-0000-0000-0000-000000000001', 'Panama',                'Croatia',               '2026-06-23 23:00:00Z', 'Toronto Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000048', 'a0000000-0000-0000-0000-000000000001', 'Colombia',              'Congo DR',              '2026-06-24 02:00:00Z', 'Guadalajara Stadium',            false, 1.0, 'scheduled');

-- =========================================
-- FASE DE GRUPOS — Rodada 3
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000049', 'a0000000-0000-0000-0000-000000000001', 'Scotland',              'Brazil',                '2026-06-24 22:00:00Z', 'Miami Stadium',                  false, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000050', 'a0000000-0000-0000-0000-000000000001', 'Morocco',               'Haiti',                 '2026-06-24 22:00:00Z', 'Atlanta Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000051', 'a0000000-0000-0000-0000-000000000001', 'Switzerland',           'Canada',                '2026-06-24 19:00:00Z', 'BC Place Vancouver',             false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000052', 'a0000000-0000-0000-0000-000000000001', 'Bosnia and Herzegovina', 'Qatar',                '2026-06-24 19:00:00Z', 'Seattle Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000053', 'a0000000-0000-0000-0000-000000000001', 'Czechia',               'Mexico',                '2026-06-25 01:00:00Z', 'Mexico City Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000054', 'a0000000-0000-0000-0000-000000000001', 'South Africa',          'Korea Republic',         '2026-06-25 01:00:00Z', 'Monterrey Stadium',              false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000055', 'a0000000-0000-0000-0000-000000000001', 'Curaçao',               'Côte d''Ivoire',         '2026-06-25 20:00:00Z', 'Philadelphia Stadium',           false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000056', 'a0000000-0000-0000-0000-000000000001', 'Ecuador',               'Germany',               '2026-06-25 20:00:00Z', 'New York/New Jersey Stadium',    false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000057', 'a0000000-0000-0000-0000-000000000001', 'Japan',                 'Sweden',                '2026-06-25 23:00:00Z', 'Dallas Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000058', 'a0000000-0000-0000-0000-000000000001', 'Tunisia',               'Netherlands',           '2026-06-25 23:00:00Z', 'Kansas City Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000059', 'a0000000-0000-0000-0000-000000000001', 'Türkiye',               'USA',                   '2026-06-26 02:00:00Z', 'Los Angeles Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000060', 'a0000000-0000-0000-0000-000000000001', 'Paraguay',              'Australia',             '2026-06-26 02:00:00Z', 'San Francisco Bay Area Stadium', false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000061', 'a0000000-0000-0000-0000-000000000001', 'Norway',                'France',                '2026-06-26 19:00:00Z', 'Boston Stadium',                 false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000062', 'a0000000-0000-0000-0000-000000000001', 'Senegal',               'Iraq',                  '2026-06-26 19:00:00Z', 'Toronto Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000063', 'a0000000-0000-0000-0000-000000000001', 'Egypt',                 'IR Iran',               '2026-06-27 03:00:00Z', 'Seattle Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000064', 'a0000000-0000-0000-0000-000000000001', 'New Zealand',           'Belgium',               '2026-06-27 03:00:00Z', 'BC Place Vancouver',             false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000065', 'a0000000-0000-0000-0000-000000000001', 'Cabo Verde',            'Saudi Arabia',           '2026-06-27 00:00:00Z', 'Houston Stadium',                false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000066', 'a0000000-0000-0000-0000-000000000001', 'Uruguay',               'Spain',                 '2026-06-27 00:00:00Z', 'Guadalajara Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000067', 'a0000000-0000-0000-0000-000000000001', 'Panama',                'England',               '2026-06-27 21:00:00Z', 'New York/New Jersey Stadium',    false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000068', 'a0000000-0000-0000-0000-000000000001', 'Croatia',               'Ghana',                 '2026-06-27 21:00:00Z', 'Philadelphia Stadium',           false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000069', 'a0000000-0000-0000-0000-000000000001', 'Algeria',               'Austria',               '2026-06-28 02:00:00Z', 'Kansas City Stadium',            false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000070', 'a0000000-0000-0000-0000-000000000001', 'Jordan',                'Argentina',             '2026-06-28 02:00:00Z', 'Dallas Stadium',                 false, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000071', 'a0000000-0000-0000-0000-000000000001', 'Colombia',              'Portugal',              '2026-06-27 23:30:00Z', 'Miami Stadium',                  false, 1.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000072', 'a0000000-0000-0000-0000-000000000001', 'Congo DR',              'Uzbekistan',            '2026-06-27 23:30:00Z', 'Atlanta Stadium',                false, 1.0, 'scheduled');

-- =========================================
-- OITAVAS DE FINAL (Rodada 4)
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000073', 'a0000000-0000-0000-0000-000000000001', '2A',              '2B',              '2026-06-28 19:00:00Z', 'Los Angeles Stadium',            true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000074', 'a0000000-0000-0000-0000-000000000001', '1E',              '3ABCDF',          '2026-06-29 20:30:00Z', 'Boston Stadium',                 true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000075', 'a0000000-0000-0000-0000-000000000001', '1F',              '2C',              '2026-06-30 01:00:00Z', 'Monterrey Stadium',              true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000076', 'a0000000-0000-0000-0000-000000000001', '1C',              '2F',              '2026-06-29 17:00:00Z', 'Houston Stadium',                true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000077', 'a0000000-0000-0000-0000-000000000001', '1I',              '3CDFGH',          '2026-06-30 21:00:00Z', 'New York/New Jersey Stadium',    true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000078', 'a0000000-0000-0000-0000-000000000001', '2E',              '2I',              '2026-06-30 17:00:00Z', 'Dallas Stadium',                 true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000079', 'a0000000-0000-0000-0000-000000000001', '1A',              '3CEFHI',          '2026-07-01 01:00:00Z', 'Mexico City Stadium',            true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000080', 'a0000000-0000-0000-0000-000000000001', '1L',              '3EHIJK',          '2026-07-01 16:00:00Z', 'Atlanta Stadium',                true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000081', 'a0000000-0000-0000-0000-000000000001', '1D',              '3BEFIJ',          '2026-07-02 00:00:00Z', 'San Francisco Bay Area Stadium', true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000082', 'a0000000-0000-0000-0000-000000000001', '1G',              '3AEHIJ',          '2026-07-01 20:00:00Z', 'Seattle Stadium',                true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000083', 'a0000000-0000-0000-0000-000000000001', '2K',              '2L',              '2026-07-02 23:00:00Z', 'Toronto Stadium',                true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000084', 'a0000000-0000-0000-0000-000000000001', '1H',              '2J',              '2026-07-02 19:00:00Z', 'Los Angeles Stadium',            true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000085', 'a0000000-0000-0000-0000-000000000001', '1B',              '3EFGIJ',          '2026-07-03 03:00:00Z', 'BC Place Vancouver',             true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000086', 'a0000000-0000-0000-0000-000000000001', '1J',              '2H',              '2026-07-03 22:00:00Z', 'Miami Stadium',                  true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000087', 'a0000000-0000-0000-0000-000000000001', '1K',              '3DEIJL',          '2026-07-04 01:30:00Z', 'Kansas City Stadium',            true, 1.5, 'scheduled'),
('c0000000-0000-0000-0000-000000000088', 'a0000000-0000-0000-0000-000000000001', '2D',              '2G',              '2026-07-03 18:00:00Z', 'Dallas Stadium',                 true, 1.5, 'scheduled');

-- =========================================
-- QUARTAS DE FINAL (Rodada 5)
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000089', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-04 21:00:00Z', 'Philadelphia Stadium',           true, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000090', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-04 17:00:00Z', 'Houston Stadium',                true, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000091', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-05 20:00:00Z', 'New York/New Jersey Stadium',    true, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000092', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-06 00:00:00Z', 'Mexico City Stadium',            true, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000093', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-06 19:00:00Z', 'Dallas Stadium',                 true, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000094', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-07 00:00:00Z', 'Seattle Stadium',                true, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000095', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-07 16:00:00Z', 'Atlanta Stadium',                true, 2.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000096', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-07 20:00:00Z', 'BC Place Vancouver',             true, 2.0, 'scheduled');

-- =========================================
-- SEMIFINAIS (Rodada 6)
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000097', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-09 20:00:00Z', 'Boston Stadium',                 true, 3.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000098', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-10 19:00:00Z', 'Los Angeles Stadium',            true, 3.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-11 21:00:00Z', 'Miami Stadium',                  true, 3.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000100', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-12 01:00:00Z', 'Kansas City Stadium',            true, 3.0, 'scheduled');

-- =========================================
-- TERCEIRO LUGAR (Rodada 7)
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000101', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-14 19:00:00Z', 'Dallas Stadium',                 true, 3.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000102', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-15 19:00:00Z', 'Atlanta Stadium',                true, 3.0, 'scheduled');

-- =========================================
-- FINAL (Rodada 8)
-- =========================================
INSERT INTO public.games (id, competition_id, home_team, away_team, match_date, stadium, is_knockout, score_multiplier, status) VALUES
('c0000000-0000-0000-0000-000000000103', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-18 21:00:00Z', 'Miami Stadium',                  true, 5.0, 'scheduled'),
('c0000000-0000-0000-0000-000000000104', 'a0000000-0000-0000-0000-000000000001', 'A ser definido', 'A ser definido', '2026-07-19 19:00:00Z', 'New York/New Jersey Stadium',    true, 5.0, 'scheduled');
