"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { addLibraryImage } from "@/app/admin/actions";
import { uploadImage } from "@/lib/upload";
import { Button } from "@/components/ui/button";

export function LibraryUpload({ categories, areas }: { categories: { slug: string; name: string }[]; areas: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const file = f.get("photo") as File;
    if (!file?.size) { setMsg({ ok: false, text: "Choose a photo first." }); return; }
    setBusy(true); setMsg(null);
    try {
      const image_url = await uploadImage(file);
      const res = await addLibraryImage({
        image_url, category_slug: String(f.get("category")), area: String(f.get("area")),
        keywords: String(f.get("keywords")), credit: String(f.get("credit")),
      });
      if (!res.ok) setMsg({ ok: false, text: res.error });
      else { setMsg({ ok: true, text: "Added to library ✓" }); form.reset(); router.refresh(); }
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
    setBusy(false);
  }

  const input = "rounded-lg border bg-background px-2 py-1.5 text-sm";
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2 rounded-xl border bg-background p-3">
      <input name="photo" type="file" accept="image/*" className="text-sm" />
      <select name="category" className={input}><option value="">Category</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
      <select name="area" className={input}><option value="">Area</option>{areas.map((a) => <option key={a}>{a}</option>)}</select>
      <input name="keywords" placeholder="keywords: ghat, ganga, river" className={`${input} w-56`} />
      <input name="credit" placeholder="Credit (default: बलिया न्यूज़)" className={`${input} w-52`} />
      <Button type="submit" disabled={busy}>{busy ? "Uploading…" : "Add photo"}</Button>
      {msg && <span role="status" className={`text-sm font-medium ${msg.ok ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>{msg.text}</span>}
    </form>
  );
}
