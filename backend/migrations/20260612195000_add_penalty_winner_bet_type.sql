-- Migration: Add penalty_winner bet type
-- Feature: penalty-shootout-support
-- Requirements: 6.1

INSERT INTO bet_types (id, name, slug, description, type, default_points, is_active, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Vencedor dos Pênaltis',
  'penalty-winner',
  'Aposte em qual time vencerá a disputa de pênaltis em partidas eliminatórias',
  'penalty_winner',
  15,
  true,
  NOW(),
  NOW()
);
