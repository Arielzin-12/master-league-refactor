import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/carreira/$careerId/social")({
  head: () => ({ meta: [{ title: "Redes sociais — MasterLeague" }, { name: "description", content: "Posts e comentários sobre sua carreira." }] }),
  component: SocialPage,
});

interface Post { id: string; author_type: string; author_name: string; author_handle: string; body: string; likes: number; matchday: number }
interface Comment { id: string; post_id: string; author_name: string; author_handle: string; body: string; likes: number }
interface Press { id: string; matchday: number; question: string; answer: string | null; reaction: string | null }

function SocialPage() {
  const { careerId } = useParams({ from: "/carreira/$careerId/social" });
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [press, setPress] = useState<Press[]>([]);

  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([
        supabase.from("social_posts").select("*").eq("career_id", careerId).order("created_at", { ascending: false }).limit(60),
        supabase.from("social_comments").select("*").eq("career_id", careerId),
        supabase.from("press_conferences").select("*").eq("career_id", careerId).order("created_at", { ascending: false }).limit(30),
      ]);
      setPosts((a.data ?? []) as Post[]);
      setComments((b.data ?? []) as Comment[]);
      setPress((c.data ?? []) as Press[]);
    })();
  }, [careerId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        {posts.length === 0 && <p className="text-muted-foreground">Os posts aparecem depois de cada jogo registrado.</p>}
        {posts.map((p) => {
          const cs = comments.filter((c) => c.post_id === p.id);
          return (
            <Card key={p.id} className="border-border/60 bg-card/70">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 font-bold text-primary">{p.author_name[0]}</div>
                  <div><p className="font-bold">{p.author_name}</p><p className="text-xs text-muted-foreground">{p.author_handle} • R{p.matchday} • {p.author_type}</p></div>
                </div>
                <p className="whitespace-pre-line text-sm">{p.body}</p>
                <div className="flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.likes}</span><span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{cs.length}</span></div>
                <div className="space-y-2 border-l-2 border-border/60 pl-3">
                  {cs.map((c) => (
                    <div key={c.id} className="text-sm"><span className="font-semibold">{c.author_name}</span> <span className="text-xs text-muted-foreground">{c.author_handle}</span><p>{c.body}</p></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="space-y-3">
        <h3 className="font-bold">🎙️ Histórico de coletivas</h3>
        {press.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma coletiva registrada.</p>}
        {press.map((q) => (
          <Card key={q.id} className="border-border/60 bg-card/70"><CardContent className="space-y-1 p-3 text-sm">
            <p className="text-xs text-muted-foreground">Rodada {q.matchday}</p>
            <p className="font-semibold">{q.question}</p>
            {q.answer && <p>“{q.answer}”</p>}
            {q.reaction && <p className="text-xs text-primary">{q.reaction}</p>}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
