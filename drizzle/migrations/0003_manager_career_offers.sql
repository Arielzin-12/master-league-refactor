-- PROPOSTAS PELO TREINADOR
ALTER TABLE public.careers
  ADD COLUMN IF NOT EXISTS manager_salary_eur BIGINT NOT NULL DEFAULT 100000,
  ADD COLUMN IF NOT EXISTS manager_contract_until_season INTEGER;

CREATE TABLE IF NOT EXISTS public.manager_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  season INTEGER NOT NULL,
  matchday INTEGER NOT NULL,
  phase TEXT NOT NULL DEFAULT 'midseason',
  club_slug TEXT NOT NULL,
  club_name TEXT NOT NULL,
  salary_eur BIGINT NOT NULL DEFAULT 100000,
  bonus_eur BIGINT NOT NULL DEFAULT 0,
  contract_years INTEGER NOT NULL DEFAULT 2,
  interest INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  negotiation_round INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manager_offers_career
  ON public.manager_offers(career_id, season, matchday);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_offers TO authenticated;
GRANT ALL ON public.manager_offers TO service_role;
ALTER TABLE public.manager_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners select manager offers" ON public.manager_offers;
CREATE POLICY "owners select manager offers" ON public.manager_offers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners insert manager offers" ON public.manager_offers;
CREATE POLICY "owners insert manager offers" ON public.manager_offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners update manager offers" ON public.manager_offers;
CREATE POLICY "owners update manager offers" ON public.manager_offers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "owners delete manager offers" ON public.manager_offers;
CREATE POLICY "owners delete manager offers" ON public.manager_offers
  FOR DELETE USING (auth.uid() = user_id);
