import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCareer } from "@/lib/career-context";

export const Route = createFileRoute("/carreira/$careerId/diretoria")({
  head: () => ({ meta: [{ title: "Diretoria e treinador — MasterLeague" }, { name: "description", content: "Objetivos, confiança da diretoria e perfil do treinador." }] }),
  component: BoardPage,
});

interface Career { id: string; club_name: string; season: number; played: number; wins: number; draws: number; losses: number; titles: number }

function BoardPage() {
  const { careerId } = useParams({ from: "/carreira/$careerId/diretoria" });
  const { career } = useCareer();
  const c = career as typeof career & { board_confidence?: number; fan_mood?: number; squad_morale?: number; reputation?: number; board_objective?: string; titles?: number };
  const [all, setAll] = useState<Career[]>([]);

  useEffect(() => {
    supabase.from("careers").select("id,club_name,season,played,wins,draws,losses,titles").eq("manager_name", career.manager_name)
      .then(({ data }) => setAll((data ?? []) as Career[]));
  }, [careerId, career.manager_name]);

  const bars = [
    ["Confiança da diretoria", c.board_confidence ?? 60],
    ["Moral da torcida", c.fan_mood ?? 60],
    ["Moral do elenco", c.squad_morale ?? 70],
    ["Reputação do treinador", c.reputation ?? 50],
  ] as const;
  const aprove = career.played ? Math.round(((career.wins * 3 + career.draws) / (career.played * 3)) * 100) : 0;
  const tot = all.reduce((a, x) => ({ p: a.p + x.played, w: a.w + x.wins, d: a.d + x.draws, l: a.l + x.losses, t: a.t + (x.titles ?? 0) }), { p: 0, w: 0, d: 0, l: 0, t: 0 });
  const conf = c.board_confidence ?? 60;
  const status = conf >= 70 ? "A diretoria está satisfeita com o trabalho." : conf >= 40 ? "A diretoria acompanha com atenção." : "Seu cargo está em risco — a diretoria cobra resultados.";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60 bg-card/70">
        <CardHeader><CardTitle>Diretoria</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Objetivo da temporada</p>
            <p className="font-bold">{c.board_objective ?? "Informação não disponível"}</p>
          </div>
          {bars.map(([l, v]) => (
            <div key={l} className="space-y-1">
              <div className="flex justify-between text-sm"><span>{l}</span><span className="font-bold">{v}</span></div>
              <Progress value={v} />
            </div>
          ))}
          <p className="text-sm text-muted-foreground">{status}</p>
          <p className="text-sm">Situação atual: {career.league_position}º lugar, {career.points} pontos, aproveitamento {aprove}%.</p>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/70">
        <CardHeader><CardTitle>Treinador — {career.manager_name}</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["Jogos", tot.p], ["Vitórias", tot.w], ["Empates", tot.d], ["Derrotas", tot.l], ["Títulos", tot.t], ["Aproveit.", `${tot.p ? Math.round(((tot.w * 3 + tot.d) / (tot.p * 3)) * 100) : 0}%`]].map(([l, v]) => (
              <div key={String(l)} className="rounded-lg border border-border/60 p-2"><p className="text-xl font-black">{v}</p><p className="text-[10px] uppercase text-muted-foreground">{l}</p></div>
            ))}
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">Clubes treinados</p>
            {all.map((x) => <div key={x.id} className="flex justify-between border-b border-border/40 py-1"><span>{x.club_name} • temp. {x.season}</span><span className="text-muted-foreground">{x.wins}V {x.draws}E {x.losses}D</span></div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
