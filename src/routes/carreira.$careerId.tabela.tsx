import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useCareer } from "@/lib/career-context";
import { supabase } from "@/integrations/supabase/client";
import { sortTable, type StandingRow } from "@/lib/fixtures";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
  const [table, setTable] = useState<StandingRow[]>([]);
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
          .from("standings")
          .select("club_name, club_slug, played, wins, draws, losses, goals_for, goals_against, points")
          .eq("career_id", careerId)
          .eq("season", career.season),
        supabase
          .from("fixtures")
          .select("id, matchday, home_club, away_club, home_goals, away_goals, played, is_user_match")
          .eq("career_id", careerId)
          .eq("season", career.season)
          .eq("is_user_match", true)
          .order("matchday", { ascending: true }),
      ]);
      setMatches((m.data ?? []) as MatchRow[]);
      setTable(sortTable((s.data ?? []) as StandingRow[]));
      setFixtures((f.data ?? []) as FixtureLite[]);
    })();
  }, [careerId, career.season, career.matchday]);

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/70">
        <CardHeader>
          <CardTitle>Classificação</CardTitle>
          <CardDescription>
            {club.league} • Temporada {career.season} • Rodada {Math.min(career.matchday, 38)} de 38
          </CardDescription>
        </CardHeader>
        <CardContent>
          {table.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              A tabela aparece assim que o campeonato desta carreira for criado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-2">Clube</th>
                    <th className="py-2 px-2 text-center">P</th>
                    <th className="py-2 px-2 text-center">J</th>
                    <th className="py-2 px-2 text-center">V</th>
                    <th className="py-2 px-2 text-center">E</th>
                    <th className="py-2 px-2 text-center">D</th>
                    <th className="py-2 px-2 text-center">GP</th>
                    <th className="py-2 px-2 text-center">GC</th>
                    <th className="py-2 pl-2 text-center">SG</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row, i) => {
                    const mine = row.club_name === club.name;
                    const zone =
                      i < 4 ? "border-l-2 border-l-primary" : i >= table.length - 4 ? "border-l-2 border-l-destructive" : "";
                    return (
                      <tr
                        key={row.club_name}
                        className={`border-b border-border/30 ${zone} ${mine ? "bg-primary/10 font-semibold" : ""}`}
                      >
                        <td className="py-2 pr-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 pr-2">{row.club_name}</td>
                        <td className="py-2 px-2 text-center font-bold">{row.points}</td>
                        <td className="py-2 px-2 text-center">{row.played}</td>
                        <td className="py-2 px-2 text-center">{row.wins}</td>
                        <td className="py-2 px-2 text-center">{row.draws}</td>
                        <td className="py-2 px-2 text-center">{row.losses}</td>
                        <td className="py-2 px-2 text-center">{row.goals_for}</td>
                        <td className="py-2 px-2 text-center">{row.goals_against}</td>
                        <td className="py-2 pl-2 text-center">{row.goals_for - row.goals_against}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
              <ul className="max-h-[420px] space-y-1 overflow-y-auto pr-1">
                {fixtures.map((f) => {
                  const home = f.home_club === club.name;
                  const opp = home ? f.away_club : f.home_club;
                  const gf = home ? f.home_goals : f.away_goals;
                  const ga = home ? f.away_goals : f.home_goals;
                  const current = f.matchday === career.matchday;
                  return (
                    <li
                      key={f.id}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${
                        current ? "border-primary/60 bg-primary/10" : "border-border/40 bg-background/30"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="w-8 text-xs text-muted-foreground">R{f.matchday}</span>
                        <span className="w-10 text-xs uppercase text-muted-foreground">{home ? "Casa" : "Fora"}</span>
                        <span>{opp}</span>
                      </span>
                      <span className="font-bold">
                        {f.played && gf !== null && ga !== null ? `${gf} x ${ga}` : "—"}
                      </span>
                    </li>
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
