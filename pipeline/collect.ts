// Step 1-2: read feeds, drop old and already-seen items, group same-event items.
import Parser from "rss-parser";
import type { SupabaseClient } from "@supabase/supabase-js";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { jaccard, type AutoCfg } from "./lib";

export type Item = { title: string; link: string; publisher: string; publishedAt: Date; snippet: string; extra: { publisher: string; link: string }[] };

const parser = new Parser({ timeout: 15000, headers: { "user-agent": "Mozilla/5.0 (compatible; BalliaNewsBot/1.0)" } });

export async function collect(supabase: SupabaseClient, cfg: AutoCfg): Promise<{ items: Item[]; errors: string[]; found: number }> {
  const { data: sources } = await supabase.from("sources").select("id,name,url,type").eq("enabled", true);
  const errors: string[] = [];
  const all: Item[] = [];
  const cutoff = Date.now() - cfg.maxAgeHours * 3600_000;

  for (const s of sources ?? []) {
    try {
      if (s.type === "api" && /(^|\.)newsdata\.io$/.test(new URL(s.url).hostname)) {
        const got = await fetchNewsData(s.url);
        all.push(...got.filter((i) => i.publishedAt.getTime() >= cutoff));
        await supabase.from("sources").update({ last_checked_at: new Date().toISOString() }).eq("id", s.id);
        continue;
      }
      const feed = await parser.parseURL(s.url);
      for (const e of feed.items ?? []) {
        const when = new Date(e.isoDate || e.pubDate || Date.now());
        if (!e.link || !e.title || when.getTime() < cutoff) continue;
        // Google News titles end with " - Publisher"
        const m = e.title.match(/^(.*)\s+-\s+([^-]+)$/);
        all.push({
          title: (m ? m[1] : e.title).trim(),
          link: e.link,
          publisher: (m ? m[2] : (e as { source?: string }).source || s.name).trim(),
          publishedAt: when,
          snippet: (e.contentSnippet || "").replace(/\s+/g, " ").trim().slice(0, 500),
          extra: [],
        });
      }
      await supabase.from("sources").update({ last_checked_at: new Date().toISOString() }).eq("id", s.id);
    } catch (e) {
      errors.push(`${s.name}: ${(e as Error).message}`);
    }
  }

  const found = all.length;
  // Drop links we already processed.
  const links = all.map((i) => i.link);
  const seen = new Set<string>();
  for (let i = 0; i < links.length; i += 100) {
    const { data } = await supabase.from("seen_items").select("url").in("url", links.slice(i, i + 100));
    (data ?? []).forEach((r) => seen.add(r.url));
  }
  const fresh = all.filter((i) => !seen.has(i.link));

  // Same event reported by several sources -> one item with all sources listed.
  const groups: Item[] = [];
  for (const it of fresh.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())) {
    const twin = groups.find((g) => jaccard(g.title, it.title) >= 0.6);
    if (twin) { if (!twin.extra.some((x) => x.publisher === it.publisher)) twin.extra.push({ publisher: it.publisher, link: it.link }); }
    else groups.push(it);
  }
  return { items: groups, errors, found };
}

type NewsDataRow = { title?: string; link?: string; description?: string | null; pubDate?: string; source_name?: string; source_id?: string; duplicate?: boolean };

// NewsData.io (https://newsdata.io). The source URL is saved without the key; NEWSDATA_API_KEY is added here.
// Free plan: 10 results per request, 200 requests a day, news delayed by 12 hours. Links go straight to the publisher.
export async function fetchNewsData(sourceUrl: string, maxPages = 2): Promise<Item[]> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) throw new Error("NEWSDATA_API_KEY is not set");
  const out: Item[] = [];
  let page: string | undefined;
  for (let n = 0; n < maxPages; n++) {
    const url = new URL(sourceUrl);
    url.searchParams.set("apikey", key);
    if (page) url.searchParams.set("page", page);
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const body = await res.json() as { status?: string; results?: NewsDataRow[] | { message?: string }; nextPage?: string | null };
    if (body.status !== "success" || !Array.isArray(body.results)) {
      const msg = (body.results as { message?: string } | undefined)?.message;
      throw new Error(`newsdata ${res.status}: ${msg ?? "bad response"}`);
    }
    for (const r of body.results) {
      if (!r.link || !r.title || r.duplicate) continue;
      // pubDate is UTC, written as "YYYY-MM-DD HH:MM:SS".
      const when = r.pubDate ? new Date(`${r.pubDate.replace(" ", "T")}Z`) : new Date();
      out.push({
        title: r.title.trim(),
        link: r.link,
        publisher: (r.source_name || r.source_id || "NewsData").trim(),
        publishedAt: isNaN(when.getTime()) ? new Date() : when,
        snippet: (r.description || "").replace(/\s+/g, " ").trim().slice(0, 500),
        extra: [],
      });
    }
    page = body.nextPage ?? undefined;
    if (!page) break;
  }
  return out;
}

// Best effort: follow the Google redirect and pull out the main text of the publisher page.
// Only used to understand the story; the text is never republished.
export async function readArticle(link: string): Promise<{ url: string; text: string }> {
  try {
    const res = await fetch(link, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Mozilla/5.0 (compatible; BalliaNewsBot/1.0)" } });
    const html = await res.text();
    const finalUrl = res.url;
    if (/news\.google\.com/.test(finalUrl)) return { url: link, text: "" }; // redirect not resolved (JS page)
    const doc = new JSDOM(html, { url: finalUrl }).window.document;
    const art = new Readability(doc).parse();
    return { url: finalUrl, text: (art?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 6000) };
  } catch {
    return { url: link, text: "" };
  }
}
