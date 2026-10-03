import { supabase } from "@/integrations/supabase/client";
import { CLUBS, type ClubSlug } from "@/data/clubs";
import { SQUADS, MARKET_SEED, ovrFromValue, wageFromValue } from "@/data/squads";
import { EXTRA_MARKET } from "@/data/market-extra";
import { generatePlayerStats } from "@/lib/players";
import { isWindowOpen, windowClosesAt } from "@/lib/season";
import { pushAINews } from "@/lib/news";
import { generateSeason } from "@/lib/fixtures";

export interface NewCareerInput {
  managerName: string;
  clubSlug: ClubSlug;
  userId: string;
}

export async function createCareer(input: NewCareerInput) {
  const club = CLUBS[input.clubSlug];
  const squad = SQUADS[input.clubSlug];

  const weekly = squad.reduce((acc, p) => acc + p.weeklyWage, 0);
  const boardObjectives: Record<ClubSlug, string> = {
    palmeiras: "Disputar o título do Brasileirão",
    flamengo: "Disputar o título do Brasileirão",
    corinthians: "Garantir vaga na Libertadores",
    vasco: "Terminar na primeira metade da tabela",
    fluminense: "Garantir vaga na Libertadores",
    cruzeiro: "Terminar entre os 8 primeiros",
    gremio: "Evitar o rebaixamento e permanecer na Série A",
    santos: "Evitar o rebaixamento e permanecer na Série A",
    internacional: "Evitar o rebaixamento e permanecer na Série A",
    "real-madrid": "Disputar o título da LaLiga",
    barcelona: "Disputar o título da LaLiga",
    chelsea: "Garantir vaga na Champions League",
  };
  const boardObjective = boardObjectives[input.clubSlug];


  const { data: career, error: careerErr } = await supabase
    .from("careers")
    .insert({
      user_id: input.userId,
      manager_name: input.managerName,
      club_name: club.name,
      club_slug: club.slug,
      cash_eur: club.budgetEur,
      weekly_wages_eur: weekly,
      next_opponent: club.rivals[0] ?? "Adversário",
      transfer_window_open: isWindowOpen(1),
      transfer_window_closes_at: windowClosesAt(1),
      board_objective: boardObjective,
    })
    .select()
    .single();

  if (careerErr || !career) throw careerErr ?? new Error("Falha ao criar carreira");

  // Calendário completo (38 rodadas) + tabela zerada do Brasileirão
  await generateSeason({
    careerId: career.id,
    userId: input.userId,
    season: career.season,
    userClubName: club.name,
  });

  const { data: firstFixture } = await supabase
    .from("fixtures")
    .select("home_club, away_club")
    .eq("career_id", career.id)
    .eq("season", career.season)
    .eq("matchday", 1)
    .eq("is_user_match", true)
    .maybeSingle();

  if (firstFixture) {
    const opp = firstFixture.home_club === club.name ? firstFixture.away_club : firstFixture.home_club;
    await supabase.from("careers").update({ next_opponent: opp }).eq("id", career.id);
    career.next_opponent = opp;
  }



  // Inserir todos os elencos dos 6 clubes
  const allSquadRows: Array<{
    career_id: string;
    user_id: string;
    club_slug: string;
    name: string;
    position: string;
    overall: number;
    weekly_wage_eur: number;
    market_value_eur: number;
    age: number;
    potential: number;
    attack: number;
    defense: number;
    physical: number;
    technique: number;
  }> = [];
  (Object.keys(SQUADS) as ClubSlug[]).forEach((slug) => {
    SQUADS[slug].forEach((p) => {
      const age = p.age;
      const stats = generatePlayerStats(age, p.position);
      allSquadRows.push({
        career_id: career.id,
        user_id: input.userId,
        club_slug: slug,
        name: p.name,
        position: p.position,
        overall: p.overall,
        weekly_wage_eur: p.weeklyWage,
        market_value_eur: p.marketValue,
        age,
        potential: Math.max(p.overall, stats.potential),
        attack: stats.attack,
        defense: stats.defense,
        physical: stats.physical,
        technique: stats.technique,
      });
    });
  });

  const { error: squadErr } = await supabase.from("squad_players").insert(allSquadRows);
  if (squadErr) throw squadErr;

  // Mercado: remover qualquer jogador que pertença ao CLUBE SELECIONADO.
  // Jogadores de outros times continuam disponíveis no mercado.
  const ownedNames = new Set<string>(squad.map((p) => p.name));
  const ownClubName = club.name;

  // Remover duplicatas dentro do próprio MARKET_SEED (mantém a primeira ocorrência,
  // e como a lista está ordenada por valor, fica a entrada de maior valor).
  const seen = new Set<string>();
  const dedupedMarket = MARKET_SEED.filter((mp) => {
    if (seen.has(mp.name)) return false;
    seen.add(mp.name);
    return true;
  });

  const marketRows = dedupedMarket
    .filter((mp) => !ownedNames.has(mp.name) && mp.currentClub !== ownClubName)
    .map((mp) => {
    const age = mp.age;
    const stats = generatePlayerStats(age, mp.position);
    return {
      career_id: career.id,
      user_id: input.userId,
      name: mp.name,
      position: mp.position,
      overall: mp.overall,
      market_value_eur: mp.marketValue,
      expected_wage_eur: mp.expectedWage,
      region: mp.region,
      current_club: mp.currentClub,
      age,
      potential: Math.max(mp.overall, stats.potential),
    };
  });

  if (marketRows.length > 0) {
    const { error: mErr } = await supabase.from("market_players").insert(marketRows);
    if (mErr) throw mErr;
  }

  // Todos os jogadores dos novos clubes também entram no mercado quando
  // ainda não estiverem cadastrados, exceto os jogadores do clube escolhido.
  const marketNames = new Set(marketRows.map((r) => r.name));
  const squadMarketRows = (Object.keys(SQUADS) as ClubSlug[]).flatMap((slug) => {
    const squadClub = CLUBS[slug];
    if (squadClub.name === ownClubName) return [];
    return SQUADS[slug].filter((p) => !marketNames.has(p.name)).map((p) => {
      const stats = generatePlayerStats(p.age, p.position);
      return {
        career_id: career.id,
        user_id: input.userId,
        name: p.name,
        position: p.position,
        overall: p.overall,
        market_value_eur: p.marketValue,
        expected_wage_eur: p.weeklyWage,
        region: squadClub.league,
        current_club: squadClub.name,
        age: p.age,
        potential: Math.max(p.overall, stats.potential),
      };
    });
  });
  if (squadMarketRows.length > 0) {
    const { error: smErr } = await supabase.from("market_players").insert(squadMarketRows);
    if (smErr) throw smErr;
  }

  const extraRows = buildExtraMarketRows(career.id, input.userId, club.name, new Set([...ownedNames, ...marketRows.map((r) => r.name)]));
  if (extraRows.length > 0) {
    const { error: xErr } = await supabase.from("market_players").insert(extraRows);
    if (xErr) throw xErr;
  }

  // Notícias iniciais (geradas por IA com fallback)
  await Promise.all([
    pushAINews({
      careerId: career.id,
      userId: input.userId,
      kind: "headline",
      hint: `Anunciar a chegada de ${input.managerName} como novo treinador do ${club.name} para a temporada do ${club.league}. Tom: oficial e empolgado.`,
      context: {
        clube: club.name,
        liga: club.league,
        treinador: input.managerName,
        rivais: club.rivals.join(", "),
        orcamento_eur: club.budgetEur,
      },
      fallbackTitle: `${input.managerName} é o novo treinador do ${club.name}`,
      fallbackBody: `A diretoria oficializou hoje a chegada de ${input.managerName} para comandar o ${club.name} na nova temporada do ${club.league}.`,
    }),
    pushAINews({
      careerId: career.id,
      userId: input.userId,
      kind: "press",
      hint: `Reação da torcida do ${club.name} à chegada de ${input.managerName}. Mencione redes sociais, expectativa, possíveis cobranças.`,
      context: { clube: club.name, treinador: input.managerName },
      fallbackTitle: `Torcida do ${club.name} recebe novo comandante com expectativa`,
      fallbackBody: `Nas redes sociais, torcedores do ${club.name} demonstram esperança por uma temporada vitoriosa.`,
    }),
  ]);

  return career;
}

export interface ManagerOfferRow {
  id: string; career_id: string; user_id: string; season: number; matchday: number;
  phase: "midseason" | "endseason"; club_slug: ClubSlug; club_name: string;
  salary_eur: number; bonus_eur: number; contract_years: number; interest: number;
  status: string; negotiation_round: number; created_at: string;
}

const REAL_LIFE_FIRST_HALF_PPG: Partial<Record<ClubSlug, number>> = {
  palmeiras: 44 / 19, flamengo: 40 / 19, corinthians: 27 / 19, vasco: 20 / 19,
  fluminense: 32 / 19, cruzeiro: 27 / 19, gremio: 21 / 19, santos: 21 / 19, internacional: 21 / 19,
  "real-madrid": 15 / 7, barcelona: 21 / 7, chelsea: 7 / 5,
};

function managerOfferSalary(clubSlug: ClubSlug): number {
  return Math.max(45_000, Math.round(CLUBS[clubSlug].budgetEur * 0.001));
}

function managerOfferInterest(clubSlug: ClubSlug, currentClubSlug: ClubSlug, currentPosition: number): number {
  const targetBudget = CLUBS[clubSlug].budgetEur;
  const currentBudget = CLUBS[currentClubSlug].budgetEur;
  const prestige = Math.min(20, Math.max(0, Math.round((targetBudget - currentBudget) / 5_000_000)));
  const performance = currentPosition <= 6 ? 18 : currentPosition <= 10 ? 10 : currentPosition <= 16 ? 5 : 0;
  return Math.min(95, 45 + prestige + performance);
}

export async function generateManagerOffers(params: {
  careerId: string; userId: string; currentClubSlug: ClubSlug; currentSeason: number;
  matchday: number; leaguePosition: number; phase: "midseason" | "endseason";
}) {
  const { careerId, userId, currentClubSlug, currentSeason, matchday, leaguePosition, phase } = params;
  const candidates = (Object.keys(CLUBS) as ClubSlug[]).filter((slug) => slug !== currentClubSlug);
  const count = leaguePosition <= 5 ? 4 : leaguePosition <= 10 ? 3 : 2;
  const shuffled = [...candidates].sort(() => Math.random() - 0.5).slice(0, count);
  const { data: existing } = await supabase.from("manager_offers").select("club_slug").eq("career_id", careerId).eq("season", currentSeason).eq("phase", phase);
  const already = new Set((existing ?? []).map((x) => x.club_slug));
  const rows = shuffled.filter((slug) => !already.has(slug)).map((slug) => {
    const salary = managerOfferSalary(slug);
    return { career_id: careerId, user_id: userId, season: currentSeason, matchday, phase, club_slug: slug,
      club_name: CLUBS[slug].name, salary_eur: salary, bonus_eur: Math.round(salary * (phase === "endseason" ? 6 : 4)),
      contract_years: phase === "endseason" ? 3 : 2, interest: managerOfferInterest(slug, currentClubSlug, leaguePosition),
      status: "pending", negotiation_round: 1 };
  });
  if (rows.length) {
    const { error } = await supabase.from("manager_offers").insert(rows);
    if (error) throw error;
    await pushAINews({ careerId, userId, kind: "transfer",
      hint: "Anunciar que clubes fizeram propostas para contratar o treinador. Usar somente clubes da lista da carreira.",
      context: { clubes_interessados: rows.map((r) => r.club_name), rodada: matchday, fase: phase },
      fallbackTitle: phase === "midseason" ? "Mercado de treinadores se movimenta" : "Fim de temporada movimenta o mercado de treinadores",
      fallbackBody: "O trabalho do treinador despertou interesse e " + rows.length + " clubes apresentaram propostas.",
    });
  }
  return rows;
}

export async function switchManagerClub(params: {
  careerId: string; userId: string; managerName: string; currentClubSlug: ClubSlug; targetClubSlug: ClubSlug;
  season: number; currentMatchday: number; targetSalary: number; contractYears: number;
}) {
  const { careerId, userId, managerName, currentClubSlug, targetClubSlug, season, currentMatchday, targetSalary, contractYears } = params;
  const targetClub = CLUBS[targetClubSlug]; const oldClub = CLUBS[currentClubSlug];
  if (currentMatchday >= 19) {
    const { data: fixtures } = await supabase.from("fixtures").select("id, matchday, home_club, away_club, played").eq("career_id", careerId).eq("season", season).lte("matchday", 19);
    const targetPpg = REAL_LIFE_FIRST_HALF_PPG[targetClubSlug] ?? 1.5;
    const poisson = (lambda: number) => { const l = Math.exp(-lambda); let k = 0; let p = 1; do { k++; p *= Math.random(); } while (p > l); return Math.min(6, k - 1); };
    const score = (home: string, away: string): [number, number] => {
      const isTargetHome = home === targetClub.name; const isTargetAway = away === targetClub.name;
      if (!isTargetHome && !isTargetAway) return [poisson(1.15), poisson(1.05)];
      const advantage = ((targetPpg - 1.5) * 0.75) + (isTargetHome ? 0.25 : -0.08);
      const targetGoals = poisson(Math.max(0.35, 1.25 + advantage));
      const opponentGoals = poisson(Math.max(0.35, 1.25 - advantage));
      return isTargetHome ? [targetGoals, opponentGoals] : [opponentGoals, targetGoals];
    };
    for (const f of fixtures ?? []) {
      if (f.played) continue;
      const [hg, ag] = score(f.home_club, f.away_club);
      await supabase.from("fixtures").update({ home_goals: hg, away_goals: ag, played: true }).eq("id", f.id);
    }
    const { recomputeStandings } = await import("@/lib/fixtures");
    await recomputeStandings({ careerId, userId, season });
  }
  const { data: targetPlayers } = await supabase.from("squad_players").select("name, position, overall, weekly_wage_eur, market_value_eur, age, potential").eq("career_id", careerId).eq("club_slug", targetClubSlug);
  const { data: oldPlayers } = await supabase.from("squad_players").select("name, position, overall, weekly_wage_eur, market_value_eur, age, potential").eq("career_id", careerId).eq("club_slug", currentClubSlug);
  await supabase.from("market_players").delete().eq("career_id", careerId).eq("current_club", targetClub.name);
  for (const p of oldPlayers ?? []) {
    const { data: exists } = await supabase.from("market_players").select("id").eq("career_id", careerId).eq("name", p.name).maybeSingle();
    if (!exists) await supabase.from("market_players").insert({ career_id: careerId, user_id: userId, name: p.name, position: p.position, overall: p.overall, market_value_eur: p.market_value_eur, expected_wage_eur: p.weekly_wage_eur, region: oldClub.league, current_club: oldClub.name, age: p.age, potential: p.potential });
  }
  const weeklyWages = (targetPlayers ?? []).reduce((sum, p) => sum + Number(p.weekly_wage_eur ?? 0), 0);
  const { data: firstFixture } = await supabase.from("fixtures").select("home_club, away_club").eq("career_id", careerId).eq("season", season).eq("matchday", Math.max(currentMatchday + 1, 20)).eq("is_user_match", true).maybeSingle();
  const nextOpponent = firstFixture ? (firstFixture.home_club === targetClub.name ? firstFixture.away_club : firstFixture.home_club) : targetClub.rivals[0] ?? "Adversário";
  const { data: updatedCareer, error } = await supabase.from("careers").update({ club_name: targetClub.name, club_slug: targetClub.slug, manager_salary_eur: targetSalary, manager_contract_until_season: season + contractYears, weekly_wages_eur: weeklyWages, cash_eur: targetClub.budgetEur, next_opponent: nextOpponent, matchday: currentMatchday >= 19 ? 20 : currentMatchday, updated_at: new Date().toISOString() }).eq("id", careerId).select().single();
  if (error) throw error;
  await supabase.from("manager_offers").update({ status: "rejected" }).eq("career_id", careerId).eq("season", season).eq("status", "pending").neq("club_slug", targetClubSlug);
  await supabase.from("manager_offers").update({ status: "accepted" }).eq("career_id", careerId).eq("season", season).eq("club_slug", targetClubSlug);
  await pushAINews({ careerId, userId, kind: "transfer", hint: "Anunciar a troca de clube do treinador e a nova fase da carreira.",
    context: { treinador: managerName, clube_anterior: oldClub.name, novo_clube: targetClub.name, rodada: currentMatchday },
    fallbackTitle: managerName + " assume o comando do " + targetClub.name,
    fallbackBody: managerName + " deixa o " + oldClub.name + " e assume o " + targetClub.name + ".",
  });
  return updatedCareer;
}
/**
 * Fecha uma temporada e prepara a seguinte.
 * A evolução considera idade, potencial, minutos e média de atuação.
 */
export async function advanceCareerSeason(careerId: string, userId: string, clubName: string, currentSeason: number) {
  const nextSeason = currentSeason + 1;

  const { data: players, error } = await supabase
    .from("squad_players")
    .select("id, name, age, overall, potential, appearances, minutes, rating_sum")
    .eq("career_id", careerId);

  if (error) throw error;

  for (const p of players ?? []) {
    // A evolução já foi aplicada ao fim de cada partida em applyPostMatch.
    // Aqui apenas envelhecemos o jogador e zeramos as estatísticas da temporada.
    const age = (p.age ?? 0) + 1;

    await supabase.from("squad_players").update({
      age,
      goals: 0,
      assists: 0,
      appearances: 0,
      minutes: 0,
      motm: 0,
      clean_sheets: 0,
      rating_sum: 0,
      yellow_cards_season: 0,
      red_cards_season: 0,
    }).eq("id", p.id);
  }

  // Jogadores disponíveis no mercado apenas envelhecem na virada.
  // Eles não recebem evolução automática, pois não participaram das partidas da carreira.
  const { data: marketPlayers } = await supabase
    .from("market_players")
    .select("id, age")
    .eq("career_id", careerId);

  for (const p of marketPlayers ?? []) {
    await supabase.from("market_players")
      .update({ age: (p.age ?? 0) + 1 })
      .eq("id", p.id);
  }

  // Nova temporada: calendário e tabela zerados, mantendo o histórico da carreira.
  await generateSeason({
    careerId,
    userId,
    season: nextSeason,
    userClubName: clubName,
  });

  const { data: firstFixture } = await supabase
    .from("fixtures")
    .select("home_club, away_club")
    .eq("career_id", careerId)
    .eq("season", nextSeason)
    .eq("matchday", 1)
    .eq("is_user_match", true)
    .maybeSingle();

  const nextOpponent = firstFixture
    ? (firstFixture.home_club === clubName ? firstFixture.away_club : firstFixture.home_club)
    : "Adversário";

  await supabase.from("careers").update({
    season: nextSeason,
    matchday: 1,
    points: 0,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goals_for: 0,
    goals_against: 0,
    league_position: 1,
    next_opponent: nextOpponent,
    transfer_window_open: isWindowOpen(1),
    transfer_window_closes_at: windowClosesAt(1),
    updated_at: new Date().toISOString(),
  }).eq("id", careerId);

  return { season: nextSeason, nextOpponent };
}

export async function deleteCareer(careerId: string) {
  const { error } = await supabase.from("careers").delete().eq("id", careerId);
  if (error) throw error;
}

/** Jogadores extras do mercado (lista do usuário). Idade não informada: usa 25 como nos demais. */
export function buildExtraMarketRows(careerId: string, userId: string, ownClub: string, skipNames: Set<string>) {
  return EXTRA_MARKET.filter((p) => p.club !== ownClub && !skipNames.has(p.name)).map((p) => {
    const age = p.age ?? 25;
    const overall = p.overall ?? ovrFromValue(p.value, age);
    return {
      career_id: careerId,
      user_id: userId,
      name: p.name,
      position: p.position,
      overall,
      market_value_eur: p.value,
      expected_wage_eur: p.expectedWage ?? wageFromValue(p.value, overall),
      region: p.league,
      league: p.league,
      nationality: p.nationality,
      traits: p.traits,
      current_club: p.club,
      age,
      potential: overall,
    };
  });
}

/** Adiciona ao mercado de uma carreira existente os jogadores extras que ainda não estão lá. */
const synced = new Set<string>();
export async function syncExtraMarket(careerId: string, userId: string, clubName: string, clubSlug: string) {
  if (synced.has(careerId)) return;
  synced.add(careerId);
  const [{ data: m }, { data: s }] = await Promise.all([
    supabase.from("market_players").select("name").eq("career_id", careerId),
    supabase.from("squad_players").select("name").eq("career_id", careerId).eq("club_slug", clubSlug),
  ]);
  const skip = new Set([...(m ?? []), ...(s ?? [])].map((r) => r.name));
  const rows = buildExtraMarketRows(careerId, userId, clubName, skip);
  if (rows.length) await supabase.from("market_players").insert(rows);
}