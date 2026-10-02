ALTER TABLE public.careers ADD COLUMN IF NOT EXISTS manager_salary_eur bigint NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS manager_contract_until_season integer NOT NULL DEFAULT 3;
CREATE TABLE IF NOT EXISTS public.manager_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id uuid NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  season integer NOT NULL,
  matchday integer NOT NULL DEFAULT 0,
  phase text NOT NULL DEFAULT 'midseason',
  club_slug text NOT NULL,
  club_name text NOT NULL,
  salary_eur bigint NOT NULL DEFAULT 0,
  bonus_eur bigint NOT NULL DEFAULT 0,
  contract_years integer NOT NULL DEFAULT 2,
  interest integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'pending',
  negotiation_round integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manager_offers TO authenticated;
GRANT ALL ON public.manager_offers TO service_role;
ALTER TABLE public.manager_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own manager offers" ON public.manager_offers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);