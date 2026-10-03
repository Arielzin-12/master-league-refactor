import { supabase } from "@/integrations/supabase/client";
import { LEAGUE_CLUBS, TOTAL_MATCHDAYS, clubStrength, slugifyClub } from "@/data/league";

export interface FixtureRow {
  id: string;
  matchday: number;
  competition: string;
  home_club: string;
  away_club: string;
  home_goals: number | null;
  away_goals: number | null;
  played: boolean;
  is_user_match: boolean;
}

export interface StandingRow {
  club_name: string;
  club_slug: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  points: number;
}

/**
 * Round-robin (algoritmo do círculo) com turno e returno espelhados.
 */
function buildRounds(clubs: string[]): Array<Array<[string, string]>> {
  const teams = [...clubs];
  const n = teams.length;
  const half = n / 2;
  const rounds: Array<Array<[string, string]>> = [];
  let rotating = teams.slice(1);
  const fixed = teams[0] as string;

  for (let r = 0; r < n - 1; r++) {
    const round: Array<[string, string]> = [];
    const left = [fixed, ...rotating.slice(0, half - 1)];
    const right = rotating.slice(half - 1).reverse();
    for (let i = 0; i < half; i++) {
      const a = left[i] as string;
      const b = right[i] as string;
      // alterna mando para equilibrar casa/fora
      round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    rotating = [rotating[rotating.length - 1] as string, ...rotating.slice(0, -1)];
  }

  // Returno: mesmos confrontos com mando invertido
  const second = rounds.map((round) => round.map(([h, a]) => [a, h] as [string, string]));
  return [...rounds, ...second];
}

/**
 * Cria o calendário de 38 rodadas e a tabela zerada para uma temporada.
 */
export async function generateSeason(params: {
  careerId: string;
  userId: string;
  season: number;
  userClubName: string;
}) {
  const { careerId, userId, season, userClubName } = params;
  const names = LEAGUE_CLUBS.map((c) => c.name);
  if (!names.includes(userClubName)) names[names.length - 1] = userClubName;

  // Evita gerar o mesmo calendário mais de uma vez para a mesma carreira/temporada.
  // A função pode ser chamada novamente ao entrar na tela/retomar a carreira.
  const expectedFixtureCount = names.length * (names.length - 1);
  const { data: existingFixtures, error: existingError } = await supabase
    .from("fixtures")
    .select("id, played")
    .eq("career_id", careerId)
    .eq("season", season);

  if (existingError) throw existingError;

  if ((existingFixtures?.length ?? 0) >= expectedFixtureCount) {
    return { totalMatchdays: TOTAL_MATCHDAYS };
  }

  // Se ficou uma geração incompleta e nenhum jogo foi disputado, limpa o lote
  // incompleto antes de recriar os 38 turnos. Isso evita jogos repetidos.
  if ((existingFixtures?.length ?? 0) > 0) {
    const hasPlayedMatch = existingFixtures?.some((fixture) => fixture.played);
    if (hasPlayedMatch) {
      throw new Error("O calendário desta temporada já começou e não pode ser regenerado.");
    }

    const { error: deleteFixturesError } = await supabase
      .from("fixtures")
      .delete()
      .eq("career_id", careerId)
      .eq("season", season);
    if (deleteFixturesError) throw deleteFixturesError;

    const { error: deleteStandingsError } = await supabase
      .from("standings")
      .delete()
      .eq("career_id", careerId)
      .eq("season", season);
    if (deleteStandingsError) throw deleteStandingsError;
  }

  const rounds = buildRounds(names);

  const fixtures = rounds.flatMap((round, idx) =>
    round.map(([home, away]) => ({
      career_id: careerId,
      user_id: userId,
      season,
      matchday: idx + 1,
      competition: "Brasileirão",
      home_club: home,
      away_club: away,
      is_user_match: home === userClubName || away === userClubName,
    })),
  );

  // insere em blocos para não estourar o payload
  for (let i = 0; i < fixtures.length; i += 200) {
    const { error } = await supabase
      .from("fixtures")
      .upsert(fixtures.slice(i, i + 200), {
        onConflict: "career_id,season,matchday,home_club",
        ignoreDuplicates: true,
      });
    if (error) throw error;
  }

  const standings = names.map((name) => ({
    career_id: careerId,
    user_id: userId,
    season,
    club_name: name,
    club_slug: slugifyClub(name),
  }));
  const { error: sErr } = await supabase
    .from("standings")
    .upsert(standings, {
      onConflict: "career_id,season,club_name",
      ignoreDuplicates: true,
    });
  if (sErr) throw sErr;

  return { totalMatchdays: TOTAL_MATCHDAYS };
}

/** Placar simulado de forma imparcial a partir da força das duas equipes. */
function simulateScore(homeName: string, awayName: string): [number, number] {
  const home = clubStrength(homeName) + 3; // mando de campo
  const away = clubStrength(awayName);
  const diff = (home - away) / 12;
  const expHome = Math.max(0.25, 1.25 + diff);
  const expAway = Math.max(0.25, 1.25 - diff);
  return [poisson(expHome), poisson(expAway)];
}

function poisson(lambda: number): number {
  const l = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > l);
  return Math.min(6, k - 1);
}

/**
 * Registra o resultado informado pelo usuário (nunca alterado) e simula os
 * demais jogos da rodada. Recalcula a tabela e devolve a posição do clube.
 */
export async function resolveMatchday(params: {
  careerId: string;
  userId: string;
  season: number;
  matchday: number;
  userClubName: string;
  opponent: string;
  home: boolean;
  goalsFor: number;
  goalsAgainst: number;
}): Promise<{ position: number | null }> {
  const { careerId, userId, season, matchday, userClubName } = params;

  const { data: fixtures } = await supabase
    .from("fixtures")
    .select("id, home_club, away_club, is_user_match, played")
    .eq("career_id", careerId)
    .eq("season", season)
    .eq("matchday", matchday);

  if (!fixtures || fixtures.length === 0) return { position: null };

  await Promise.all(
    fixtures
      .filter((f) => !f.played)
      .map((f) => {
        let hg: number;
        let ag: number;
        if (f.is_user_match) {
          // Resultado informado pelo usuário — preservado exatamente.
          const userIsHome = f.home_club === userClubName;
          hg = userIsHome ? params.goalsFor : params.goalsAgainst;
          ag = userIsHome ? params.goalsAgainst : params.goalsFor;
        } else {
          [hg, ag] = simulateScore(f.home_club, f.away_club);
        }
        return supabase.from("fixtures").update({ home_goals: hg, away_goals: ag, played: true }).eq("id", f.id);
      }),
  );


  await recomputeStandings({ careerId, userId, season });

  const { data: table } = await supabase
    .from("standings")
    .select("club_name, points, goals_for, goals_against, wins")
    .eq("career_id", careerId)
    .eq("season", season);

  if (!table) return { position: null };
  const sorted = sortTable(table as StandingRow[]);
  const idx = sorted.findIndex((r) => r.club_name === userClubName);
  return { position: idx >= 0 ? idx + 1 : null };
}

export function sortTable<T extends Partial<StandingRow>>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const pts = (b.points ?? 0) - (a.points ?? 0);
    if (pts !== 0) return pts;
    const w = (b.wins ?? 0) - (a.wins ?? 0);
    if (w !== 0) return w;
    const sg = ((b.goals_for ?? 0) - (b.goals_against ?? 0)) - ((a.goals_for ?? 0) - (a.goals_against ?? 0));
    if (sg !== 0) return sg;
    return (b.goals_for ?? 0) - (a.goals_for ?? 0);
  });
}

/** Recalcula a tabela inteira a partir dos jogos já disputados. */
export async function recomputeStandings(params: { careerId: string; userId: string; season: number }) {
  const { careerId, season } = params;
  const { data: played } = await supabase
    .from("fixtures")
    .select("home_club, away_club, home_goals, away_goals")
    .eq("career_id", careerId)
    .eq("season", season)
    .eq("played", true);

  const acc = new Map<string, Omit<StandingRow, "club_name" | "club_slug">>();
  const ensure = (club: string) => {
    if (!acc.has(club)) {
      acc.set(club, { played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0, points: 0 });
    }
    return acc.get(club)!;
  };

  for (const f of played ?? []) {
    if (f.home_goals === null || f.away_goals === null) continue;
    const h = ensure(f.home_club);
    const a = ensure(f.away_club);
    h.played++; a.played++;
    h.goals_for += f.home_goals; h.goals_against += f.away_goals;
    a.goals_for += f.away_goals; a.goals_against += f.home_goals;
    if (f.home_goals > f.away_goals) { h.wins++; h.points += 3; a.losses++; }
    else if (f.home_goals < f.away_goals) { a.wins++; a.points += 3; h.losses++; }
    else { h.draws++; a.draws++; h.points++; a.points++; }
  }

  const rows = Array.from(acc.entries()).map(([club, s]) => ({
    career_id: careerId,
    user_id: params.userId,
    season,
    club_name: club,
    club_slug: slugifyClub(club),
    ...s,
  }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("standings")
      .upsert(rows, { onConflict: "career_id,season,club_name" });
    if (error) throw error;
  }
}
