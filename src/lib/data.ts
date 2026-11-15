import { createClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { config } from "@/lib/config";
import type { Category, News } from "@/types";
import { fallbackImage, needsFallbackImage, sampleNews, sampleNewsBySlug, sampleVideos } from "@/lib/sample-data";

export type NewsItem = News & { category: { name: string; slug: string } | null };

export const publicClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

const useSample = config.features.sampleData;

// Stories without a photo get a matching illustration instead of a grey box.
const dress = (rows: NewsItem[]): NewsItem[] =>
  rows.map((n) => (needsFallbackImage(n.main_image) ? { ...n, main_image: fallbackImage(n.category?.slug, n.slug) } : n));

const SELECT = "*, category:categories(name,slug)";
const SELECT_INNER = "*, category:categories!inner(name,slug)";

// Never crash a page because the database is empty or unreachable.
async function safe<T>(q: PromiseLike<{ data: T | null; error: { message: string } | null }>, fallback: T): Promise<T> {
  try {
    const { data, error } = await q;
    if (error) { if (!error.message.includes("prerender")) console.error("[db]", error.message); return fallback; }
    return data ?? fallback;
  } catch (e) {
    if (String((e as Error)?.message).includes("prerender")) throw e; // let Next handle prerender aborts
    console.error("[db]", e);
    return fallback;
  }
}

export async function getCategories(): Promise<Pick<Category, "name" | "slug" | "show_on_home">[]> {
  const rows = await safe(
    publicClient().from("categories").select("name,slug,show_on_home").eq("is_visible", true).order("display_order"),
    [] as Pick<Category, "name" | "slug" | "show_on_home">[],
  );
  if (rows.length) return rows;
  return config.categories.map((c) => ({ name: c.name, slug: c.slug, show_on_home: c.showOnHome }));
}

export async function getCategory(slug: string) {
  const cats = await safe(
    publicClient().from("categories").select("id,name,slug").eq("slug", slug).eq("is_visible", true).limit(1),
    [] as { id: string; name: string; slug: string }[],
  );
  if (cats[0]) return cats[0];
  const c = config.categories.find((x) => x.slug === slug);
  return useSample && c ? { id: c.slug, name: c.name, slug: c.slug } : null;
}

export async function getLatest(opts: { offset?: number; limit?: number; categorySlug?: string } = {}): Promise<NewsItem[]> {
  const { offset = 0, limit = 10, categorySlug } = opts;
  let q = publicClient()
    .from("news")
    .select(categorySlug ? SELECT_INNER : SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (categorySlug) q = q.eq("category.slug", categorySlug);
  const rows = dress(await safe(q as unknown as PromiseLike<{ data: NewsItem[] | null; error: { message: string } | null }>, [] as NewsItem[]));
  if (rows.length || !useSample) return rows;
  const pool = categorySlug ? sampleNews.filter((n) => n.category?.slug === categorySlug) : sampleNews;
  return pool.slice(offset, offset + limit);
}

export async function getFeatured(limit = 5): Promise<NewsItem[]> {
  const featured = await safe(
    publicClient().from("news").select(SELECT).eq("status", "published").eq("is_featured", true)
      .order("featured_at", { ascending: false }).limit(limit),
    [] as NewsItem[],
  );
  if (featured.length >= limit) return dress(featured);
  const ids = new Set(featured.map((n) => n.id));
  const latest = await getLatest({ limit: limit + featured.length });
  if (!featured.length && latest[0]?.id.startsWith("sample-")) return sampleNews.filter((n) => n.is_featured).slice(0, limit);
  return [...dress(featured), ...latest.filter((n) => !ids.has(n.id))].slice(0, limit);
}

export async function getNewsBySlug(slug: string): Promise<NewsItem | null> {
  const rows = await safe(
    publicClient().from("news").select(SELECT).eq("slug", slug).eq("status", "published").limit(1),
    [] as NewsItem[],
  );
  return dress(rows)[0] ?? (useSample ? sampleNewsBySlug(slug) : null);
}

export async function getRelated(categoryId: string, excludeId: string, limit = 4): Promise<NewsItem[]> {
  if (useSample && excludeId.startsWith("sample-")) {
    return sampleNews.filter((n) => n.category_id === categoryId && n.id !== excludeId).slice(0, limit);
  }
  return dress(await safe(
    publicClient().from("news").select(SELECT).eq("status", "published").eq("category_id", categoryId)
      .neq("id", excludeId).order("published_at", { ascending: false }).limit(limit),
    [] as NewsItem[],
  ));
}

export async function getMostRead(days = config.homepage.mostReadDays, limit = 5): Promise<NewsItem[]> {
  const db = publicClient();
  const rows: News[] = await safe(db.rpc("most_read", { p_days: days, p_limit: limit }) as unknown as PromiseLike<{ data: News[] | null; error: { message: string } | null }>, []);
  if (!rows.length) {
    // Nothing viewed yet: fall back to all-time most viewed.
    const all = await safe(
      db.from("news").select(SELECT).eq("status", "published").order("view_count", { ascending: false }).limit(limit),
      [] as NewsItem[],
    );
    return all.length || !useSample ? dress(all) : [...sampleNews].sort((a, b) => b.view_count - a.view_count).slice(0, limit);
  }
  const cats = await safe(db.from("categories").select("id,name,slug"), [] as { id: string; name: string; slug: string }[]);
  const map = new Map(cats.map((c) => [c.id, c]));
  return dress(rows.map((n: News) => ({ ...n, category: map.get(n.category_id) ?? null })));
}

export async function getVideoNews(limit = 3): Promise<NewsItem[]> {
  const rows = await getVideoRows(limit);
  return rows.length || !useSample ? rows : sampleVideos.slice(0, limit);
}

async function getVideoRows(limit: number): Promise<NewsItem[]> {
  return dress(await safe(
    publicClient().from("news").select(SELECT).eq("status", "published").not("youtube_url", "is", null)
      .neq("youtube_url", "").order("published_at", { ascending: false }).limit(limit),
    [] as NewsItem[],
  ));
}

export async function getBreaking(): Promise<{ headline: string; slug: string }[]> {
  await connection(); // uses the current time below
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const rows = await safe(
    publicClient().from("news").select("headline,slug").eq("status", "published").eq("is_breaking", true)
      .gte("breaking_set_at", cutoff).order("breaking_set_at", { ascending: false }).limit(8),
    [] as { headline: string; slug: string }[],
  );
  return rows.length || !useSample ? rows : sampleNews.filter((n) => n.is_breaking).map((n) => ({ headline: n.headline, slug: n.slug }));
}

export async function searchNews(term: string, limit = 30): Promise<NewsItem[]> {
  const q = term.replace(/[%,()*\\]/g, " ").trim();
  if (!q) return [];
  const rows = dress(await safe(
    publicClient().from("news").select(SELECT).eq("status", "published")
      .or(`headline.ilike.%${q}%,summary.ilike.%${q}%,tags.cs.{${q.replace(/[{}"]/g, "")}}`)
      .order("published_at", { ascending: false }).limit(limit),
    [] as NewsItem[],
  ));
  if (rows.length || !useSample) return rows;
  const t = q.toLowerCase();
  return sampleNews.filter((n) => [n.headline, n.summary, ...n.tags].some((x) => x.toLowerCase().includes(t))).slice(0, limit);
}

export async function getSitemapRows() {
  return safe(
    publicClient().from("news").select("slug,updated_at").eq("status", "published")
      .order("published_at", { ascending: false }).limit(1000),
    [] as { slug: string; updated_at: string }[],
  );
}
