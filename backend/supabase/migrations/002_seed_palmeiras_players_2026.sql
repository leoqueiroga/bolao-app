-- Seed dos jogadores do Palmeiras para a temporada 2026
-- Baseado na Wikipedia: https://en.wikipedia.org/wiki/2026_SE_Palmeiras_season
-- Atualizado em: 14/01/2026

-- Limpar jogadores existentes (opcional - descomente se quiser resetar)
-- DELETE FROM players WHERE deleted_at IS NULL;

-- Inserir jogadores do elenco 2026
INSERT INTO players (name, shirt_number, position, is_active) VALUES
-- Goleiros
('Carlos Miguel', 1, 'GK', true),
('Marcelo Lomba', 14, 'GK', true),
('Weverton', 21, 'GK', true),
('Aranha', 24, 'GK', true),

-- Defensores
('Bruno Fuchs', 3, 'DF', true),
('Agustín Giay', 4, 'DF', true),
('Jefté', 6, 'DF', true),
('Khellven', 12, 'DF', true),
('Gustavo Gómez', 15, 'DF', true),
('Joaquín Piquerez', 22, 'DF', true),
('Murilo', 26, 'DF', true),
('Benedetti', 43, 'DF', true),

-- Meio-campistas
('Felipe Anderson', 7, 'MF', true),
('Andreas Pereira', 8, 'MF', true),
('Maurício', 18, 'MF', true),
('Raphael Veiga', 23, 'MF', true),
('Marlon Freitas', 27, 'MF', true),
('Lucas Evangelista', 30, 'MF', true),
('Emiliano Martínez', 32, 'MF', true),
('Figueiredo', 38, 'MF', true),
('Allan', 40, 'MF', true),

-- Atacantes
('Vitor Roque', 9, 'FW', true),
('Paulinho', 10, 'FW', true),
('Bruno Rodrigues', 11, 'FW', true),
('Facundo Torres', 17, 'FW', true),
('Ramón Sosa', 19, 'FW', true),
('Luighi', 31, 'FW', true),
('José Manuel López', 42, 'FW', true)

ON CONFLICT (id) DO NOTHING;

-- Criar índice para busca por número de camisa (se não existir)
CREATE INDEX IF NOT EXISTS idx_players_shirt_number ON players(shirt_number);

-- Criar índice para busca por posição (se não existir)
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);

-- Criar índice para jogadores ativos (se não existir)
CREATE INDEX IF NOT EXISTS idx_players_active ON players(is_active) WHERE is_active = true;
