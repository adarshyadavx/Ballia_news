import Link from "next/link";
import { requireTeam } from "@/lib/auth";
import { hindiDateTime } from "@/lib/dates";
import { deleteNews, setNewsStatus } from "../../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";

type SP = { q?: string; status?: string; category?: string };

export default async function ManageNews({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { supabase, profile } = await requireTeam();
  const isAdmin = profile.role === "admin";

  let q = supabase.from("news")
    .select("id,headline,slug,status,view_count,created_at,published_at,writer_name,category:categories(name),author:profiles(full_name)")
    .order("created_at", { ascending: false }).limit(100);
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.category) q = q.eq("category_id", sp.category);
  if (sp.q) q = q.ilike("headline", `%${sp.q.replace(/[%,()]/g, " ")}%`);
  if (!isAdmin) q = q.eq("author_id", profile.id);
  const [{ data: rows }, { data: cats }] = await Promise.all([q, supabase.from("categories").select("id,name").order("display_order")]);

  const input = "rounded-lg border bg-background px-2 py-1.5 text-sm";
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Manage News</h1>
        <Link href="/admin/news/new" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold shadow-xs transition-colors hover:bg-primary/90 text-primary-foreground">+ नई खबर</Link>
      </div>
      <form className="mb-3 flex flex-wrap gap-2">
        <input name="q" defaultValue={sp.q} placeholder="Search headline" className={input} />
        <select name="status" defaultValue={sp.status ?? ""} className={input}>
          <option value="">All status</option><option value="published">Published</option>
          <option value="draft">Draft</option><option value="pending_review">Pending review</option>
        </select>
        <select name="category" defaultValue={sp.category ?? ""} className={input}>
          <option value="">All categories</option>
          {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button className="rounded-lg border px-3 py-1.5 text-sm font-semibold">Filter</button>
      </form>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase"><tr>
            <th className="p-2">Headline</th><th className="p-2">Category</th><th className="p-2">Writer</th>
            <th className="p-2">Status</th><th className="p-2">Date</th><th className="p-2">Views</th><th className="p-2">Actions</th>
          </tr></thead>
          <tbody>
            {(rows ?? []).map((n) => {
              const cat = n.category as unknown as { name: string } | null;
              const author = n.author as unknown as { full_name: string } | null;
              return (
                <tr key={n.id} className="border-t align-top">
                  <td className="max-w-xs p-2 font-semibold">{n.headline}</td>
                  <td className="p-2">{cat?.name}</td>
                  <td className="p-2">{n.writer_name || author?.full_name}</td>
                  <td className="p-2"><span className={`rounded px-2 py-0.5 text-xs font-bold ${n.status === "published" ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300"}`}>{n.status}</span></td>
                  <td className="p-2 whitespace-nowrap">{hindiDateTime(n.published_at ?? n.created_at)}</td>
                  <td className="p-2">{n.view_count}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/news/${n.id}`} className="underline">Edit</Link>
                      {n.status === "published" && <Link href={`/news/${n.slug}`} target="_blank" className="underline">View</Link>}
                      {isAdmin && (
                        <form action={setNewsStatus}>
                          <input type="hidden" name="id" value={n.id} />
                          <input type="hidden" name="status" value={n.status === "published" ? "draft" : "published"} />
                          <button className="underline">{n.status === "published" ? "Unpublish" : "Publish"}</button>
                        </form>
                      )}
                      {isAdmin && (
                        <form action={deleteNews}>
                          <input type="hidden" name="id" value={n.id} />
                          <ConfirmButton message="Are you sure you want to permanently delete this story?" className="text-red-700 dark:text-red-400 underline">Delete</ConfirmButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows?.length && <p className="p-6 text-center text-muted-foreground">No stories found.</p>}
      </div>
    </div>
  );
}
