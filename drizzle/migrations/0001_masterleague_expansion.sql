-- CARREIRA: orçamentos separados, diretoria e moral
ALTER TABLE public.careers
  ADD COLUMN IF NOT EXISTS transfer_budget_eur BIGINT NOT NULL DEFAULT 50000000,
  ADD COLUMN IF NOT EXISTS wage_budget_eur BIGINT NOT NULL DEFAULT 5000000,
  ADD COLUMN IF NOT EXISTS board_confidence INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS fan_mood INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS squad_morale INTEGER NOT NULL DEFAULT 65,
  ADD COLUMN IF NOT EXISTS board_objective TEXT NOT NULL DEFAULT 'Terminar no G8',
  ADD COLUMN IF NOT EXISTS reputation INTEGER NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS total_matches INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS titles INTEGER NOT NULL DEFAULT 0;

-- ELENCO: contrato, papel, lesão e suspensão
ALTER TABLE public.squad_players
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS secondary_positions TEXT,
  ADD COLUMN IF NOT EXISTS foot TEXT NOT NULL DEFAULT 'Direito',
  ADD COLUMN IF NOT EXISTS efootball_player_value INTEGER,
  ADD COLUMN IF NOT EXISTS squad_role TEXT NOT NULL DEFAULT 'Rotação',
  ADD COLUMN IF NOT EXISTS contract_until_season INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS signing_bonus_eur BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS injury_type TEXT,
  ADD COLUMN IF NOT EXISTS injury_returns_at_matchday INTEGER,
  ADD COLUMN IF NOT EXISTS injury_severity TEXT,
  ADD COLUMN IF NOT EXISTS red_cards_season INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS suspended_matches INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS appearances INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS motm INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clean_sheets INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_sum NUMERIC NOT NULL DEFAULT 0;

-- MERCADO: dados de busca avançada
ALTER TABLE public.market_players
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS league TEXT,
  ADD COLUMN IF NOT EXISTS foot TEXT NOT NULL DEFAULT 'Direito',
  ADD COLUMN IF NOT EXISTS traits TEXT,
  ADD COLUMN IF NOT EXISTS efootball_player_value INTEGER;
CREATE INDEX IF NOT EXISTS idx_market_search ON public.market_players(career_id, position, overall);

-- PARTIDA: detalhes do jogo registrado pelo usuário
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS competition TEXT NOT NULL DEFAULT 'Brasileirão',
  ADD COLUMN IF NOT EXISTS motm_player_id UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT true;

-- CALENDÁRIO
CREATE TABLE public.fixtures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  season INTEGER NOT NULL DEFAULT 1,
  matchday INTEGER NOT NULL,
  competition TEXT NOT NULL DEFAULT 'Brasileirão',
  home_club TEXT NOT NULL,
  away_club TEXT NOT NULL,
  home_goals INTEGER,
  away_goals INTEGER,
  played BOOLEAN NOT NULL DEFAULT false,
  is_user_match BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fixtures_career ON public.fixtures(career_id, season, matchday);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fixtures TO authenticated;
GRANT ALL ON public.fixtures TO service_role;
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all fixtures" ON public.fixtures FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CLASSIFICAÇÃO
CREATE TABLE public.standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  season INTEGER NOT NULL DEFAULT 1,
  club_name TEXT NOT NULL,
  club_slug TEXT NOT NULL,
  played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  points INTEGER NOT NULL DEFAULT 0,
  UNIQUE (career_id, season, club_slug)
);
CREATE INDEX idx_standings_career ON public.standings(career_id, season);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.standings TO authenticated;
GRANT ALL ON public.standings TO service_role;
ALTER TABLE public.standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all standings" ON public.standings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ESCALAÇÕES
CREATE TABLE public.lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  matchday INTEGER NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  formation TEXT NOT NULL DEFAULT '4-3-3',
  starters JSONB NOT NULL DEFAULT '[]'::jsonb,
  bench JSONB NOT NULL DEFAULT '[]'::jsonb,
  captain_id UUID,
  set_pieces JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lineups_career ON public.lineups(career_id, matchday);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lineups TO authenticated;
GRANT ALL ON public.lineups TO service_role;
ALTER TABLE public.lineups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all lineups" ON public.lineups FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EVENTOS DA PARTIDA (gols, assistências, cartões, substituições)
CREATE TABLE public.match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  minute INTEGER,
  event_type TEXT NOT NULL,
  player_id UUID,
  player_name TEXT,
  assist_player_id UUID,
  assist_player_name TEXT,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_events_match ON public.match_events(match_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all events" ON public.match_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LESÕES
CREATE TABLE public.injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES public.squad_players(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  injury_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'leve',
  started_matchday INTEGER NOT NULL,
  returns_matchday INTEGER NOT NULL,
  recovered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_injuries_career ON public.injuries(career_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.injuries TO authenticated;
GRANT ALL ON public.injuries TO service_role;
ALTER TABLE public.injuries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all injuries" ON public.injuries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SUSPENSÕES
CREATE TABLE public.suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_id UUID NOT NULL REFERENCES public.squad_players(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'cartoes',
  matches_total INTEGER NOT NULL DEFAULT 1,
  matches_served INTEGER NOT NULL DEFAULT 0,
  started_matchday INTEGER NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_susp_career ON public.suspensions(career_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suspensions TO authenticated;
GRANT ALL ON public.suspensions TO service_role;
ALTER TABLE public.suspensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all suspensions" ON public.suspensions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- FINANÇAS
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  matchday INTEGER NOT NULL DEFAULT 1,
  season INTEGER NOT NULL DEFAULT 1,
  budget TEXT NOT NULL DEFAULT 'transfer',
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_eur BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fin_career ON public.financial_transactions(career_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all finance" ON public.financial_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SCOUTING / LISTA DE OBSERVAÇÃO
CREATE TABLE public.scouting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  market_player_id UUID REFERENCES public.market_players(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (career_id, market_player_id)
);
CREATE INDEX idx_scouting_career ON public.scouting(career_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scouting TO authenticated;
GRANT ALL ON public.scouting TO service_role;
ALTER TABLE public.scouting ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all scouting" ON public.scouting FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- REDES SOCIAIS
CREATE TABLE public.social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'torcedor',
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  body TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  matchday INTEGER NOT NULL DEFAULT 1,
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_career ON public.social_posts(career_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all posts" ON public.social_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'torcedor',
  author_name TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  body TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_post ON public.social_comments(post_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_comments TO authenticated;
GRANT ALL ON public.social_comments TO service_role;
ALTER TABLE public.social_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all comments" ON public.social_comments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COLETIVAS
CREATE TABLE public.press_conferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  matchday INTEGER NOT NULL DEFAULT 1,
  context TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  reaction TEXT,
  fan_delta INTEGER NOT NULL DEFAULT 0,
  squad_delta INTEGER NOT NULL DEFAULT 0,
  board_delta INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_press_career ON public.press_conferences(career_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.press_conferences TO authenticated;
GRANT ALL ON public.press_conferences TO service_role;
ALTER TABLE public.press_conferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners all press" ON public.press_conferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);