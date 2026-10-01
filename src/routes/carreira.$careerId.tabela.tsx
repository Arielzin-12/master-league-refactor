import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCareer } from "@/lib/career-context";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface MatchRow {
  id: string;
  matchday: number;
  opponent: string;
  goals_for: number;
  goals_against: number;
  result: string;
  league_position_after: number | null;
}

interface FixtureLite {
  id: string;
  matchday: number;
  home_club: string;
  away_club: string;
  home_goals: number | null;
  away_goals: number | null;
  played: boolean;
  is_user_match: boolean;
}

export const Route = createFileRoute("/carreira/$careerId/tabela")({
  component: TabelaPage,
});

function TabelaPage() {
  const { career, club } = useCareer();
  const { careerId } = useParams({ from: "/carreira/$careerId/tabela" });
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [fixtures, setFixtures] = useState<FixtureLite[]>([]);

  useEffect(() => {
    (async () => {
      const [m, s, f] = await Promise.all([
        supabase
          .from("matches")
          .select("id, matchday, opponent, goals_for, goals_against, result, league_position_after")
          .eq("career_id", careerId)
          .order("matchday", { ascending: false })
          .limit(15),
        supabase
          .from("fixtures")
          .select("id, matchday, home_club, away_club, home_goals, away_goals, played, is_user_match")
          .eq("career_id", careerId)
          .eq("season", career.season)
          .eq("is_user_match", true)
          .order("matchday", { ascending: true }),
      ]);
      setMatches((m.data ?? []) as MatchRow[]);
      setFixtures((f.data ?? []) as FixtureLite[]);
    })();
  }, [careerId, career.season, career.matchday]);

  const updateFixture = async (fixtureId: string, opponent: string, home: boolean) => {
    const trimmed = opponent.trim();
    if (!trimmed) { toast.error("Informe um adversário."); return; }
    const payload = home
      ? { home_club: club.name, away_club: trimmed }
      : { home_club: trimmed, away_club: club.name };
    const { error } = await supabase.from("fixtures").update(payload).eq("id", fixtureId).eq("career_id", careerId);
    if (error) { toast.error(error.message); return; }
    setFixtures((prev) => prev.map((f) => f.id === fixtureId ? { ...f, ...payload } : f));
    toast.success("Jogo do calendário atualizado.");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Calendário do {club.name}</CardTitle>
            <CardDescription>38 rodadas, com mando de campo definido</CardDescription>
          </CardHeader>
          <CardContent>
            {fixtures.length === 0 ? (
              <p className="text-sm text-muted-foreground">Calendário ainda não gerado para esta carreira.</p>
            ) : (
              <ul className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {fixtures.map((f) => {
                  const home = f.home_club === club.name;
                  const opp = home ? f.away_club : f.home_club;
                  const gf = home ? f.home_goals : f.away_goals;
                  const ga = home ? f.away_goals : f.home_goals;
                  const current = f.matchday === career.matchday;
                  return (
                    <FixtureEditor key={f.id} fixture={f} current={current} opponent={opp} home={home}
                      score={f.played && gf !== null && ga !== null ? `${gf} x ${ga}` : "—"} onSave={updateFixture} />
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/70">
          <CardHeader>
            <CardTitle>Últimos resultados</CardTitle>
            <CardDescription>Os 15 jogos mais recentes registrados por você</CardDescription>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum jogo registrado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {matches.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-md border border-border/40 bg-background/30 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded text-xs font-bold ${
                          m.result === "V"
                            ? "bg-primary text-primary-foreground"
                            : m.result === "E"
                              ? "bg-muted text-foreground"
                              : "bg-destructive text-destructive-foreground"
                        }`}
                      >
                        {m.result}
                      </span>
                      <span className="text-muted-foreground">R{m.matchday}</span>
                      <span>
                        vs <span className="font-medium">{m.opponent}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">
                        {m.goals_for} x {m.goals_against}
                      </span>
                      {m.league_position_after && (
                        <span className="text-xs text-muted-foreground">{m.league_position_after}º</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FixtureEditor({ fixture, current, opponent, home, score, onSave }: {
  fixture: FixtureLite;
  current: boolean;
  opponent: string;
  home: boolean;
  score: string;
  onSave: (id: string, opponent: string, home: boolean) => Promise<void>;
}) {
  const [value, setValue] = useState(opponent);
  const [side, setSide] = useState(home ? "home" : "away");
  useEffect(() => { setValue(opponent); setSide(home ? "home" : "away"); }, [opponent, home]);
  return (
    <li className={`rounded-md border p-3 ${current ? "border-primary/60 bg-primary/10" : "border-border/40 bg-background/30"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex items-center gap-3 md:w-28">
          <span className="text-xs font-bold text-muted-foreground">R{fixture.matchday}</span>
          {current && <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">ATUAL</span>}
        </div>
        <Input value={value} onChange={(e) => setValue(e.target.value)} className="md:flex-1" placeholder="Adversário" />
        <Select value={side} onValueChange={setSide}>
          <SelectTrigger className="md:w-32"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="home">Casa</SelectItem><SelectItem value="away">Fora</SelectItem></SelectContent>
        </Select>
        <span className="min-w-12 text-center text-sm font-bold">{score}</span>
        <Button size="sm" onClick={() => onSave(fixture.id, value, side === "home")}>Salvar</Button>
      </div>
    </li>
  );
}
