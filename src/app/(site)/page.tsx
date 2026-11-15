import Link from "next/link";
import { config } from "@/lib/config";
import { getCategories, getFeatured, getLatest, getMostRead, getVideoNews } from "@/lib/data";
import { NewsCard, SectionTitle } from "@/components/news/news-card";
import { NewsFeed } from "@/components/news/news-feed";
import { AdSlot } from "@/components/ads/ad-slot";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta(`${config.site.name} - ${config.site.tagline}`, config.site.tagline, "/");

export default async function HomePage() {
  const pageSize = config.homepage.latestNewsCount;
  const [featured, latest, cats, mostRead, videos] = await Promise.all([
    getFeatured(5),
    getLatest({ limit: pageSize }),
    getCategories(),
    getMostRead(),
    config.homepage.showVideoBlock ? getVideoNews(3) : Promise.resolve([]),
  ]);

  if (!latest.length && !featured.length) {
    return (
      <div className="shell shell-narrow py-28 text-center">
        <h1 className="text-2xl font-bold">अभी कोई खबर नहीं है</h1>
        <p className="mt-2 text-muted-foreground">जल्द ही ताज़ा खबरें यहाँ दिखेंगी।</p>
      </div>
    );
  }

  const [top, ...rest] = featured;
  const homeCats = cats.filter((c) => c.show_on_home);
  const catBlocks = await Promise.all(homeCats.map(async (c) => ({ c, items: await getLatest({ limit: 4, categorySlug: c.slug }) })));

  return (
    <main className="shell rise py-8 lg:py-10">
      {top && (
        <section aria-label="मुख्य खबर" className="grid gap-8 border-b pb-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8"><NewsCard item={top} variant="hero" priority /></div>
          <div className="lg:col-span-4 lg:border-l lg:pl-10">
            <h2 className="mb-4 text-sm font-semibold text-muted-foreground">मुख्य खबरें</h2>
            {rest.slice(0, 4).map((n) => <NewsCard key={n.id} item={n} variant="text" />)}
          </div>
        </section>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="min-w-0 space-y-14 lg:col-span-8">
          <section>
            <SectionTitle>ताज़ा खबरें</SectionTitle>
            <NewsFeed initial={latest} pageSize={pageSize}
              adEvery={config.ads.nativeBanner.homeEvery} maxAds={config.ads.nativeBanner.maxPerPage} />
          </section>

          {catBlocks.filter((b) => b.items.length).map(({ c, items }) => (
            <section key={c.slug}>
              <SectionTitle href={`/category/${c.slug}`}>{c.name}</SectionTitle>
              <div className="grid gap-8 md:grid-cols-2">
                <NewsCard item={items[0]} />
                <div>{items.slice(1).map((n) => <NewsCard key={n.id} item={n} variant="text" />)}</div>
              </div>
            </section>
          ))}

          {videos.length > 0 && (
            <section>
              <SectionTitle>वीडियो न्यूज़</SectionTitle>
              <div className="grid gap-6 sm:grid-cols-3">
                {videos.map((n) => <NewsCard key={n.id} item={n} play />)}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-8 lg:sticky lg:top-32">
            <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-2 text-lg font-bold tracking-tight">सबसे ज़्यादा पढ़ी गई</h2>
              <ol>
                {mostRead.map((n, i) => (
                  <li key={n.id} className="group flex gap-4 border-b py-4 last:border-0 last:pb-0">
                    <span className="w-7 shrink-0 text-3xl leading-none font-bold text-muted-foreground/35 tabular-nums transition-colors group-hover:text-primary">{i + 1}</span>
                    <Link href={`/news/${n.slug}`} className="text-[0.95rem] leading-snug font-semibold transition-colors group-hover:text-primary">{n.headline}</Link>
                  </li>
                ))}
              </ol>
            </section>
            <AdSlot slot="sidebar" />
          </div>
        </aside>
      </div>
    </main>
  );
}
