"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveNews, type NewsInput } from "@/app/admin/actions";
import { RichEditor } from "./rich-editor";
import { uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import type { NewsStatus } from "@/types";

export type FormInitial = Omit<NewsInput, "id" | "status"> & { id?: string; slug?: string; status: NewsStatus };

export function NewsForm({ initial, categories, isAdmin }: {
  initial: FormInitial; categories: { id: string; name: string }[]; isAdmin: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState<FormInitial>(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const idRef = useRef<string | undefined>(initial.id);
  const [slug, setSlug] = useState<string | undefined>(initial.slug);
  const dirty = useRef(false);
  const latest = useRef(f);
  useEffect(() => { latest.current = f; }, [f]);

  const set = <K extends keyof FormInitial>(k: K, v: FormInitial[K]) => { dirty.current = true; setF((cur) => ({ ...cur, [k]: v })); };

  const save = useCallback(async (status: NewsStatus, auto = false) => {
    if (!auto) setBusy(true);
    const res = await saveNews({ ...latest.current, id: idRef.current, status });
    if (!auto) setBusy(false);
    if (!res.ok) { if (!auto) setMsg({ ok: false, text: res.error }); return; }
    const firstSave = !idRef.current;
    idRef.current = res.id;
    setSlug(res.slug);
    dirty.current = false;
    setF((cur) => ({ ...cur, status: res.status }));
    if (firstSave) window.history.replaceState(null, "", `/admin/news/${res.id}`);
    setMsg({
      ok: true,
      text: auto ? "Draft auto-saved" : res.status === "published" ? "Published ✓" : res.status === "pending_review" ? "Sent for review ✓" : "Draft saved ✓",
    });
    if (!auto && status === "published") router.refresh();
  }, [router]);

  // Auto-save an unpublished draft every 30 seconds when something changed.
  useEffect(() => {
    const t = setInterval(() => {
      const c = latest.current;
      if (dirty.current && c.status !== "published" && c.headline && c.summary && c.main_image && c.category_id && c.content.replace(/<[^>]*>/g, "").trim()) {
        save("draft", true);
      }
    }, 30000);
    return () => clearInterval(t);
  }, [save]);

  async function pickPhoto(file?: File) {
    if (!file) return;
    setUploading(true);
    try { set("main_image", await uploadImage(file)); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    setUploading(false);
  }

  const input = "mt-1 w-full rounded-lg border bg-background px-3 py-2";
  const label = "block text-sm font-semibold";
  const catName = categories.find((c) => c.id === f.category_id)?.name;

  if (preview) {
    return (
      <div className="rounded-lg border bg-background p-4">
        <button className="mb-3 rounded-lg border px-3 py-1 text-sm font-semibold" onClick={() => setPreview(false)}>← Back to editing</button>
        <p className="text-sm font-bold text-primary">{catName}</p>
        <h1 className="text-3xl font-extrabold">{f.headline}</h1>
        <p className="mt-1 text-lg text-muted-foreground">{f.summary}</p>
        {f.main_image && <img src={f.main_image} alt="" className="my-3 w-full rounded" />}
        {f.image_caption && <p className="text-sm text-muted-foreground">{f.image_caption}</p>}
        <div className="article mt-3 text-lg leading-8" dangerouslySetInnerHTML={{ __html: f.content }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <label className={label}>Headline *
        <input value={f.headline} onChange={(e) => set("headline", e.target.value)} className={input} /></label>
      <label className={label}>Short summary * <span className="font-normal text-muted-foreground">({f.summary.length}/200)</span>
        <textarea value={f.summary} onChange={(e) => set("summary", e.target.value)} rows={2} maxLength={300} className={input} /></label>

      <div>
        <div className={label}>Full story *</div>
        <RichEditor value={f.content} onChange={(h) => set("content", h)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className={label}>Main photo *</div>
          {f.main_image && <img src={f.main_image} alt="" className="mb-2 aspect-video w-full rounded object-cover" />}
          <input type="file" accept="image/*" onChange={(e) => pickPhoto(e.target.files?.[0])} className="text-sm" />
          {uploading && <p className="text-sm text-muted-foreground">Compressing and uploading…</p>}
        </div>
        <label className={label}>Photo caption
          <input value={f.image_caption} onChange={(e) => set("image_caption", e.target.value)} className={input} /></label>
        <label className={label}>Category *
          <select value={f.category_id} onChange={(e) => set("category_id", e.target.value)} className={input}>
            <option value="">— choose —</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
        <label className={label}>Area / tehsil
          <select value={f.area} onChange={(e) => set("area", e.target.value)} className={input}>
            <option value="">—</option>
            {config.areas.map((a) => <option key={a}>{a}</option>)}
          </select></label>
        <label className={label}>Tags (comma separated)
          <input value={f.tags} onChange={(e) => set("tags", e.target.value)} className={input} /></label>
        <label className={label}>YouTube link
          <input value={f.youtube_url} onChange={(e) => set("youtube_url", e.target.value)} className={input} /></label>
        <label className={label}>Writer name
          <input value={f.writer_name} onChange={(e) => set("writer_name", e.target.value)} placeholder={config.site.name} className={input} /></label>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={f.is_breaking} onChange={(e) => set("is_breaking", e.target.checked)} /> Breaking news (auto-off after 24h)</label>
          <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={f.is_featured} onChange={(e) => set("is_featured", e.target.checked)} /> Featured (top story)</label>
        </div>
      )}

      {msg && <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{msg.text}
        {msg.ok && slug && f.status === "published" && <> · <a className="underline" href={`/news/${slug}`} target="_blank">View on site</a></>}</p>}

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t bg-background/95 py-3">
        <Button type="button" variant="outline" disabled={busy || uploading} onClick={() => save(f.status === "published" ? "published" : "draft")}>Save {f.status === "published" ? "changes" : "draft"}</Button>
        <Button type="button" variant="outline" onClick={() => setPreview(true)}>Preview</Button>
        {isAdmin ? (
          f.status !== "published" && <Button type="button" disabled={busy || uploading} onClick={() => save("published")}>Publish</Button>
        ) : (
          <Button type="button" disabled={busy || uploading} onClick={() => save("pending_review")}>Send for review</Button>
        )}
        {f.status === "published" && isAdmin && (
          <a className="rounded-lg border px-3 py-2 text-sm font-semibold" href={`https://wa.me/?text=${encodeURIComponent(`${f.headline}\n${config.site.url}/news/${slug}`)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
        )}
      </div>
    </div>
  );
}
