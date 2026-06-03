-- Migration: Schema inicial do Bolão Copa do Mundo
-- Criação de todas as tabelas do zero

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    total_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_total_points ON public.profiles(total_points DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trigger: sync com auth.users no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- COMPETITIONS
-- =========================================
CREATE TABLE IF NOT EXISTS public.competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    year INTEGER NOT NULL,
    score_multiplier NUMERIC DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitions_read_all" ON public.competitions FOR SELECT USING (true);
CREATE POLICY "competitions_admin_write" ON public.competitions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =========================================
-- GAMES
-- =========================================
CREATE TABLE IF NOT EXISTS public.games (
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

-- =========================================
-- BET TYPES
-- =========================================
CREATE TABLE IF NOT EXISTS public.bet_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('exact_score', 'result')),
    description TEXT,
    default_points INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bet_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bet_types_read_all" ON public.bet_types FOR SELECT USING (true);
CREATE POLICY "bet_types_admin_write" ON public.bet_types FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Inserir tipos padrão
INSERT INTO public.bet_types (name, slug, type, description, default_points, is_active)
VALUES
    ('Placar Exato', 'placar-exato', 'exact_score', 'Acerte o placar exato do jogo', 20, true),
    ('Resultado', 'resultado', 'result', 'Acerte o resultado: vitória do time da casa, empate ou vitória do visitante', 10, true)
ON CONFLICT (slug) DO NOTHING;

-- =========================================
-- BETS
-- =========================================
CREATE TABLE IF NOT EXISTS public.bets (
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

-- =========================================
-- SCORING RULES (opcional — sobrescreve pontos por jogo/competição)
-- =========================================
CREATE TABLE IF NOT EXISTS public.scoring_rules (
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
-- RANKING SNAPSHOTS
-- =========================================
CREATE TABLE IF NOT EXISTS public.ranking_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    correct_bets INTEGER DEFAULT 0,
    accuracy NUMERIC DEFAULT 0,
    year INTEGER NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ranking_read_all" ON public.ranking_snapshots FOR SELECT USING (true);
