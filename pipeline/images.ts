// Step 7: licensed image. Own library -> Pexels -> Openverse -> default category picture.
// Never the newspaper's photo. Every photo is copied into our own storage, with its credit.
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { baseConfig, type AutoCfg } from "./lib";

export type Picked = { url: string; type: "library" | "stock" | "default"; credit: string };

const DEFAULTS: Record<string, string> = {
  "ballia-city": "ghat", tehsil: "village", crime: "crime", politics: "politics", education: "education",
  sports: "sports", agriculture: "farm", culture: "temple", jobs: "office", "uttar-pradesh": "dome", accident: "road",
};

const UA = "BalliaNewsBot/1.0 (+https://github.com/adarshyadavx/Ballia_news)";

// Same story -> same choice, different stories -> spread over the candidates.
function pickIndex(seed: string, n: number): number {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
  return Math.abs(h) % n;
}

// Download, shrink to 1600px WebP and store in the news-images bucket.
export async function storeImage(supabase: SupabaseClient, src: string, folder = "auto"): Promise<string | null> {
  const res = await fetch(src, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  const webp = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  const path = `${folder}/${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const up = await supabase.storage.from("news-images").upload(path, webp, { contentType: "image/webp", cacheControl: "31536000" });
  return up.error ? null : supabase.storage.from("news-images").getPublicUrl(path).data.publicUrl;
}

type OvResult = { id: string; url: string; creator?: string; source?: string; license: string; license_version?: string; foreign_landing_url?: string; width?: number; height?: number };
const ovCache = new Map<string, OvResult[]>();

// Openverse (openverse.org): Creative Commons photos, no key needed. Only licences that allow
// commercial use; the credit line carries the creator, licence and source page.
async function openverse(query: string): Promise<OvResult[]> {
  if (ovCache.has(query)) return ovCache.get(query)!;
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license_type=commercial&aspect_ratio=wide&mature=false&page_size=20`;
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) { console.error(`openverse ${res.status} for "${query}"`); return []; } // not cached: try again next story
  const rows = ((await res.json()).results as OvResult[] ?? []).filter((r) => (r.width ?? 0) >= 800);
  ovCache.set(query, rows);
  return rows;
}

export async function pickImage(
  supabase: SupabaseClient, cfg: AutoCfg,
  q: { category: string; area: string; tags: string[]; keywords: string; seed?: string },
): Promise<Picked> {
  const seed = q.seed ?? `${q.category}-${Date.now()}`;

  if (cfg.images.useLibrary) {
    const { data } = await supabase.from("image_library").select("image_url,category_slug,area,keywords,credit");
    const terms = [...q.tags, ...q.keywords.split(/\s+/)].map((t) => t.toLowerCase()).filter(Boolean);
    const scored = (data ?? []).map((r) => {
      let score = 0;
      if (r.category_slug === q.category) score += 3;
      if (q.area && r.area === q.area) score += 3;
      score += (r.keywords ?? []).filter((k: string) => terms.includes(k.toLowerCase())).length * 2;
      return { score, r };
    }).filter((x) => x.score >= 3);
    const top = scored.length ? Math.max(...scored.map((x) => x.score)) : 0;
    const best = scored.filter((x) => x.score === top);
    // A single matching photo would repeat on every story of that kind; then a stock photo is used,
    // unless the photo is of the story's own area (score 6+).
    if (best.length >= 2 || top >= 6) {
      const row = best[pickIndex(seed, best.length)].r;
      return { url: row.image_url, type: "library", credit: row.credit || baseConfig.site.name };
    }
  }

  const key = process.env.PEXELS_API_KEY;
  if (cfg.images.usePexels && key && q.keywords) {
    try {
      const res = await fetch(`https://api.pexels.com/v1/search?per_page=10&orientation=landscape&query=${encodeURIComponent(q.keywords + " India")}`, { headers: { authorization: key }, signal: AbortSignal.timeout(15000) });
      const photos = (await res.json()).photos ?? [];
      const photo = photos.length ? photos[pickIndex(seed, photos.length)] : null;
      if (photo) {
        const stored = await storeImage(supabase, photo.src.large2x || photo.src.large);
        if (stored) return { url: stored, type: "stock", credit: `${photo.photographer} / Pexels (${photo.url})` };
      }
    } catch (e) { console.error("pexels failed:", (e as Error).message); }
  }

  if (cfg.images.useOpenverse && q.keywords) {
    try {
      const rows = await openverse(q.keywords);
      if (rows.length) {
        const start = pickIndex(seed, rows.length);
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const r = rows[(start + i) % rows.length];
          // Openverse's own image endpoint (many original hosts refuse direct downloads).
          const stored = await storeImage(supabase, `https://api.openverse.org/v1/images/${r.id}/thumb/?full_size=true`).catch(() => null);
          if (!stored) continue;
          const lic = `CC ${r.license.toUpperCase()}${r.license_version ? ` ${r.license_version}` : ""}`.replace("CC CC0", "CC0").replace("CC PDM", "Public Domain");
          return { url: stored, type: "stock", credit: `${r.creator || "Unknown"} / ${r.source || "Openverse"}, ${lic} (${r.foreign_landing_url ?? r.url})` };
        }
      }
    } catch (e) { console.error("openverse failed:", (e as Error).message); }
  }

  return { url: `/samples/${DEFAULTS[q.category] ?? "ghat"}.svg`, type: "default", credit: baseConfig.site.name };
}
