import Link from "next/link";
import { requireTeam } from "@/lib/auth";
import { hindiDateTime } from "@/lib/dates";
import { Card, CardContent } from "@/components/ui/card";

export default async function Dashboard() {
  const { supabase, user } = await requireTeam();
  const today = new Date().toISOString().slice(0, 10);

  const count = async (status?: string) => {
    let q = supabase.from("news").select("id", { count: "exact", head: true });
    if (status) q = q.eq("status", status);
    return (await q).count ?? 0;
  };
  const [total, published, drafts, viewsToday, top, msgs, mine] = await Promise.all([
    count(), count("published"), count("draft"),
    supabase.from("daily_views").select("views").eq("date", today),
    supabase.from("news").select("id,headline,slug,view_count").eq("status", "published").order("view_count", { ascending: false }).limit(5),
    supabase.from("messages").select("id,name,phone,message,status,created_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("news").select("id,headline,updated_at").eq("author_id", user.id).eq("status", "draft").order("updated_at", { ascending: false }).limit(5),
  ]);
  const todayViews = (viewsToday.data ?? []).reduce((s, r) => s + r.views, 0);
  const cards = [["Total news", total], ["Published", published], ["Drafts", drafts], ["Today's views", todayViews]];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <Link href="/admin/news/new" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold shadow-xs transition-colors hover:bg-primary/90 text-primary-foreground">+ नई खबर</Link>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map(([label, n]) => (
          <Card key={label}><CardContent className="p-4">
            <div className="text-3xl font-bold tracking-tight">{n}</div><div className="text-sm text-muted-foreground">{label}</div>
          </CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4">
          <h2 className="mb-2 font-bold">Top stories</h2>
          <ol className="space-y-1 text-sm">{(top.data ?? []).map((n) => (
            <li key={n.id}><Link href={`/admin/news/${n.id}`} className="hover:text-primary">{n.headline}</Link> <span className="text-muted-foreground">({n.view_count})</span></li>
          ))}</ol>
          {!top.data?.length && <p className="text-sm text-muted-foreground">No stories yet.</p>}
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <h2 className="mb-2 font-bold">Latest messages</h2>
          <ul className="space-y-2 text-sm">{(msgs.data ?? []).map((m) => (
            <li key={m.id}><b>{m.name}</b> · {m.phone}<div className="line-clamp-1 text-muted-foreground">{m.message}</div></li>
          ))}</ul>
          {!msgs.data?.length && <p className="text-sm text-muted-foreground">No messages.</p>}
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <h2 className="mb-2 font-bold">My latest drafts</h2>
          <ul className="space-y-1 text-sm">{(mine.data ?? []).map((n) => (
            <li key={n.id}><Link href={`/admin/news/${n.id}`} className="hover:text-primary">{n.headline}</Link>
              <div className="text-xs text-muted-foreground">{hindiDateTime(n.updated_at)}</div></li>
          ))}</ul>
          {!mine.data?.length && <p className="text-sm text-muted-foreground">No drafts.</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}
