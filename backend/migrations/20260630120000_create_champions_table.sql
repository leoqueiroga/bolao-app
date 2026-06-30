-- Galeria de Campeões
CREATE TABLE IF NOT EXISTS champions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index para ordenação
CREATE INDEX idx_champions_display_order ON champions (display_order ASC);
CREATE INDEX idx_champions_active ON champions (is_active) WHERE is_active = TRUE;

-- Grants para os roles do Supabase
GRANT ALL ON champions TO service_role;
GRANT SELECT ON champions TO authenticated;
GRANT SELECT ON champions TO anon;

-- RLS Policies
ALTER TABLE champions ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler campeões ativos
CREATE POLICY "Authenticated users can read active champions"
  ON champions FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- Service role (usado pelo backend) tem acesso total
CREATE POLICY "Service role has full access"
  ON champions FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);
