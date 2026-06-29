-- Migration: Add penalty shootout columns to games table
-- Feature: penalty-shootout-support
-- Requirements: 3.1, 3.5
-- Description: Adds penalty_home_score and penalty_away_score columns with validation constraints

ALTER TABLE games
  ADD COLUMN penalty_home_score INTEGER DEFAULT NULL,
  ADD COLUMN penalty_away_score INTEGER DEFAULT NULL;

-- Constraint para garantir que valores estejam no intervalo válido (0-99)
ALTER TABLE games
  ADD CONSTRAINT chk_penalty_home_score CHECK (penalty_home_score IS NULL OR (penalty_home_score >= 0 AND penalty_home_score <= 99));

ALTER TABLE games
  ADD CONSTRAINT chk_penalty_away_score CHECK (penalty_away_score IS NULL OR (penalty_away_score >= 0 AND penalty_away_score <= 99));

-- Constraint para garantir consistência: ambos preenchidos ou ambos nulos
ALTER TABLE games
  ADD CONSTRAINT chk_penalty_scores_consistency CHECK (
    (penalty_home_score IS NULL AND penalty_away_score IS NULL) OR
    (penalty_home_score IS NOT NULL AND penalty_away_score IS NOT NULL)
  );
