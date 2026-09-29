CREATE UNIQUE INDEX IF NOT EXISTS standings_career_season_club_uidx
  ON public.standings (career_id, season, club_name);

CREATE UNIQUE INDEX IF NOT EXISTS fixtures_career_season_md_home_uidx
  ON public.fixtures (career_id, season, matchday, home_club);