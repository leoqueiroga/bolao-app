-- Migration: Add monitoring columns to games table
-- Requirements: 3.1, 6.3, 7.3
-- Description: Adds external_match_id and is_monitoring columns for live match monitoring

ALTER TABLE games
  ADD COLUMN external_match_id INTEGER DEFAULT NULL,
  ADD COLUMN is_monitoring BOOLEAN DEFAULT FALSE;

-- Partial index for quick lookup of games being monitored (recovery on startup)
CREATE INDEX idx_games_monitoring
  ON games (status, is_monitoring)
  WHERE status = 'in_progress';

-- Partial index for lookup by external_match_id
CREATE INDEX idx_games_external_match_id
  ON games (external_match_id)
  WHERE external_match_id IS NOT NULL;
