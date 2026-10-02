ALTER TABLE public.squad_players
  ADD COLUMN IF NOT EXISTS contract_until_season INTEGER NOT NULL DEFAULT 4;

CREATE INDEX IF NOT EXISTS idx_squad_contract
  ON public.squad_players(career_id, contract_until_season);
