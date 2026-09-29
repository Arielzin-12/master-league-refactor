import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCareer } from "@/lib/career-context";

export const Route = createFileRoute("/carreira/$careerId/medico")({
  head: () => ({ meta: [{ title: "Departamento médico — MasterLeague" }, { name: "description", content: "Lesionados, pendurados e suspensos." }] }),
  component: MedicoPage,
});

interface P { id: string; name: string; position: string; yellow_cards_season: number; suspended_matches: number; injury_type: string | null; injury_severity: string | null; injury_returns_at_matchday: number | null; contract_until_season: number }
interface H { id: string; player_name: string; injury_type?: string; reason?: string; severity?: string; started_matchday: number; returns_matchday?: number; recovered?: boolean; active?: boolean; matches_total?: number; matches_served?: number }

function MedicoPage() {
  const { careerId } = useParams({ from: "/carreira/$careerId/medico" });
  const { career } = useCareer();
  const [players, setPlayers] = useState<P[]>([]);
  const [inj, setInj] = useState<H[]>([]);
  const [susp, setSusp] = useState<H[]>([]);

  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([
        supabase.from("squad_players").select("id,name,position,yellow_cards_season,suspended_matches,injury_type,injury_severity,injury_returns_at_matchday,contract_until_season").eq("career_id", careerId),
        supabase.from("injuries").select("*").eq("career_id", careerId).order("created_at", { ascending: false }),
        supabase.from("suspensions").select("*").eq("career_id", careerId).order("created_at", { ascending: false }),
      ]);
      setPlayers((a.data ?? []) as P[]);
      setInj((b.data ?? []) as H[]);
      setSusp((c.data ?? []) as H[]);
    })();
  }, [careerId]);

  const injured = players.filter((p) => p.injury_type);
  const hanging = players.filter((p) => p.yellow_cards_season === 2);
  const suspended = players.filter((p) => p.suspended_matches > 0);
  const expiring = players.filter((p) => p.contract_until_season <= career.season);

  const Box = ({ title, items, render }: { title: string; items: P[]; render: (p: P) => string }) => (
    <Card className="border-border/60 bg-card/70">
      <CardHeader className="pb-2"><CardTitle className="text-base">{title} <span className="text-muted-foreground">({items.length})</span></CardTitle></CardHeader>
      <CardContent className="space-y-1 text-sm">
        {items.length === 0 && <p className="text-muted-foreground">Ninguém nesta lista.</p>}
        {items.map((p) => (
          <div key={p.id} className="flex justify-between gap-2"><span>{p.name} <span className="text-xs text-muted-foreground">{p.position}</span></span><span className="text-xs text-muted-foreground">{render(p)}</span></div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Lesionados e suspensos ficam bloqueados na escalação até voltarem.</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Box title="🏥 Lesionados" items={injured} render={(p) => `${p.injury_type} • volta R${p.injury_returns_at_matchday}`} />
        <Box title="⚠️ Pendurados" items={hanging} render={() => "2 amarelos"} />
        <Box title="🚫 Suspensos" items={suspended} render={(p) => `${p.suspended_matches} jogo(s)`} />
        <Box title="📄 Contrato acabando" items={expiring} render={(p) => `até temp. ${p.contract_until_season}`} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 bg-card/70">
          <CardHeader><CardTitle className="text-base">Histórico de lesões</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {inj.length === 0 && <p className="text-muted-foreground">Sem lesões registradas.</p>}
            {inj.map((i) => <div key={i.id} className="flex justify-between"><span>{i.player_name} — {i.injury_type} ({i.severity})</span><span className="text-xs text-muted-foreground">R{i.started_matchday}→R{i.returns_matchday} {i.recovered ? "✅" : "🏥"}</span></div>)}
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader><CardTitle className="text-base">Histórico de suspensões</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {susp.length === 0 && <p className="text-muted-foreground">Sem suspensões registradas.</p>}
            {susp.map((s) => <div key={s.id} className="flex justify-between"><span>{s.player_name} — {s.reason}</span><span className="text-xs text-muted-foreground">R{s.started_matchday} • {s.matches_served}/{s.matches_total} {s.active ? "🚫" : "✅"}</span></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
