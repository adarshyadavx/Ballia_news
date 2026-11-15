// Step 7: licensed image. Own library -> Pexels -> default category picture. Never the newspaper's photo.
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { baseConfig, type AutoCfg } from "./lib";

export type Picked = { url: string; type: "library" | "stock" | "default"; credit: string };

const DEFAULTS: Record<string, string> = {
  "ballia-city": "ghat", tehsil: "village", crime: "crime", politics: "politics", education: "education",
  sports: "sports", agriculture: "farm", culture: "temple", jobs: "office", "uttar-pradesh": "dome",
};

export async function pickImage(supabase: SupabaseClient, cfg: AutoCfg, q: { category: string; area: string; tags: string[]; keywords: string }): Promise<Picked> {
  if (cfg.images.useLibrary) {
    const { data } = await supabase.from("image_library").select("image_url,category_slug,area,keywords,credit");
    const terms = [...q.tags, ...q.keywords.split(/\s+/)].map((t) => t.toLowerCase()).filter(Boolean);
    let best: { score: number; row: NonNullable<typeof data>[number] } | null = null;
    for (const r of data ?? []) {
      let score = 0;
      if (r.category_slug === q.category) score += 3;
      if (q.area && r.area === q.area) score += 3;
      score += (r.keywords ?? []).filter((k: string) => terms.includes(k.toLowerCase())).length * 2;
      if (score >= 3 && (!best || score > best.score)) best = { score, row: r };
    }
    if (best) return { url: best.row.image_url, type: "library", credit: best.row.credit || baseConfig.site.name };
  }

  const key = process.env.PEXELS_API_KEY;
  if (cfg.images.usePexels && key && q.keywords) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?per_page=5&orientation=landscape&query=${encodeURIComponent(q.keywords + " India")}`, { headers: { authorization: key }, signal: AbortSignal.timeout(15000) });
      const photo = (await res.json()).photos?.[0];
      if (photo) {
        const buf = Buffer.from(await (await fetch(photo.src.large2x || photo.src.large, { signal: AbortSignal.timeout(20000) })).arrayBuffer());
        const webp = await sharp(buf).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
        const path = `auto/${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
        const up = await supabase.storage.from("news-images").upload(path, webp, { contentType: "image/webp", cacheControl: "31536000" });
        if (!up.error) {
          return { url: supabase.storage.from("news-images").getPublicUrl(path).data.publicUrl, type: "stock", credit: `${photo.photographer} / Pexels (${photo.url})` };
        }
      }
    } catch (e) { console.error("pexels failed:", (e as Error).message); }
  }
  return { url: `/samples/${DEFAULTS[q.category] ?? "ghat"}.svg`, type: "default", credit: baseConfig.site.name };
}
