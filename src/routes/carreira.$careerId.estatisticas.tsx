import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/carreira/$careerId/estatisticas")({
  head: () => ({ meta: [{ title: "Estatísticas — MasterLeague" }, { name: "description", content: "Artilharia, assistências e desempenho do elenco." }] }),
  component: StatsPage,
});

interface Row {
  id: string; name: string; position: string; goals: number; assists: number; appearances: number; minutes: number;
  yellow_cards_season: number; red_cards_season: number; motm: number; clean_sheets: number; rating_sum: number;
}
interface MatchRow { id: string; matchday: number; opponent: string; home: boolean; goals_for: number; goals_against: number; result: string; scorers: string | null }

function StatsPage() {
  const { careerId } = useParams({ from: "/carreira/$careerId/estatisticas" });
  const [rows, setRows] = useState<Row[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: m }] = await Promise.all([
        supabase.from("squad_players").select("id,name,position,goals,assists,appearances,minutes,yellow_cards_season,red_cards_season,motm,clean_sheets,rating_sum").eq("career_id", careerId),
        supabase.from("matches").select("id,matchday,opponent,home,goals_for,goals_against,result,scorers").eq("career_id", careerId).order("matchday"),
      ]);
      setRows((p ?? []) as Row[]);
      setMatches((m ?? []) as MatchRow[]);
    })();
  }, [careerId]);

  const avg = (r: Row) => (r.appearances ? Number(r.rating_sum) / r.appearances : 0);
  const top = (key: (r: Row) => number, fmt: (r: Row) => string = (r) => String(key(r))) =>
    [...rows].filter((r) => key(r) > 0).sort((a, b) => key(b) - key(a)).slice(0, 8).map((r) => ({ r, v: fmt(r) }));
  const boards = [
    { t: "⚽ Artilharia", d: top((r) => r.goals) },
    { t: "🎯 Assistências", d: top((r) => r.assists) },
    { t: "⭐ Melhor em campo", d: top((r) => r.motm) },
    { t: "📈 Média de nota (mín. 1 jogo)", d: top(avg, (r) => avg(r).toFixed(2)) },
    { t: "🧤 Clean sheets", d: top((r) => r.clean_sheets) },
    { t: "⏱️ Minutos", d: top((r) => r.minutes) },
    { t: "🟨 Amarelos (ciclo atual)", d: top((r) => r.yellow_cards_season) },
    { t: "🟥 Vermelhos", d: top((r) => r.red_cards_season) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {boards.map((b) => (
          <Card key={b.t} className="border-border/60 bg-card/70">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{b.t}</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              {b.d.length === 0 && <p className="text-muted-foreground">Sem registros ainda.</p>}
              {b.d.map(({ r, v }, i) => (
                <div key={r.id} className="flex justify-between gap-2">
                  <span className="truncate"><span className="text-muted-foreground">{i + 1}.</span> {r.name}</span>
                  <span className="font-bold text-primary">{v}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader><CardTitle>Histórico da temporada</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {matches.length === 0 && <p className="text-muted-foreground">Nenhum jogo registrado.</p>}
          {matches.map((m) => (
            <div key={m.id} className="flex items-center gap-3 border-b border-border/40 py-1.5">
              <span className="w-10 text-muted-foreground">R{m.matchday}</span>
              <span className={`w-6 rounded text-center text-xs font-bold ${m.result === "V" ? "bg-primary text-primary-foreground" : m.result === "D" ? "bg-destructive text-destructive-foreground" : "bg-muted"}`}>{m.result}</span>
              <span className="flex-1">{m.home ? "vs" : "@"} {m.opponent}</span>
              <span className="font-bold">{m.goals_for}×{m.goals_against}</span>
              <span className="hidden flex-1 truncate text-xs text-muted-foreground md:block">{m.scorers ?? ""}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
