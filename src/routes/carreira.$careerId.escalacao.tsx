import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useCareer } from "@/lib/career-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isDerby, derbyName } from "@/lib/season";
import {
  loadLineup,
  loadLineupSchemes,
  saveLineup,
  saveLineupScheme,
  type FormationId,
  type PitchPoint,
  type SavedLineup,
  type SavedLineupScheme,
} from "@/lib/lineup";
import { toast } from "sonner";
import { ArrowRight, Flame, Save, Star, Trophy, Users } from "lucide-react";
import { POSITION_ORDER, POSITION_LIST, POSITION_LABEL, normalizePosition, type Position } from "@/data/squads";

interface SquadRow {
  id: string;
  name: string;
  position: string;
  overall: number;
  injured: boolean;
  is_captain: boolean;
  face_url: string | null;
}

const FORMATION_OPTIONS: Array<{ value: FormationId; label: string }> = [
  { value: "4-3-3", label: "4-3-3" },
  { value: "4-2-3-1", label: "4-2-3-1" },
  { value: "4-4-2", label: "4-4-2" },
  { value: "3-5-2", label: "3-5-2" },
  { value: "3-4-3", label: "3-4-3" },
  { value: "5-3-2", label: "5-3-2" },
];

const FORMATION_POINTS: Record<FormationId, PitchPoint[]> = {
  "4-3-3": [
    { x: 50, y: 88 },
    { x: 18, y: 70 }, { x: 39, y: 74 }, { x: 61, y: 74 }, { x: 82, y: 70 },
    { x: 27, y: 51 }, { x: 50, y: 56 }, { x: 73, y: 51 },
    { x: 18, y: 27 }, { x: 50, y: 22 }, { x: 82, y: 27 },
  ],
  "4-2-3-1": [
    { x: 50, y: 88 },
    { x: 18, y: 70 }, { x: 39, y: 74 }, { x: 61, y: 74 }, { x: 82, y: 70 },
    { x: 39, y: 57 }, { x: 61, y: 57 },
    { x: 20, y: 39 }, { x: 50, y: 41 }, { x: 80, y: 39 },
    { x: 50, y: 18 },
  ],
  "4-4-2": [
    { x: 50, y: 88 },
    { x: 18, y: 70 }, { x: 39, y: 74 }, { x: 61, y: 74 }, { x: 82, y: 70 },
    { x: 17, y: 49 }, { x: 39, y: 52 }, { x: 61, y: 52 }, { x: 83, y: 49 },
    { x: 39, y: 23 }, { x: 61, y: 23 },
  ],
  "3-5-2": [
    { x: 50, y: 88 },
    { x: 25, y: 72 }, { x: 50, y: 75 }, { x: 75, y: 72 },
    { x: 12, y: 50 }, { x: 31, y: 54 }, { x: 50, y: 57 }, { x: 69, y: 54 }, { x: 88, y: 50 },
    { x: 40, y: 23 }, { x: 60, y: 23 },
  ],
  "3-4-3": [
    { x: 50, y: 88 },
    { x: 25, y: 72 }, { x: 50, y: 75 }, { x: 75, y: 72 },
    { x: 18, y: 49 }, { x: 39, y: 53 }, { x: 61, y: 53 }, { x: 82, y: 49 },
    { x: 18, y: 27 }, { x: 50, y: 22 }, { x: 82, y: 27 },
  ],
  "5-3-2": [
    { x: 50, y: 88 },
    { x: 10, y: 70 }, { x: 30, y: 74 }, { x: 50, y: 76 }, { x: 70, y: 74 }, { x: 90, y: 70 },
    { x: 25, y: 50 }, { x: 50, y: 55 }, { x: 75, y: 50 },
    { x: 40, y: 23 }, { x: 60, y: 23 },
  ],
};

const ROLE_OPTIONS = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Ala",
  "Volante",
  "Meia central",
  "Armador",
  "Ponta",
  "Segundo atacante",
  "Centroavante",
];

function defaultRole(position: string) {
  const normalized = normalizePosition(position);
  if (normalized === "GOL") return "Goleiro";
  if (normalized === "ZAG") return "Zagueiro";
  if (normalized === "LAT") return "Lateral";
  if (normalized === "VOL" || normalized === "MDF") return "Volante";
  if (normalized === "MCT") return "Meia central";
  if (normalized === "MAT") return "Armador";
  if (normalized === "PTA") return "Ponta";
  return "Centroavante";
}

function makeDefaultRoles(players: SquadRow[]) {
  return Object.fromEntries(players.map((player) => [player.id, defaultRole(player.position)]));
}

function roleRank(position: string) {
  const normalized = normalizePosition(position);
  if (normalized === "GOL") return 0;
  if (normalized === "ZAG" || normalized === "LAT") return 1;
  if (normalized === "VOL" || normalized === "MDF" || normalized === "MCT") return 2;
  return 3;
}

function clampPercentage(value: number) {
  return Math.max(8, Math.min(92, value));
}

function buildDefaultPositions(ids: string[], formation: FormationId, players: SquadRow[]) {
  const playerIndex = new Map(players.map((player, index) => [player.id, index]));
  const sortedIds = [...ids].sort((a, b) => {
    const aPlayer = players.find((player) => player.id === a);
    const bPlayer = players.find((player) => player.id === b);
    const rankDifference = roleRank(aPlayer?.position ?? "") - roleRank(bPlayer?.position ?? "");
    if (rankDifference !== 0) return rankDifference;
    return (playerIndex.get(a) ?? 0) - (playerIndex.get(b) ?? 0);
  });
  const points = FORMATION_POINTS[formation];
  return Object.fromEntries(sortedIds.slice(0, 11).map((id, index) => [id, points[index] ?? { x: 50, y: 50 }]));
}

function mergePositions(
  ids: string[],
  formation: FormationId,
  savedPositions: Record<string, PitchPoint> | undefined,
  players: SquadRow[],
) {
  const defaults = buildDefaultPositions(ids, formation, players);
  const result: Record<string, PitchPoint> = { ...defaults };
  for (const id of ids) {
    const point = savedPositions?.[id];
    if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
      result[id] = { x: clampPercentage(point.x), y: clampPercentage(point.y) };
    }
  }
  return result;
}

function playerInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function PlayerFace({ player, className = "" }: { player: Pick<SquadRow, "name" | "face_url">; className?: string }) {
  const [failed, setFailed] = useState(false);
  const hasFace = Boolean(player.face_url) && !failed;

  return (
    <div className={"flex shrink-0 items-center justify-center overflow-hidden border border-white/20 bg-slate-900 font-black text-white shadow " + className}>
      {hasFace ? (
        <img
          src={player.face_url as string}
          alt={"Rosto de " + player.name}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="select-none text-xs tracking-wide">{playerInitials(player.name)}</span>
      )}
    </div>
  );
}

export const Route = createFileRoute("/carreira/$careerId/escalacao")({
  component: EscalacaoPage,
});

function EscalacaoPage() {
  const { career, club } = useCareer();
  const { careerId } = useParams({ from: "/carreira/$careerId/escalacao" });
  const navigate = useNavigate();

  const [players, setPlayers] = useState<SquadRow[]>([]);
  const [starters, setStarters] = useState<Set<string>>(new Set());
  const [bench, setBench] = useState<Set<string>>(new Set());
  const [captainId, setCaptainId] = useState("");
  const [opponent, setOpponent] = useState(career.next_opponent ?? club.rivals[0] ?? "Adversário");
  const [home, setHome] = useState(true);
  const [formation, setFormation] = useState<FormationId>("4-3-3");
  const [pitchPositions, setPitchPositions] = useState<Record<string, PitchPoint>>({});
  const [playerRoles, setPlayerRoles] = useState<Record<string, string>>({});
  const [savedSchemes, setSavedSchemes] = useState<SavedLineupScheme[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [selectedStarterId, setSelectedStarterId] = useState("");
  const pitchRef = useRef<HTMLDivElement>(null);
  const draggingIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadPlayers = async () => {
      const { data, error } = await supabase
        .from("squad_players")
        .select("id, name, position, overall, injured, is_captain, face_url")
        .eq("career_id", careerId)
        .eq("club_slug", career.club_slug);

      if (!active) return;
      if (error) {
        toast.error(error.message);
        return;
      }

      const rows = (data ?? []) as SquadRow[];
      setPlayers(rows);
      setPlayerRoles(makeDefaultRoles(rows));
      setSavedSchemes(loadLineupSchemes(careerId));
      const captain = rows.find((player) => player.is_captain);
      setCaptainId(captain?.id ?? "");
    };

    void loadPlayers();
    return () => {
      active = false;
    };
  }, [careerId, career.club_slug]);

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

  const groupedPlayers = useMemo(() => {
    const groups = new Map<Position, SquadRow[]>();
    for (const position of POSITION_LIST) groups.set(position, []);
    for (const player of ordered) {
      const position = normalizePosition(player.position);
      groups.get(position)?.push(player);
    }
    return groups;
  }, [ordered]);

  const startersList = useMemo(() => ordered.filter((player) => starters.has(player.id)), [ordered, starters]);
  const benchList = useMemo(() => ordered.filter((player) => bench.has(player.id)), [ordered, bench]);
  const selectedStarter = startersList.find((player) => player.id === selectedStarterId) ?? startersList[0];
  const derby = isDerby(club.slug, opponent.trim());
  const dName = derbyName(club.slug, opponent.trim());

  const toggleStarter = (id: string) => {
    const player = players.find((item) => item.id === id);
    if (player?.injured) {
      toast.error("Jogadores lesionados não podem ser escalados.");
      return;
    }

    const next = new Set(starters);
    if (next.has(id)) {
      next.delete(id);
      setStarters(next);
      setPitchPositions(buildDefaultPositions(ordered.filter((item) => next.has(item.id)).map((item) => item.id), formation, ordered));
      if (captainId === id) setCaptainId("");
      if (selectedStarterId === id) setSelectedStarterId(Array.from(next)[0] ?? "");
      return;
    }

    if (next.size >= 11) {
      toast.error("Máximo de 11 titulares.");
      return;
    }
    next.add(id);
    setStarters(next);
    setBench((current) => {
      const updated = new Set(current);
      updated.delete(id);
      return updated;
    });
    setPitchPositions(buildDefaultPositions(ordered.filter((item) => next.has(item.id)).map((item) => item.id), formation, ordered));
    setSelectedStarterId(id);
  };

  const toggleBench = (id: string) => {
    if (starters.has(id)) {
      toast.error("Esse jogador já é titular.");
      return;
    }
    const player = players.find((item) => item.id === id);
    if (player?.injured) {
      toast.error("Jogadores lesionados não podem ficar disponíveis no banco.");
      return;
    }
    const next = new Set(bench);
    if (next.has(id)) {
      next.delete(id);
      setBench(next);
      return;
    }
    if (next.size >= 10) {
      toast.error("Máximo de 10 reservas.");
      return;
    }
    next.add(id);
    setBench(next);
  };

  const changeFormation = (nextFormation: FormationId) => {
    setFormation(nextFormation);
    setPitchPositions(
      buildDefaultPositions(
        ordered.filter((player) => starters.has(player.id)).map((player) => player.id),
        nextFormation,
        ordered,
      ),
    );
  };

  const handlePitchPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const token = target.closest("[data-player-id]") as HTMLElement | null;
    const id = token?.dataset.playerId;
    if (!id || !starters.has(id)) return;

    draggingIdRef.current = id;
    setSelectedStarterId(id);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is not supported in every embedded browser.
    }
  };

  const handlePitchPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const id = draggingIdRef.current;
    const field = pitchRef.current;
    if (!id || !field) return;

    const rect = field.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    setPitchPositions((current) => ({
      ...current,
      [id]: {
        x: clampPercentage(((event.clientX - rect.left) / rect.width) * 100),
        y: clampPercentage(((event.clientY - rect.top) / rect.height) * 100),
      },
    }));
  };

  const handlePitchPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    draggingIdRef.current = null;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Ignore pointer-capture cleanup failures.
    }
  };

  const buildSavedLineup = (): SavedLineup => ({
    matchday: career.matchday,
    starters: startersList.map((player) => player.id),
    bench: benchList.map((player) => player.id),
    subs: [],
    opponent: opponent.trim(),
    home,
    captainId: captainId || undefined,
    formation,
    positions: Object.fromEntries(
      startersList.map((player) => [player.id, pitchPositions[player.id] ?? { x: 50, y: 50 }]),
    ),
    roles: Object.fromEntries(
      players.map((player) => [player.id, playerRoles[player.id] ?? defaultRole(player.position)]),
    ),
  });

  const saveStartingTeam = () => {
    if (starters.size !== 11) {
      toast.error("Escale exatamente 11 titulares antes de salvar o time.");
      return;
    }
    saveLineup(careerId, buildSavedLineup());
    toast.success("Time titular salvo com formação, posições e funções.");
  };

  const restoreStartingTeam = () => {
    const saved = loadLineup(careerId);
    if (!saved) {
      toast.error("Nenhum time titular salvo foi encontrado.");
      return;
    }

    const availableIds = new Set(players.filter((player) => !player.injured).map((player) => player.id));
    const restoredStarters = Array.from(new Set(saved.starters.filter((id) => availableIds.has(id)))).slice(0, 11);
    const restoredStartersSet = new Set(restoredStarters);
    const restoredBench = Array.from(new Set(saved.bench.filter((id) => availableIds.has(id) && !restoredStartersSet.has(id)))).slice(0, 10);
    const restoredFormation = saved.formation && FORMATION_OPTIONS.some((option) => option.value === saved.formation)
      ? saved.formation
      : "4-3-3";

    setFormation(restoredFormation);
    setStarters(restoredStartersSet);
    setBench(new Set(restoredBench));
    setPitchPositions(mergePositions(restoredStarters, restoredFormation, saved.positions, players));
    setPlayerRoles({
      ...makeDefaultRoles(players),
      ...Object.fromEntries(players.filter((player) => saved.roles?.[player.id]).map((player) => [player.id, saved.roles?.[player.id] as string])),
    });
    setCaptainId(saved.captainId && restoredStartersSet.has(saved.captainId) ? saved.captainId : "");
    setOpponent(saved.opponent || opponent);
    setHome(saved.home);
    setSelectedStarterId(restoredStarters[0] ?? "");

    if (restoredStarters.length !== 11) {
      toast.warning("Time recuperado parcialmente: confira jogadores removidos ou lesionados e complete os 11 titulares.");
    } else {
      toast.success("Time titular restaurado, incluindo formação, posições e funções.");
    }
  };

  const saveScheme = () => {
    const name = schemeName.trim();
    if (starters.size !== 11) {
      toast.error("Escale 11 titulares antes de salvar um esquema.");
      return;
    }
    if (!name) {
      toast.error("Dê um nome ao esquema para encontrá-lo depois.");
      return;
    }

    const lineup = buildSavedLineup();
    const next = saveLineupScheme(careerId, {
      name,
      formation,
      starters: lineup.starters,
      positions: lineup.positions ?? {},
      roles: lineup.roles ?? {},
    });
    setSavedSchemes(next);
    setSelectedSchemeId(next[0]?.id ?? "");
    setSchemeName("");
    toast.success("Esquema salvo para reutilização.");
  };

  const applyScheme = () => {
    const scheme = savedSchemes.find((item) => item.id === selectedSchemeId);
    if (!scheme) {
      toast.error("Selecione um esquema salvo.");
      return;
    }

    const availableIds = new Set(players.filter((player) => !player.injured).map((player) => player.id));
    const restoredStarters = Array.from(new Set(scheme.starters.filter((id) => availableIds.has(id)))).slice(0, 11);
    if (restoredStarters.length === 0) {
      toast.error("Nenhum titular desse esquema está mais disponível no elenco.");
      return;
    }
    const restoredStartersSet = new Set(restoredStarters);

    setFormation(scheme.formation);
    setStarters(restoredStartersSet);
    setBench((current) => new Set(Array.from(current).filter((id) => !restoredStartersSet.has(id))));
    setPitchPositions(mergePositions(restoredStarters, scheme.formation, scheme.positions, players));
    setPlayerRoles({
      ...makeDefaultRoles(players),
      ...Object.fromEntries(players.filter((player) => scheme.roles[player.id]).map((player) => [player.id, scheme.roles[player.id]])),
    });
    setCaptainId((current) => (current && restoredStartersSet.has(current) ? current : ""));
    setSelectedStarterId(restoredStarters[0] ?? "");

    if (restoredStarters.length !== 11) {
      toast.warning("Esquema aplicado parcialmente porque alguns jogadores não estão mais disponíveis.");
    } else {
      toast.success("Formação e organização do esquema aplicadas.");
    }
  };

  const proceed = async () => {
    if (starters.size !== 11) {
      toast.error("Escale 11 titulares (" + starters.size + "/11).");
      return;
    }
    if (!opponent.trim()) {
      toast.error("Informe o adversário.");
      return;
    }
    if (captainId && !starters.has(captainId)) {
      toast.error("O capitão precisa estar entre os titulares.");
      return;
    }

    const { error: clearCaptainError } = await supabase
      .from("squad_players")
      .update({ is_captain: false })
      .eq("career_id", careerId)
      .eq("club_slug", career.club_slug);
    if (clearCaptainError) {
      toast.error(clearCaptainError.message);
      return;
    }
    if (captainId) {
      const { error } = await supabase.from("squad_players").update({ is_captain: true }).eq("id", captainId);
      if (error) {
        toast.error(error.message);
        return;
      }
    }

    saveLineup(careerId, buildSavedLineup());
    toast.success("Escalação confirmada! Hora do jogo.");
    await navigate({ to: "/carreira/$careerId/jogo", params: { careerId } });
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-gold" /> Próximo confronto
          </CardTitle>
          <CardDescription>Defina o adversário e o mando antes de escalar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Adversário</Label>
            <Input value={opponent} onChange={(event) => setOpponent(event.target.value)} list="rivals-list" />
            <datalist id="rivals-list">
              {club.rivals.map((rival) => <option key={rival} value={rival} />)}
            </datalist>
            {derby && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                <Flame className="h-4 w-4" />
                <span><strong>{dName}!</strong> Esse jogo vale o orgulho da torcida.</span>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Mando</Label>
            <Select value={home ? "home" : "away"} onValueChange={(value) => setHome(value === "home")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Em casa 🏟️</SelectItem>
                <SelectItem value="away">Fora ✈️</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Campo e titulares</CardTitle>
              <CardDescription>
                Titulares: {starters.size}/11 • Reservas: {bench.size}/10. Arraste cada jogador para ajustar o posicionamento.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={saveStartingTeam} disabled={starters.size !== 11}>
                <Save className="mr-1.5 h-4 w-4" /> Salvar time titular
              </Button>
              <Button variant="outline" size="sm" onClick={restoreStartingTeam}>
                Colocar time titular
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border border-border/40 bg-background/30 p-3 md:grid-cols-[180px_minmax(0,1fr)] md:items-end">
            <div className="space-y-1.5">
              <Label>Formação</Label>
              <Select value={formation} onValueChange={(value) => changeFormation(value as FormationId)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
              <Input
                value={schemeName}
                onChange={(event) => setSchemeName(event.target.value)}
                placeholder="Nome do esquema (ex.: Pressão alta)"
                aria-label="Nome do esquema"
                maxLength={60}
              />
              <Button variant="outline" size="sm" onClick={saveScheme} disabled={starters.size !== 11}>
                Salvar esquema
              </Button>
              <Button variant="outline" size="sm" onClick={applyScheme} disabled={!selectedSchemeId || savedSchemes.length === 0}>
                Aplicar esquema
              </Button>
            </div>
          </div>

          {savedSchemes.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label className="shrink-0">Esquemas salvos</Label>
              <Select value={selectedSchemeId} onValueChange={setSelectedSchemeId}>
                <SelectTrigger className="sm:max-w-sm"><SelectValue placeholder="Selecione um esquema" /></SelectTrigger>
                <SelectContent>
                  {savedSchemes.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>{scheme.name} · {scheme.formation}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">Até 12 esquemas por carreira.</span>
            </div>
          )}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Campo tático · {formation}</p>
                <p className="text-[10px] text-muted-foreground">Arraste para mover</p>
              </div>
              <div
                ref={pitchRef}
                onPointerDown={handlePitchPointerDown}
                onPointerMove={handlePitchPointerMove}
                onPointerUp={handlePitchPointerUp}
                onPointerCancel={handlePitchPointerUp}
                className="relative mx-auto aspect-[3/4] w-full max-w-[600px] select-none overflow-hidden rounded-xl border border-emerald-300/40 bg-emerald-800 shadow-inner"
                style={{
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0, rgba(255,255,255,.035) 11%, transparent 11%, transparent 22%)",
                  touchAction: "none",
                }}
                aria-label="Campo de futebol interativo"
              >
                <div className="pointer-events-none absolute inset-[3%] rounded-md border border-white/40" />
                <div className="pointer-events-none absolute left-[3%] right-[3%] top-1/2 border-t border-white/40" />
                <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40" />
                <div className="pointer-events-none absolute left-[25%] right-[25%] top-[3%] h-[15%] border border-t-0 border-white/40" />
                <div className="pointer-events-none absolute left-[38%] right-[38%] top-[3%] h-[5%] border border-t-0 border-white/40" />
                <div className="pointer-events-none absolute bottom-[3%] left-[25%] right-[25%] h-[15%] border border-b-0 border-white/40" />
                <div className="pointer-events-none absolute bottom-[3%] left-[38%] right-[38%] h-[5%] border border-b-0 border-white/40" />
                {startersList.map((player) => {
                  const point = pitchPositions[player.id] ?? { x: 50, y: 50 };
                  const selected = (selectedStarter?.id ?? selectedStarterId) === player.id;
                  const role = playerRoles[player.id] ?? defaultRole(player.position);
                  return (
                    <button
                      key={player.id}
                      type="button"
                      data-player-id={player.id}
                      onClick={() => setSelectedStarterId(player.id)}
                      className={
                        "absolute z-20 flex -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center gap-0.5 rounded-lg p-1 text-center transition " +
                        (selected ? "bg-black/35 ring-2 ring-amber-300" : "hover:bg-black/25")
                      }
                      style={{ left: String(point.x) + "%", top: String(point.y) + "%", touchAction: "none" }}
                      aria-label={player.name + ", " + role + ". Arraste para reposicionar."}
                      title={player.name + " · " + role}
                    >
                      <span className="relative block">
                        <PlayerFace player={player} className="h-10 w-10 rounded-full ring-1 ring-white/70 sm:h-12 sm:w-12" />
                        <span className="absolute -right-1 -top-1 rounded bg-amber-300 px-1 py-0.5 text-[9px] font-black leading-none text-slate-950">
                          {player.overall}
                        </span>
                        {captainId === player.id && (
                          <span className="absolute -left-1 -top-1 rounded-full bg-amber-300 p-0.5 text-[8px] text-slate-950">C</span>
                        )}
                      </span>
                      <span className="max-w-[88px] truncate rounded bg-slate-950/80 px-1.5 py-0.5 text-[9px] font-bold leading-tight text-white sm:text-[10px]">
                        {player.name}
                      </span>
                      <span className="max-w-[88px] truncate rounded bg-emerald-950/90 px-1 py-0.5 text-[8px] font-semibold leading-tight text-emerald-100 sm:text-[9px]">
                        {role}
                      </span>
                    </button>
                  );
                })}
                {startersList.length === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-8 text-center text-sm font-semibold text-white/80">
                    Selecione os titulares na lista abaixo para preencher o campo.
                  </div>
                )}
              </div>
              <p className="px-1 text-[10px] text-muted-foreground">
                As posições são salvas individualmente. Trocar a formação reposiciona os titulares; depois, você pode arrastá-los livremente.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-border/50 bg-background/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Funções dos jogadores</CardTitle>
                  <CardDescription>Selecione um titular no campo para alterar sua função.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedStarter ? (
                    <>
                      <div className="flex items-center gap-3">
                        <PlayerFace player={selectedStarter} className="h-14 w-14 rounded-xl" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{selectedStarter.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {normalizePosition(selectedStarter.position)} · OVR {selectedStarter.overall}
                          </p>
                          {captainId === selectedStarter.id && <Badge variant="secondary" className="mt-1 text-[10px]">Capitão</Badge>}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={captainId === selectedStarter.id ? "text-amber-400" : "text-muted-foreground"}
                          onClick={() => setCaptainId(captainId === selectedStarter.id ? "" : selectedStarter.id)}
                          title={captainId === selectedStarter.id ? "Remover capitania" : "Definir como capitão"}
                          aria-label={captainId === selectedStarter.id ? "Remover capitania" : "Definir como capitão"}
                        >
                          <Star className={"h-5 w-5 " + (captainId === selectedStarter.id ? "fill-current" : "")} />
                        </Button>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Função em campo</Label>
                        <Select
                          value={playerRoles[selectedStarter.id] ?? defaultRole(selectedStarter.position)}
                          onValueChange={(value) => setPlayerRoles((current) => ({ ...current, [selectedStarter.id]: value }))}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <p className="rounded-md border border-dashed border-border/50 p-3 text-center text-xs text-muted-foreground">
                      Selecione um dos 11 titulares para editar sua função.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-background/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Banco de reservas</CardTitle>
                  <CardDescription>{benchList.length}/10 disponíveis. As substituições são confirmadas na tela da partida.</CardDescription>
                </CardHeader>
                <CardContent>
                  {benchList.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/50 p-3 text-center text-xs text-muted-foreground">
                      Marque jogadores como Banco na lista do elenco.
                    </p>
                  ) : (
                    <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                      {benchList.map((player) => (
                        <div key={player.id} className="flex items-center gap-2 rounded-md border border-sky-500/30 bg-sky-500/5 px-2 py-2">
                          <PlayerFace player={player} className="h-9 w-9 rounded-full" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{player.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {normalizePosition(player.position)} · {POSITION_LABEL[normalizePosition(player.position)]}
                            </p>
                          </div>
                          <span className="text-xs font-bold text-sky-300">{player.overall}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="rounded-lg border border-border/40 bg-background/20 p-3 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">Como funcionam as substituições?</p>
                Na tela do jogo, escolha quem sai e quem entra entre os reservas disponíveis. O jogador que entrar passa a contar como atleta em campo para os lances da partida.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Elenco</CardTitle>
          <CardDescription>
            Titulares: {starters.size}/11 • Reservas: {bench.size}/10. Jogadores lesionados ficam indisponíveis para seleção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1">
            {POSITION_LIST.map((position) => {
              const list = groupedPlayers.get(position) ?? [];
              if (list.length === 0) return null;
              return (
                <div key={position} className="space-y-1">
                  <p className="sticky top-0 z-10 -mx-1 bg-card/95 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground backdrop-blur">
                    {position} — {POSITION_LABEL[position]} ({list.length})
                  </p>
                  {list.map((player) => {
                    const isStarter = starters.has(player.id);
                    const isBench = bench.has(player.id);
                    return (
                      <div
                        key={player.id}
                        className={
                          "flex flex-wrap items-center gap-2 rounded-md border px-2 py-2 transition sm:flex-nowrap " +
                          (isStarter
                            ? "border-primary bg-primary/10"
                            : isBench
                              ? "border-sky-500/40 bg-sky-500/10"
                              : "border-border/40 bg-background/30") +
                          (player.injured ? " opacity-50" : "")
                        }
                      >
                        <PlayerFace player={player} className="h-10 w-10 rounded-full" />
                        <span className="w-10 rounded bg-muted px-1 py-0.5 text-center text-[10px] font-bold">{position}</span>
                        <span className="min-w-[120px] flex-1 truncate text-sm font-medium">{player.name}</span>
                        <span className="text-xs font-bold text-primary">{player.overall}</span>
                        {player.injured && <Badge variant="destructive" className="text-[9px]">Lesão</Badge>}
                        {isStarter && <Badge className="text-[9px]">Titular</Badge>}
                        {isBench && <Badge variant="secondary" className="text-[9px]">Banco</Badge>}
                        <div className="ml-auto flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant={isStarter ? "default" : "outline"}
                            className="h-8 px-2 text-[10px]"
                            disabled={player.injured}
                            onClick={() => toggleStarter(player.id)}
                          >
                            {isStarter ? "Titular ✓" : "Titular"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={isBench ? "secondary" : "outline"}
                            className="h-8 px-2 text-[10px]"
                            disabled={player.injured || isStarter}
                            onClick={() => toggleBench(player.id)}
                          >
                            {isBench ? "Banco ✓" : "Banco"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={proceed} size="lg" className="w-full sm:flex-1">
          Confirmar escalação e ir ao jogo <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/carreira/$careerId" params={{ careerId }}>Voltar ao hub</Link>
        </Button>
      </div>
    </div>
  );
}
