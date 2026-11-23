import Link from "next/link";
import { ChevronRight, Clock, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { config } from "@/lib/config";
import { getLatest, getNewsBySlug, getRelated } from "@/lib/data";
import { decodeParam, youtubeId } from "@/lib/slug";
import { hindiDateTime } from "@/lib/dates";
import { newsJsonLd, newsMeta } from "@/lib/seo";
import { NewsImage } from "@/components/news/news-image";
import { NewsCard, SectionTitle } from "@/components/news/news-card";
import { ShareButtons, ShareFab } from "@/components/news/share-buttons";
import { ViewCounter } from "@/components/news/view-counter";
import { AdSlot } from "@/components/ads/ad-slot";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const news = await getNewsBySlug(decodeParam((await params).slug));
  return news ? newsMeta(news) : { title: "खबर नहीं मिली" };
}

// Splits the article HTML after N paragraphs so an ad can sit between the two halves.
function splitAfter(html: string, n: number): [string, string] {
  const parts = html.split(/(?<=<\/p>)/);
  if (parts.length <= n) return [html, ""];
  return [parts.slice(0, n).join(""), parts.slice(n).join("")];
}

export default async function NewsPage({ params }: Props) {
  const news = await getNewsBySlug(decodeParam((await params).slug));
  if (!news) notFound();

  const [related, latest] = await Promise.all([
    getRelated(news.category_id, news.id, 4),
    getLatest({ limit: 6 }),
  ]);
  const latestOther = latest.filter((n) => n.id !== news.id).slice(0, 5);
  const [before, after] = splitAfter(news.content, config.ads.nativeBanner.articleAfterParagraph);
  const vid = youtubeId(news.youtube_url);
  const updated = news.published_at && new Date(news.updated_at).getTime() - new Date(news.published_at).getTime() > 5 * 60 * 1000;

  return (
    <main className="shell rise py-8 lg:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsJsonLd(news)).replace(/</g, "\\u003c") }} />
      <ViewCounter newsId={news.id} />

      <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <article className="min-w-0 lg:col-span-8">
          <nav aria-label="पथ" className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">मुख्य पृष्ठ</Link>
            {news.category && <>
              <ChevronRight size={14} aria-hidden />
              <Link href={`/category/${news.category.slug}`} className="transition-colors hover:text-foreground">{news.category.name}</Link>
            </>}
          </nav>

          <h1 className="text-[1.75rem] leading-[1.45] font-bold tracking-tight sm:text-4xl sm:leading-[1.4]">{news.headline}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{news.summary}</p>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y py-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {(news.writer_name || config.site.name).charAt(0)}
              </span>
              <div className="text-sm leading-snug">
                <div className="font-semibold">{news.writer_name || config.site.name}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
                  {news.published_at && <span className="inline-flex items-center gap-1"><Clock size={13} /> {hindiDateTime(news.published_at)}</span>}
                  {news.area && <span className="inline-flex items-center gap-1"><MapPin size={13} /> {news.area}</span>}
                  {updated && <span>अपडेट: {hindiDateTime(news.updated_at)}</span>}
                </div>
              </div>
            </div>
            <ShareButtons headline={news.headline} />
          </div>

          <figure className="mt-8">
            <NewsImage src={news.main_image} alt={news.image_caption || news.headline} priority ratio="aspect-[16/9]" className="rounded-2xl"
              sizes="(min-width: 1024px) 66vw, 100vw" />
            {news.image_caption && <figcaption className="mt-3 text-sm text-muted-foreground">{news.image_caption}</figcaption>}
          </figure>

          <div className="article mt-8 text-[1.0625rem] leading-[1.95] sm:text-lg sm:leading-[2]">
            <div dangerouslySetInnerHTML={{ __html: before }} />
            {after && <AdSlot slot="native" />}
            {after && <div dangerouslySetInnerHTML={{ __html: after }} />}
          </div>

          {vid && (
            <div className="my-8 aspect-video w-full overflow-hidden rounded-2xl border">
              <iframe className="h-full w-full" loading="lazy" title="वीडियो"
                src={`https://www.youtube-nocookie.com/embed/${vid}`} allowFullScreen />
            </div>
          )}

          {news.is_auto && news.source_names && news.source_names.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                स्रोत:{" "}
                {news.source_names.map((name, i) => (
                  <span key={name + i}>
                    {i > 0 && ", "}
                    {news.source_urls?.[i]
                      ? <a href={news.source_urls[i]} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-foreground underline underline-offset-2">{name}</a>
                      : <span className="font-medium text-foreground">{name}</span>}
                  </span>
                ))}
              </p>
              <a href={`mailto:${config.contact.email}?subject=${encodeURIComponent(`गलती बताएं: ${news.headline}`)}&body=${encodeURIComponent(`${config.site.url}/news/${news.slug}\n\n`)}`}
                className="inline-flex min-h-10 items-center font-medium text-primary hover:underline">गलती बताएं</a>
            </div>
          )}

          {news.tags.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {news.tags.map((t) => (
                <li key={t}><Link href={`/search?q=${encodeURIComponent(t)}`} className="inline-flex h-10 items-center rounded-full bg-muted px-4 md:h-8 md:px-3.5 text-sm text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">#{t}</Link></li>
              ))}
            </ul>
          )}

          <div className="mt-8 border-t pt-6"><ShareButtons headline={news.headline} /></div>
          <AdSlot slot="mobileArticleEnd" />
          <AdSlot slot="native" />

          {related.length > 0 && (
            <section className="mt-14">
              <SectionTitle>संबंधित खबरें</SectionTitle>
              <div className="grid gap-6 sm:grid-cols-2">
                {related.slice(0, 4).map((n) => <NewsCard key={n.id} item={n} />)}
              </div>
            </section>
          )}
        </article>

        <aside className="lg:col-span-4">
          <div className="space-y-8 lg:sticky lg:top-32">
            <section className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-soft)]">
              <h2 className="mb-4 text-lg font-bold tracking-tight">ताज़ा खबरें</h2>
              {latestOther.map((n) => <NewsCard key={n.id} item={n} variant="text" />)}
            </section>
            <AdSlot slot="sidebar" />
          </div>
        </aside>
      </div>

      {config.features.stickyWhatsappShare && <ShareFab headline={news.headline} />}
    </main>
  );
}
