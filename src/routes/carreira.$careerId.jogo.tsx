import type { ClubSlug } from "@/data/clubs";
import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { applyPostMatch } from "@/lib/postmatch";
import { advanceCareerSeason, generateManagerOffers } from "@/lib/career";
import { useEffect, useMemo, useState } from "react";
import { useCareer } from "@/lib/career-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  fanReaction,
  postMatchHeadline,
} from "@/lib/narrative";
import { isWindowOpen, isDerby, derbyName } from "@/lib/season";
import { resolveMatchday } from "@/lib/fixtures";
import { loadLineup, type SavedLineup } from "@/lib/lineup";
import { POSITION_ORDER, normalizePosition } from "@/data/squads";
import { toast } from "sonner";
import { Trophy, ChevronRight, Goal, HandHelping, Square, Plus, Minus, ArrowRightLeft, Flame, ClipboardList, Trash2, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { victoryBonus, buildIncomingOffers } from "@/lib/players";
import { pushAINews } from "@/lib/news";

interface SquadRow {
  id: string;
  name: string;
  position: string;
  overall: number;
  goals: number;
  assists: number;
  injured: boolean;
  age: number;
  market_value_eur: number;
  weekly_wage_eur: number;
  yellow_cards_season: number;
  morale: number;
  is_captain: boolean;
}

type StatKey = "goals" | "assists" | "yellow" | "red" | "defensive";

type GoalDetail = { playerId: string; minute: number; description: string };

const STAT_META: Record<StatKey, { label: string; icon: typeof Goal; color: string; bg: string }> = {
  goals:   { label: "Gols",         icon: Goal,         color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/40" },
  assists: { label: "Assistências", icon: HandHelping,  color: "text-sky-300",     bg: "bg-sky-500/15 border-sky-500/40" },
  yellow:  { label: "Amarelos",     icon: Square,       color: "text-yellow-300",  bg: "bg-yellow-500/15 border-yellow-500/40" },
  red:     { label: "Vermelhos",    icon: Square,       color: "text-red-400",     bg: "bg-red-500/15 border-red-500/40" },
  defensive: { label: "Defensivas", icon: Shield, color: "text-cyan-300", bg: "bg-cyan-500/15 border-cyan-500/40" },
};

export const Route = createFileRoute("/carreira/$careerId/jogo")({
  component: JogoPage,
});

function namesFromCount(rec: Record<string, number>, players: SquadRow[]): string {
  const parts: string[] = [];
  for (const [id, n] of Object.entries(rec)) {
    const p = players.find((x) => x.id === id);
    if (!p || n <= 0) continue;
    parts.push(n > 1 ? `${p.name} (${n})` : p.name);
  }
  return parts.join(", ");
}

function totalCount(rec: Record<string, number>) {
  return Object.values(rec).reduce((s, n) => s + n, 0);
}

function JogoPage() {
  const { career, club, refresh } = useCareer();
  const { careerId } = useParams({ from: "/carreira/$careerId/jogo" });
  const navigate = useNavigate();

  const [players, setPlayers] = useState<SquadRow[]>([]);
  const [lineup, setLineup] = useState<SavedLineup | null>(null);
  const opponent = lineup?.opponent ?? career.next_opponent ?? "Adversário";
  const home = lineup?.home ?? true;
  const [gf, setGf] = useState(0);
  const [ga, setGa] = useState(0);

  // Contagens por jogador
  const [goals, setGoals] = useState<Record<string, number>>({});
  const [assists, setAssists] = useState<Record<string, number>>({});
  const [yellow, setYellow] = useState<Record<string, number>>({});
  const [red, setRed] = useState<Record<string, number>>({});
  const [defensive, setDefensive] = useState<Record<string, number>>({});
  const [goalDetails, setGoalDetails] = useState<GoalDetail[]>([]);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [goalPlayerId, setGoalPlayerId] = useState("");
  const [goalMinute, setGoalMinute] = useState("");
  const [goalDescription, setGoalDescription] = useState("");

  // Substituições feitas durante o jogo (ao vivo).
  const [liveSubs, setLiveSubs] = useState<{ outId: string; inId: string; minute: number }[]>([]);
  const [subOutId, setSubOutId] = useState<string>("");
  const [subInId, setSubInId] = useState<string>("");
  const [subMinute, setSubMinute] = useState<number>(60);

  const [activeStat, setActiveStat] = useState<StatKey>("goals");
  const [position, setPosition] = useState(career.league_position);
  const [busy, setBusy] = useState(false);
  const [motmId, setMotmId] = useState("");
  const [notes, setNotes] = useState("");
  const [defensiveNotes, setDefensiveNotes] = useState("");

  const draftKey = `match-draft:${careerId}`;
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.gf !== undefined) setGf(d.gf);
        if (d.ga !== undefined) setGa(d.ga);
        if (d.goals) setGoals(d.goals);
        if (d.assists) setAssists(d.assists);
        if (d.yellow) setYellow(d.yellow);
        if (d.red) setRed(d.red);
        if (d.defensive) setDefensive(d.defensive);
        if (d.goalDetails) setGoalDetails(d.goalDetails);
        if (d.liveSubs) setLiveSubs(d.liveSubs);
        if (d.subOutId) setSubOutId(d.subOutId);
        if (d.subInId) setSubInId(d.subInId);
        if (d.subMinute) setSubMinute(d.subMinute);
        if (d.activeStat) setActiveStat(d.activeStat);
        if (d.position !== undefined) setPosition(d.position);
        if (d.motmId) setMotmId(d.motmId);
        if (d.notes) setNotes(d.notes);
        if (d.defensiveNotes) setDefensiveNotes(d.defensiveNotes);
      }
    } catch {}
    setDraftRestored(true);
  }, [draftKey]);

  useEffect(() => {
    if (!draftRestored || typeof window === "undefined") return;
    window.localStorage.setItem(draftKey, JSON.stringify({
      gf, ga, goals, assists, yellow, red, defensive, goalDetails, liveSubs, subOutId, subInId, subMinute,
      activeStat, position, motmId, notes, defensiveNotes, savedAt: Date.now(),
    }));
  }, [draftRestored, draftKey, gf, ga, goals, assists, yellow, red, defensive, goalDetails, liveSubs, subOutId, subInId, subMinute, activeStat, position, motmId, notes, defensiveNotes]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("squad_players")
        .select("id, name, position, overall, goals, assists, injured, age, market_value_eur, weekly_wage_eur, yellow_cards_season, morale, is_captain")
        .eq("career_id", careerId)
        .eq("club_slug", career.club_slug);
      setPlayers((data ?? []) as SquadRow[]);
    })();
    setLineup(loadLineup(careerId));
  }, [careerId, career.club_slug]);

  // Ordenado por posição (do gol ao centroavante) e depois por overall desc.
  const ordered = useMemo(
    () =>
      [...players].sort((a, b) => {
        const pa = POSITION_ORDER[normalizePosition(a.position)] ?? 99;
        const pb = POSITION_ORDER[normalizePosition(b.position)] ?? 99;
        if (pa !== pb) return pa - pb;
        return b.overall - a.overall;
      }),
    [players],
  );

  // Jogadores realmente disponíveis para registrar lances:
  // titulares + reservas que entraram em substituições durante o jogo.
  const lineupPlayers = useMemo(() => {
    if (!lineup) return [] as SquadRow[];
    const subInIds = new Set(liveSubs.map((s) => s.inId));
    const ids = new Set<string>([...lineup.starters, ...Array.from(subInIds)]);
    return ordered.filter((p) => ids.has(p.id));
  }, [ordered, lineup, liveSubs]);

  // Lista de quem está atualmente em campo (titulares - quem saiu + quem entrou).
  const onFieldIds = useMemo(() => {
    if (!lineup) return new Set<string>();
    const ids = new Set<string>(lineup.starters);
    for (const s of liveSubs) {
      ids.delete(s.outId);
      ids.add(s.inId);
    }
    return ids;
  }, [lineup, liveSubs]);

  // Reservas ainda disponíveis para entrar (no banco e que ainda não entraram).
  const benchAvailable = useMemo(() => {
    if (!lineup) return [] as SquadRow[];
    const usedIn = new Set(liveSubs.map((s) => s.inId));
    return ordered.filter((p) => lineup.bench.includes(p.id) && !usedIn.has(p.id));
  }, [ordered, lineup, liveSubs]);

  // Quem está em campo agora (para sair).
  const onFieldList = useMemo(
    () => ordered.filter((p) => onFieldIds.has(p.id)),
    [ordered, onFieldIds],
  );

  // Pré-seleciona valores padrão dos selects de substituição.
  useEffect(() => {
    if (!subOutId && onFieldList.length > 0) setSubOutId(onFieldList[0].id);
    if (!subInId && benchAvailable.length > 0) setSubInId(benchAvailable[0].id);
  }, [onFieldList, benchAvailable, subOutId, subInId]);

  const addLiveSub = () => {
    if (!subOutId || !subInId) {
      toast.error("Selecione quem sai e quem entra.");
      return;
    }
    if (subOutId === subInId) {
      toast.error("Jogador inválido.");
      return;
    }
    const minute = Math.max(1, Math.min(120, subMinute || 60));
    setLiveSubs((s) => [...s, { outId: subOutId, inId: subInId, minute }]);
    // Reseta seleção
    setSubOutId("");
    setSubInId("");
    setSubMinute(60);
    toast.success("Substituição registrada.");
  };

  const removeLiveSub = (idx: number) => {
    setLiveSubs((s) => s.filter((_, i) => i !== idx));
  };

  const stateFor = (key: StatKey) =>
    key === "goals" ? goals : key === "assists" ? assists : key === "yellow" ? yellow : key === "red" ? red : defensive;
  const setStateFor = (key: StatKey) =>
    key === "goals" ? setGoals : key === "assists" ? setAssists : key === "yellow" ? setYellow : key === "red" ? setRed : setDefensive;

  const openGoalDialog = (playerId: string) => {
    setGoalPlayerId(playerId);
    setGoalMinute("");
    setGoalDescription("");
    setGoalDialogOpen(true);
  };

  const confirmGoal = () => {
    const minute = Number.parseInt(goalMinute.replace(/'/g, "").trim(), 10);
    if (!Number.isFinite(minute) || minute < 1 || minute > 120) {
      toast.error("Informe um minuto válido entre 1 e 120.");
      return;
    }
    if (!goalDescription.trim()) {
      toast.error("Informe como foi o gol.");
      return;
    }
    const playerId = goalPlayerId;
    setGoals((current) => ({ ...current, [playerId]: (current[playerId] ?? 0) + 1 }));
    setGoalDetails((current) => [...current, { playerId, minute, description: goalDescription.trim() }]);
    setGoalDialogOpen(false);
  };

  const removeGoal = (playerId: string) => {
    setGoals((current) => {
      const next = { ...current };
      const value = Math.max(0, (next[playerId] ?? 0) - 1);
      if (value === 0) delete next[playerId];
      else next[playerId] = value;
      return next;
    });
    setGoalDetails((current) => {
      const index = [...current].map((g, i) => ({ ...g, i })).reverse().find((g) => g.playerId === playerId)?.i;
      return index === undefined ? current : current.filter((_, i) => i !== index);
    });
  };

  const bumpStat = (key: StatKey, playerId: string, delta: number) => {
    const current = stateFor(key);
    const setter = setStateFor(key);
    const nextVal = Math.max(0, (current[playerId] ?? 0) + delta);
    if (key === "red" && nextVal > 1) {
      toast.error("Um jogador só pode receber 1 vermelho.");
      return;
    }
    if (key === "defensive" && nextVal > 99) return;
    if (key === "yellow" && nextVal > 2) {
      toast.error("Máximo de 2 amarelos por jogador. O 2º amarelo já significa expulsão.");
      return;
    }
    setter({ ...current, [playerId]: nextVal });
    // 2 amarelos = expulsão automática (1 vermelho).
    if (key === "yellow" && nextVal === 2 && (red[playerId] ?? 0) === 0) {
      setRed((r) => ({ ...r, [playerId]: 1 }));
      const p = players.find((pp) => pp.id === playerId);
      if (p) toast.warning(`🟨🟨 ${p.name} levou o 2º amarelo e foi expulso!`);
    }
  };

  const submit = async () => {
    if (!lineup || lineup.starters.length !== 11) {
      toast.error("Escale 11 titulares antes de jogar.");
      navigate({ to: "/carreira/$careerId/escalacao", params: { careerId } });
      return;
    }
    if (!opponent.trim())   { toast.error("Adversário não definido."); return; }
    if (gf < 0 || ga < 0)   { toast.error("Placar inválido."); return; }

    const totalGoals = totalCount(goals);
    if (totalGoals > gf) {
      toast.error(`Você marcou ${totalGoals} gols, mas o placar diz ${gf}.`);
      return;
    }

    setBusy(true);
    const realResult: "V" | "E" | "D" = gf > ga ? "V" : gf < ga ? "D" : "E";
    const pointsDelta = realResult === "V" ? 3 : realResult === "E" ? 1 : 0;
    const bonus = realResult === "V" ? victoryBonus(gf, ga) : 0;
    const nextMatchday = career.matchday + 1;
    const windowStillOpen = isWindowOpen(nextMatchday);
    const wasOpen = career.transfer_window_open;
    const derby = isDerby(club.slug, opponent.trim());
    const dName = derbyName(club.slug, opponent.trim());

    const goalDetailsStr = goalDetails
      .map((g) => {
        const p = players.find((x) => x.id === g.playerId);
        return p ? `${p.name} aos ${g.minute}' — ${g.description}` : "";
      })
      .filter(Boolean)
      .join("; ");
    const scorersStr = namesFromCount(goals, players);
    const assistsStr = namesFromCount(assists, players);
    const yellowStr  = namesFromCount(yellow, players);
    const redStr     = namesFromCount(red, players);

    // === MORAL MISTA: base por resultado + ajuste individual ===
    const baseDelta = realResult === "V" ? (gf - ga >= 3 ? 8 : 5) : realResult === "E" ? -1 : (ga - gf >= 3 ? -10 : -6);
    const starterIds = new Set(lineup.starters);
    const onFieldFinal = new Set(onFieldIds); // já considera substituições
    for (const p of players) {
      let delta = 0;
      if (onFieldFinal.has(p.id)) delta += baseDelta;
      else if (starterIds.has(p.id)) delta += baseDelta; // titular que saiu
      else delta += Math.round(baseDelta * 0.4); // reservas/fora sentem menos
      delta += (goals[p.id] ?? 0) * 6;
      delta += (assists[p.id] ?? 0) * 3;
      delta -= (yellow[p.id] ?? 0) * 2;
      delta -= (red[p.id] ?? 0) * 12;
      if (p.is_captain) {
        delta = Math.round(delta * 1.3); // capitão sente mais
      }
      if (delta === 0) continue;
      const next = Math.max(5, Math.min(100, p.morale ?? 70) + delta);
      // Só atualiza se mudou
      if (next !== p.morale) {
        await supabase.from("squad_players").update({ morale: next }).eq("id", p.id);
      }
    }

    // Registra o resultado informado (inalterado) e simula os outros jogos da rodada.
    // A posição informada pelo treinador é a posição oficial registrada após a partida.
    // A tabela simulada continua sendo recalculada, mas não sobrescreve este valor.
    let finalPosition = Math.max(1, Math.min(20, Number(position) || career.league_position || 1));
    try {
      await resolveMatchday({
        careerId: career.id,
        userId: career.user_id,
        season: career.season,
        matchday: career.matchday,
        userClubName: club.name,
        opponent: opponent.trim(),
        home,
        goalsFor: gf,
        goalsAgainst: ga,
      });
    } catch {
      // Se o calendário ainda não existir, mantém a posição informada.
    }

    const { error: matchErr } = await supabase.from("matches").insert({
      career_id: career.id,
      user_id: career.user_id,
      matchday: career.matchday,
      opponent: opponent.trim(),
      home,
      goals_for: gf,
      goals_against: ga,
      scorers: scorersStr || null,
      assists: assistsStr || null,
      league_position_after: finalPosition,
      result: realResult,
      competition: "Brasileirão",
      motm_player_id: motmId || null,
      notes: [notes.trim(), goalDetailsStr ? `Gols: ${goalDetailsStr}` : "", totalCount(defensive) > 0 ? `Atuações defensivas: ${namesFromCount(defensive, players)}` : ""].filter(Boolean).join("\n") || null,
    });
    if (matchErr) { toast.error(matchErr.message); setBusy(false); return; }

    // Atualizar gols/assistências
    for (const [id, n] of Object.entries(goals)) {
      const p = players.find((x) => x.id === id);
      if (p && n > 0) await supabase.from("squad_players").update({ goals: p.goals + n }).eq("id", p.id);
    }
    for (const [id, n] of Object.entries(assists)) {
      const p = players.find((x) => x.id === id);
      if (p && n > 0) await supabase.from("squad_players").update({ assists: p.assists + n }).eq("id", p.id);
    }
    // Vermelho => suspenso (injured proxy)
    for (const [id, n] of Object.entries(red)) {
      if (n > 0) await supabase.from("squad_players").update({ injured: true }).eq("id", id);
    }

    // Amarelos da temporada: 3 amarelos em jogos diferentes => suspensão + reset.
    // 2 amarelos no mesmo jogo (já viraram vermelho acima) NÃO contam pro acumulado.
    for (const [id, n] of Object.entries(yellow)) {
      const p = players.find((x) => x.id === id);
      if (!p || n <= 0) continue;
      const tookRed = (red[id] ?? 0) > 0;
      if (tookRed) continue; // já está suspenso por vermelho; não acumula amarelo
      const newTotal = (p.yellow_cards_season ?? 0) + 1; // 1 amarelo por jogo conta
      if (newTotal >= 3) {
        // Suspensão por acúmulo: marca como injured (proxy de suspensão) e zera contador.
        await supabase
          .from("squad_players")
          .update({ yellow_cards_season: 0, injured: true })
          .eq("id", p.id);
        await pushAINews({
          careerId: career.id,
          userId: career.user_id,
          kind: "headline",
          hint: `Suspensão por acúmulo de cartões amarelos. ${p.name} recebeu o 3º amarelo da temporada e está fora da próxima rodada.`,
          context: { jogador: p.name, clube: club.name, posicao: p.position, rodada: career.matchday },
          fallbackTitle: `${p.name} suspenso por acúmulo de amarelos`,
          fallbackBody: `${p.name} recebeu o 3º cartão amarelo da temporada e está automaticamente suspenso para a próxima rodada do ${club.name}.`,
        });
      } else {
        await supabase
          .from("squad_players")
          .update({ yellow_cards_season: newTotal })
          .eq("id", p.id);
      }
    }

    let nextOpp = club.rivals[(career.matchday) % club.rivals.length] ?? "Adversário";
    const { data: nextFixture } = await supabase
      .from("fixtures")
      .select("home_club, away_club")
      .eq("career_id", career.id)
      .eq("season", career.season)
      .eq("matchday", nextMatchday)
      .eq("is_user_match", true)
      .maybeSingle();
    if (nextFixture) {
      nextOpp = nextFixture.home_club === club.name ? nextFixture.away_club : nextFixture.home_club;
    }

    // Retorno automático de jogadores emprestados cuja janela expirou.
    const { data: returningLoans } = await supabase
      .from("squad_players")
      .select("id, name, original_wage_eur, loan_to_club, loan_returns_at_matchday")
      .eq("career_id", career.id)
      .eq("on_loan", true)
      .lte("loan_returns_at_matchday", nextMatchday);
    if (returningLoans && returningLoans.length > 0) {
      for (const r of returningLoans) {
        await supabase
          .from("squad_players")
          .update({
            on_loan: false,
            loan_to_club: null,
            loan_returns_at_matchday: null,
            injured: false,
            weekly_wage_eur: r.original_wage_eur || 0,
          })
          .eq("id", r.id);
        await pushAINews({
          careerId: career.id,
          userId: career.user_id,
          kind: "transfer",
          hint: `${r.name} retorna ao ${club.name} após empréstimo no ${r.loan_to_club ?? "clube parceiro"}. Mostrar reapresentação.`,
          context: { jogador: r.name, clube: club.name, clube_origem: r.loan_to_club, rodada: nextMatchday },
          fallbackTitle: `${r.name} retorna de empréstimo`,
          fallbackBody: `Após período cedido ao ${r.loan_to_club ?? "clube parceiro"}, ${r.name} se reapresenta no ${club.name}.`,
        });
      }
    }

    const cx = career as typeof career & { board_confidence?: number; fan_mood?: number; squad_morale?: number; reputation?: number; total_matches?: number };
    let boardNext = {};
    try {
      boardNext = await applyPostMatch({
        careerId: career.id, userId: career.user_id, season: career.season,
        matchday: career.matchday, nextMatchday, clubName: club.name,
        opponent: opponent.trim(), home, gf, ga, result: realResult, bonus,
        weeklyWages: career.weekly_wages_eur,
        players: players.map((p) => ({ id: p.id, name: p.name, position: p.position })),
        starters: lineup?.starters ?? [],
        subsIn: liveSubs.map((s) => ({ id: s.inId, minute: s.minute })),
        subsOut: liveSubs.map((s) => ({ id: s.outId, minute: s.minute })),
        goals, assists, yellow, red, motmId: motmId || null,
        board: {
          board_confidence: cx.board_confidence ?? 60, fan_mood: cx.fan_mood ?? 60,
          squad_morale: cx.squad_morale ?? 70, reputation: cx.reputation ?? 50,
        },
      });
    } catch (e) {
      console.error("post-match", e);
    }

    const { error: cErr } = await supabase.from("careers").update({
      ...boardNext,
      total_matches: (cx.total_matches ?? 0) + 1,
      transfer_budget_eur: ((cx as { transfer_budget_eur?: number }).transfer_budget_eur ?? 0) + bonus + (home ? 1_200_000 : 0),
      matchday: nextMatchday,
      points: career.points + pointsDelta,
      played: career.played + 1,
      wins: career.wins + (realResult === "V" ? 1 : 0),
      draws: career.draws + (realResult === "E" ? 1 : 0),
      losses: career.losses + (realResult === "D" ? 1 : 0),
      goals_for: career.goals_for + gf,
      goals_against: career.goals_against + ga,
      league_position: finalPosition,
      next_opponent: nextOpp,
      cash_eur: career.cash_eur - career.weekly_wages_eur + bonus,
      transfer_window_open: windowStillOpen,
      transfer_window_closes_at: windowStillOpen ? career.transfer_window_closes_at : nextMatchday,
      updated_at: new Date().toISOString(),
    }).eq("id", career.id);
    if (cErr) { toast.error(cErr.message); setBusy(false); return; }

    // Mercado de treinadores: propostas aparecem após a 19ª e a 38ª rodada.
    if (career.matchday === 19 || career.matchday === 38) {
      try {
        await generateManagerOffers({
          careerId: career.id,
          userId: career.user_id,
          currentClubSlug: career.club_slug as ClubSlug,
          currentSeason: career.season,
          matchday: career.matchday,
          leaguePosition: finalPosition ?? career.league_position,
          phase: career.matchday === 19 ? "midseason" : "endseason",
        });
        toast.success(career.matchday === 19 ? "O mercado de treinadores se movimentou: novas propostas chegaram." : "A temporada terminou e novas propostas de clubes chegaram.");
      } catch (e) {
        console.error("manager offers", e);
      }
    }

    // Encerramento da temporada: envelhece todos os jogadores, aplica evolução
    // baseada em potencial/idade/desempenho e abre uma nova temporada.
    if (career.matchday === 38) {
      try {
        await advanceCareerSeason(career.id, career.user_id, club.name, career.season);
        toast.success(`Temporada ${career.season} encerrada. Elenco atualizado para a nova temporada.`);
      } catch (e) {
        console.error("season progression", e);
        toast.error("A temporada terminou, mas houve um erro ao preparar a próxima.");
      }
    }

    // Notícia rica e detalhada
    const localStr = home ? "em casa" : "como visitante";
    const xgStr = realResult === "V"
      ? `O ${club.name} construiu o resultado com autoridade ${localStr}, controlando os principais momentos da partida.`
      : realResult === "D"
      ? `O ${club.name} foi superado ${localStr}, falhando em transformar posse em chances claras.`
      : `Equipes se anularam em campo. O ${club.name} jogou ${localStr} sem encontrar o caminho da vitória.`;

    const scorersBlock = scorersStr
      ? `⚽ **Gols:** ${scorersStr}`
      : `⚽ **Gols:** Nenhum gol marcado pelo ${club.shortName}.`;
    const assistsBlock = assistsStr
      ? `🎯 **Assistências:** ${assistsStr}`
      : `🎯 **Assistências:** Sem assistências registradas.`;
    const cardsLines: string[] = [];
    if (yellowStr) cardsLines.push(`🟨 **Amarelos:** ${yellowStr}`);
    if (redStr)    cardsLines.push(`🟥 **Vermelhos:** ${redStr}`);
    const cardsBlock = cardsLines.length ? cardsLines.join("\n") : "🟨 **Cartões:** Partida sem cartões relevantes.";
    const defensiveBlock = defensiveNotes.trim()
      ? `🛡️ **Atuação defensiva:** ${defensiveNotes.trim()}`
      : "🛡️ **Atuação defensiva:** Nenhum destaque defensivo registrado.";

    const fan = fanReaction(gf, ga, derby);
    const bonusLine = bonus > 0
      ? `\n\n💰 **Bônus financeiro:** A diretoria liberou €${bonus.toLocaleString("pt-BR")} pelo desempenho ofensivo.`
      : "";
    const derbyLine = derby && dName
      ? `\n\n🔥 **${dName}:** Esse jogo entra para a história da rivalidade. ${
          realResult === "V" ? "Torcida vai cantar a semana inteira!" :
          realResult === "D" ? "Torcida cobra reação imediata." :
          "Empate em clássico tem gosto de pouco para os dois lados."
        }`
      : "";
    const subsLine = lineup.subs.length > 0
      ? `\n\n🔄 **Substituições programadas:** ${lineup.subs.map((s) => {
          const out = players.find((p) => p.id === s.outId)?.name ?? "?";
          const inn = players.find((p) => p.id === s.inId)?.name ?? "?";
          return `${s.minute}' ${out} ↔ ${inn}`;
        }).join(" • ")}`
      : "";
    const liveSubsLine = liveSubs.length > 0
      ? `\n\n🔄 **Substituições no jogo:** ${liveSubs.map((s) => {
          const out = players.find((p) => p.id === s.outId)?.name ?? "?";
          const inn = players.find((p) => p.id === s.inId)?.name ?? "?";
          return `${s.minute}' ↓ ${out} ↑ ${inn}`;
        }).join(" • ")}`
      : "";

    const detailedBody = [
      `**${club.name} ${gf} x ${ga} ${opponent.trim()}** — Rodada ${career.matchday} (${home ? "Casa" : "Fora"}).`,
      "",
      xgStr,
      "",
      scorersBlock,
      assistsBlock,
      cardsBlock,
      defensiveBlock,
      "",
      `📊 **Posição na tabela após o jogo:** ${position}º com ${career.points + pointsDelta} pontos em ${career.played + 1} jogos.`,
      `${fan}${bonusLine}${liveSubsLine}${subsLine}${derbyLine}`,
    ].join("\n");

    // Imagem da torcida pós-jogo (não bloqueante: se falhar segue sem imagem)
    let crowdImageUrl: string | null = null;
    try {
      const moodKind = derby
        ? (realResult === "V" ? "derby_win" : realResult === "D" ? "derby_loss" : "draw")
        : (realResult === "V" ? "win" : realResult === "D" ? "loss" : "draw");
      const { data: crowdData } = await supabase.functions.invoke("generate-crowd", {
        body: { mood: moodKind, clubName: club.name, scoreline: `${gf}x${ga}` },
      });
      if (crowdData?.image_url) crowdImageUrl = String(crowdData.image_url);
    } catch (e) {
      console.warn("crowd image skipped", e);
    }

    await pushAINews({
      careerId: career.id,
      userId: career.user_id,
      kind: "headline",
      hint: `Manchete pós-jogo da rodada ${career.matchday}. ${club.name} ${gf} x ${ga} ${opponent.trim()} (${home ? "casa" : "fora"}). Resultado: ${realResult}. ${derby && dName ? `Foi o ${dName}.` : ""} Inclua tom da torcida e impacto na tabela.`,
      context: {
        clube: club.name, adversario: opponent.trim(), placar_pro: gf, placar_contra: ga,
        mando: home ? "casa" : "fora", resultado: realResult, posicao_tabela: position,
        pontos_total: career.points + pointsDelta, rodada: career.matchday,
        derby: dName, gols: scorersStr, assistencias: assistsStr,
        amarelos: yellowStr, vermelhos: redStr,
        atuacao_defensiva: defensiveNotes.trim() || null,
        clean_sheet_equipe: ga === 0,
      },
      fallbackTitle: postMatchHeadline(opponent.trim(), gf, ga, club.name, club.slug),
      fallbackBody: detailedBody,
      imageUrl: crowdImageUrl,
    });

    if (bonus > 0) {
      await pushAINews({
        careerId: career.id,
        userId: career.user_id,
        kind: "finance",
        hint: `Diretoria do ${club.name} libera bônus de €${bonus.toLocaleString("pt-BR")} pela vitória de ${gf}x${ga} sobre o ${opponent.trim()}.`,
        context: { clube: club.name, bonus_eur: bonus, adversario: opponent.trim(), placar: `${gf}x${ga}` },
        fallbackTitle: `Diretoria libera €${bonus.toLocaleString("pt-BR")} após vitória`,
        fallbackBody: `Após a vitória por ${gf}x${ga} sobre o ${opponent.trim()}, o conselho do ${club.name} aprovou aporte extra de €${bonus.toLocaleString("pt-BR")}.`,
      });
    }

    if (redStr) {
      await pushAINews({
        careerId: career.id,
        userId: career.user_id,
        kind: "headline",
        hint: `Expulsão complica o ${club.shortName}: ${redStr} recebeu vermelho no jogo contra ${opponent.trim()} e fica fora da próxima rodada.`,
        context: { clube: club.name, expulsos: redStr, adversario: opponent.trim() },
        fallbackTitle: `Expulsão complica o ${club.shortName} contra o ${opponent.trim()}`,
        fallbackBody: `${redStr} recebeu cartão vermelho e ficará de fora da próxima rodada.`,
      });
    }

    if (wasOpen && !windowStillOpen) {
      await pushAINews({
        careerId: career.id,
        userId: career.user_id,
        kind: "transfer",
        hint: `Janela de transferências encerrada após a rodada ${career.matchday}. ${club.name} terá de competir com o elenco atual.`,
        context: { clube: club.name, rodada: career.matchday },
        fallbackTitle: "Janela de transferências encerrada",
        fallbackBody: `A federação encerrou oficialmente a janela após a rodada ${career.matchday}.`,
      });
    }
    if (!wasOpen && windowStillOpen) {
      await pushAINews({
        careerId: career.id,
        userId: career.user_id,
        kind: "transfer",
        hint: `Janela de transferências reaberta. ${club.name} tem 4 rodadas para reforçar o elenco.`,
        context: { clube: club.name, rodada: nextMatchday },
        fallbackTitle: "Janela de transferências reaberta",
        fallbackBody: `A janela voltou a abrir! O ${club.name} tem 4 rodadas para reforçar o elenco.`,
      });
    }

    if (windowStillOpen) {
      const offers = buildIncomingOffers(
        players.map((p) => ({
          id: p.id, name: p.name, overall: p.overall, age: p.age,
          market_value_eur: p.market_value_eur, weekly_wage_eur: p.weekly_wage_eur,
          goals: p.goals, assists: p.assists,
        })),
        nextMatchday,
        true,
      );
      if (offers.length > 0) {
        await supabase.from("incoming_offers").insert(
          offers.map((o) => ({
            ...o,
            career_id: career.id,
            user_id: career.user_id,
          })),
        );
        // Notícia por IA anunciando o assédio do mercado pelos nossos jogadores
        const targets = offers
          .map((o) => `${o.player_name} (${o.from_club}, ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(o.fee_eur)})`)
          .join("; ");
        await pushAINews({
          careerId: career.id,
          userId: career.user_id,
          kind: "transfer",
          hint: `Mercado se movimenta atrás de jogadores do ${club.name} após a rodada ${career.matchday}. Cite os alvos, clubes interessados e valores oferecidos. Tom: especulativo e jornalístico.`,
          context: {
            clube: club.name, rodada: career.matchday,
            alvos: targets,
            quantidade_propostas: offers.length,
          },
          fallbackTitle: `${club.shortName} recebe ${offers.length} proposta${offers.length > 1 ? "s" : ""} pelo elenco`,
          fallbackBody: `Após a rodada ${career.matchday}, clubes se movimentaram pelos jogadores do ${club.name}. Alvos: ${targets}.`,
        });
      }
    }

    toast.success("Resultado registrado!");
    if (bonus > 0) toast.success(`💰 Bônus por vitória: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "EUR" }).format(bonus)}`);
    if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
    await refresh();

    setBusy(false);
    navigate({ to: "/carreira/$careerId", params: { careerId } });
  };

  const activeRec = stateFor(activeStat);
  const derby = isDerby(club.slug, opponent);
  const dName = derbyName(club.slug, opponent);

  // Sem escalação salva: orienta o usuário a escalar primeiro.
  if (!lineup || lineup.starters.length !== 11) {
    return (
      <Card className="mx-auto max-w-2xl border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Escale o time antes do jogo
          </CardTitle>
          <CardDescription>
            Você precisa definir os 11 titulares, o banco e (opcionalmente) as substituições antes de registrar o resultado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/carreira/$careerId/escalacao" params={{ careerId }}>
              Ir para a escalação <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="w-full">
            <Link to="/carreira/$careerId" params={{ careerId }}>Voltar ao hub</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Escalação confirmada
          </CardTitle>
          <CardDescription>
            {lineup.starters.length} titulares • {lineup.bench.length} reservas •{" "}
            <Link
              to="/carreira/$careerId/escalacao"
              params={{ careerId }}
              className="text-primary underline-offset-2 hover:underline"
            >
              editar
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-border/40 bg-background/30 px-3 py-2 text-sm">
            <Trophy className="h-4 w-4 text-gold" />
            <span className="font-semibold">{club.shortName}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-semibold">{opponent}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {home ? "🏟️ Casa" : "✈️ Fora"}
            </Badge>
            {derby && dName && (
              <Badge variant="destructive" className="text-[10px]"><Flame className="mr-1 h-3 w-3" />{dName}</Badge>
            )}
          </div>
          <div className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Em campo</p>
            {ordered.filter((p) => onFieldIds.has(p.id)).map((p) => {
              const camePerSub = liveSubs.some((s) => s.inId === p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
                    camePerSub ? "border-emerald-500/40 bg-emerald-500/10" : "border-primary/40 bg-primary/10"
                  }`}
                >
                  <span className="w-10 rounded bg-muted px-1 py-0.5 text-center text-xs font-bold">{normalizePosition(p.position)}</span>
                  <span className="flex-1 truncate">{p.name}</span>
                  {camePerSub && <Badge variant="outline" className="text-[9px]">Entrou</Badge>}
                  <span className="text-sm font-bold text-primary">{p.overall}</span>
                </div>
              );
            })}
            {liveSubs.length > 0 && (
              <>
                <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Saíram do jogo</p>
                {liveSubs.map((s, i) => {
                  const out = players.find((p) => p.id === s.outId);
                  if (!out) return null;
                  return (
                    <div key={`out-${i}`} className="flex items-center gap-3 rounded-md border border-border/40 bg-background/30 px-3 py-2 opacity-70">
                      <span className="w-10 rounded bg-muted px-1 py-0.5 text-center text-xs font-bold">{normalizePosition(out.position)}</span>
                      <span className="flex-1 truncate text-sm line-through">{out.name}</span>
                      <span className="text-[10px] text-muted-foreground">saiu aos {s.minute}'</span>
                    </div>
                  );
                })}
              </>
            )}
            {lineup.bench.length > 0 && (
              <>
                <p className="mt-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Banco ({benchAvailable.length} disponíveis)
                </p>
                {ordered.filter((p) => lineup.bench.includes(p.id)).map((p) => {
                  const used = liveSubs.some((s) => s.inId === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 rounded-md border border-border/40 bg-background/30 px-3 py-2 ${used ? "opacity-50" : ""}`}
                    >
                      <span className="w-10 rounded bg-muted px-1 py-0.5 text-center text-xs font-bold">{normalizePosition(p.position)}</span>
                      <span className="flex-1 truncate text-sm">{p.name}</span>
                      {used && <Badge variant="outline" className="text-[9px]">Em campo</Badge>}
                      <span className="text-sm font-bold text-muted-foreground">{p.overall}</span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-gold" /> Resultado</CardTitle>
          <CardDescription>Você define cada placar e cada lance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{club.shortName}</Label>
              <Input type="number" min={0} value={gf} onChange={(e) => setGf(parseInt(e.target.value) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label>{(opponent || "ADV").slice(0, 3).toUpperCase()}</Label>
              <Input type="number" min={0} value={ga} onChange={(e) => setGa(parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lances do jogo</Label>
            <div className="grid grid-cols-4 gap-1">
              {(Object.keys(STAT_META) as StatKey[]).map((key) => {
                const meta = STAT_META[key];
                const Icon = meta.icon;
                const total = totalCount(stateFor(key));
                const isActive = activeStat === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveStat(key)}
                    className={`flex flex-col items-center gap-1 rounded-md border p-2 text-xs transition ${
                      isActive ? meta.bg : "border-border/40 bg-background/30 hover:bg-background/60"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                    <span className="font-semibold">{meta.label}</span>
                    <span className={`text-sm font-bold ${meta.color}`}>{total}</span>
                  </button>
                );
              })}
            </div>

            {lineupPlayers.length === 0 ? (
              <p className="rounded-md border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground">
                Carregando elenco da escalação...
              </p>
            ) : (
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-border/40 bg-background/20 p-2">
                {lineupPlayers.map((p) => {
                  const count = activeRec[p.id] ?? 0;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition ${
                        count > 0 ? STAT_META[activeStat].bg : "hover:bg-background/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => activeStat === "goals" ? openGoalDialog(p.id) : bumpStat(activeStat, p.id, 1)}
                        className="flex flex-1 items-center gap-2 text-left"
                      >
                        <span className="w-9 rounded bg-muted px-1 py-0.5 text-center text-[10px] font-bold">{p.position}</span>
                        <span className="flex-1 truncate">{p.name}</span>
                        {count > 0 && (
                          <Badge variant="outline" className={`${STAT_META[activeStat].color} border-current`}>
                            ×{count}
                          </Badge>
                        )}
                      </button>
                      {count > 0 && activeStat !== "goals" && (
                        <button
                          type="button"
                          onClick={() => bumpStat(activeStat, p.id, -1)}
                          className="rounded p-1 text-muted-foreground hover:bg-background/60"
                          aria-label="Remover um"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                      )}
                      {activeStat !== "goals" && <button
                        type="button"
                        onClick={() => bumpStat(activeStat, p.id, 1)}
                        className="rounded p-1 text-muted-foreground hover:bg-background/60"
                        aria-label="Adicionar um"
                      >
                        <Plus className="h-3 w-3" />
                      </button>}
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Dica: clique no jogador para adicionar +1 do lance selecionado. Clique de novo para somar.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Posição na tabela após o jogo</Label>
            <Input type="number" min={1} max={20} value={position} onChange={(e) => setPosition(parseInt(e.target.value) || 1)} />
          </div>

          <div className="space-y-2 rounded-md border border-border/40 bg-background/20 p-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <Label className="m-0">Substituições no jogo</Label>
              <span className="ml-auto text-[10px] text-muted-foreground">
                {liveSubs.length} feita{liveSubs.length === 1 ? "" : "s"}
              </span>
            </div>

            {liveSubs.length > 0 && (
              <div className="space-y-1">
                {liveSubs.map((s, i) => {
                  const out = players.find((p) => p.id === s.outId);
                  const inn = players.find((p) => p.id === s.inId);
                  return (
                    <div key={i} className="flex items-center gap-2 rounded border border-border/40 bg-background/40 px-2 py-1.5 text-xs">
                      <span className="font-bold text-muted-foreground">{s.minute}'</span>
                      <span className="text-destructive-foreground">↓ {out?.name ?? "?"}</span>
                      <span className="text-primary">↑ {inn?.name ?? "?"}</span>
                      <button
                        type="button"
                        onClick={() => removeLiveSub(i)}
                        className="ml-auto rounded p-1 text-muted-foreground hover:bg-background/60 hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {benchAvailable.length === 0 ? (
              <p className="rounded border border-dashed border-border/40 p-2 text-center text-[11px] text-muted-foreground">
                Sem reservas disponíveis para substituições.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-[1fr,1fr,80px,auto]">
                <div className="space-y-1">
                  <Label className="text-[10px]">Sai</Label>
                  <Select value={subOutId} onValueChange={setSubOutId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {onFieldList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {normalizePosition(p.position)} • {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Entra</Label>
                  <Select value={subInId} onValueChange={setSubInId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {benchAvailable.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {normalizePosition(p.position)} • {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Min.</Label>
                  <Input
                    className="h-8 text-xs"
                    type="number"
                    min={1}
                    max={120}
                    value={subMinute}
                    onChange={(e) => setSubMinute(parseInt(e.target.value) || 60)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" size="sm" onClick={addLiveSub} className="h-8 w-full md:w-auto">
                    <Plus className="mr-1 h-3 w-3" /> Substituir
                  </Button>
                </div>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Quem entrar fica disponível para registrar gols, assistências e cartões.
            </p>
          </div>

          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm">
            <div className="font-semibold">🧤 Clean sheet</div>
            <p className="mt-1 text-xs text-muted-foreground">{ga === 0 ? "Sim — o time não sofreu gols. Goleiros e defensores elegíveis terão o clean sheet contabilizado automaticamente." : "Não — o adversário marcou pelo menos um gol."}</p>
          </div>

          <div className="space-y-2 rounded-md border border-border/40 bg-background/20 p-3">
            <Label>🛡️ Atuação defensiva</Label>
            <p className="text-[10px] text-muted-foreground">Registre as ações defensivas diretamente nos jogadores acima. Cada clique adiciona +1, no mesmo padrão de gols, assistências e cartões.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Melhor em campo</span>
              <select value={motmId} onChange={(e) => setMotmId(e.target.value)} className="h-9 w-full rounded-md border border-border bg-background px-2">
                <option value="">— Sem escolha —</option>
                {lineupPlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Observações</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: gol no fim, pênalti perdido..." className="h-9 w-full rounded-md border border-border bg-background px-2" />
            </label>
          </div>

          <Button onClick={submit} disabled={busy} size="lg" className="w-full">
            {busy ? "Registrando..." : "Confirmar resultado"} <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar gol</DialogTitle>
            <DialogDescription>Informe o minuto e como foi o gol.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="goal-minute">Minuto</Label>
              <Input id="goal-minute" value={goalMinute} onChange={(e) => setGoalMinute(e.target.value)} placeholder="12' ou 12" inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goal-description">Como foi o gol?</Label>
              <Input id="goal-description" value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} placeholder="Ex.: cavadinha, no ângulo, de falta..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setGoalDialogOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={confirmGoal}>Adicionar gol</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
