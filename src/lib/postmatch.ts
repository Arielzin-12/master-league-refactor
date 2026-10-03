import { supabase } from "@/integrations/supabase/client";

interface PM {
  careerId: string;
  userId: string;
  season: number;
  matchday: number;
  nextMatchday: number;
  clubName: string;
  opponent: string;
  home: boolean;
  gf: number;
  ga: number;
  result: "V" | "E" | "D";
  bonus: number;
  weeklyWages: number;
  players: { id: string; name: string; position: string }[];
  starters: string[];
  subsIn: { id: string; minute: number }[];
  subsOut: { id: string; minute: number }[];
  goals: Record<string, number>;
  assists: Record<string, number>;
  yellow: Record<string, number>;
  red: Record<string, number>;
  motmId: string | null;
  board: { board_confidence: number; fan_mood: number; squad_morale: number; reputation: number };
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const INJURIES: Array<[string, string, number]> = [
  ["Lesão muscular na coxa", "leve", 1],
  ["Entorse no tornozelo", "leve", 2],
  ["Estiramento na panturrilha", "média", 3],
  ["Lesão no joelho", "grave", 6],
];

/** Aplica tudo que muda na carreira após um jogo registrado pelo usuário. */
export async function applyPostMatch(p: PM) {
  const byId = new Map(p.players.map((x) => [x.id, x]));

  // 1) Cumprir suspensões e recuperar lesões que vencem nesta rodada
  const { data: activeSusp } = await supabase
    .from("suspensions").select("*").eq("career_id", p.careerId).eq("active", true);
  for (const s of activeSusp ?? []) {
    if (s.started_matchday >= p.matchday) continue;
    const served = s.matches_served + 1;
    const done = served >= s.matches_total;
    await supabase.from("suspensions").update({ matches_served: served, active: !done }).eq("id", s.id);
    await supabase.from("squad_players").update({ suspended_matches: Math.max(0, s.matches_total - served) }).eq("id", s.player_id);
  }
  const { data: injs } = await supabase
    .from("injuries").select("*").eq("career_id", p.careerId).eq("recovered", false).lte("returns_matchday", p.nextMatchday);
  for (const i of injs ?? []) {
    await supabase.from("injuries").update({ recovered: true }).eq("id", i.id);
    await supabase.from("squad_players").update({ injury_type: null, injury_severity: null, injury_returns_at_matchday: null }).eq("id", i.player_id);
  }
  // Libera quem não tem mais suspensão nem lesão
  const { data: blocked } = await supabase
    .from("squad_players").select("id, suspended_matches, injury_type, on_loan").eq("career_id", p.careerId).eq("injured", true);
  for (const b of blocked ?? []) {
    if (!b.on_loan && (b.suspended_matches ?? 0) === 0 && !b.injury_type) {
      await supabase.from("squad_players").update({ injured: false }).eq("id", b.id);
    }
  }

  // 2) Estatísticas individuais (jogos, minutos, MOTM, clean sheet, nota)
  const minutes = new Map<string, number>();
  for (const id of p.starters) minutes.set(id, 90);
  for (const s of p.subsOut) minutes.set(s.id, Math.min(90, s.minute));
  for (const s of p.subsIn) minutes.set(s.id, Math.max(1, 90 - s.minute));
  const { data: current } = await supabase
    .from("squad_players")
    .select("id, appearances, minutes, motm, clean_sheets, rating_sum")
    .in("id", [...minutes.keys()]);
  for (const c of current ?? []) {
    const pl = byId.get(c.id);
    const mins = minutes.get(c.id) ?? 0;
    let rating = 6.0 + (p.result === "V" ? 0.5 : p.result === "D" ? -0.5 : 0);
    rating += (p.goals[c.id] ?? 0) * 1 + (p.assists[c.id] ?? 0) * 0.5 - (p.red[c.id] ?? 0) * 1.5 - (p.yellow[c.id] ?? 0) * 0.3;
    if (p.motmId === c.id) rating += 1;
    rating = Math.max(3, Math.min(10, rating));
    const cleanSheet = p.ga === 0 && mins >= 60 && pl && /GOL|ZAG|LD|LE|GK|CB|LB|RB/i.test(pl.position);
    await supabase.from("squad_players").update({
      appearances: c.appearances + 1,
      minutes: c.minutes + mins,
      motm: c.motm + (p.motmId === c.id ? 1 : 0),
      clean_sheets: c.clean_sheets + (cleanSheet ? 1 : 0),
      rating_sum: Number(c.rating_sum) + rating,
    }).eq("id", c.id);
  }

  // 3) Suspensões novas (vermelho = 1 jogo; 3º amarelo já marcado pela tela de jogo)
  for (const [id, n] of Object.entries(p.red)) {
    const pl = byId.get(id);
    if (!pl || n <= 0) continue;
    await supabase.from("suspensions").insert({
      career_id: p.careerId, user_id: p.userId, player_id: id, player_name: pl.name,
      reason: "Cartão vermelho", matches_total: 1, matches_served: 0, started_matchday: p.matchday, active: true,
    });
    const { data: row } = await supabase.from("squad_players").select("red_cards_season").eq("id", id).maybeSingle();
    await supabase.from("squad_players").update({ suspended_matches: 1, red_cards_season: (row?.red_cards_season ?? 0) + 1, injured: true }).eq("id", id);
  }
  for (const [id, n] of Object.entries(p.yellow)) {
    const pl = byId.get(id);
    if (!pl || n <= 0 || (p.red[id] ?? 0) > 0) continue;
    const { data: row } = await supabase.from("squad_players").select("yellow_cards_season, injured, suspended_matches").eq("id", id).maybeSingle();
    // A tela de jogo zera o contador e marca injured ao chegar no 3º amarelo
    if (row && row.yellow_cards_season === 0 && row.injured && (row.suspended_matches ?? 0) === 0) {
      await supabase.from("suspensions").insert({
        career_id: p.careerId, user_id: p.userId, player_id: id, player_name: pl.name,
        reason: "3 cartões amarelos", matches_total: 1, matches_served: 0, started_matchday: p.matchday, active: true,
      });
      await supabase.from("squad_players").update({ suspended_matches: 1 }).eq("id", id);
    }
  }

  // 4) Lesões aleatórias: chance por jogador, não uma chance única por partida.
  // Base realista: 1,5% por jogador que atuou. Histórico de lesões: 2,5%.
  // Quem acabou de retornar de lesão recebe 1% nesta partida.
  const played = [...minutes.keys()];
  const { data: injuryHistory } = await supabase
    .from("injuries")
    .select("player_id, started_matchday, returns_matchday, recovered")
    .eq("career_id", p.careerId)
    .in("player_id", played);

  for (const id of played) {
    const pl = byId.get(id);
    if (!pl || pl.injured || pl.injury_type) continue;

    const history = (injuryHistory ?? []).filter((i) => i.player_id === id);
    const justReturned = history.some((i) => i.recovered && i.returns_matchday === p.matchday);
    const hasHistory = history.length > 0;
    const injuryChance = justReturned ? 0.01 : hasHistory ? 0.025 : 0.015;

    if (Math.random() >= injuryChance) continue;

    const [type, sev, games] = INJURIES[Math.floor(Math.random() * INJURIES.length)]!;
    const returns = p.matchday + games + 1;
    await supabase.from("injuries").insert({
      career_id: p.careerId, user_id: p.userId, player_id: id, player_name: pl.name,
      injury_type: type, severity: sev, started_matchday: p.matchday, returns_matchday: returns, recovered: false,
    });
    await supabase.from("squad_players").update({ injured: true, injury_type: type, injury_severity: sev, injury_returns_at_matchday: returns }).eq("id", id);
    await supabase.from("news_feed").insert({
      career_id: p.careerId, user_id: p.userId, kind: "headline",
      title: `🏥 ${pl.name} sofre lesão`,
      body: `${pl.name} saiu com ${type.toLowerCase()} (${sev}) contra o ${p.opponent} e deve voltar na rodada ${returns}.`,
    });
  }

  // 5) Finanças: folha salarial sai da reserva salarial, bônus entra no orçamento de transferências
  const tx = [
    { budget: "wages", category: "salarios", description: `Folha semanal — rodada ${p.matchday}`, amount_eur: -p.weeklyWages },
    { budget: "transfer", category: "bilheteria", description: `Receita de jogo vs ${p.opponent}`, amount_eur: p.home ? 1_200_000 : 0 },
  ];
  if (p.bonus > 0) tx.push({ budget: "transfer", category: "premiacao", description: `Bônus por vitória vs ${p.opponent}`, amount_eur: p.bonus });
  await supabase.from("financial_transactions").insert(
    tx.filter((t) => t.amount_eur !== 0).map((t) => ({ ...t, career_id: p.careerId, user_id: p.userId, season: p.season, matchday: p.matchday })),
  );

  // 6) Diretoria, torcida, elenco, reputação
  const diff = p.gf - p.ga;
  const d = p.result === "V" ? 3 + Math.min(diff, 3) : p.result === "E" ? 0 : -4 + Math.max(diff, -3);
  const board = {
    board_confidence: clamp(p.board.board_confidence + d),
    fan_mood: clamp(p.board.fan_mood + d * 1.5),
    squad_morale: clamp(p.board.squad_morale + d),
    reputation: clamp(p.board.reputation + (p.result === "V" ? 1 : p.result === "D" ? -1 : 0)),
  };

  // 7) Rede social: post baseado no resultado real + comentários
  await createMatchSocial(p);

  return board;
}

async function createMatchSocial(p: PM) {
  const score = p.home ? `${p.clubName} ${p.gf}x${p.ga} ${p.opponent}` : `${p.opponent} ${p.ga}x${p.gf} ${p.clubName}`;
  const scorers = Object.entries(p.goals).filter(([, n]) => n > 0).map(([id, n]) => {
    const name = p.players.find((x) => x.id === id)?.name ?? "";
    return n > 1 ? `${name} (${n})` : name;
  }).join(", ");
  const handle = p.clubName.toLowerCase().replace(/[^a-z]/g, "");
  const posts = [
    {
      author_type: "clube", author_name: p.clubName, author_handle: `@${handle}oficial`,
      body: `FIM DE JOGO | ${score}${scorers ? `\n⚽ ${scorers}` : ""}\nRodada ${p.matchday} do Brasileirão.`,
      comments: commentsFor(p, "clube"),
    },
    {
      author_type: "jornalista", author_name: "Setorista MasterLeague", author_handle: `@setorista_${handle}`,
      body: p.result === "V"
        ? `${p.clubName} vence o ${p.opponent} e ganha fôlego na tabela. Ambiente leve no vestiário.`
        : p.result === "E"
          ? `Empate entre ${p.clubName} e ${p.opponent}. Comissão técnica deve cobrar mais eficiência.`
          : `Derrota do ${p.clubName} para o ${p.opponent}. Pressão sobre o treinador aumenta.`,
      comments: commentsFor(p, "jornalista"),
    },
  ];
  for (const post of posts) {
    const { data } = await supabase.from("social_posts").insert({
      career_id: p.careerId, user_id: p.userId, matchday: p.matchday, context: "partida",
      author_type: post.author_type, author_name: post.author_name, author_handle: post.author_handle,
      body: post.body, likes: 200 + Math.floor(Math.random() * 5000),
    }).select("id").single();
    if (data) {
      await supabase.from("social_comments").insert(post.comments.map((c) => ({
        ...c, post_id: data.id, career_id: p.careerId, user_id: p.userId, likes: Math.floor(Math.random() * 400),
      })));
    }
  }
}

function commentsFor(p: PM, kind: string) {
  const top = Object.entries(p.goals).sort((a, b) => b[1] - a[1])[0];
  const hero = top ? p.players.find((x) => x.id === top[0])?.name : undefined;
  const fan = (body: string, i: number) => ({ author_type: "torcedor", author_name: `Torcedor ${i}`, author_handle: `@torcedor_${p.matchday}_${i}`, body });
  const rival = (body: string) => ({ author_type: "rival", author_name: `Torcedor do ${p.opponent}`, author_handle: `@rival_${p.matchday}`, body });
  if (p.result === "V") return [
    fan(hero ? `${hero} decidiu! Que jogador 🔥` : "Vitória com raça, é isso que a gente quer!", 1),
    fan(kind === "clube" ? "Três pontos importantíssimos, bora manter a sequência!" : "O treinador acertou na escalação hoje.", 2),
    rival(`Sorte de vocês hoje, no returno é diferente.`),
  ];
  if (p.result === "E") return [
    fan("Dava pra ter vencido, faltou capricho na frente.", 1),
    fan("Um ponto fora não é ruim, mas em casa tem que ganhar.", 2),
    rival("Saímos satisfeitos com o empate."),
  ];
  return [
    fan("Inaceitável! Precisa mudar alguma coisa já.", 1),
    fan(`Tomamos ${p.ga} gols, a defesa precisa de reforço urgente.`, 2),
    rival(`Aqui é ${p.opponent}! 😎`),
  ];
}
