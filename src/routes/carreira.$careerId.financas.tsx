import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEur } from "@/lib/format";
import { useCareer } from "@/lib/career-context";

export const Route = createFileRoute("/carreira/$careerId/financas")({
  head: () => ({ meta: [{ title: "Finanças — MasterLeague" }, { name: "description", content: "Orçamento de transferências, reserva salarial e extrato." }] }),
  component: FinPage,
});

interface Tx { id: string; matchday: number; budget: string; category: string; description: string; amount_eur: number }

function FinPage() {
  const { careerId } = useParams({ from: "/carreira/$careerId/financas" });
  const { career } = useCareer();
  const c = career as typeof career & { transfer_budget_eur?: number; wage_budget_eur?: number };
  const [tx, setTx] = useState<Tx[]>([]);

  useEffect(() => {
    supabase.from("financial_transactions").select("*").eq("career_id", careerId).order("created_at", { ascending: false }).limit(200)
      .then(({ data }) => setTx((data ?? []) as Tx[]));
  }, [careerId]);

  const wageRoom = (c.wage_budget_eur ?? 0) - career.weekly_wages_eur;
  const sum = (b: string, sign: 1 | -1) => tx.filter((t) => t.budget === b && Math.sign(t.amount_eur) === sign).reduce((a, t) => a + t.amount_eur, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Orçamento de transferências</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-primary">{formatEur(c.transfer_budget_eur ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Entradas {formatEur(sum("transfer", 1))} • Saídas {formatEur(-sum("transfer", -1))}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/70">
          <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Reserva salarial (semanal)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{formatEur(c.wage_budget_eur ?? 0)}</p>
            <p className="mt-2 text-xs text-muted-foreground">Folha atual {formatEur(career.weekly_wages_eur)} • Espaço {" "}
              <span className={wageRoom < 0 ? "text-destructive" : "text-primary"}>{formatEur(wageRoom)}</span></p>
          </CardContent>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground">Os dois orçamentos são separados: salários nunca saem do dinheiro de transferências.</p>
      <Card className="border-border/60 bg-card/70">
        <CardHeader><CardTitle>Extrato</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {tx.length === 0 && <p className="text-muted-foreground">Nenhuma movimentação ainda. Elas aparecem após cada jogo e transferência.</p>}
          {tx.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-border/40 py-1.5">
              <span className="w-10 text-muted-foreground">R{t.matchday}</span>
              <span className="w-24 text-xs uppercase text-muted-foreground">{t.budget === "wages" ? "Salários" : "Transferências"}</span>
              <span className="flex-1">{t.description}</span>
              <span className={`font-bold ${t.amount_eur < 0 ? "text-destructive" : "text-primary"}`}>{formatEur(t.amount_eur)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
