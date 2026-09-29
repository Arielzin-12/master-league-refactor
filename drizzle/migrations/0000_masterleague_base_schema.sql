CREATE TABLE public.careers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  manager_name TEXT NOT NULL,
  club_name TEXT NOT NULL,
  club_slug TEXT NOT NULL,
  season INTEGER NOT NULL DEFAULT 1,
  matchday INTEGER NOT NULL DEFAULT 1,
  cash_eur BIGINT NOT NULL DEFAULT 50000000,
  weekly_wages_eur BIGINT NOT NULL DEFAULT 0,
  league_position INTEGER NOT NULL DEFAULT 10,
  points INTEGER NOT NULL DEFAULT 0,
  played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  intro_done BOOLEAN NOT NULL DEFAULT false,
  next_opponent TEXT,
  transfer_window_open BOOLEAN NOT NULL DEFAULT true,
  transfer_window_closes_at INTEGER NOT NULL DEFAULT 8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_careers_user ON public.careers(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.careers TO authenticated;
GRANT ALL ON public.careers TO service_role;
ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners select careers" ON public.careers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert careers" ON public.careers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update careers" ON public.careers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners delete careers" ON public.careers FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.squad_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  club_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'MEI',
  overall INTEGER NOT NULL DEFAULT 80,
  weekly_wage_eur BIGINT NOT NULL DEFAULT 100000,
  market_value_eur BIGINT NOT NULL DEFAULT 20000000,
  morale INTEGER NOT NULL DEFAULT 70,
  injured BOOLEAN NOT NULL DEFAULT false,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  age INTEGER NOT NULL DEFAULT 25,
  potential INTEGER NOT NULL DEFAULT 80,
  attack INTEGER NOT NULL DEFAULT 70,
  defense INTEGER NOT NULL DEFAULT 70,
  physical INTEGER NOT NULL DEFAULT 70,
  technique INTEGER NOT NULL DEFAULT 70,
  yellow_cards_season INTEGER NOT NULL DEFAULT 0,
  on_loan BOOLEAN NOT NULL DEFAULT false,
  loan_to_club TEXT,
  loan_returns_at_matchday INTEGER,
  original_wage_eur BIGINT NOT NULL DEFAULT 0,
  face_url TEXT,
  is_captain BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_squad_career ON public.squad_players(career_id);
CREATE INDEX idx_squad_club ON public.squad_players(career_id, club_slug);
CREATE UNIQUE INDEX idx_squad_one_captain ON public.squad_players(career_id, club_slug) WHERE is_captain = true;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_players TO authenticated;
GRANT ALL ON public.squad_players TO service_role;
ALTER TABLE public.squad_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners select squad" ON public.squad_players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert squad" ON public.squad_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update squad" ON public.squad_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners delete squad" ON public.squad_players FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.market_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL DEFAULT 'MEI',
  overall INTEGER NOT NULL DEFAULT 80,
  market_value_eur BIGINT NOT NULL,
  expected_wage_eur BIGINT NOT NULL DEFAULT 200000,
  region TEXT NOT NULL DEFAULT 'Europa',
  current_club TEXT NOT NULL DEFAULT 'Livre',
  age INTEGER NOT NULL DEFAULT 25,
  potential INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_career ON public.market_players(career_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_players TO authenticated;
GRANT ALL ON public.market_players TO service_role;
ALTER TABLE public.market_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners select market" ON public.market_players FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert market" ON public.market_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update market" ON public.market_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners delete market" ON public.market_players FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  matchday INTEGER NOT NULL,
  opponent TEXT NOT NULL,
  home BOOLEAN NOT NULL DEFAULT true,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  scorers TEXT,
  assists TEXT,
  league_position_after INTEGER,
  result TEXT NOT NULL DEFAULT 'V',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_matches_career ON public.matches(career_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners select matches" ON public.matches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update matches" ON public.matches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners delete matches" ON public.matches FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.transfer_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  direction TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_id UUID,
  other_club TEXT NOT NULL,
  fee_eur BIGINT NOT NULL DEFAULT 0,
  wage_eur BIGINT NOT NULL DEFAULT 0,
  contract_years INTEGER NOT NULL DEFAULT 3,
  bonus_eur BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  club_response TEXT,
  player_response TEXT,
  deal_type TEXT NOT NULL DEFAULT 'buy',
  loan_months INTEGER NOT NULL DEFAULT 0,
  loan_buy_option_eur BIGINT NOT NULL DEFAULT 0,
  loan_obligation BOOLEAN NOT NULL DEFAULT false,
  wage_share_pct INTEGER NOT NULL DEFAULT 100,
  negotiation_round INTEGER NOT NULL DEFAULT 1,
  rounds_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_offers_career ON public.transfer_offers(career_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfer_offers TO authenticated;
GRANT ALL ON public.transfer_offers TO service_role;
ALTER TABLE public.transfer_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners select offers" ON public.transfer_offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert offers" ON public.transfer_offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update offers" ON public.transfer_offers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners delete offers" ON public.transfer_offers FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.incoming_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  player_id UUID NOT NULL,
  player_name TEXT NOT NULL,
  from_club TEXT NOT NULL,
  fee_eur BIGINT NOT NULL DEFAULT 0,
  bonus_eur BIGINT NOT NULL DEFAULT 0,
  wage_offered_eur BIGINT NOT NULL DEFAULT 0,
  offer_type TEXT NOT NULL DEFAULT 'buy',
  player_interest INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  matchday INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_incoming_offers_career ON public.incoming_offers(career_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incoming_offers TO authenticated;
GRANT ALL ON public.incoming_offers TO service_role;
ALTER TABLE public.incoming_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners select incoming" ON public.incoming_offers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert incoming" ON public.incoming_offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update incoming" ON public.incoming_offers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners delete incoming" ON public.incoming_offers FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.news_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  career_id UUID NOT NULL REFERENCES public.careers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL DEFAULT 'news',
  title TEXT NOT NULL,
  body TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_news_career ON public.news_feed(career_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_feed TO authenticated;
GRANT ALL ON public.news_feed TO service_role;
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owners select news" ON public.news_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "owners insert news" ON public.news_feed FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners update news" ON public.news_feed FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "owners delete news" ON public.news_feed FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "faces readable by owner" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'player-faces');
CREATE POLICY "faces upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'player-faces');
CREATE POLICY "faces update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'player-faces');
CREATE POLICY "crowd readable" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'crowd-images');
CREATE POLICY "crowd upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'crowd-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "crowd update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'crowd-images' AND auth.uid()::text = (storage.foldername(name))[1]);