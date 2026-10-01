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
    const age = (p.age ?? 0) + 1;
    const overall = Number(p.overall ?? 0);
    const potential = Math.max(overall, Number(p.potential ?? overall));
    const appearances = Number(p.appearances ?? 0);
    const minutes = Number(p.minutes ?? 0);
    const ratingSum = Number(p.rating_sum ?? 0);
    const averageRating = appearances > 0 ? ratingSum / appearances : 0;

    // Mais minutos + boa média = maior chance de desenvolvimento.
    const minutesFactor = Math.min(1, minutes / 2200);
    const performanceBonus = averageRating >= 7.4 ? 1 : averageRating >= 6.8 ? 0.5 : averageRating > 0 && averageRating < 6.0 ? -1 : 0;

    let delta = 0;
    if (age <= 20) delta = 1 + (minutesFactor >= 0.65 ? 1 : 0) + (averageRating >= 7.2 ? 1 : 0);
    else if (age <= 23) delta = 1 + (minutesFactor >= 0.7 ? 1 : 0) + (averageRating >= 7.3 ? 1 : 0);
    else if (age <= 26) delta = (minutesFactor >= 0.65 && averageRating >= 7.0) ? 1 : 0;
    else if (age <= 30) delta = performanceBonus >= 1 ? 1 : 0;
    else if (age <= 34) delta = performanceBonus >= 1 ? 0 : -1;
    else delta = -1 - (averageRating > 0 && averageRating < 6.2 ? 1 : 0);

    // Potencial limita o crescimento dos jogadores em evolução.
    const nextOverall = delta > 0
      ? Math.min(potential, overall + delta)
      : Math.max(1, overall + delta);

    await supabase.from("squad_players").update({
      age,
      overall: nextOverall,
      // Estatísticas de gols/cartões/minutos são da temporada e recomeçam zeradas.
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

  // Jogadores disponíveis no mercado também envelhecem para a nova temporada.
  const { data: marketPlayers } = await supabase
    .from("market_players")
    .select("id, age, overall, potential")
    .eq("career_id", careerId);

  for (const p of marketPlayers ?? []) {
    const age = (p.age ?? 0) + 1;
    const overall = Number(p.overall ?? 0);
    const potential = Math.max(overall, Number(p.potential ?? overall));
    let delta = 0;
    if (age <= 23) delta = potential > overall ? 1 : 0;
    else if (age >= 36) delta = -1;
    const nextOverall = delta > 0 ? Math.min(potential, overall + delta) : overall + delta;
    await supabase.from("market_players").update({ age, overall: Math.max(1, nextOverall) }).eq("id", p.id);
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
    const age = 25;
    const overall = ovrFromValue(p.value, age);
    return {
      career_id: careerId,
      user_id: userId,
      name: p.name,
      position: p.position,
      overall,
      market_value_eur: p.value,
      expected_wage_eur: wageFromValue(p.value, overall),
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