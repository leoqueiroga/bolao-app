-- Supabase Database Schema for Fronteira Alvi-Verde
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitions table
CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    year INTEGER NOT NULL,
    score_multiplier DECIMAL(4,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    shirt_number INTEGER NOT NULL,
    position VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competition_id UUID REFERENCES competitions(id) ON DELETE SET NULL,
    opponent VARCHAR(255) NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(10) CHECK (location IN ('home', 'away')) NOT NULL,
    stadium VARCHAR(255),
    is_classic BOOLEAN DEFAULT false,
    is_knockout BOOLEAN DEFAULT false,
    score_multiplier DECIMAL(4,2) DEFAULT 1.00,
    palmeiras_score INTEGER,
    opponent_score INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'finished', 'postponed', 'cancelled')),
    bets_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Bet Types table
CREATE TABLE IF NOT EXISTS bet_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('exact_score', 'result', 'first_goal', 'player_goal')),
    default_points INTEGER DEFAULT 10,
    is_aggregable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    options JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    bet_type_id UUID REFERENCES bet_types(id) ON DELETE CASCADE NOT NULL,
    prediction JSONB NOT NULL,
    points_earned INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'correct', 'incorrect')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, game_id, bet_type_id)
);

-- Game Events table
CREATE TABLE IF NOT EXISTS game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    player_id UUID REFERENCES players(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('goal', 'first_goal', 'assist', 'yellow_card', 'red_card')),
    minute INTEGER NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scoring Rules table
CREATE TABLE IF NOT EXISTS scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bet_type_id UUID REFERENCES bet_types(id) ON DELETE CASCADE NOT NULL,
    competition_id UUID REFERENCES competitions(id) ON DELETE CASCADE,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    requirements JSONB NOT NULL,
    experience_reward INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- Ranking Snapshots table
CREATE TABLE IF NOT EXISTS ranking_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    position INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    total_bets INTEGER DEFAULT 0,
    correct_bets INTEGER DEFAULT 0,
    accuracy DECIMAL(5,2) DEFAULT 0,
    year INTEGER NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_games_competition_id ON games(competition_id);
CREATE INDEX IF NOT EXISTS idx_games_match_date ON games(match_date);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_game_id ON bets(game_id);
CREATE INDEX IF NOT EXISTS idx_bets_status ON bets(status);
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_user_id ON ranking_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_ranking_snapshots_snapshot_date ON ranking_snapshots(snapshot_date);

-- Function to handle new user registration (supports email, Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'preferred_username',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to add experience points
CREATE OR REPLACE FUNCTION public.add_experience(p_user_id UUID, p_amount INTEGER)
RETURNS void AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_required_xp INTEGER;
BEGIN
    SELECT experience_points, level INTO v_current_xp, v_current_level
    FROM profiles
    WHERE id = p_user_id;

    v_current_xp := v_current_xp + p_amount;

    -- Check for level up
    v_required_xp := v_current_level * 100;
    WHILE v_current_xp >= v_required_xp LOOP
        v_current_level := v_current_level + 1;
        v_required_xp := v_current_level * 100;
    END LOOP;

    UPDATE profiles
    SET experience_points = v_current_xp, level = v_current_level, updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_snapshots ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Competitions policies (public read)
CREATE POLICY "Anyone can view competitions" ON competitions FOR SELECT USING (true);
CREATE POLICY "Admins can manage competitions" ON competitions FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Players policies (public read)
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Admins can manage players" ON players FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Games policies (public read)
CREATE POLICY "Anyone can view games" ON games FOR SELECT USING (true);
CREATE POLICY "Admins can manage games" ON games FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bet Types policies (public read)
CREATE POLICY "Anyone can view bet types" ON bet_types FOR SELECT USING (true);
CREATE POLICY "Admins can manage bet types" ON bet_types FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Bets policies
CREATE POLICY "Users can view own bets" ON bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bets" ON bets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bets" ON bets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bets" ON bets FOR DELETE USING (auth.uid() = user_id);

-- Game Events policies (public read)
CREATE POLICY "Anyone can view game events" ON game_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage game events" ON game_events FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Scoring Rules policies (public read)
CREATE POLICY "Anyone can view scoring rules" ON scoring_rules FOR SELECT USING (true);
CREATE POLICY "Admins can manage scoring rules" ON scoring_rules FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Achievements policies (public read)
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON achievements FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- User Achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage user achievements" ON user_achievements FOR ALL USING (true);

-- Ranking Snapshots policies
CREATE POLICY "Anyone can view ranking snapshots" ON ranking_snapshots FOR SELECT USING (true);
CREATE POLICY "System can manage ranking snapshots" ON ranking_snapshots FOR ALL USING (true);

-- Insert default bet types
INSERT INTO bet_types (name, slug, description, type, default_points, is_aggregable, is_active) VALUES
('Placar Exato', 'placar-exato', 'Acerte o placar exato do jogo', 'exact_score', 30, false, true),
('Resultado', 'resultado', 'Acerte o resultado (vitória, empate ou derrota)', 'result', 10, false, true),
('Primeiro Gol', 'primeiro-gol', 'Acerte quem fez o primeiro gol', 'first_goal', 15, false, true),
('Artilheiro', 'artilheiro', 'Acerte qual jogador vai marcar', 'player_goal', 20, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample achievements
INSERT INTO achievements (name, slug, description, icon, type, rarity, requirements, experience_reward, is_active) VALUES
('Primeira Aposta', 'primeira-aposta', 'Faça sua primeira aposta', '🎯', 'total_bets', 'common', '{"count": 1}', 10, true),
('Apostador Iniciante', 'apostador-iniciante', 'Faça 10 apostas', '📝', 'total_bets', 'common', '{"count": 10}', 25, true),
('Apostador Experiente', 'apostador-experiente', 'Faça 50 apostas', '📊', 'total_bets', 'rare', '{"count": 50}', 100, true),
('Mestre das Apostas', 'mestre-apostas', 'Faça 100 apostas', '🏆', 'total_bets', 'epic', '{"count": 100}', 250, true),
('Primeira Vitória', 'primeira-vitoria', 'Acerte sua primeira aposta', '✅', 'correct_bets', 'common', '{"count": 1}', 15, true),
('Vidente', 'vidente', 'Acerte 10 apostas', '🔮', 'correct_bets', 'rare', '{"count": 10}', 75, true),
('Oráculo', 'oraculo', 'Acerte 50 apostas', '👁️', 'correct_bets', 'epic', '{"count": 50}', 200, true),
('Sequência de 3', 'sequencia-3', 'Acerte 3 apostas seguidas', '🔥', 'streak', 'common', '{"days": 3}', 30, true),
('Sequência de 7', 'sequencia-7', 'Acerte 7 apostas seguidas', '💪', 'streak', 'rare', '{"days": 7}', 100, true),
('Precisão', 'precisao', 'Mantenha 70% de acerto em pelo menos 20 apostas', '🎯', 'accuracy', 'epic', '{"percentage": 70, "min_bets": 20}', 150, true)
ON CONFLICT (slug) DO NOTHING;
