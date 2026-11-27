import { Suspense } from "react";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { config } from "@/lib/config";
import { getCategories, getCategory, getLatest } from "@/lib/data";
import { decodeParam } from "@/lib/slug";
import { pageMeta } from "@/lib/seo";
import { NewsFeed } from "@/components/news/news-feed";
import { AdSlot } from "@/components/ads/ad-slot";

type Props = { params: Promise<{ slug: string }> };
const PAGE = 12;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeParam((await params).slug);
  const cat = await getCategory(slug);
  if (!cat) return { title: "श्रेणी नहीं मिली" };
  return pageMeta(`${cat.name} समाचार`, `${config.site.name} पर ${cat.name} की ताज़ा खबरें`, `/category/${cat.slug}`);
}

async function CategoryPageContent({ params }: Props) {
  const slug = decodeParam((await params).slug);
  const cat = await getCategory(slug);
  if (!cat) notFound();
  const [items, cats] = await Promise.all([getLatest({ limit: PAGE, categorySlug: cat.slug }), getCategories()]);

  return (
    <main className="shell rise py-8 lg:py-10">
      <header className="mb-10 border-b pb-8">
        <p className="text-sm font-medium text-primary">श्रेणी</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{cat.name}</h1>
        <p className="mt-2 text-muted-foreground">{config.site.name} पर {cat.name} की ताज़ा खबरें</p>
      </header>

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="min-w-0 lg:col-span-8">
          {items.length === 0 ? (
            <p className="rounded-2xl border border-dashed py-20 text-center text-muted-foreground">अभी कोई खबर नहीं है</p>
          ) : (
            <NewsFeed initial={items} pageSize={PAGE} categorySlug={cat.slug}
              adEvery={config.ads.nativeBanner.categoryEvery} maxAds={config.ads.nativeBanner.maxPerPage} />
          )}
        </div>
        <aside className="lg:col-span-4">
          <div className="space-y-8 lg:sticky lg:top-32">
            <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-4 text-lg font-bold tracking-tight">अन्य श्रेणियाँ</h2>
              <ul className="flex flex-wrap gap-2">
                {cats.filter((c) => c.slug !== cat.slug).map((c) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`} className="inline-flex h-8 items-center rounded-full bg-muted px-3.5 text-sm text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">{c.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
            <AdSlot slot="sidebar" className="lg:static" />
          </div>
        </aside>
      </div>
    </main>
  );
}

// Data loads inside Suspense so a client navigation shows the skeleton at once instead of waiting.
export default function CategoryPage(props: Props) {
  return <Suspense fallback={<PageSkeleton />}><CategoryPageContent {...props} /></Suspense>;
}
