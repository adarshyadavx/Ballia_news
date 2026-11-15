import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getLatest, searchNews } from "@/lib/data";
import { NewsCard } from "@/components/news/news-card";
import { AdSlot } from "@/components/ads/ad-slot";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = { ...pageMeta("खबर खोजें", "बलिया न्यूज़ पर खबरें खोजें", "/search"), robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().slice(0, 100);
  const results = q ? await searchNews(q) : [];
  const latest = q && results.length === 0 ? await getLatest({ limit: 10 }) : [];

  return (
    <main className="shell shell-narrow rise py-10 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">खबर खोजें</h1>
      <form action="/search" role="search" className="relative mt-6 mb-10">
        <Search size={18} strokeWidth={1.75} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-muted-foreground" />
        <input name="q" defaultValue={q} placeholder="शीर्षक, सारांश या टैग लिखें" aria-label="खोज" autoFocus={!q}
          className="h-14 w-full rounded-full border bg-card pr-32 pl-13 text-base shadow-[var(--shadow-soft)] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-primary/60 focus-visible:ring-4 focus-visible:ring-primary/10" />
        <button className="absolute top-1/2 right-2 h-10 -translate-y-1/2 cursor-pointer rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">खोजें</button>
      </form>

      {!q && <p className="text-muted-foreground">ऊपर के बॉक्स में कुछ लिखकर खोजें।</p>}
      {q && results.length > 0 && (
        <>
          <p className="mb-6 text-sm text-muted-foreground">&ldquo;{q}&rdquo; के लिए {results.length} परिणाम</p>
          {results.map((n, i) => (
            <div key={n.id}>
              <NewsCard item={n} variant="row" />
              {i === 2 && <AdSlot slot="native" />}
            </div>
          ))}
        </>
      )}
      {q && results.length === 0 && (
        <>
          <div className="rounded-2xl border border-dashed py-14 text-center">
            <p className="text-lg font-semibold">कोई खबर नहीं मिली</p>
            <p className="mt-1 text-sm text-muted-foreground">दूसरे शब्द से खोजकर देखें, या नीचे ताज़ा खबरें पढ़ें।</p>
          </div>
          <h2 className="mt-12 mb-6 text-xl font-bold tracking-tight">ताज़ा खबरें</h2>
          {latest.map((n) => <NewsCard key={n.id} item={n} variant="row" />)}
        </>
      )}
    </main>
  );
}
