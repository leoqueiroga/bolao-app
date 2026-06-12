-- Migration 006: Adicionar colunas faltantes à tabela profiles
-- A tabela profiles foi criada sem essas colunas na migration 001

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;
