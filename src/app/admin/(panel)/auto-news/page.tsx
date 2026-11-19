import { redirect } from "next/navigation";
import { requireTeam } from "@/lib/auth";
import { hindiDateTime } from "@/lib/dates";
import { config } from "@/lib/config";
import { addSource, deleteHeld, deleteLibraryImage, deleteSource, publishHeld, setAutoSetting, toggleSource } from "../../actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { LibraryUpload } from "@/components/admin/library-upload";

const card = "rounded-xl border bg-background p-4";
const input = "rounded-lg border bg-background px-2 py-1.5 text-sm";

function Switch({ name, label, hint, on }: { name: string; label: string; hint: string; on: boolean }) {
  return (
    <form action={setAutoSetting} className="flex items-center justify-between gap-4">
      <div><div className="font-semibold">{label}</div><div className="text-sm text-muted-foreground">{hint}</div></div>
      <input type="hidden" name="key" value={name} />
      <input type="hidden" name="value" value={String(!on)} />
      <button className={`h-8 w-14 cursor-pointer rounded-full p-1 transition-colors ${on ? "bg-primary" : "bg-muted-foreground/40"}`} aria-label={`${label}: ${on ? "on" : "off"}`}>
        <span className={`block size-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : ""}`} />
      </button>
    </form>
  );
}

export default async function AutoNewsPage() {
  const { supabase, profile } = await requireTeam();
  if (profile.role !== "admin") redirect("/admin");

  const [settings, runs, held, sources, library] = await Promise.all([
    supabase.from("app_settings").select("key,value"),
    supabase.from("pipeline_runs").select("*").order("started_at", { ascending: false }).limit(20),
    supabase.from("news").select("id,headline,summary,hold_reason,ai_confidence,source_names,source_urls,created_at").eq("is_auto", true).eq("review_status", "held").eq("status", "draft").order("created_at", { ascending: false }).limit(50),
    supabase.from("sources").select("*").order("name"),
    supabase.from("image_library").select("*").order("created_at", { ascending: false }).limit(60),
  ]);
  if (settings.error) {
    return <div className={card}><h1 className="mb-2 text-xl font-bold">Auto News</h1>
      <p className="text-sm text-muted-foreground">Database tables are missing. Run <code>supabase/migrations/0002_auto_news.sql</code> in the Supabase SQL Editor, then reload this page.</p></div>;
  }
  const s = new Map((settings.data ?? []).map((r) => [r.key as string, r.value as boolean]));
  const enabled = s.get("autoNews.enabled") ?? config.autoNews.enabled;
  const autoPublish = s.get("autoNews.autoPublish") ?? config.autoNews.autoPublish;
  const cats = config.categories.map((c) => ({ slug: c.slug, name: c.name }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Auto News</h1>

      <section className={`${card} space-y-4`}>
        <Switch name="autoNews.enabled" label="Pipeline on" hint="Runs every 3 hours (6 AM - 9 PM IST) from GitHub Actions." on={enabled} />
        <div className="border-t" />
        <Switch name="autoNews.autoPublish" label="Auto-publish" hint="Off = every story is saved as a held draft for you to review. Turn on after the test period." on={autoPublish} />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Held stories ({held.data?.length ?? 0})</h2>
        <div className="space-y-3">
          {(held.data ?? []).map((n) => (
            <div key={n.id} className={card}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{n.headline}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.summary}</p>
                  <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">Held: {n.hold_reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {hindiDateTime(n.created_at)} · confidence {n.ai_confidence ?? "-"} · Source:{" "}
                    {(n.source_names ?? []).map((name: string, i: number) => (
                      <a key={i} href={(n.source_urls ?? [])[i]} target="_blank" rel="noopener noreferrer" className="underline">{name} </a>
                    ))}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <a href={`/admin/news/${n.id}`} className="underline">Edit</a>
                  <form action={publishHeld}><input type="hidden" name="id" value={n.id} /><button className="cursor-pointer font-semibold text-primary underline">Publish</button></form>
                  <form action={deleteHeld}><input type="hidden" name="id" value={n.id} />
                    <ConfirmButton message="Delete this held story?" className="cursor-pointer text-red-700 underline dark:text-red-400">Delete</ConfirmButton></form>
                </div>
              </div>
            </div>
          ))}
          {!held.data?.length && <p className="text-sm text-muted-foreground">Nothing is waiting for review.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Last 20 runs</h2>
        <div className="overflow-x-auto rounded-xl border bg-background">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs"><tr><th className="p-2">Started</th><th className="p-2">Mode</th><th className="p-2">Found</th><th className="p-2">Published</th><th className="p-2">Held</th><th className="p-2">Skipped</th><th className="p-2">Errors</th></tr></thead>
            <tbody>
              {(runs.data ?? []).map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-2 whitespace-nowrap">{hindiDateTime(r.started_at)}</td><td className="p-2">{r.mode}</td>
                  <td className="p-2">{r.found}</td><td className="p-2">{r.published}</td><td className="p-2">{r.held}</td><td className="p-2">{r.rejected}</td>
                  <td className="max-w-xs p-2 text-xs text-red-700 dark:text-red-400">{(r.errors ?? []).slice(0, 2).join(" | ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!runs.data?.length && <p className="p-6 text-center text-muted-foreground">No runs yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">News sources</h2>
        <form action={addSource} className="mb-3 flex flex-wrap gap-2 rounded-xl border bg-background p-3">
          <input name="name" required placeholder="Name" className={input} />
          <input name="url" required type="url" placeholder="https://… feed address" className={`${input} min-w-64 flex-1`} />
          <select name="type" className={input}><option value="google-news">google-news</option><option value="publisher">publisher</option><option value="official">official</option><option value="api">api</option></select>
          <button className="rounded-full bg-primary px-5 py-1.5 text-sm font-semibold text-primary-foreground">Add source</button>
        </form>
        <div className="space-y-2">
          {(sources.data ?? []).map((src) => (
            <div key={src.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-background p-3 text-sm">
              <div className="min-w-0 flex-1"><div className="font-semibold">{src.name} <span className="font-normal text-muted-foreground">({src.type})</span></div>
                <div className="truncate text-xs text-muted-foreground">{src.url}</div>
                {src.last_checked_at && <div className="text-xs text-muted-foreground">Checked {hindiDateTime(src.last_checked_at)}</div>}</div>
              <form action={toggleSource}><input type="hidden" name="id" value={src.id} /><input type="hidden" name="enabled" value={String(!src.enabled)} />
                <button className="cursor-pointer rounded-full border px-3 py-1">{src.enabled ? "On · turn off" : "Off · turn on"}</button></form>
              <form action={deleteSource}><input type="hidden" name="id" value={src.id} />
                <ConfirmButton message="Delete this source?" className="cursor-pointer text-red-700 underline dark:text-red-400">Delete</ConfirmButton></form>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold">Image library ({library.data?.length ?? 0})</h2>
        <p className="mb-3 text-sm text-muted-foreground">Upload your own Ballia photos (collectorate, ghat, station, market…). The pipeline picks the best match by category, area and keywords before using stock photos.</p>
        <LibraryUpload categories={cats} areas={config.areas} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {(library.data ?? []).map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border bg-background text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.image_url} alt="" className="aspect-video w-full object-cover" />
              <div className="space-y-1 p-2"><div className="truncate">{[img.category_slug, img.area].filter(Boolean).join(" · ") || "—"}</div>
                <div className="truncate text-muted-foreground">{(img.keywords ?? []).join(", ")}</div>
                <form action={deleteLibraryImage}><input type="hidden" name="id" value={img.id} />
                  <ConfirmButton message="Remove from library?" className="cursor-pointer text-red-700 underline dark:text-red-400">Remove</ConfirmButton></form></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
